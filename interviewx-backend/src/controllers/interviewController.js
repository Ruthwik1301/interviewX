import { InterviewSession } from "../models/InterviewSession.js";
import {
  scoreIntro,
  batchScoreAnswers,
  generateReport,
} from "../services/groqService.js";
import {
  getTrackMeta,
  getQuestionsForSession,
  TRACK_META,
} from "../data/questionBanks.js";

const VALID_TRACKS = Object.keys(TRACK_META);
const DSA_TRACKS = ["dsa-fundamentals", "competitive"];

const GREETING = (trackTitle, role) =>
  `Hi there! 👋 Welcome to your ${trackTitle}. I'm your AI interviewer today.\n\n` +
  `Before we dive in, could you please introduce yourself? Tell me about your background ` +
  `and what brings you to this ${role} role.`;

// ─── startInterview ───────────────────────────────────────────────────────────
// Questions come from the curated bank — zero Groq calls here.

export async function startInterview(req, res, next) {
  try {
    const { trackId, role, level } = req.body;

    if (!trackId || !VALID_TRACKS.includes(trackId)) {
      return res.status(400).json({ error: "Invalid trackId." });
    }

    const meta = getTrackMeta(trackId);
    const resolvedRole = role || meta.role;
    const resolvedLevel = level || "Mid Level";
    const isDSA = DSA_TRACKS.includes(trackId);

    // Pure DB lookup — no Groq call
    const questions = getQuestionsForSession(trackId, resolvedLevel);

    // Serialize objects to strings for MongoDB
    const serialized = InterviewSession.serializeQuestions(questions);

    const firstContent = isDSA
      ? typeof questions[0] === "object"
        ? JSON.stringify(questions[0])
        : questions[0]
      : GREETING(meta.title, resolvedRole);

    const session = new InterviewSession({
      user: req.userId,
      trackId,
      trackTitle: meta.title,
      role: resolvedRole,
      level: resolvedLevel,
      questions: serialized,
      introPhase: !isDSA,
      transcript: [{ role: "ai", content: firstContent }],
    });

    await session.save();
    res.status(201).json({ session: session.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

// ─── submitAnswer ─────────────────────────────────────────────────────────────
// Stores the answer immediately with a placeholder score.
// Real scoring happens in batchScoreAnswers at completeInterview time.
// This makes the interview feel instant — no waiting for Groq per answer.
// Live feedback is shown as a simple acknowledgement.

export async function submitAnswer(req, res, next) {
  try {
    const { id } = req.params;
    const { answer, usedVoice = false } = req.body;

    if (!answer?.trim()) {
      return res.status(400).json({ error: "Answer text is required." });
    }

    const session = await InterviewSession.findOne({
      _id: id,
      user: req.userId,
    });
    if (!session) return res.status(404).json({ error: "Session not found." });
    if (session.status !== "in_progress")
      return res
        .status(409)
        .json({ error: "Session is no longer in progress." });

    // ── Intro phase ──────────────────────────────────────────────────────────
    if (session.introPhase) {
      session.transcript.push({ role: "user", content: answer });

      // scoreIntro = 1 Groq call
      const {
        feedback,
        pronunciationFeedback,
        communicationScore,
        transition,
      } = await scoreIntro({
        trackTitle: session.trackTitle,
        role: session.role,
        intro: answer,
        usedVoice,
      });

      const introResponse =
        `${feedback}\n\n` +
        (pronunciationFeedback
          ? `🎙️ **Voice tip:** ${pronunciationFeedback}\n\n`
          : "") +
        `${transition}\n\n**Question 1:** ${session.questions[0]}`;

      session.introFeedback = feedback;
      session.introPhase = false;
      // Store intro score for report calculation
      session.introCommunicationScore = communicationScore;
      session.transcript.push({ role: "ai", content: introResponse });
      await session.save();

      return res.json({
        isIntro: true,
        score: communicationScore,
        feedback,
        pronunciationFeedback,
        nextQuestion: session.questions[0],
        introResponse,
        isComplete: false,
        session: session.toPublicJSON(),
      });
    }

    // ── Regular answer — store with placeholder score ─────────────────────
    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion)
      return res.status(409).json({ error: "No active question." });

    session.transcript.push({ role: "user", content: answer });

    // Placeholder — real score assigned at completeInterview
    session.answers.push({
      question: currentQuestion,
      answer,
      score: 0,
      feedback: "Pending AI evaluation…",
      pronunciationFeedback: "",
      usedVoice,
    });

    const nextIndex = session.currentQuestionIndex + 1;
    const isLastQuestion = nextIndex >= session.questions.length;
    let nextQuestion = null;

    if (!isLastQuestion) {
      nextQuestion = session.questions[nextIndex];
      session.currentQuestionIndex = nextIndex;
      session.transcript.push({ role: "ai", content: nextQuestion });
    }

    await session.save();

    // Instant acknowledgement to the frontend — no Groq wait
    res.json({
      score: null, // will be filled in the report
      feedback:
        "Answer recorded! You will receive detailed feedback in your report.",
      pronunciationFeedback: "",
      nextQuestion,
      isComplete: isLastQuestion,
      session: session.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
}

// ─── completeInterview ────────────────────────────────────────────────────────
// THIS is where the single Groq batch call happens.
// All answers scored in one call, then report generated with pure math.

export async function completeInterview(req, res, next) {
  try {
    const { id } = req.params;

    const session = await InterviewSession.findOne({
      _id: id,
      user: req.userId,
    });
    if (!session) return res.status(404).json({ error: "Session not found." });
    if (session.status === "completed")
      return res.json({ session: session.toPublicJSON() });
    if (session.answers.length === 0) {
      return res
        .status(409)
        .json({
          error: "Cannot complete a session with no answered questions.",
        });
    }

    // ── Single Groq call: batch score all answers ────────────────────────
    const scored = await batchScoreAnswers({
      trackTitle: session.trackTitle,
      role: session.role,
      answers: session.answers.map((a) => ({
        question: a.question,
        answer: a.answer,
      })),
      usedVoice: session.answers.some((a) => a.usedVoice),
    });

    // Apply scores back to session answers
    session.answers.forEach((ans, i) => {
      ans.score = scored[i]?.score ?? 60;
      ans.feedback = scored[i]?.feedback ?? "Good effort.";
      ans.pronunciationFeedback = scored[i]?.pronunciationFeedback ?? "";
    });

    // ── Pure math report — zero Groq calls ───────────────────────────────
    const report = generateReport({
      trackTitle: session.trackTitle,
      role: session.role,
      answers: session.answers,
      introScore: session.introCommunicationScore ?? null,
    });

    session.report = report;
    session.status = "completed";
    session.completedAt = new Date();
    await session.save();

    res.json({ session: session.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

// ─── listInterviews / getInterview ────────────────────────────────────────────

export async function listInterviews(req, res, next) {
  try {
    const sessions = await InterviewSession.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ sessions: sessions.map((s) => s.toPublicJSON()) });
  } catch (err) {
    next(err);
  }
}

export async function getInterview(req, res, next) {
  try {
    const { id } = req.params;
    const session = await InterviewSession.findOne({
      _id: id,
      user: req.userId,
    });
    if (!session) return res.status(404).json({ error: "Session not found." });
    res.json({ session: session.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}
