const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      default: null,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["doctor", "owner"],
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to generate standard conversationId from two user IDs
messageSchema.statics.getConversationId = function (userId1, userId2) {
  const sorted = [userId1.toString(), userId2.toString()].sort();
  return `direct_${sorted[0]}_${sorted[1]}`;
};

module.exports = mongoose.model("Message", messageSchema);
