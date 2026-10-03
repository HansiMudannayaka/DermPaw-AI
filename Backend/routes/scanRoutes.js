/**
 * DermPaw AI - Scan Route
 * POST /api/scan/analyze  - receive image from React Native, forward to Flask,
 *                           return prediction + Grad-CAM.
 * POST /api/scans         - save a scan result to MongoDB (EXISTING).
 * GET  /api/scans         - list scans for logged-in user (EXISTING).
 */
const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const Scan     = require("../models/Scan");
const protect  = require("../middleware/authMiddleware");
const { analyzeSkinImage, getGradCam, healthCheck } = require("../services/mlService");

// Use memory storage - we forward bytes directly to Flask; nothing is saved to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits : { fileSize: 10 * 1024 * 1024 },   // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// ===========================================================================
// NEW: POST /api/scan/analyze
// React Native  ->  Node (this route)  ->  Flask /predict  ->  back to RN
// ===========================================================================
router.post("/analyze", protect, upload.single("image"), async (req, res) => {
  // -- 400: no image
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Image is required" });
  }

  try {
    // NODE -> FLASK
    const result = await analyzeSkinImage(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    // Pass-through non-predicted statuses (rejected / retake / unknown)
    if (!result.success) {
      return res.status(200).json({
        success       : false,
        rawFlaskResult: result.rawFlaskResult,
        message       : result.rawFlaskResult?.message || "Scan could not be processed",
      });
    }

    // NODE -> REACT NATIVE: clean response
    // NOTE: gradCam is a base64 data-URI; we do NOT store it in MongoDB
    // unless your Scan schema already has an image field for cloud storage.
    return res.status(200).json({
      success   : true,
      prediction: result.prediction,
      gradCam   : result.gradCam,
    });

  } catch (err) {
    console.error("SCAN ANALYZE ERROR:", err.message);

    // Flask unreachable
    if (err.flaskStatus === 503 || err.message.includes("ECONNREFUSED")) {
      return res.status(503).json({
        success: false,
        message: "AI service is currently unavailable. Please try again later.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Analysis failed. Please try again.",
    });
  }
});

// NEW: GET /api/scan/ml-health  - check Flask reachability
router.get("/ml-health", protect, async (_req, res) => {
  const status = await healthCheck();
  return res.status(status.reachable ? 200 : 503).json(status);
});

// ===========================================================================
// EXISTING: POST /api/scans  - save scan result
// ===========================================================================
router.post("/", protect, async (req, res) => {
  try {
    const { disease, status, confidence, image, gradCamImage, petId, petName, allScores, diseaseInfo } = req.body;

    if (!disease) {
      return res.status(400).json({ success: false, message: "Disease name is required" });
    }

    const scan = new Scan({
      owner       : req.user._id,
      disease,
      status      : status      || "warning",
      confidence  : confidence  || 0,
      image       : image       || "",
      gradCamImage: gradCamImage || "",
      pet         : petId       || null,
      petName     : petName     || "",
      allScores   : allScores   || {},
      diseaseInfo : diseaseInfo || {},
    });

    await scan.save();
    return res.status(201).json({ success: true, scan });
  } catch (err) {
    console.error("SAVE SCAN ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ===========================================================================
// EXISTING: GET /api/scans  - list scans for owner (supports ?petId=...)
// ===========================================================================
router.get("/", protect, async (req, res) => {
  try {
    const filter = { owner: req.user._id };
    if (req.query.petId) {
      filter.$or = [
        { pet: req.query.petId },
        { petName: req.query.petName || "" }
      ];
    }
    const scans = await Scan.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, scans });
  } catch (err) {
    console.error("GET SCANS ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Multer error handler
router.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "Image too large (max 10 MB)" });
  }
  if (err.message?.startsWith("Unsupported file type")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: "Upload error" });
});

module.exports = router;
