import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Author from "../models/Author.js";
import auth from "../middleware/auth.js";
import passport from "../config/passport.js";

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

router.post("/register", async (req, res) => {
  try {
    const { nome, cognome, email, password } = req.body;
    if (
      !nome ||
      !cognome ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res
        .status(400)
        .json({ message: "Please complete all required fields." });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }
    const existingAuthor = await Author.findOne({ email: normalizedEmail });
    if (existingAuthor) {
      return res
        .status(409)
        .json({ message: "This email is already registered." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const author = await Author.create({
      nome,
      cognome,
      email: normalizedEmail,
      password: hashedPassword,
    });
    res.status(201).json({
      message: "Registration completed successfully.",
      author: {
        _id: author._id,
        nome: author.nome,
        cognome: author.cognome,
        email: author.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "This email is already registered." });
    }
    res.status(500).json({ message: "Unable to complete registration." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res
        .status(400)
        .json({ message: "Please enter your email and password." });
    }
    const author = await Author.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");
    if (!author || !author.password) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const validPassword = await bcrypt.compare(password, author.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = jwt.sign({ id: author._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({
      token,
      author: {
        _id: author._id,
        nome: author.nome,
        cognome: author.cognome,
        email: author.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to log in." });
  }
});

router.get("/me", auth, (req, res) => {
  res.json({
    _id: req.author._id,
    nome: req.author.nome,
    cognome: req.author.cognome,
    email: req.author.email,
    avatar: req.author.avatar,
  });
});

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/?google_error=1`,
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.redirect(`${FRONTEND_URL}/?google_token=${encodeURIComponent(token)}`);
  },
);

export default router;
