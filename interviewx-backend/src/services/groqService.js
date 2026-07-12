import Groq from "groq-sdk";
import { env } from "../config/env.js";

const groq = new Groq({ apiKey: env.groqApiKey });
const GROQ_TIMEOUT_MS = 12000;

const DSA_TRACKS = ["dsa-fundamentals", "competitive"];

// ─── Groq is now used for ONLY 2 things per session: ─────────────────────────
//   1. scoreIntro  — 1 call (non-DSA tracks only)
//   2. batchScoreAnswers — 1 call for ALL answers at once
//
// Everything else (question generation, report) is handled without Groq.
// Total: max 2 Groq calls per session, down from 8-10.
// ─────────────────────────────────────────────────────────────────────────────

function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function withTimeout(promise, ms = GROQ_TIMEOUT_MS, label = "Groq call") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

// ─── 1. scoreIntro ────────────────────────────────────────────────────────────

export async function scoreIntro({ trackTitle, role, intro, usedVoice }) {
  try {
    const completion = await withTimeout(
      groq.chat.completions.create({
        model: env.groqModel,
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a warm, encouraging interview coach evaluating a candidate's self-introduction. " +
              'Respond ONLY with JSON: {"feedback": "<2-3 sentence warm feedback>", ' +
              '"pronunciationFeedback": "<1-2 sentence voice coaching tip>", ' +
              '"communicationScore": <0-100>, ' +
              '"transition": "<1 sentence naturally transitioning to first question>"}. No markdown.',
          },
          {
            role: "user",
            content:
              `Candidate interviewing for "${role}" role in ${trackTitle}. ` +
              `They ${usedVoice ? "spoke" : "typed"} this introduction:\n\n"${intro}"`,
          },
        ],
      }),
      GROQ_TIMEOUT_MS,
      "scoreIntro",
    );
    const parsed = safeParseJSON(completion.choices[0]?.message?.content ?? "");
    if (parsed?.feedback && parsed?.transition) {
      return {
        feedback: parsed.feedback,
        pronunciationFeedback: parsed.pronunciationFeedback ?? "",
        communicationScore: Math.max(
          0,
          Math.min(100, Math.round(parsed.communicationScore ?? 70)),
        ),
        transition: parsed.transition,
      };
    }
  } catch (err) {
    console.error("[groqService] scoreIntro failed:", err.message);
  }
  return {
    feedback: "Great introduction! You came across clearly and professionally.",
    pronunciationFeedback:
      "Tip: Speak at a steady pace and maintain a confident tone.",
    communicationScore: 70,
    transition: "Let's get started with the interview questions!",
  };
}

// ─── 2. batchScoreAnswers — ONE Groq call for ALL answers ────────────────────
//
// Instead of calling Groq once per answer (6 calls for 6 questions),
// we send all answers in a single prompt and get back all scores at once.
// This is the biggest credit saving — 6 calls → 1 call.

/**
 * Question fields may be:
 * - a plain string (regular tracks)
 * - a JSON string of {title, description, ...} (DSA tracks — stored as
 *   a string in MongoDB since the schema requires String, not Mixed)
 * - an object (in case it was never serialized)
 * This safely extracts a clean, short display title in all cases.
 */
function getQuestionTitle(q) {
  if (typeof q === "object" && q !== null) {
    return q.title ?? q.description ?? JSON.stringify(q);
  }
  if (typeof q === "string") {
    const trimmed = q.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsed.title ?? parsed.description ?? trimmed;
      } catch {
        return trimmed;
      }
    }
    return q;
  }
  return String(q ?? "this question");
}

