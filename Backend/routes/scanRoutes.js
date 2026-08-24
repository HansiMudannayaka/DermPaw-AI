const express = require("express");
const router = express.Router();
const Scan = require("../models/Scan");
const protect = require("../middleware/authMiddleware");

// ================= SAVE A SCAN (OWNER) =================
router.post("/", protect, async (req, res) => {
  try {
    const { disease, status, confidence, image, petId, petName } = req.body;

    if (!disease) {
      return res.status(400).json({ success: false, message: "Disease name is required" });
    }

    const scan = new Scan({
      owner: req.user._id,
      disease,
      status: status || "warning",
      confidence: confidence || 0,
      image: image || "",
      pet: petId || null,
      petName: petName || "",
    });

    await scan.save();
    return res.status(201).json({ success: true, scan });
  } catch (err) {
    console.error("SAVE SCAN ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= GET SCANS (OWNER) =================
router.get("/", protect, async (req, res) => {
  try {
    const scans = await Scan.find({ owner: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, scans });
  } catch (err) {
    console.error("GET SCANS ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
