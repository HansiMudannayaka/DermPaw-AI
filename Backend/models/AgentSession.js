const mongoose = require("mongoose");

const agentSessionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      default: null,
    },
    scan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scan",
      default: null,
    },
    prediction: {
      disease: { type: String, default: "" },
      confidence: { type: Number, default: 0 },
      allScores: { type: mongoose.Schema.Types.Mixed, default: {} },
      diseaseInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
      image: { type: String, default: "" },
      gradCamImage: { type: String, default: "" },
    },
    uncertainty: {
      entropy: { type: Number, default: 0 },
      normalizedEntropy: { type: Number, default: 0 },
      level: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH"],
        default: "LOW",
      },
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "agent", "system"],
          required: true,
        },
        type: {
          type: String,
          enum: ["text", "escalation", "info"],
          default: "text",
        },
        content: { type: String, required: true },
        evidenceSources: { type: mongoose.Schema.Types.Mixed, default: [] },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    safety: {
      level: {
        type: String,
        enum: ["NORMAL", "ATTENTION", "VETERINARIAN_REVIEW"],
        default: "NORMAL",
      },
      requiresVetReview: { type: Boolean, default: false },
      reasons: [{ type: String }],
    },
    status: {
      type: String,
      enum: ["active", "completed", "escalated"],
      default: "active",
    },
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AgentSession", agentSessionSchema);
