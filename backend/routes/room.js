const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Helper to generate random room code
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * ====================
 * CREATE ROOM
 * ====================
 * Body: { name }
 * Auth: REQUIRED
 * Creator is auto-added to Team A
 */
router.post("/create", async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.userId;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Room name is required" });
    }

    // Ensure unique room code
    let code;
    let exists;
    do {
      code = generateRoomCode();
      exists = await prisma.room.findUnique({ where: { code } });
    } while (exists);

    const room = await prisma.room.create({
      data: {
        name,
        code,
        teamA: [userId], // creator joins Team A
        teamB: [],
      },
    });

    res.status(201).json({
      roomId: room.id,
      name: room.name,
      code: room.code,
      team: "A",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ====================
 * JOIN ROOM
 * ====================
 * Body: { roomCode, team }  // team = "A" | "B"
 * Auth: REQUIRED
 */
router.post("/join", async (req, res) => {
  try {
    const { roomCode, team } = req.body;
    const userId = req.userId;

    if (!roomCode || !team || !["A", "B"].includes(team)) {
      return res.status(400).json({ message: "Invalid request body" });
    }

    const room = await prisma.room.findUnique({
      where: { code: roomCode },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Prevent user joining twice
    if (room.teamA.includes(userId) || room.teamB.includes(userId)) {
      return res.status(400).json({ message: "User already joined this room" });
    }

    await prisma.room.update({
      where: { code: roomCode },
      data: {
        teamA: team === "A" ? { push: userId } : undefined,
        teamB: team === "B" ? { push: userId } : undefined,
      },
    });

    res.json({
      message: "Joined room successfully",
      roomCode,
      team,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ====================
 * GET ROOM DETAILS
 * ====================
 * Params: :code
 * Auth: REQUIRED
 */
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.userId;

    const room = await prisma.room.findUnique({
      where: { code },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    let team = null;
    if (room.teamA.includes(userId)) team = "A";
    if (room.teamB.includes(userId)) team = "B";

    res.json({
      roomId: room.id,
      name: room.name,
      code: room.code,
      yourTeam: team,
      teamAcount: room.teamA.length,
      teamBcount: room.teamB.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
