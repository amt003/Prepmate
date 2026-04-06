const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  label: { type: String, enum: ["A", "B", "C", "D"], required: true },
  text: { type: String, required: true },
});

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    options: {
      type: [optionSchema],
      validate: [(v) => v.length === 4, "Exactly 4 options required"],
    },
    answer: { type: String, enum: ["A", "B", "C", "D"], required: true },
    explanation: { type: String, default: "" },

    topic: {
      type: String,
      enum: [
        "Data Structures",
        "Algorithms",
        "DBMS",
        "Computer Networks",
        "OS",
        "AI & ML",
      ],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },

    // Who added it
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isAIGenerated: { type: Boolean, default: false },

    // Crowd stats
    timesAttempted: { type: Number, default: 0 },
    timesCorrect: { type: Number, default: 0 },

    // Upvotes from peers
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Accuracy for this question
questionSchema.virtual("accuracy").get(function () {
  if (!this.timesAttempted) return null;
  return Math.round((this.timesCorrect / this.timesAttempted) * 100);
});

// Full-text search index
questionSchema.index({ text: "text", topic: 1, difficulty: 1 });

module.exports = mongoose.model("Question", questionSchema);
