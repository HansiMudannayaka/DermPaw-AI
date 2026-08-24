const express = require("express");
const router = express.Router();
const Pet = require("../models/Pet");
const protect = require("../middleware/authMiddleware");

// ================= CREATE PET =================
router.post("/", protect, async (req, res) => {
  try {
    const { name, age, weight, gender, description, color, image } = req.body;

    if (!name || !age || !weight || !gender || !description || !color) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    const pet = new Pet({
      owner: req.user._id,
      name,
      age,
      weight,
      gender,
      description,
      color,
      image: image || "",
    });

    await pet.save();
    return res.status(201).json({ success: true, pet });
  } catch (err) {
    console.error("CREATE PET ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= GET ALL PETS (OWNER) =================
router.get("/", protect, async (req, res) => {
  try {
    const pets = await Pet.find({ owner: req.user._id });
    return res.status(200).json({ success: true, pets });
  } catch (err) {
    console.error("GET PETS ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= UPDATE PET =================
router.put("/:id", protect, async (req, res) => {
  try {
    let pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ success: false, message: "Pet not found" });
    }

    // Check ownership
    if (pet.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this pet" });
    }

    pet = await Pet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ success: true, pet });
  } catch (err) {
    console.error("UPDATE PET ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= DELETE PET =================
router.delete("/:id", protect, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ success: false, message: "Pet not found" });
    }

    // Check ownership
    if (pet.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this pet" });
    }

    await Pet.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Pet deleted successfully" });
  } catch (err) {
    console.error("DELETE PET ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
