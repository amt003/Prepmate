const express = require("express");
const { protect } = require("../middleware/auth");
const {
  generateQuestions,
  saveGeneratedQuestions,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/generate", protect, generateQuestions);
router.post("/save", protect, saveGeneratedQuestions);

module.exports = router;
