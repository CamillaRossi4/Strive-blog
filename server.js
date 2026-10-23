import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authorsRouter from "./routes/authors.js";
import blogPostsRouter from "./routes/blogPosts.js";
import authRouter from "./routes/auth.js";
import passport from "./config/passport.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: ["http://localhost:5173", "https://strive-blog-theta.vercel.app"],
  }),
);
app.use(express.json());
app.use(passport.initialize());
app.use("/authors", authorsRouter);
app.use("/blogPosts", blogPostsRouter);
app.use("/auth", authRouter);

app.get("/", (req, res) => {
  res.send("Strive Blog API is running!");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });
