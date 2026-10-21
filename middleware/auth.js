import jwt from "jsonwebtoken";
import Author from "../models/Author.js";

const auth = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authentication token required." });
    }
    const token = authorization.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication token required." });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const author = await Author.findById(decoded.id);
    if (!author) {
      return res.status(401).json({ message: "User not found." });
    }
    req.author = author;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

export default auth;
