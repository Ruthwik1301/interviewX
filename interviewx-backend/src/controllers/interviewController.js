import { InterviewSession } from "../models/InterviewSession.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
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
import {
  DAILY_LIMIT_TIMEZONE,
  PLAN_KEYS,
  SUBSCRIPTION_STATUS,
  getPlanConfig,
} from "../config/billing.js";
import { env } from "../config/env.js";

const VALID_TRACKS = Object.keys(TRACK_META);
const DSA_TRACKS = ["dsa-fundamentals", "competitive"];
const APTITUDE_TRACKS = [
  "numerical-reasoning",
  "logical-reasoning",
  "verbal-ability",
];
const ENTITLED_SUBSCRIPTION_STATUSES = new Set([
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.TRIALING,
  SUBSCRIPTION_STATUS.PAST_DUE,
]);

const GREETING = (trackTitle, role) =>
  `Hi there! 👋 Welcome to your ${trackTitle}. I'm your AI interviewer today.\n\n` +
  `Before we dive in, could you please introduce yourself? Tell me about your background ` +
  `and what brings you to this ${role} role.`;

function getUtcDayRange(date = new Date()) {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function getIndividualPlan(user) {
  if (!user) return PLAN_KEYS.FREE;
  return user.plan === PLAN_KEYS.PRO &&
    ENTITLED_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus)
    ? PLAN_KEYS.PRO
    : PLAN_KEYS.FREE;
}

function getMemberRecord(team, userId) {
  return (team?.members ?? []).find(
    (member) => String(member.user) === String(userId),
  );
}

function countActiveMembers(team) {
  return (team?.members ?? []).filter((member) => member.status === "active")
    .length;
}

// Internal QA/testing check only. Reads from an untracked env value
// (QA_UNLIMITED_EMAILS) - never stored on the user record, never returned
// from any API response, and never referenced by the frontend. It only
// removes the daily session cap; it does not change the displayed plan
// name or unlock team/billing-only features.
function isQaUnlimitedEmail(user) {
  const email = user?.email?.toLowerCase?.();
  return Boolean(email) && env.qaUnlimitedEmails.has(email);
}

function resolveAccessContextFromStateBase(user, team) {
  if (!user) {
    return {
      plan: PLAN_KEYS.FREE,
      dailyLimit: getPlanConfig(PLAN_KEYS.FREE).dailySessionLimit,
    };
  }

  if (user.activeTeam && team) {
    const member = getMemberRecord(team, user._id ?? user.id);
    const activeMembers = countActiveMembers(team);
    const seatsPurchased = team?.seatsPurchased ?? 0;
    const subscriptionEntitled = ENTITLED_SUBSCRIPTION_STATUSES.has(
      team?.subscriptionStatus,
    );

    if (
      member &&
      member.status === "active" &&
      subscriptionEntitled &&
      activeMembers <= seatsPurchased
    ) {
      return {
        plan: PLAN_KEYS.TEAM,
        dailyLimit:
          getPlanConfig(PLAN_KEYS.TEAM).dailySessionLimitPerMember ?? 3,
        team,
        teamMember: member,
      };
    }
  }

  const individualPlan = getIndividualPlan(user);
  return {
    plan: individualPlan,
    dailyLimit: getPlanConfig(individualPlan).dailySessionLimit ?? null,
  };
}

export function resolveAccessContextFromState(user, team) {
  const context = resolveAccessContextFromStateBase(user, team);

  if (isQaUnlimitedEmail(user)) {
    return { ...context, dailyLimit: null };
  }

  return context;
}

async function resolveAccessContext(user) {
  if (!user) {
    return resolveAccessContextFromState(user, null);
  }

  let team = null;
  if (user.activeTeam) {
    team = await Team.findById(user.activeTeam).select(
      "name subscriptionStatus members seatsPurchased",
    );
  }

  return resolveAccessContextFromState(user, team);
}

