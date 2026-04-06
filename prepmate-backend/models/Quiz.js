const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  question:      { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedOption: { type: String, enum: ['A', 'B', 'C', 'D', null], default: null },
  isCorrect:     { type: Boolean, default: false },
  timeTaken:     { type: Number, default: 0 }, // seconds
});

const quizSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic:   { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Mixed'], default: 'Mixed' },

    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    attempts:  [attemptSchema],

    // Result
    score:         { type: Number, default: 0 },   // correct count
    totalQuestions:{ type: Number },
    pointsEarned:  { type: Number, default: 0 },
    timeTaken:     { type: Number, default: 0 },    // total seconds
    completed:     { type: Boolean, default: false },
    completedAt:   { type: Date },
  },
  { timestamps: true }
);

// Percentage helper
quizSchema.virtual('percentage').get(function () {
  if (!this.totalQuestions) return 0;
  return Math.round((this.score / this.totalQuestions) * 100);
});

// Calculate points when quiz completes
quizSchema.methods.calculatePoints = function () {
  const base = this.score * 10;
  const difficultyBonus = { Easy: 1, Medium: 1.5, Hard: 2, Mixed: 1.3 };
  return Math.round(base * (difficultyBonus[this.difficulty] || 1));
};

module.exports = mongoose.model('Quiz', quizSchema);
