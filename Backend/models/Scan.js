const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    disease: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["healthy", "warning", "danger"],
      default: "warning",
    },
    confidence: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: "",
    },
    gradCamImage: {
      type: String,
      default: "",
    },
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
    },
    petName: {
      type: String,
      default: "",
    },
    allScores: {
      type: Object,
      default: {},
    },
    diseaseInfo: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Scan", scanSchema);
