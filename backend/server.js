const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./src/config/db");
connectDB();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
// Track rooms: { sessionId: [{ socketId, role }] }
const rooms = {};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", ({ sessionId, role }) => {
    socket.join(sessionId);

    if (!rooms[sessionId]) rooms[sessionId] = [];

    // Remove old entry for this socket if reconnecting
    rooms[sessionId] = rooms[sessionId].filter(p => p.socketId !== socket.id);
    rooms[sessionId].push({ socketId: socket.id, role });

    console.log(`${role} joined room ${sessionId}. Total:`, rooms[sessionId].length);

    if (rooms[sessionId].length === 2) {
      // Always tell the interviewer to create the offer
      const interviewer = rooms[sessionId].find(p => p.role === "interviewer");
      const candidate   = rooms[sessionId].find(p => p.role === "candidate");

      if (interviewer && candidate) {
        console.log("Both peers ready — telling interviewer to create offer");
        io.to(interviewer.socketId).emit("initiate-offer");
      } else {
        // Fallback: tell first joiner
        console.log("Both peers ready — telling first joiner to create offer");
        io.to(rooms[sessionId][0].socketId).emit("initiate-offer");
      }
    }
  });

  socket.on("offer", ({ sessionId, offer }) => {
    socket.to(sessionId).emit("offer", { offer, from: socket.id });
  });

  socket.on("answer", ({ sessionId, answer }) => {
    socket.to(sessionId).emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ sessionId, candidate }) => {
    socket.to(sessionId).emit("ice-candidate", { candidate });
  });

  socket.on("send-question", ({ sessionId, question }) => {
    socket.to(sessionId).emit("receive-question", { question });
  });

  socket.on("send-answer", ({ sessionId, answer }) => {
    socket.to(sessionId).emit("receive-answer", { answer });
  });

  socket.on("interview-started", ({ sessionId }) => {
    socket.to(sessionId).emit("interview-started");
  });

  socket.on("interview-ended", ({ sessionId }) => {
    socket.to(sessionId).emit("interview-ended");
  });

  // NEW: Detection event handler
  socket.on("detection-event", ({ sessionId, eventType, details, impact }) => {
    // Forward to recruiter in the room
    socket.to(sessionId).emit("detection-event", { eventType, details, impact });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    for (const sessionId in rooms) {
      rooms[sessionId] = rooms[sessionId].filter(p => p.socketId !== socket.id);
      if (rooms[sessionId].length === 0) delete rooms[sessionId];
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});