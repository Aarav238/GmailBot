import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  picture:      { type: String },
  refreshToken: { type: String, required: true },
  botEnabled:   { type: Boolean, default: false },
  lastRun:      { type: Date,    default: null },
  lastError:    { type: String,  default: null },
  // User-configurable settings
  replyMessage: { type: String,  default: "Thank you for your email. I have received your message and will get back to you as soon as possible." },
  minInterval:  { type: Number,  default: 10 },
  maxInterval:  { type: Number,  default: 10 },
  createdAt:    { type: Date,    default: Date.now },
});

export default mongoose.model("User", userSchema);