function safeParseQuestion(question) {
  if (typeof question === "object" && question !== null) return question;
  if (typeof question !== "string") return null;

  const trimmed = question.trim();
  if (!trimmed.startsWith("{")) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function formatAptitudeQuestion(question, number) {
  const parsed = safeParseQuestion(question) ?? question;
  if (!parsed || typeof parsed !== "object") {
    return `Question ${number}: ${String(question ?? "")}`;
  }

  const meta = [parsed.category, parsed.topic, parsed.difficulty]
    .filter(Boolean)
    .join(" · ");

  const options = Array.isArray(parsed.options)
    ? parsed.options.map((opt) => `${opt.id}. ${opt.text}`).join("\n")
    : "";

  return [
    `Question ${number}: ${parsed.title ?? "Aptitude Question"}`,
    meta,
    parsed.question ?? parsed.description ?? "",
    options,
    "Reply with the option letter or the full answer text.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function getQuestionContent(trackId, question, number) {
  if (APTITUDE_TRACKS.includes(trackId)) {
    return formatAptitudeQuestion(question, number);
  }

  if (DSA_TRACKS.includes(trackId)) {
    return typeof question === "object" ? JSON.stringify(question) : question;
  }

  return question;
}

function normalizeAnswer(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, "");
}

function extractOptionId(answer) {
  const raw = String(answer ?? "");
  const match = raw.match(/\b([A-D])\b/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function evaluateAptitudeAnswer(question, answer) {
  const parsed = safeParseQuestion(question);
  if (!parsed || !Array.isArray(parsed.options) || !parsed.correctAnswer) {
    return {
      score: 25,
      feedback:
        "This aptitude answer could not be deterministically graded, so a fallback score was applied.",
      pronunciationFeedback: "",
    };
  }

  const rawAnswer = String(answer ?? "").trim();
  const normalizedAnswer = normalizeAnswer(rawAnswer);
  const selectedId = extractOptionId(rawAnswer);
  const correctId = String(parsed.correctAnswer).toUpperCase();
  const correctOption = parsed.options.find(
    (opt) => String(opt.id).toUpperCase() === correctId,
  );

  const matchedOption =
    parsed.options.find((opt) => {
      const optionText = normalizeAnswer(opt.text);
      return (
        selectedId === String(opt.id).toUpperCase() ||
        normalizedAnswer === optionText ||
        normalizedAnswer === normalizeAnswer(`option ${opt.id}`) ||
        (optionText.length >= 4 && normalizedAnswer.includes(optionText))
      );
    }) ?? null;

  if (
    !normalizedAnswer ||
    /skip this question|^skip$|noanswer/i.test(rawAnswer)
  ) {
    return {
      score: 0,
      feedback: `Question skipped. Correct answer: ${correctId}${
        correctOption ? ` — ${correctOption.text}` : ""
      }. ${parsed.explanation}`,
      pronunciationFeedback: "",
    };
  }

  if (matchedOption && String(matchedOption.id).toUpperCase() === correctId) {
    return {
      score: 100,
      feedback: `Correct. ${parsed.explanation}`,
      pronunciationFeedback: "",
    };
  }

  if (matchedOption) {
    return {
      score: 25,
      feedback: `Not quite. Correct answer: ${correctId}${
        correctOption ? ` — ${correctOption.text}` : ""
      }. ${parsed.explanation}`,
      pronunciationFeedback: "",
    };
  }

  return {
    score: 10,
    feedback: `Your answer could not be confidently matched to one of the options. Correct answer: ${correctId}${
      correctOption ? ` — ${correctOption.text}` : ""
    }. ${parsed.explanation}`,
    pronunciationFeedback: "",
  };
}

// ─── startInterview ───────────────────────────────────────────────────────────
// Questions come from the curated bank — zero Groq calls here.

export async function startInterview(req, res, next) {
  try {
    const { trackId, role, level } = req.body;

    if (!trackId || !VALID_TRACKS.includes(trackId)) {
      return res.status(400).json({ error: "Invalid trackId." });
    }

    const user = await User.findById(req.userId).select(
      "email plan subscriptionStatus activeTeam teamRole",
    );
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const access = await resolveAccessContext(user);
    if (access.dailyLimit) {
      const { start, end } = getUtcDayRange();
      const sessionsToday = await InterviewSession.countDocuments({
        user: req.userId,
        createdAt: { $gte: start, $lt: end },
      });

      if (sessionsToday >= access.dailyLimit) {
        return res.status(429).json({
          error:
            `Daily interview session limit reached for your ${access.plan} plan. ` +
            `You can create up to ${access.dailyLimit} session${access.dailyLimit === 1 ? "" : "s"} ` +
            `per day (${DAILY_LIMIT_TIMEZONE}).`,
        });
      }
    }

    const meta = getTrackMeta(trackId);
    const resolvedRole = role || meta.role;
    const resolvedLevel = level || "Mid Level";
    const isDSA = DSA_TRACKS.includes(trackId);
    const isAptitude = APTITUDE_TRACKS.includes(trackId);

    // Pure curated lookup — no Groq call
    const questions = getQuestionsForSession(trackId, resolvedLevel);

    // Serialize objects to strings for MongoDB
    const serialized = InterviewSession.serializeQuestions(questions);

    const firstContent = isDSA
      ? typeof questions[0] === "object"
        ? JSON.stringify(questions[0])
        : questions[0]
      : isAptitude
        ? formatAptitudeQuestion(questions[0], 1)
        : GREETING(meta.title, resolvedRole);

    const session = new InterviewSession({
      user: req.userId,
      trackId,
      trackTitle: meta.title,
      role: resolvedRole,
      level: resolvedLevel,
      questions: serialized,
      introPhase: !isDSA && !isAptitude,
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
// Real scoring happens later:
// - regular/DSA tracks: batchScoreAnswers() at completeInterview time
// - aptitude tracks: deterministic grading at completeInterview time

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
    if (session.status !== "in_progress") {
      return res
        .status(409)
        .json({ error: "Session is no longer in progress." });
    }

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
          ? `🎙️ Voice tip: ${pronunciationFeedback}\n\n`
          : "") +
        `${transition}\n\nQuestion 1: ${session.questions[0]}`;

      session.introFeedback = feedback;
      session.introPhase = false;
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

    // ── Regular / DSA / Aptitude answer — store immediately ────────────────
    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion) {
      return res.status(409).json({ error: "No active question." });
    }

    session.transcript.push({ role: "user", content: answer });

    session.answers.push({
      question: currentQuestion,
      answer,
      score: 0,
      feedback: "Pending evaluation…",
      pronunciationFeedback: "",
      usedVoice,
    });

    const nextIndex = session.currentQuestionIndex + 1;
    const isLastQuestion = nextIndex >= session.questions.length;
    let nextQuestion = null;

    if (!isLastQuestion) {
      nextQuestion = getQuestionContent(
        session.trackId,
        session.questions[nextIndex],
        nextIndex + 1,
      );
      session.currentQuestionIndex = nextIndex;
      session.transcript.push({ role: "ai", content: nextQuestion });
    }

    await session.save();

    res.json({
      score: null,
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
// Scoring strategy by track type:
// - Regular / DSA: one Groq batch call for all answers
// - Aptitude: deterministic scoring from curated correct answers (zero Groq calls)

export async function completeInterview(req, res, next) {
  try {
    const { id } = req.params;

    const session = await InterviewSession.findOne({
      _id: id,
      user: req.userId,
    });
    if (!session) return res.status(404).json({ error: "Session not found." });
    if (session.status === "completed") {
      return res.json({ session: session.toPublicJSON() });
    }
    if (session.answers.length === 0) {
      return res.status(409).json({
        error: "Cannot complete a session with no answered questions.",
      });
    }

    const isAptitude = APTITUDE_TRACKS.includes(session.trackId);

    if (isAptitude) {
      session.answers.forEach((ans) => {
        const scored = evaluateAptitudeAnswer(ans.question, ans.answer);
        ans.score = scored.score;
        ans.feedback = scored.feedback;
        ans.pronunciationFeedback = scored.pronunciationFeedback;
      });
    } else {
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

      session.answers.forEach((ans, i) => {
        ans.score = scored[i]?.score ?? 60;
        ans.feedback = scored[i]?.feedback ?? "Good effort.";
        ans.pronunciationFeedback = scored[i]?.pronunciationFeedback ?? "";
      });
    }

    const report = generateReport({
      trackTitle: session.trackTitle,
      role: session.role,
      answers: session.answers,
      introScore: isAptitude ? null : (session.introCommunicationScore ?? null),
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
