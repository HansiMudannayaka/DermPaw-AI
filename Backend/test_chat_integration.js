const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/User");
const Message = require("./models/Message");

async function runTest() {
  console.log("=== RUNNING DIRECT CHAT QUERY TEST ===");
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");

    let doctor = await User.findOne({ role: "doctor" });
    let owner = await User.findOne({ role: "owner" });

    if (!doctor || !owner) {
      console.log("Users not found, exiting");
      process.exit(0);
    }

    const convId = Message.getConversationId(owner._id, doctor._id);
    console.log("Full direct conversation ID:", convId);

    // Create test message
    const msg = new Message({
      conversationId: convId,
      sender: owner._id,
      senderRole: "owner",
      recipient: doctor._id,
      text: "Testing persistence when coming back!",
      read: false,
    });
    await msg.save();
    console.log("Message saved with ID:", msg._id);

    // Simulate Owner querying by `direct_${doctor._id}`
    const queryId = `direct_${doctor._id}`;
    console.log("Owner queries with rawId:", queryId);

    const currentUserId = owner._id.toString();
    let targetUserId = null;
    if (queryId.startsWith("direct_")) {
      const parts = queryId.replace("direct_", "").split("_");
      if (parts.length === 1) {
        targetUserId = parts[0];
      } else if (parts.length >= 2) {
        targetUserId = parts[0] === currentUserId ? parts[1] : parts[0];
      }
    }

    const orConditions = [
      { conversationId: queryId },
      { conversationId: `consultation_${queryId}` },
    ];
    if (targetUserId && mongoose.Types.ObjectId.isValid(targetUserId)) {
      const directConvId = Message.getConversationId(owner._id, targetUserId);
      orConditions.push({ conversationId: directConvId });
      orConditions.push({
        $and: [
          { sender: { $in: [owner._id, targetUserId] } },
          { recipient: { $in: [owner._id, targetUserId] } },
        ],
      });
    }

    const found = await Message.find({ $or: orConditions });
    console.log(`Found ${found.length} messages using raw query ID '${queryId}'! ✅`);

    if (found.length === 0) {
      throw new Error("Message was NOT found by direct query!");
    }

    // Clean up
    await Message.deleteOne({ _id: msg._id });
    console.log("Cleaned up ✅");

    console.log("=== PERSISTENCE TEST PASSED SUCCESSFULLY! ===");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

runTest();
