const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

/* =========================
   GET ALL USERS (filter by role on client)
========================= */
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/* =========================
   GET USER BY ID
========================= */
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user, ...user.toObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   CREATE DOCTOR (HASH PASSWORD)
========================= */
router.post("/", async (req, res) => {
  try {
    const { name, username, email, password, specialization, experience, licenseNo } = req.body;

    // check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Doctor already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = new User({
      name,
      username,
      email,
      password: hashedPassword,
      specialization,
      experience,
      licenseNo,
      role: req.body.role || "doctor",
    });

    await doctor.save();

    const safeDoctor = doctor.toObject();
    delete safeDoctor.password;

    res.status(201).json(safeDoctor);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   UPDATE USER (doctor or owner)
========================= */
router.put("/:id", async (req, res) => {
  try {
    const allowedFields = [
      "name", "username", "email", "specialization", "experience", "licenseNo",
      "clinic", "phone", "location", "bio", "image", "profileImage", "rating", "reviews", "status"
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password");

    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: updated, ...updated.toObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   DELETE DOCTOR
========================= */
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;