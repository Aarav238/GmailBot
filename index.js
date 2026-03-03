import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import { MONGODB_URI } from "./configs/configs.js";
import authRoutes from "./routes/auth.js";
import botRoutes from "./routes/bot.js";
import { startBotEngine } from "./services/botEngine.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:8000"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/bot", botRoutes);

app.get("/", (req, res) => {
  res.send("Gmail Bot API running");
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    startBotEngine();
    app.listen(8000, () => console.log("Server started at port 8000"));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
