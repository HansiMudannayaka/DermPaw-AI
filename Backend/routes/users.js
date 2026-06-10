const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

/* =========================
   GET ALL DOCTORS
========================= */
router.get("/", async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" }).select("-password");
    res.json(doctors);
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
      role ,
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
   UPDATE DOCTOR
========================= */
router.put("/:id", async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select("-password");

    res.json(updated);
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