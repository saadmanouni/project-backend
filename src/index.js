import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase } from "./db/database.js";

import teamsRouter from "./routes/teams.js";
import exchangesRouter from "./routes/exchanges.js";
import cluesRouter from "./routes/clues.js";
import answersRouter from "./routes/answers.js";
import commentsRouter from "./routes/comments.js";
import sessionRouter from "./routes/session.js";
import priseEnChargeRouter from "./routes/priseEnCharge.js";
import casesRouter from "./routes/cases.js";
import settingsRouter from "./routes/settings.js";
import questionsRouter from "./routes/questions.js";
import teamCluesRouter from "./routes/teamClues.js";
import buzzRouter from "./routes/buzz.js";
import phase5Routes from "./routes/phase5.js";
import phase6Router from "./routes/phase6.js";


import { setupSocketHandlers } from "./socket/socketHandler.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ⚙️ CORS autorisé
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map(s => s.trim());

const io = new Server(httpServer, {
  cors: {
   origin: (origin, callback) => {
  if (!origin) return callback(null, true);

  const cleanOrigin = origin.replace(/\/$/, "");

  if (ALLOWED_ORIGINS.map(o => o.replace(/\/$/, "")).includes(cleanOrigin)) {
    return callback(null, true);
  }

  console.log("❌ Socket CORS rejected:", origin);
  return callback(new Error("Not allowed by CORS (socket.io)"), false);
},

    methods: ["GET", "POST"],
    credentials: true,
  },
});

// 🧱 Middleware CORS
app.use(cors({
  origin: (origin, callback) => {
  if (!origin) return callback(null, true); // Navigateur local

  const cleanOrigin = origin.replace(/\/$/, ""); // retire le slash final

  if (ALLOWED_ORIGINS.map(o => o.replace(/\/$/, "")).includes(cleanOrigin)) {
    return callback(null, true);
  }

  console.log("❌ CORS rejected:", origin);
  return callback(new Error("Not allowed by CORS (express)"), false);
},

  credentials: true,
}));

// 🧱 Middleware JSON
app.use(express.json());

// 🗃 Initialisation DB
await initializeDatabase();

// 🛣 Toutes les routes API
app.use("/api/phase5", phase5Routes);   // <-- CORRECT
app.use("/api/phase6", phase6Router);
app.use("/api/teams", teamsRouter);
app.use("/api/exchanges", exchangesRouter);
app.use("/api/clues", cluesRouter);
app.use("/api/answers", answersRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/session", sessionRouter);
app.use("/api/prise-en-charge", priseEnChargeRouter);
app.use("/api/cases", casesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/buzz", buzzRouter);
app.use("/api/team-clues", teamCluesRouter);

// Route test
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ⚡ Socket.io
setupSocketHandlers(io);
global.io = io;


const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`⚡ Socket.io ready for connections`);
});
