import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Author from "../models/Author.js";
import auth from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const authors = await Author.find();
    res.json(authors);
  } catch (error) {
    res.status(500).json({ message: "Unable to load authors." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid author ID." });
    }
    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ message: "Author not found." });
    }
    res.json(author);
  } catch (error) {
    res.status(500).json({ message: "Unable to load author." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nome, cognome, email, password, dataDiNascita } = req.body;
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
      dataDiNascita,
    });
    res.status(201).json({
      _id: author._id,
      nome: author.nome,
      cognome: author.cognome,
      email: author.email,
      dataDiNascita: author.dataDiNascita,
      avatar: author.avatar,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "This email is already registered." });
    }
    res.status(400).json({ message: "Unable to create author." });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid author ID." });
    }
    if (String(req.author._id) !== req.params.id) {
      return res
        .status(403)
        .json({ message: "You cannot edit another author's profile." });
    }
    const { nome, cognome, dataDiNascita } = req.body;
    const updates = {};
    if (nome !== undefined) updates.nome = nome;
    if (cognome !== undefined) updates.cognome = cognome;
    if (dataDiNascita !== undefined) updates.dataDiNascita = dataDiNascita;
    const author = await Author.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!author) {
      return res.status(404).json({ message: "Author not found." });
    }
    res.json(author);
  } catch (error) {
    res.status(400).json({ message: "Unable to update author." });
  }
});

router.patch("/:id/avatar", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid author ID." });
    }
    if (String(req.author._id) !== req.params.id) {
      return res
        .status(403)
        .json({ message: "You cannot edit another author's avatar." });
    }
    upload.single("avatar")(req, res, async (error) => {
      if (error) {
        return res.status(400).json({ message: "Unable to upload image." });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded." });
      }
      try {
        const author = await Author.findByIdAndUpdate(
          req.params.id,
          { $set: { avatar: req.file.path } },
          { new: true, runValidators: true },
        );
        if (!author) {
          return res.status(404).json({ message: "Author not found." });
        }
        res.json(author);
      } catch {
        res.status(500).json({ message: "Unable to update avatar." });
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to upload avatar." });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid author ID." });
    }
    if (String(req.author._id) !== req.params.id) {
      return res
        .status(403)
        .json({ message: "You cannot delete another author's account." });
    }
    const author = await Author.findByIdAndDelete(req.params.id);
    if (!author) {
      return res.status(404).json({ message: "Author not found." });
    }
    res.json({ message: "Author deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete author." });
  }
});

export default router;
