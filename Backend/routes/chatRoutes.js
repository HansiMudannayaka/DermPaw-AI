const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Consultation = require("../models/Consultation");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

/**
 * POST /api/chat/messages
 * Send a chat message
 */
router.post("/messages", protect, async (req, res) => {
  try {
    let { recipientId, consultationId, text, image } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ success: false, message: "Message text cannot be empty" });
    }

    let consultation = null;
    if (consultationId) {
      consultation = await Consultation.findById(consultationId);
      if (consultation) {
        // If recipientId is not supplied, infer it from consultation
        if (!recipientId) {
          if (req.user.role === "doctor") {
            recipientId = consultation.owner;
          } else {
            recipientId = consultation.doctor;
          }
        }
      }
    }

    if (!recipientId) {
      return res.status(400).json({ success: false, message: "Recipient ID is required" });
    }

    if (recipientId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot send a message to yourself" });
    }

    const recipientUser = await User.findById(recipientId);
    if (!recipientUser) {
      return res.status(404).json({ success: false, message: "Recipient user not found" });
    }

    const senderRole = req.user.role === "doctor" ? "doctor" : "owner";
    const conversationId = Message.getConversationId(req.user._id, recipientId);

    const newMessage = new Message({
      consultation: consultation ? consultation._id : null,
      conversationId,
      sender: req.user._id,
      senderRole,
      recipient: recipientId,
      text: text.trim(),
      image: image || "",
      read: false,
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "name username email role image profileImage")
      .populate("recipient", "name username email role image profileImage");

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to send message", error: err.message });
  }
});

/**
 * Helper to resolve partner user ID from conversationId / consultationId
 */
async function resolvePartnerUserId(rawId, currentUserId) {
  let targetUserId = null;
  let consultationDoc = null;

  if (rawId.startsWith("direct_")) {
    const parts = rawId.replace("direct_", "").split("_");
    if (parts.length === 1) {
      targetUserId = parts[0];
    } else if (parts.length >= 2) {
      targetUserId = parts[0] === currentUserId ? parts[1] : parts[0];
    }
  } else {
    const potentialId = rawId.startsWith("consultation_")
      ? rawId.replace("consultation_", "")
      : rawId;

    if (mongoose.Types.ObjectId.isValid(potentialId)) {
      consultationDoc = await Consultation.findById(potentialId);
      if (consultationDoc) {
        const ownerIdStr = consultationDoc.owner ? consultationDoc.owner.toString() : "";
        const doctorIdStr = consultationDoc.doctor ? consultationDoc.doctor.toString() : "";
        targetUserId = ownerIdStr === currentUserId ? doctorIdStr : ownerIdStr;
      } else {
        // May be a direct User ID
        targetUserId = potentialId;
      }
    }
  }
  return { targetUserId, consultationDoc };
}

/**
 * GET /api/chat/messages/:conversationId
 * Fetch all messages for a conversation or consultation (unified per Doctor-Owner pair)
 */
router.get("/messages/:conversationId", protect, async (req, res) => {
  try {
    const rawId = req.params.conversationId;
    const currentUserId = req.user._id.toString();

    const { targetUserId, consultationDoc } = await resolvePartnerUserId(rawId, currentUserId);

    const orConditions = [
      { conversationId: rawId },
      { conversationId: `consultation_${rawId}` },
    ];

    if (mongoose.Types.ObjectId.isValid(rawId)) {
      orConditions.push({ consultation: rawId });
    }

    if (consultationDoc) {
      orConditions.push({ consultation: consultationDoc._id });
    }

    if (targetUserId && mongoose.Types.ObjectId.isValid(targetUserId)) {
      const directConvId = Message.getConversationId(req.user._id, targetUserId);
      orConditions.push({ conversationId: directConvId });
      orConditions.push({ conversationId: `direct_${targetUserId}` });
      orConditions.push({
        $and: [
          { sender: { $in: [req.user._id, targetUserId] } },
          { recipient: { $in: [req.user._id, targetUserId] } },
        ],
      });
    }

    const query = { $or: orConditions };

    const messages = await Message.find(query)
      .populate("sender", "name username email role image profileImage")
      .populate("recipient", "name username email role image profileImage")
      .sort({ createdAt: 1 });

    // Mark unread messages received by the current user as read
    await Message.updateMany(
      {
        ...query,
        recipient: req.user._id,
        read: false,
      },
      { $set: { read: true } }
    );

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (err) {
    console.error("GET MESSAGES ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch messages", error: err.message });
  }
});

