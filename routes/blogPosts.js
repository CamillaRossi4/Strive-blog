import express from "express";
import mongoose from "mongoose";
import BlogPost from "../models/BlogPost.js";
import { upload } from "../config/cloudinary.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
    const limit = Math.min(
      100,
      Math.max(1, Math.floor(Number(req.query.limit) || 10)),
    );
    const skip = (page - 1) * limit;
    const filter = {};
    if (typeof req.query.title === "string" && req.query.title.trim()) {
      const title = req.query.title.trim().slice(0, 100);
      const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: escapedTitle, $options: "i" };
    }
    const posts = await BlogPost.find(filter)
      .populate("author")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await BlogPost.countDocuments(filter);
    res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Unable to load articles." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid article ID." });
    }
    const post = await BlogPost.findById(req.params.id).populate("author");
    if (!post) {
      return res.status(404).json({ message: "Article not found." });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Unable to load article." });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { category, title, cover, readTime, content } = req.body;
    const post = await BlogPost.create({
      category,
      title,
      cover,
      readTime,
      content,
      author: req.author._id,
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: "Unable to create article." });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid article ID." });
    }
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Article not found." });
    }
    if (String(post.author) !== String(req.author._id)) {
      return res.status(403).json({ message: "You cannot edit this article." });
    }
    const { category, title, cover, readTime, content } = req.body;
    if (category !== undefined) post.category = category;
    if (title !== undefined) post.title = title;
    if (cover !== undefined) post.cover = cover;
    if (readTime !== undefined) post.readTime = readTime;
    if (content !== undefined) post.content = content;
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(400).json({ message: "Unable to update article." });
  }
});

router.patch("/:id/cover", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid article ID." });
    }
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Article not found." });
    }
    if (String(post.author) !== String(req.author._id)) {
      return res.status(403).json({ message: "You cannot edit this article." });
    }
    upload.single("cover")(req, res, async (error) => {
      if (error) {
        return res.status(400).json({ message: "Unable to upload image." });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded." });
      }
      try {
        post.cover = req.file.path;
        await post.save();
        res.json(post);
      } catch {
        res.status(500).json({ message: "Unable to update article cover." });
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to upload article cover." });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid article ID." });
    }
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Article not found." });
    }
    if (String(post.author) !== String(req.author._id)) {
      return res
        .status(403)
        .json({ message: "You cannot delete this article." });
    }
    await post.deleteOne();
    res.json({ message: "Article deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete article." });
  }
});

router.get("/:id/comments", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid article ID." });
    }
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Article not found." });
    }
    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ message: "Unable to load comments." });
  }
});

router.get("/:id/comments/:commentId", async (req, res) => {
  try {
    if (
      !mongoose.isValidObjectId(req.params.id) ||
      !mongoose.isValidObjectId(req.params.commentId)
    ) {
      return res.status(400).json({ message: "Invalid ID." });
    }
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Article not found." });
    }
    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: "Unable to load comment." });
  }
});

router.post("/:id/comments", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid article ID." });
    }
    const content = req.body.content;
    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty." });
    }
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Article not found." });
    }
    post.comments.push({
      author: `${req.author.nome} ${req.author.cognome}`,
      authorId: req.author._id,
      content: content.trim(),
    });
    await post.save();
    res.status(201).json(post.comments[post.comments.length - 1]);
  } catch (error) {
    res.status(400).json({ message: "Unable to publish comment." });
  }
});

router.put("/:id/comments/:commentId", auth, async (req, res) => {
  try {
    if (
      !mongoose.isValidObjectId(req.params.id) ||
      !mongoose.isValidObjectId(req.params.commentId)
    ) {
      return res.status(400).json({ message: "Invalid ID." });
    }
    const content = req.body.content;
    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty." });
    }
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Article not found." });
    }
    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }
    if (
      !comment.authorId ||
      String(comment.authorId) !== String(req.author._id)
    ) {
      return res.status(403).json({ message: "You cannot edit this comment." });
    }
    comment.content = content.trim();
    await post.save();
    res.json(comment);
  } catch (error) {
    res.status(400).json({ message: "Unable to update comment." });
  }
});

router.delete("/:id/comments/:commentId", auth, async (req, res) => {
  try {
    if (
      !mongoose.isValidObjectId(req.params.id) ||
      !mongoose.isValidObjectId(req.params.commentId)
    ) {
      return res.status(400).json({ message: "Invalid ID." });
    }
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Article not found." });
    }
    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }
    if (
      !comment.authorId ||
      String(comment.authorId) !== String(req.author._id)
    ) {
      return res
        .status(403)
        .json({ message: "You cannot delete this comment." });
    }
    comment.deleteOne();
    await post.save();
    res.json({ message: "Comment deleted successfully." });
  } catch (error) {
    res.status(400).json({ message: "Unable to delete comment." });
  }
});

export default router;
