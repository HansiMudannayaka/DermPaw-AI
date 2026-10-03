const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Consultation = require("../models/Consultation");
const Message = require("../models/Message");
const bcrypt = require("bcryptjs");
const protect = require("../middleware/authMiddleware");

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Doctor routes working!" });
});


// GET all doctors
router.get("/", async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" }).select("-password");
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE doctor
router.post("/", async (req, res) => {
  try {
    console.log("Creating doctor with data:", req.body);
    
    const { name, username, email, password, specialization, experience, licenseNo } = req.body;

    // Check existing
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create doctor
    const doctor = new User({
      name: name.startsWith("Dr.") ? name : `Dr. ${name}`,
      username,
      email,
      password: hashedPassword,
      specialization: specialization || "",
      experience: experience || "",
      licenseNo: licenseNo || "",
      role: "doctor",
      status: "active"
    });

    await doctor.save();

    const doctorResponse = doctor.toObject();
    delete doctorResponse.password;

    res.status(201).json({ 
      success: true, 
      message: "Doctor created successfully",
      doctor: doctorResponse 
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// UPDATE doctor
router.put("/:id", async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password");

    res.json({ success: true, doctor: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE doctor
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;