const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const User = require("../models/User");

// POST /api/quizzes/start  — generate a new quiz
exports.startQuiz = async (req, res) => {
  try {
    const { topic, difficulty, count = 10 } = req.body;

    const filter = { isApproved: true, topic };
    if (difficulty && difficulty !== "Mixed") filter.difficulty = difficulty;

    // First, count how many questions match the filter
    const totalAvailable = await Question.countDocuments(filter);

    if (totalAvailable === 0) {
      return res.status(404).json({
        success: false,
        message: "No questions found for this topic.",
      });
    }

    // Use the minimum of requested count or available questions
    const sampleSize = Math.min(Number(count), totalAvailable);

    // Randomly pick `sampleSize` questions
    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: sampleSize } },
      { $project: { answer: 0, explanation: 0 } }, // hide answers during quiz
    ]);

    const quiz = await Quiz.create({
      user: req.user._id,
      topic,
      difficulty: difficulty || "Mixed",
      questions: questions.map((q) => q._id),
      totalQuestions: questions.length,
    });

    res.status(201).json({ success: true, quizId: quiz._id, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/quizzes/:id/submit  — submit answers
exports.submitQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz)
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found." });
    if (quiz.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not your quiz." });
    }
    if (quiz.completed) {
      return res
        .status(400)
        .json({ success: false, message: "Quiz already submitted." });
    }

    const { answers, timeTaken } = req.body;
    // answers: [{ questionId, selectedOption }]

    // Fetch actual answers
    const questionIds = quiz.questions;
    const questions = await Question.find({ _id: { $in: questionIds } });
    const answerMap = {};
    questions.forEach((q) => {
      answerMap[q._id.toString()] = q.answer;
    });

    let score = 0;
    const attempts = answers.map((a) => {
      const correct = answerMap[a.questionId] === a.selectedOption;
      if (correct) score++;
      return {
        question: a.questionId,
        selectedOption: a.selectedOption,
        isCorrect: correct,
        timeTaken: a.timeTaken || 0,
      };
    });

    // Update question crowd stats
    for (const a of attempts) {
      await Question.findByIdAndUpdate(a.question, {
        $inc: {
          timesAttempted: 1,
          ...(a.isCorrect ? { timesCorrect: 1 } : {}),
        },
      });
    }

    // Save quiz result
    quiz.attempts = attempts;
    quiz.score = score;
    quiz.timeTaken = timeTaken || 0;
    quiz.completed = true;
    quiz.completedAt = new Date();
    quiz.pointsEarned = quiz.calculatePoints();
    await quiz.save();

    // Update user stats
    const user = await User.findById(req.user._id);
    user.points += quiz.pointsEarned;
    user.stats.totalQuizzes += 1;
    user.stats.totalQuestions += quiz.totalQuestions;
    user.stats.correctAnswers += score;

    // Update topic progress
    const topicData = user.topicProgress.get(quiz.topic) || {
      attempted: 0,
      correct: 0,
    };
    topicData.attempted += quiz.totalQuestions;
    topicData.correct += score;
    user.topicProgress.set(quiz.topic, topicData);

    user.syncLevel();
    await user.save();

    // Return result with correct answers revealed
    const result = await Quiz.findById(quiz._id).populate(
      "attempts.question",
      "text options answer explanation",
    );

    res.json({
      success: true,
      score,
      totalQuestions: quiz.totalQuestions,
      percentage: quiz.percentage,
      pointsEarned: quiz.pointsEarned,
      result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/quizzes/history  — past quizzes for logged-in user
exports.getHistory = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ user: req.user._id, completed: true })
      .select(
        "topic difficulty score totalQuestions pointsEarned timeTaken completedAt",
      )
      .sort({ completedAt: -1 })
      .limit(20);
    res.json({ success: true, quizzes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
