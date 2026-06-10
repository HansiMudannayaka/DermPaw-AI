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

    // ================= DOCTOR INFO =================
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