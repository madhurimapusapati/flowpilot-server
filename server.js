const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const connectDB      = require("./config/db");
const authRoutes     = require("./routes/authRoutes");
const projectRoutes  = require("./routes/projectRoutes");
const taskRoutes     = require("./routes/taskRoutes");

connectDB();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",          // Vite dev server
  "http://localhost:4173",          // Vite preview
  process.env.CLIENT_URL,           // Railway frontend URL (set in Railway env vars)
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
}));

app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks",    taskRoutes);

app.get("/", (req, res) =>{ res.send("FlowPilot API Running")});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`)} );
