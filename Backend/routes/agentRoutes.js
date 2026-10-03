const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const AgentSession = require("../models/AgentSession");
const AgentEvaluationLog = require("../models/AgentEvaluationLog");
const {
  initializeSession,
  processUserMessage,
  createVeterinarianReview,
} = require("../services/agentOrchestrator");

// ================= INITIALIZE AGENT SESSION =================
router.post("/session", protect, async (req, res) => {
  try {
    const { petId, scanId, prediction, image, gradCamImage } = req.body;

    const result = await initializeSession({
      ownerId: req.user._id,
      petId,
      scanId,
      prediction,
      image,
      gradCamImage,
    });

    return res.status(201).json({
      success: true,
      session: result.session,
      messages: result.messages,
      uncertainty: result.uncertainty,
      safety: result.safety,
    });
  } catch (err) {
    console.error("AGENT INIT SESSION ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error initializing agent session" });
  }
});

// ================= GET SESSION DETAILS =================
router.get("/session/:id", protect, async (req, res) => {
  try {
    const session = await AgentSession.findById(req.params.id)
      .populate("pet", "name age weight gender color description image")
      .populate("scan", "disease status confidence image");

    if (!session) {
      return res.status(404).json({ success: false, message: "Agent session not found" });
    }

    if (session.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized access to this session" });
    }

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (err) {
    console.error("GET AGENT SESSION ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error fetching agent session" });
  }
});

// ================= SEND MESSAGE TO AGENT =================
router.post("/message", protect, async (req, res) => {
  try {
    const { sessionId, message, actionIntent } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "sessionId is required" });
    }

    const session = await AgentSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (session.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const result = await processUserMessage({
      session,
      messageText: message || "",
      actionIntent: actionIntent || "",
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("AGENT MESSAGE ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error processing agent message" });
  }
});

// ================= ESCALATE TO VETERINARIAN =================
router.post("/escalate", protect, async (req, res) => {
  try {
    const { sessionId, doctorId, adviceNotes } = req.body;

    if (!sessionId || !doctorId) {
      return res.status(400).json({ success: false, message: "sessionId and doctorId are required" });
    }

    const session = await AgentSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const consultation = await createVeterinarianReview({
      session,
      doctorId,
      adviceNotes,
    });

    return res.status(201).json({
      success: true,
      message: "Consultation request submitted to veterinarian",
      consultation,
    });
  } catch (err) {
    console.error("AGENT ESCALATE ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error escalating case" });
  }
});

// ================= GET EVALUATION RESEARCH LOGS =================
router.get("/evaluation-logs", protect, async (req, res) => {
  try {
    const logs = await AgentEvaluationLog.find()
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (err) {
    console.error("GET EVALUATION LOGS ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error fetching evaluation logs" });
  }
});

module.exports = router;
