const express = require("express");
const router = express.Router();
const Consultation = require("../models/Consultation");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

// ================= SUBMIT REQUEST (OWNER) =================
router.post("/", protect, async (req, res) => {
  try {
    const { doctorId, petName, petImage, aiResult } = req.body;

    if (!doctorId || !petName) {
      return res.status(400).json({ success: false, message: "Doctor ID and Pet Name are required" });
    }

    // Check if doctor exists and is actually a doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(400).json({ success: false, message: "Valid veterinarian not found" });
    }

    const consultation = new Consultation({
      doctor: doctorId,
      owner: req.user._id,
      petName,
      petImage: petImage || "",
      aiResult: aiResult || {},
      status: "pending",
    });

    await consultation.save();
    return res.status(201).json({ success: true, consultation });
  } catch (err) {
    console.error("SUBMIT CONSULTATION ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= GET OWNER HISTORY (OWNER) =================
router.get("/owner", protect, async (req, res) => {
  try {
    const consultations = await Consultation.find({ owner: req.user._id })
      .populate("doctor", "name email specialization experience licenseNo")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, consultations });
  } catch (err) {
    console.error("GET OWNER CONSULTATIONS ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= GET DOCTOR REQUESTS (DOCTOR) =================
router.get("/doctor", protect, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Access denied. Doctors only." });
    }

    const consultations = await Consultation.find({ doctor: req.user._id })
      .populate("owner", "username email name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, consultations });
  } catch (err) {
    console.error("GET DR CONSULTATIONS ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= UPDATE REQUEST (DOCTOR ONLY) =================
router.put("/:id", protect, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Access denied. Doctors only." });
    }

    let consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ success: false, message: "Consultation request not found" });
    }

    // Check if the request is assigned to this doctor
    if (consultation.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this consultation" });
    }

    const { status, advice } = req.body;
    if (status) consultation.status = status;
    if (advice !== undefined) consultation.advice = advice;

    await consultation.save();

    // Re-populate and return
    consultation = await Consultation.findById(req.params.id)
      .populate("owner", "username email name")
      .populate("doctor", "name email specialization");

    return res.status(200).json({ success: true, consultation });
  } catch (err) {
    console.error("UPDATE CONSULTATION ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
