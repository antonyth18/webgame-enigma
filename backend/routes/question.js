const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

/* ---------------------------------------------------
   CREATE QUESTION
--------------------------------------------------- */
router.post("/create", async (req, res) => {
  try {
    const { text, answer, points, hintForA } = req.body;

    if (!text || !answer || typeof points !== "number") {
      return res.status(400).json({
        message: "text, answer, and points are required",
      });
    }

    const question = await prisma.question.create({
      data: {
        text,
        answer,
        points,
        hintForA: hintForA || null,
      },
    });

    res.status(201).json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create question" });
  }
});

/* ---------------------------------------------------
   CREATE ROUND (ATTACH QUESTIONS TO ROOM)
--------------------------------------------------- */
router.post("/round/create", async (req, res) => {
  try {
    const { roomCode, roundNumber, questionAId, questionBId } = req.body;

    if (!roomCode || !roundNumber || !questionAId || !questionBId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Fetch room first (Mongo-safe)
    const room = await prisma.room.findUnique({
      where: { code: roomCode },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const round = await prisma.round.create({
      data: {
        roundNumber,
        roomId: room.id,
        questionAId,
        questionBId,
      },
      include: {
        questionA: true,
        questionB: true,
      },
    });

    res.status(201).json({
      message: "Round created",
      round,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create round" });
  }
});

/* ---------------------------------------------------
   GET ALL QUESTIONS
--------------------------------------------------- */
router.get("/all", async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

/* ---------------------------------------------------
   GET SINGLE QUESTION
--------------------------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
    });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json(question);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch question" });
  }
});

/* ---------------------------------------------------
   UPDATE QUESTION
--------------------------------------------------- */
router.put("/:id", async (req, res) => {
  try {
    const { text, answer, points, hintForA } = req.body;

    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: {
        text,
        answer,
        points,
        hintForA,
      },
    });

    res.json({
      message: "Question updated",
      question,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update question" });
  }
});

/* ---------------------------------------------------
   DELETE QUESTION
--------------------------------------------------- */
router.delete("/:id", async (req, res) => {
  try {
    await prisma.question.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Question deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete question" });
  }
});

/* ---------------------------------------------------
   SEED QUESTIONS (OPTIONAL)
--------------------------------------------------- */
router.post("/seed", async (req, res) => {
  try {
    const questions = req.body.questions;

    if (!Array.isArray(questions)) {
      return res.status(400).json({ message: "Questions array required" });
    }

    // Expected format validation
    for (const q of questions) {
      if (!q.text || !q.answer || typeof q.points !== "number") {
        return res.status(400).json({
          message: "Each question must have text, answer, points",
        });
      }
    }

    const created = await prisma.question.createMany({
      data: questions,
    });

    res.json({
      message: "Questions seeded",
      count: created.count,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to seed questions" });
  }
});

module.exports = router;
