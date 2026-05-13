const express = require("express");
const router = express.Router();

// controllers
const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

// middleware
const { protect } = require("../middlewares/authMiddleware");

// model
const User = require("../models/User");

// routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// GET /api/auth/user-by-email?email=candidate@test.com
router.get("/user-by-email", protect, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.query.email }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;