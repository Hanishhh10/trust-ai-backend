const express = require("express");
const router = express.Router();

const {
  createInterview,
  startInterview,
  logEvent,
  endInterview,
  getInterview,
  getAllSessions
} = require("../controllers/interviewController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

/* =========================
   CREATE INTERVIEW
========================= */
router.post(
  "/create",
  protect,
  authorizeRoles("interviewer"),
  createInterview
);

/* =========================
   START INTERVIEW
========================= */
router.post(
  "/start/:sessionId",
  protect,
  startInterview
);

/* =========================
   LOG EVENT
========================= */
router.post(
  "/:sessionId/events",
  protect,
  logEvent
);

/* =========================
   END INTERVIEW
========================= */
router.post(
  "/end/:sessionId",
  protect,
  endInterview
);

/* =========================
   GET ALL SESSIONS (🔥 IMPORTANT)
========================= */
router.get(
  "/",
  protect,
  authorizeRoles("interviewer"),
  getAllSessions
);

/* =========================
   GET SINGLE SESSION
========================= */
router.get(
  "/:sessionId",
  protect,
  getInterview
);

module.exports = router;