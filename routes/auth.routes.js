const { Router } = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const router = Router();
const config = require("config");

// /api/auth/register
router.post(
  "/register",
  [
    check("email", "Wrong email").isEmail(),
    check("password", "Min password length 6").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      console.log("Body:", req.body);
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: "Wrong registration data",
        });
      }

      const { email, password } = req.body;

      const candidate = await User.findOne({ email });

      if (candidate) {
        return res.status(400).json({ message: "User exist" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({ email, password: hashedPassword });

      await user.save();

      res.status(201).json({ message: "User created" });
    } catch (e) {
      res.status(500).json({ message: "Что-то пошло не так, попробуй снова" });
    }
  }
);
// /api/auth/login
router.post(
  "/login",
  [
    check("email", "Enter correct email").normalizeEmail().isEmail(),
    check("password", "Enter password").exists(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: "Wrong login data",
        });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "Wrong password" });
      }
      const token = jwt.sign({ userId: user.id }, config.get("jwtSecret"), {
        expiresIn: "5h",
      });

      res.json({ token, userId: user.id });
    } catch (e) {
      res.status(500).json({ message: "Что-то пошло не так, попробуй снова" });
    }
  }
);

module.exports = router;
