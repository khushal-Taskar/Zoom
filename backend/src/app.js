import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";

import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);

// ✅ Attach Socket.IO
connectToSocket(server);

// ✅ Railway provides PORT automatically
const PORT = process.env.PORT || 8000;

// ✅ Middlewares
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "*",
  credentials: true
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// ✅ Health check route (Railway 502 fix)
app.get("/", (req, res) => {
  res.status(200).send("Backend is running 🚀");
});

// ✅ API routes
app.use("/api/v1/users", userRoutes);

// ✅ Start server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
