const { GoogleGenerativeAI } = require("@google/generative-ai");
const Question = require("../models/Question");
const User = require("../models/User");

// POST /api/ai/generate
exports.generateQuestions = async (req, res) => {
  try {
    const { notes, topic, difficulty = "Medium", count = 5 } = req.body;

    if (!notes || notes.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least 20 characters of notes.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key not configured in .env file.",
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an expert exam question creator for computer science students.

Based on the following notes/topic, generate ${count} multiple-choice questions.

Topic: ${topic}
Difficulty: ${difficulty}
Notes:
"""
${notes}
"""

Return ONLY a valid JSON array (no markdown, no backticks, no extra text) in this exact format:
[
  {
    "text": "Question text here?",
    "options": [
      { "label": "A", "text": "Option A text" },
      { "label": "B", "text": "Option B text" },
      { "label": "C", "text": "Option C text" },
      { "label": "D", "text": "Option D text" }
    ],
    "answer": "B",
    "explanation": "Brief explanation of why B is correct."
  }
]

Rules:
- Each question must have exactly 4 options labeled A, B, C, D
- Only one answer is correct
- Make questions at ${difficulty} difficulty
- Explanation should be 1-2 sentences
- Return ONLY the JSON array, nothing else`;

    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim();

    // Strip markdown code fences if present
    raw = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let generated;
    try {
      generated = JSON.parse(raw);
    } catch {
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) {
        return res.status(500).json({
          success: false,
          message: "AI returned invalid format. Please try again.",
        });
      }
      generated = JSON.parse(match[0]);
    }

    res.json({ success: true, questions: generated, count: generated.length });
  } catch (err) {
    console.error("AI generate error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/ai/save
exports.saveGeneratedQuestions = async (req, res) => {
  try {
    const { questions, topic, difficulty } = req.body;

    if (!questions || questions.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No questions to save." });
    }

    const saved = await Question.insertMany(
      questions.map((q) => ({
        ...q,
        topic,
        difficulty: difficulty || "Medium",
        createdBy: req.user._id,
        isAIGenerated: true,
        isApproved: true,
      })),
    );

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { points: saved.length * 3, "stats.questionsAdded": saved.length },
    });

    res.status(201).json({
      success: true,
      saved: saved.length,
      message: `${saved.length} questions added to the bank! +${saved.length * 3} points`,
    });
  } catch (err) {
    console.error("AI save error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
