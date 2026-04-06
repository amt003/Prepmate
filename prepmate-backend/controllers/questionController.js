const Question = require("../models/Question");
const User = require("../models/User");

// GET /api/questions  — list with filters
exports.getQuestions = async (req, res) => {
  try {
    const { topic, difficulty, search, page = 1, limit = 20 } = req.query;
    const filter = { isApproved: true };

    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.$text = { $search: search };

    const skip = (page - 1) * limit;
    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Question.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      questions,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/questions/:id
exports.getQuestion = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id).populate(
      "createdBy",
      "name",
    );
    if (!q)
      return res
        .status(404)
        .json({ success: false, message: "Question not found." });
    res.json({ success: true, question: q });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/questions  — add a new question
exports.createQuestion = async (req, res) => {
  try {
    const { text, options, answer, explanation, topic, difficulty } = req.body;

    const question = await Question.create({
      text,
      options,
      answer,
      explanation,
      topic,
      difficulty: difficulty || "Medium",
      createdBy: req.user._id,
    });

    // Credit the user
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { points: 5, "stats.questionsAdded": 1 },
    });

    res.status(201).json({ success: true, question });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/questions/:id  — only creator or admin
exports.deleteQuestion = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q)
      return res.status(404).json({ success: false, message: "Not found." });

    const isOwner = q.createdBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized." });
    }

    await q.deleteOne();
    res.json({ success: true, message: "Question deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/questions/:id/upvote
exports.upvoteQuestion = async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q)
      return res.status(404).json({ success: false, message: "Not found." });

    const uid = req.user._id.toString();
    const alreadyVoted = q.upvotes.map(String).includes(uid);

    if (alreadyVoted) {
      q.upvotes = q.upvotes.filter((id) => id.toString() !== uid);
    } else {
      q.upvotes.push(req.user._id);
    }

    await q.save();
    res.json({
      success: true,
      upvotes: q.upvotes.length,
      voted: !alreadyVoted,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/questions/stats/count  — get question counts by topic & difficulty
exports.getQuestionStats = async (req, res) => {
  try {
    const stats = await Question.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id: { topic: "$topic", difficulty: "$difficulty" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.topic": 1, "_id.difficulty": 1 } },
    ]);

    // Format the response
    const formatted = {};
    stats.forEach(({ _id, count }) => {
      if (!formatted[_id.topic]) formatted[_id.topic] = {};
      formatted[_id.topic][_id.difficulty] = count;
    });

    res.json({ success: true, stats: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
