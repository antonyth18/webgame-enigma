const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { getRoundBank, checkAnswer } = require("../gameBank");

const router = express.Router();
const prisma = new PrismaClient();

/* ---------------------------------------------------
   HELPER: GET CURRENT ROUND
--------------------------------------------------- */
const getCurrentRound = (rounds) => {
  if (!Array.isArray(rounds) || rounds.length === 0) return null;

  // IMPORTANT:
  // Mongo does not guarantee array order unless explicitly sorted.
  // Always pick the earliest unsolved round by roundNumber.
  const sorted = [...rounds].sort((a, b) => (a.roundNumber ?? 0) - (b.roundNumber ?? 0));
  return sorted.find((r) => !r.solvedA) || null;
};

async function ensureCurrentRound(roomId) {
  // Option A: Questions are NOT in DB.
  // We still keep "round" rows to store solvedA/solvedB/hintFromB/pointsA/pointsB.
  //
  // Prisma schema currently requires questionAId/questionBId, so we attach placeholder questions.
  const roomWithRounds = await prisma.room.findUnique({
    where: { id: roomId },
    include: { rounds: true },
  });

  if (!roomWithRounds) return null;

  const hasAnyRound = Array.isArray(roomWithRounds.rounds) && roomWithRounds.rounds.length > 0;
  const current = getCurrentRound(roomWithRounds.rounds);
  if (current) return current;

  // No active round. If the game is completed (all rounds solvedA), we still won't auto-start a new one.
  // But if there are zero rounds, we can seed round 1.
  if (hasAnyRound) return null;

  // Ensure placeholder questions exist (so Round can reference them)
  const placeholderA =
    (await prisma.question.findFirst({ where: { text: "__PLACEHOLDER_A__" } })) ??
    (await prisma.question.create({
      data: { text: "__PLACEHOLDER_A__", answer: "__", points: 0, hintForA: null },
    }));

  const placeholderB =
    (await prisma.question.findFirst({ where: { text: "__PLACEHOLDER_B__" } })) ??
    (await prisma.question.create({
      data: { text: "__PLACEHOLDER_B__", answer: "__", points: 0, hintForA: null },
    }));

  const createdRound = await prisma.round.create({
    data: {
      roundNumber: 1,
      roomId,
      questionAId: placeholderA.id,
      questionBId: placeholderB.id,
    },
  });

  return createdRound;
}

/* ---------------------------------------------------
   GET GAME STATE
--------------------------------------------------- */
router.get("/:roomCode/state", async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { code: req.params.roomCode },
      include: { rounds: true },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const round = getCurrentRound(room.rounds);

    res.json({
      currentRound: round ? round.roundNumber : null,
      solvedA: round?.solvedA ?? false,
      solvedB: round?.solvedB ?? false,
      scoreA: room.scoreA,
      scoreB: room.scoreB,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch game state" });
  }
});

/* ---------------------------------------------------
   GET QUESTION (AUTO TEAM DETECTION)
--------------------------------------------------- */
router.get("/:roomCode/question", async (req, res) => {
  try {
    const userId = req.userId;

    const room = await prisma.room.findUnique({
      where: { code: req.params.roomCode },
      include: {
        rounds: {
          // no question include needed (Option A)
        },
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId: room.id,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ message: "Not part of this room" });
    }

    let round = getCurrentRound(room.rounds);
    if (!round) {
      const seeded = await ensureCurrentRound(room.id);
      if (seeded) round = seeded;
    }
    if (!round) {
      return res.status(200).json({ message: "Game completed" });
    }

    // TEAM B (Hawkins Lab)
    if (membership.team === "B") {
      const bank = getRoundBank(round.roundNumber);
      return res.json({
        team: "B",
        round: round.roundNumber,
        points: bank?.B?.points ?? 0,
        // whether Hawkins already submitted the hint for this round
        hintSubmitted: Boolean(round.solvedB),
      });
    }

    // TEAM A (Upside Down)
    const bank = getRoundBank(round.roundNumber);
    res.json({
      team: "A",
      round: round.roundNumber,
      points: bank?.A?.points ?? 0,
      hint: round.solvedB ? round.hintFromB : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get question" });
  }
});

/* ---------------------------------------------------
   SUBMIT HINT — TEAM B (NO POINTS)
   NOTE:
   - Hawkins Lab (Team B) must solve their question.
   - Their correct answer is passed to Team A as a "hint".
--------------------------------------------------- */
router.post("/:roomCode/hint", async (req, res) => {
  try {
    const { answer } = req.body;
    const userId = req.userId;

    if (!answer) {
      return res.status(400).json({ message: "Answer required" });
    }

    const room = await prisma.room.findUnique({
      where: { code: req.params.roomCode },
      include: {
        rounds: {
          // no question include needed (Option A)
        },
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId: room.id,
        },
      },
    });

    if (!membership || membership.team !== "B") {
      return res.status(403).json({ message: "Only Team B can submit hints" });
    }

    let round = getCurrentRound(room.rounds);
    if (!round) {
      const seeded = await ensureCurrentRound(room.id);
      if (seeded) round = seeded;
    }
    if (!round) {
      return res.status(400).json({ message: "No active round" });
    }

    if (round.solvedB) {
      return res.status(400).json({ message: "Hint already submitted" });
    }

    const check = checkAnswer({ roundNumber: round.roundNumber, team: "B", answer });
    if (!check.ok) {
      return res.json({ correct: false });
    }

    // ✅ Mark hint submitted (NO POINTS AWARDED)
    await prisma.round.update({
      where: { id: round.id },
      data: {
        solvedB: true,
        // stored as "hintFromB" in schema; used as hint for Team A
        hintFromB: String(answer).trim(),
      },
    });

    res.json({ correct: true, message: "Hint submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Hint submission failed" });
  }
});

/* ---------------------------------------------------
   SUBMIT ANSWER — TEAM A (POINTS AWARDED)
--------------------------------------------------- */
router.post("/:roomCode/answer", async (req, res) => {
  try {
    const { answer } = req.body;
    const userId = req.userId;

    if (!answer) {
      return res.status(400).json({ message: "Answer required" });
    }

    const room = await prisma.room.findUnique({
      where: { code: req.params.roomCode },
      include: {
        rounds: {
          // no question include needed (Option A)
        },
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId: room.id,
        },
      },
    });

    if (!membership || membership.team !== "A") {
      return res.status(403).json({ message: "Only Team A can answer" });
    }

    let round = getCurrentRound(room.rounds);
    if (!round) {
      const seeded = await ensureCurrentRound(room.id);
      if (seeded) round = seeded;
    }
    if (!round) {
      return res.status(400).json({ message: "No active round" });
    }

    if (!round.solvedB) {
      return res.status(403).json({ message: "Hint not unlocked yet" });
    }

    if (round.solvedA) {
      return res.status(400).json({ message: "Already solved" });
    }

    const check = checkAnswer({ roundNumber: round.roundNumber, team: "A", answer });
    if (!check.ok) {
      return res.json({ correct: false });
    }

    // ✅ AWARD POINTS
    await prisma.$transaction([
      prisma.round.update({
        where: { id: round.id },
        data: {
          solvedA: true,
          pointsA: check.points,
        },
      }),
      prisma.room.update({
        where: { id: room.id },
        data: {
          scoreA: { increment: check.points },
        },
      }),
    ]);

    res.json({
      correct: true,
      pointsAwarded: check.points,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Answer submission failed" });
  }
});

module.exports = router;

