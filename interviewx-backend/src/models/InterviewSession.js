import mongoose from "mongoose";

const DSA_TRACKS = ["dsa-fundamentals", "competitive"];

// Questions are stored as strings in MongoDB.
// For DSA tracks the question object is JSON-stringified before save
// and parsed back in toPublicJSON — so the rest of the app always
// sees plain strings (non-DSA) or parsed objects (DSA).

function serializeQuestion(q) {
  if (typeof q === "object" && q !== null) return JSON.stringify(q);
  return String(q);
}

function deserializeQuestion(q, isDSA) {
  if (!isDSA) return q;
  try {
    return JSON.parse(q);
  } catch {
    return q;
  }
}

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["ai", "user"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const answerScoreSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    score: { type: Number, min: 0, max: 100, required: true },
    feedback: { type: String, required: true },
    pronunciationFeedback: { type: String, default: null },
    usedVoice: { type: Boolean, default: false },
  },
  { _id: false },
);

const reportSchema = new mongoose.Schema(
  {
    overall: { type: Number, min: 0, max: 100 },
    grade: { type: String },
    breakdown: { type: Map, of: Number },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    summary: { type: String },
  },
  { _id: false },
);

const interviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    trackId: { type: String, required: true },
    trackTitle: { type: String, required: true },
    role: { type: String, default: "Candidate" },
    level: { type: String, default: "Mid Level" },

    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
    },

    introPhase: { type: Boolean, default: true },
    introFeedback: { type: String, default: null },
    introCommunicationScore: { type: Number, default: null },

    // Always stored as strings — DSA objects are JSON.stringify'd
    questions: [{ type: String }],
    currentQuestionIndex: { type: Number, default: 0 },
    transcript: [messageSchema],
    answers: [answerScoreSchema],

    report: reportSchema,

    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

interviewSessionSchema.methods.toPublicJSON = function toPublicJSON() {
  const isDSA = DSA_TRACKS.includes(this.trackId);
  return {
    id: this._id.toString(),
    trackId: this.trackId,
    trackTitle: this.trackTitle,
    role: this.role,
    level: this.level,
    status: this.status,
    introPhase: this.introPhase,
    introFeedback: this.introFeedback,
    introCommunicationScore: this.introCommunicationScore,
    // Deserialize — DSA questions come back as objects, others as strings
    questions: (this.questions ?? []).map((q) => deserializeQuestion(q, isDSA)),
    currentQuestionIndex: this.currentQuestionIndex,
    transcript: this.transcript,
    answers: this.answers,
    report: this.report,
    startedAt: this.startedAt,
    completedAt: this.completedAt,
  };
};

// Helper used by the controller to serialize before saving
interviewSessionSchema.statics.serializeQuestions = function (questions) {
  return questions.map(serializeQuestion);
};

export const InterviewSession = mongoose.model(
  "InterviewSession",
  interviewSessionSchema,
);
