const mongoose = require("mongoose");

const agentEvaluationLogSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentSession",
      required: true,
    },
    userQuery: {
      type: String,
      default: "",
    },
    initialPrediction: {
      disease: { type: String, default: "" },
      confidence: { type: Number, default: 0 },
      allScores: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    uncertainty: {
      entropy: { type: Number, default: 0 },
      normalizedEntropy: { type: Number, default: 0 },
      level: { type: String, default: "LOW" },
    },
    ragSources: [
      {
        title: String,
        disease: String,
        source: String,
        relevance: Number,
      },
    ],
    agentActions: [
      {
        tool: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    safetyResult: {
      level: String,
      requiresVetReview: Boolean,
      reasons: [String],
    },
    veterinarianEscalation: {
      escalated: { type: Boolean, default: false },
      consultationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Consultation",
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AgentEvaluationLog", agentEvaluationLogSchema);
