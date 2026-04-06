const User = require('../models/User');
const Quiz = require('../models/Quiz');

// GET /api/leaderboard?period=all|week|today
exports.getLeaderboard = async (req, res) => {
  try {
    const { period = 'all', limit = 20 } = req.query;

    if (period === 'all') {
      // All-time: rank by total points
      const users = await User.find({ role: 'student' })
        .select('name points level stats streak')
        .sort({ points: -1 })
        .limit(Number(limit));

      const board = users.map((u, i) => ({
        rank: i + 1,
        id: u._id,
        name: u.name,
        points: u.points,
        level: u.level,
        streak: u.streak,
        quizzes: u.stats.totalQuizzes,
        accuracy: u.stats.totalQuestions
          ? Math.round((u.stats.correctAnswers / u.stats.totalQuestions) * 100)
          : 0,
      }));

      return res.json({ success: true, period, board });
    }

    // Weekly / daily: aggregate points from recent quizzes
    const since = new Date();
    if (period === 'week')  since.setDate(since.getDate() - 7);
    if (period === 'today') since.setHours(0, 0, 0, 0);

    const results = await Quiz.aggregate([
      { $match: { completed: true, completedAt: { $gte: since } } },
      { $group: { _id: '$user', points: { $sum: '$pointsEarned' }, quizzes: { $sum: 1 } } },
      { $sort: { points: -1 } },
      { $limit: Number(limit) },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', level: '$user.level', points: 1, quizzes: 1 } },
    ]);

    const board = results.map((r, i) => ({ rank: i + 1, id: r._id, name: r.name, level: r.level, points: r.points, quizzes: r.quizzes }));
    res.json({ success: true, period, board });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/leaderboard/me  — current user's rank
exports.getMyRank = async (req, res) => {
  try {
    const rank = await User.countDocuments({ points: { $gt: req.user.points }, role: 'student' });
    const total = await User.countDocuments({ role: 'student' });
    res.json({ success: true, rank: rank + 1, total, points: req.user.points });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
