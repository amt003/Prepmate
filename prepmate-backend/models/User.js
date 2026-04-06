const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },

    // Class/Section
    class: { type: String, required: true }, // e.g., "10-A", "12-B", "CSE-2023"

    // Gamification
    points: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },

    // Stats
    stats: {
      totalQuizzes: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 },
      correctAnswers: { type: Number, default: 0 },
      questionsAdded: { type: Number, default: 0 },
    },

    // Topic progress: { topicName: { attempted, correct } }
    topicProgress: {
      type: Map,
      of: { attempted: Number, correct: Number },
      default: {},
    },

    badges: [{ name: String, awardedAt: Date }],
    role: { type: String, enum: ["student", "admin"], default: "student" },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update level based on points
userSchema.methods.syncLevel = function () {
  this.level = Math.floor(this.points / 200) + 1;
};

// Accuracy helper
userSchema.virtual("accuracy").get(function () {
  if (!this.stats.totalQuestions) return 0;
  return Math.round(
    (this.stats.correctAnswers / this.stats.totalQuestions) * 100,
  );
});

module.exports = mongoose.model("User", userSchema);
