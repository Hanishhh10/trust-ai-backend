const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "TRUST AI backend running" });
});

// Routes
const authRoutes      = require("./routes/authRoutes");
const testRoutes      = require("./routes/testRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const examRoutes      = require("./routes/examRoutes");

app.use("/api/auth",      authRoutes);
app.use("/api/test",      testRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/exam",      examRoutes);

module.exports = app;