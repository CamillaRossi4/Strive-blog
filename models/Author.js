import mongoose from "mongoose";

const authorSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  cognome: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: { type: String, select: false },
  googleId: { type: String },
  dataDiNascita: { type: Date },
  avatar: { type: String },
});

export default mongoose.model("Author", authorSchema);
