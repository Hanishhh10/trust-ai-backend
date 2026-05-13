const InterviewSession = require("../models/interviewSession");
const { v4: uuidv4 } = require("uuid");

/* CREATE */
exports.createInterview = async (req, res) => {
  try {
    const { candidateId } = req.body;
    const session = await InterviewSession.create({
      sessionId: uuidv4(),
      interviewer: req.user.id,
      candidate: candidateId,
      status: "created",
      trustScore: 100,
      events: []
    });
    res.status(201).json({ message: "Interview session created", session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* START */
exports.startInterview = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await InterviewSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    // ✅ accept "created" only
    if (session.status !== "created") {
      return res.status(400).json({ message: "Interview already started or ended" });
    }

    session.status = "ongoing"; // ✅ changed from "started" to "ongoing"
    session.startTime = new Date();
    await session.save();

    res.status(200).json({ message: "Interview started", session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* LOG EVENT */
exports.logEvent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { type, details } = req.body;

    const session = await InterviewSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    // ✅ accept "ongoing" (was "started" before — that's why events weren't logging)
    if (session.status !== "ongoing") {
      return res.status(400).json({ message: "Interview not active" });
    }

    session.events.push({ type, timestamp: new Date(), details });

    // Trust score deductions
    const deductions = {
      tab_switch:       -10,
      malpractice:      -30,
      multiple_faces:   -15,
      face_not_detected:-10,
      camera_off:        -5,
      gaze_away:         -3,
      paste_in_answer:  -15,
      ai_answer_detected:-25,
      suspicious_answer:-10,
    };

    const impact = deductions[type] ?? 0;
    session.trustScore = Math.max(0, session.trustScore + impact);

    await session.save();

    res.status(200).json({ message: "Event logged", trustScore: session.trustScore });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* END */
exports.endInterview = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await InterviewSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    // ✅ accept both "ongoing" and "created" so Leave always works
    if (session.status === "completed") {
      return res.status(200).json({ message: "Already ended", finalTrustScore: session.trustScore });
    }

    session.status = "completed";
    session.endTime = new Date();
    await session.save();

    res.status(200).json({ message: "Interview ended", finalTrustScore: session.trustScore });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* GET SINGLE */
exports.getInterview = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await InterviewSession.findOne({ sessionId })
      .populate("interviewer", "name email")
      .populate("candidate", "name email");
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* GET ALL */
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await InterviewSession.find()
      .populate("candidate", "email");

    const formatted = sessions.map((s) => ({
      sessionId: s.sessionId,
      status: s.status,
      trustScore: s.trustScore,
      createdAt: s.createdAt,
      candidateEmail: s.candidate?.email || "Not assigned"
    }));

    res.status(200).json({ sessions: formatted });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};