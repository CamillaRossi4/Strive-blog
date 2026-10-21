import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    author: { type: String, required: true },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
    },
    content: { type: String, required: true, trim: true, minlength: 1 },
  },
  { timestamps: true },
);

const blogPostSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    cover: { type: String, required: true },
    readTime: {
      value: { type: Number, required: true, min: 1 },
      unit: { type: String, required: true },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: true,
    },
    content: { type: String, required: true, trim: true },
    comments: [commentSchema],
  },
  { timestamps: true },
);

export default mongoose.model("BlogPost", blogPostSchema);