export async function batchScoreAnswers({
  trackTitle,
  role,
  answers,
  usedVoice,
}) {
  // answers = [{ question, answer }, ...]

  const questionsBlock = answers
    .map((a, i) => {
      const q = getQuestionTitle(a.question);
      return `Q${i + 1}: "${q}"\nAnswer: "${a.answer}"`;
    })
    .join("\n\n");

  const count = answers.length;

  try {
    const completion = await withTimeout(
      groq.chat.completions.create({
        model: env.groqModel,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              `You are an expert interview coach evaluating a candidate's answers for a ${trackTitle} (${role} role). ` +
              `Score each answer from 0-100 and give 2-3 sentences of constructive feedback. ` +
              `Also give a 1-sentence pronunciation/delivery tip for each. ` +
              `Respond ONLY with this exact JSON structure (no markdown):\n` +
              `{"scores": [` +
              `{"score": <0-100>, "feedback": "<2-3 sentences>", "pronunciationFeedback": "<1 sentence>"}` +
              `, ... ` +
              `]} — exactly ${count} objects in the scores array, in the same order as the questions.`,
          },
          {
            role: "user",
            content: `Please evaluate these ${count} interview answers:\n\n${questionsBlock}`,
          },
        ],
      }),
      GROQ_TIMEOUT_MS * 2, // double timeout for batch call
      "batchScoreAnswers",
    );

    const parsed = safeParseJSON(completion.choices[0]?.message?.content ?? "");

    if (Array.isArray(parsed?.scores) && parsed.scores.length === count) {
      return parsed.scores.map((s) => ({
        score: Math.max(0, Math.min(100, Math.round(s.score ?? 60))),
        feedback: s.feedback ?? "Good effort on this answer.",
        pronunciationFeedback: s.pronunciationFeedback ?? "",
      }));
    }

    // Partial result — use what we have
    if (Array.isArray(parsed?.scores) && parsed.scores.length > 0) {
      const results = parsed.scores.map((s) => ({
        score: Math.max(0, Math.min(100, Math.round(s.score ?? 60))),
        feedback: s.feedback ?? "Good effort.",
        pronunciationFeedback: s.pronunciationFeedback ?? "",
      }));
      // Pad with fallbacks for missing answers
      while (results.length < count) {
        results.push(fallbackScore(answers[results.length]?.answer ?? ""));
      }
      return results;
    }
  } catch (err) {
    console.error("[groqService] batchScoreAnswers failed:", err.message);
  }

  // Full fallback — score all answers heuristically
  return answers.map((a) => fallbackScore(a.answer));
}

function fallbackScore(answer) {
  const wordCount = (answer ?? "").trim().split(/\s+/).filter(Boolean).length;
  return {
    score: Math.max(45, Math.min(78, 45 + Math.floor(wordCount / 4))),
    feedback:
      "AI evaluator unavailable — estimated score based on response length.",
    pronunciationFeedback:
      "Tip: Speak clearly and at a steady pace in your real interview.",
  };
}

// ─── 3. generateReport — pure math, no Groq ──────────────────────────────────
//
// Report is calculated entirely from the scores and feedback we already have.
// No LLM needed — saves 1 Groq call per session and is more consistent.

export function generateReport({ trackTitle, role, answers, introScore }) {
  const scores = answers.map((a) => a.score);
  const overall = Math.round(
    scores.reduce((s, v) => s + v, 0) / Math.max(scores.length, 1),
  );

  // Breakdown — inferred from answer content patterns
  const avgScore = overall;
  const variance =
    scores.reduce((s, v) => s + Math.abs(v - avgScore), 0) /
    Math.max(scores.length, 1);
  const consistency = Math.max(40, Math.round(100 - variance));

  // Weight communication score from intro if available
  const commScore = introScore
    ? Math.round((introScore + avgScore) / 2)
    : Math.round(avgScore * 0.9);

  const breakdown = {
    Communication: Math.min(100, commScore),
    "Technical Depth": Math.min(100, Math.round(avgScore * 1.05)),
    "Problem Solving": Math.min(100, Math.round(avgScore * 0.98)),
    Consistency: Math.min(100, consistency),
  };

  // Strengths — pick answers with score >= 75
  const strengths = answers
    .filter((a) => a.score >= 75)
    .slice(0, 3)
    .map((a) => {
      const q = getQuestionTitle(a.question);
      return `Strong performance on: "${q.length > 60 ? q.slice(0, 60) + "…" : q}"`;
    });

  if (strengths.length === 0) {
    strengths.push(
      "Completed the full interview — showing commitment and resilience.",
    );
  }

  // Improvements — pick answers with score < 65
  const improvements = answers
    .filter((a) => a.score < 65)
    .slice(0, 3)
    .map((a) => {
      const q = getQuestionTitle(a.question);
      return `Review and practice: "${q.length > 60 ? q.slice(0, 60) + "…" : q}"`;
    });

  if (improvements.length === 0) {
    improvements.push(
      "Continue practising to maintain and improve your current performance level.",
    );
  }

  // Summary
  const grade = gradeFor(overall);
  const level =
    overall >= 80 ? "excellent" : overall >= 65 ? "solid" : "developing";
  const summary =
    `Overall ${level} performance with a score of ${overall}/100 (${grade}). ` +
    `You answered ${answers.length} question${answers.length !== 1 ? "s" : ""} ` +
    `with scores ranging from ${Math.min(...scores)} to ${Math.max(...scores)}. ` +
    (strengths.length > 0
      ? `Your strongest answers showed good understanding of the topic. `
      : "") +
    (improvements.length > 0
      ? `Focus on the areas marked for improvement to reach the next level.`
      : `Keep up the strong work across all areas.`);

  return { overall, grade, breakdown, strengths, improvements, summary };
}

function gradeFor(score) {
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  return "D";
}
