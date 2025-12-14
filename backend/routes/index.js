const express = require("express");
const authRouter = require("./auth");
const roomRouter = require("./room");
const gameRouter = require("./game");
const questionRouter = require("./question");
const authMiddleware = require("../middleware/auth")

const router = express.Router();
router.use("/auth", authRouter);

router.use(authMiddleware);

router.use("/room", roomRouter);
router.use("/question", questionRouter);
router.use("/game", gameRouter);

module.exports = router;