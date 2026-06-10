const express = require("express");
const router = express.Router();

const { loginUser, registerUser } = require("../controllers/authController");

// REGISTER
router.post("/register", registerUser);

// LOGIN
router.post("/login", loginUser);

module.exports = router;