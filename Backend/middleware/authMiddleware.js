const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* =========================
   PROTECT MIDDLEWARE
========================= */

const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check token in header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. No token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Get real user from DB (IMPORTANT FIX)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // 5. Attach user to request
    req.user = user;

    next();

  } catch (error) {
    console.log("AUTH ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Token invalid or expired",
    });
  }
};

module.exports = protect;