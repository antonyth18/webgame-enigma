const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/* -----------------------------------
   HELPERS
----------------------------------- */
const generateRoomCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

/* =====================================================
   CREATE ROOM
   - Creator is added to TEAM A
   - Auth required (req.userId)
===================================================== */
router.post("/create", async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.userId;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Room name is required" });
    }

    // Ensure unique room code
    let code;
    do {
      code = generateRoomCode();
    } while (await prisma.room.findUnique({ where: { code } }));

    const room = await prisma.room.create({
      data: {
        name,
        code,
        members: {
          create: {
            userId,
            team: "A",
          },
        },
      },
    });

    res.status(201).json({
      roomId: room.id,
      code: room.code,
      team: "A",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create room" });
  }
});

/* =====================================================
   JOIN ROOM
   - User joins Team A or B
===================================================== */
router.post("/join", async (req, res) => {
  try {
    const { roomCode, team } = req.body;
    const userId = req.userId;

    if (!roomCode || !["A", "B"].includes(team)) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const room = await prisma.room.findUnique({
      where: { code: roomCode },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Prevent duplicate membership
    const existing = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId: room.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ message: "User already in room" });
    }

    await prisma.roomMember.create({
      data: {
        userId,
        roomId: room.id,
        team,
      },
    });

    res.json({
      message: "Joined room successfully",
      roomCode,
      team,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to join room" });
  }
});

/* =====================================================
   GET ROOM DETAILS
===================================================== */
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.userId;

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        members: true,
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const membership = room.members.find(m => m.userId === userId);

    res.json({
      roomId: room.id,
      name: room.name,
      code: room.code,
      yourTeam: membership?.team || null,
      teamACount: room.members.filter(m => m.team === "A").length,
      teamBCount: room.members.filter(m => m.team === "B").length,
      scoreA: room.scoreA,
      scoreB: room.scoreB,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch room" });
  }
});

/* =====================================================
   LEADERBOARD (GLOBAL ACROSS ALL ROOMS)
   IMPORTANT: This route must come BEFORE /:code/leaderboard
   to avoid Express matching "leaderboard" as a room code
===================================================== */
router.get("/leaderboard/global", async (_req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        members: {
          include: { user: true },
        },
        rounds: true,
      },
    });

    const leaderboard = {};

    rooms.forEach((room) => {
      if (!room.members || !Array.isArray(room.members)) return;
      
      room.members.forEach((member) => {
        // Skip members without a valid user
        if (!member || !member.user || !member.user.teamName) return;

        const teamName = member.user.teamName;
        const teamSide = member.team; // "A" or "B"

        let totalPoints = 0;
        if (room.rounds && Array.isArray(room.rounds)) {
          room.rounds.forEach((round) => {
            if (teamSide === "A") totalPoints += (round.pointsA || 0);
            else totalPoints += (round.pointsB || 0);
          });
        }

        if (!leaderboard[teamName]) leaderboard[teamName] = 0;
        leaderboard[teamName] += totalPoints;
      });
    });

    const sortedLeaderboard = Object.entries(leaderboard)
      .map(([teamName, points]) => ({ teamName, points }))
      .sort((a, b) => b.points - a.points);

    res.json({ leaderboard: sortedLeaderboard });
  } catch (err) {
    console.error("Global leaderboard error:", err);
    res.status(500).json({ message: "Failed to fetch global leaderboard", error: err.message });
  }
});

/* =====================================================
   LEADERBOARD (ROOM-SPECIFIC)
===================================================== */
router.get("/:code/leaderboard", async (req, res) => {
  try {
    const roomCode = req.params.code;

    // Fetch the room with members and rounds
    const room = await prisma.room.findUnique({
      where: { code: roomCode },
      include: {
        members: {
          include: { user: true }, // include teamName
        },
        rounds: true,
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Aggregate points per teamName
    const leaderboard = {};

    if (room.members && Array.isArray(room.members)) {
      room.members.forEach((member) => {
        // Skip members that don't have a linked user record
        if (!member || !member.user || !member.user.teamName) return;

        const teamName = member.user.teamName;
        const teamSide = member.team; // "A" or "B"

        let totalPoints = 0;
        if (room.rounds && Array.isArray(room.rounds)) {
          room.rounds.forEach((round) => {
            if (teamSide === "A") totalPoints += (round.pointsA || 0);
            else totalPoints += (round.pointsB || 0);
          });
        }

        if (!leaderboard[teamName]) leaderboard[teamName] = 0;
        leaderboard[teamName] += totalPoints;
      });
    }

    // Convert to sorted array
    const sortedLeaderboard = Object.entries(leaderboard)
      .map(([teamName, points]) => ({ teamName, points }))
      .sort((a, b) => b.points - a.points);

    res.json({ leaderboard: sortedLeaderboard });
  } catch (err) {
    console.error("Room leaderboard error:", err);
    res.status(500).json({ message: "Failed to fetch leaderboard", error: err.message });
  }
});

module.exports = router;
