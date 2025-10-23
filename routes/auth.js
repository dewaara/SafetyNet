import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
// import { sendEmail } from "../utils/sendEmail.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Create new user
    const newUser = new User({ name, email, password });
    await newUser.save();

    // Generate verification token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Send verification email
    await sendVerificationEmail(req, res, token, email);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ EMAIL VERIFY
router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).json({ message: "Invalid token" });

    user.verificationStatus = true;
    await user.save();

    res.json({ message: "Email verified successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.verificationStatus) {
      return res.status(403).json({ message: "Please verify your email first" });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