/**
 * GET /api/chat/conversations
 * Fetch recent conversations for current user (unified by partner)
 */
router.get("/conversations", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all messages involving this user
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .populate("sender", "name username email role image profileImage")
      .populate("recipient", "name username email role image profileImage")
      .populate({
        path: "consultation",
        populate: { path: "pet", select: "name image description" },
      })
      .sort({ createdAt: -1 });

    // Group messages by partner user ID to ensure unified conversations
    const conversationMap = new Map();

    for (const msg of messages) {
      const isSender = msg.sender && msg.sender._id.toString() === userId.toString();
      const partner = isSender ? msg.recipient : msg.sender;
      if (!partner || !partner._id) continue;

      const partnerKey = partner._id.toString();
      const unifiedConvId = Message.getConversationId(userId, partnerKey);

      if (!conversationMap.has(partnerKey)) {
        conversationMap.set(partnerKey, {
          conversationId: unifiedConvId,
          consultation: msg.consultation || null,
          lastMessage: {
            text: msg.text,
            senderRole: msg.senderRole,
            createdAt: msg.createdAt,
            senderId: msg.sender ? msg.sender._id : null,
          },
          partner,
          unreadCount: 0,
        });
      }

      // Count unread messages sent to the current user
      if (
        msg.recipient &&
        msg.recipient._id.toString() === userId.toString() &&
        !msg.read
      ) {
        const conv = conversationMap.get(partnerKey);
        conv.unreadCount += 1;
      }
    }

    const conversations = Array.from(conversationMap.values());

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (err) {
    console.error("GET CONVERSATIONS ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch conversations", error: err.message });
  }
});

/**
 * PUT /api/chat/read/:conversationId
 * Explicitly mark all messages in a conversation as read
 */
router.put("/read/:conversationId", protect, async (req, res) => {
  try {
    const rawId = req.params.conversationId;
    const currentUserId = req.user._id.toString();

    const { targetUserId, consultationDoc } = await resolvePartnerUserId(rawId, currentUserId);

    const orConditions = [
      { conversationId: rawId },
      { conversationId: `consultation_${rawId}` },
    ];

    if (mongoose.Types.ObjectId.isValid(rawId)) {
      orConditions.push({ consultation: rawId });
    }

    if (consultationDoc) {
      orConditions.push({ consultation: consultationDoc._id });
    }

    if (targetUserId && mongoose.Types.ObjectId.isValid(targetUserId)) {
      const directConvId = Message.getConversationId(req.user._id, targetUserId);
      orConditions.push({ conversationId: directConvId });
      orConditions.push({ conversationId: `direct_${targetUserId}` });
      orConditions.push({
        $and: [
          { sender: { $in: [req.user._id, targetUserId] } },
          { recipient: { $in: [req.user._id, targetUserId] } },
        ],
      });
    }

    const query = {
      $or: orConditions,
      recipient: req.user._id,
      read: false,
    };

    await Message.updateMany(query, { $set: { read: true } });

    return res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (err) {
    console.error("MARK READ ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to mark read", error: err.message });
  }
});

/**
 * GET /api/chat/doctor-status/:id
 * Check real-time availability of a doctor (active in database)
 */
router.get("/doctor-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: true, available: false, reason: "invalid_id" });
    }

    const doctor = await User.findById(id).select("name username role status specialization");
    if (!doctor || doctor.role !== "doctor" || doctor.status === "inactive") {
      return res.json({
        success: true,
        available: false,
        doctor: null,
      });
    }

    return res.json({
      success: true,
      available: true,
      doctor: {
        _id: doctor._id,
        name: doctor.name || doctor.username,
        status: doctor.status || "active",
      },
    });
  } catch (err) {
    console.error("GET DOCTOR STATUS ERROR:", err);
    return res.status(500).json({ success: false, available: false, error: err.message });
  }
});

module.exports = router;
