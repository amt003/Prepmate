const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getQuestions,
  getQuestion,
  createQuestion,
  deleteQuestion,
  upvoteQuestion,
  getQuestionStats,
} = require("../controllers/questionController");

const router = express.Router();

router.get("/stats/count", protect, getQuestionStats);
router.get("/", protect, getQuestions);
router.get("/:id", protect, getQuestion);
router.post("/", protect, createQuestion);
router.delete("/:id", protect, deleteQuestion);
router.post("/:id/upvote", protect, upvoteQuestion);

module.exports = router;
