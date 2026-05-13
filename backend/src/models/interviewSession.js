const mongoose = require("mongoose");

const interviewSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },

  interviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  startTime: Date,
  endTime: Date,

  status: {
    type: String,
    enum: ["created", "ongoing", "completed"],  // ✅ fixed
    default: "created"
  },

  trustScore: {
    type: Number,
    default: 100
  },

  events: [
    {
      type: {
        type: String
      },
      timestamp: Date,
      details: String  // ✅ changed from Object to String so details saves properly
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);