const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ================= BASIC INFO =================
    name: {
      type: String,
      trim: true,
    },

username: {
  type: String,
  trim: true,
  minlength: 3,
},
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // IMPORTANT: hide password from API response
    },

    // ================= ROLE SYSTEM =================
    role: {
      type: String,
      enum: ["owner", "doctor", "admin"],
      default: "owner",
    },

    // ================= DOCTOR & PROFILE INFO =================
    image: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String,
      default: "",
    },
    specialization: {
      type: String,
      default: "",
    },
    experience: {
      type: String,
      default: "",
    },
    licenseNo: {
      type: String,
      default: "",
    },
    clinic: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    rating: {
      type: String,
      default: "5.0",
    },
    reviews: {
      type: String,
      default: "100+ Reviews",
    },

    // ================= STATUS =================
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);