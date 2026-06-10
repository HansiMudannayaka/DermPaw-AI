const jwt = require("jsonwebtoken");

/* =========================
   GENERATE JWT TOKEN (ROLE-BASED)
========================= */

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role, // 👈 IMPORTANT for doctor/owner routing
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

module.exports = generateToken;