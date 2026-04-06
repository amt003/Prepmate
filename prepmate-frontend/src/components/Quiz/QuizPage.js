import { useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { quizzesAPI } from "../../api";
import { useTimer } from "../../hooks";
import { useAuth } from "../../context/AuthContext";

const TOPICS = [
  "Data Structures",
  "Algorithms",
  "Computer Networks",
  "DBMS",
  "OS",
  "AI & ML",
];
const DIFFS = ["Easy", "Medium", "Hard", "Mixed"];
const COUNTS = [5, 10, 15, 20];

// ── Setup screen ─────────────────────────────────────
function QuizSetup({ onStart }) {
  const loc = useLocation();
  const [topic, setTopic] = useState(loc.state?.topic || TOPICS[0]);
  const [diff, setDiff] = useState("Medium");
  const [count, setCount] = useState(10);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const res = await quizzesAPI.start({ topic, difficulty: diff, count });
      const data = res.data;

      // handle both { questions, quizId } and debug/wrapped shapes
      const questions = data.questions || [];
      const quizId = data.quizId || data._id || null;

      if (!questions.length) {
        toast.error("No questions found for this topic. Add some first!");
        setBusy(false);
        return;
      }

      onStart({ quizId, questions });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not start quiz");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Start a Quiz</div>
        <div className="page-sub">Pick your topic and difficulty</div>
      </div>
      <div className="setup-card card">
        <div className="field">
          <label>Topic</label>
          <div className="chip-group" style={{ marginTop: "6px" }}>
            {TOPICS.map((t) => (
              <button
                key={t}
                className={`chip ${topic === t ? "active" : ""}`}
                onClick={() => setTopic(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="field" style={{ marginTop: "16px" }}>
          <label>Difficulty</label>
          <div className="chip-group" style={{ marginTop: "6px" }}>
            {DIFFS.map((d) => (
              <button
                key={d}
                className={`chip ${diff === d ? "active" : ""}`}
                onClick={() => setDiff(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="field" style={{ marginTop: "16px" }}>
          <label>Number of Questions</label>
          <div className="chip-group" style={{ marginTop: "6px" }}>
            {COUNTS.map((c) => (
              <button
                key={c}
                className={`chip ${count === c ? "active" : ""}`}
                onClick={() => setCount(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={start}
          disabled={busy}
          style={{ marginTop: "20px" }}
        >
          {busy ? "Loading questions…" : "▶ Start Quiz"}
        </button>
      </div>
    </div>
  );
}

// ── Active quiz ───────────────────────────────────────
function ActiveQuiz({ quizData, onFinish }) {
  const { quizId, questions } = quizData;
  const [idx, setIdx] = useState(0);
  const [answers, setAns] = useState({});
  const [submitting, setSub] = useState(false);
  const { updateUser } = useAuth();

  const timer = useTimer((questions?.length || 10) * 90, () => {
    toast.error("Time up! Submitting…");
    handleSubmit();
  });

  // start timer once
  useState(() => {
    timer.start();
  });

  if (!questions || questions.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">No questions loaded.</div>
      </div>
    );
  }

  const current = questions[idx];
  const totalTime = questions.length * 90 - timer.seconds;

  const select = (label) => setAns((a) => ({ ...a, [current._id]: label }));

  const handleSubmit = async () => {
    if (submitting) return;
    setSub(true);
    timer.pause();
    try {
      const answersArr = questions.map((q) => ({
        questionId: q._id,
        selectedOption: answers[q._id] || null,
        timeTaken: 0,
      }));
      const res = await quizzesAPI.submit(quizId, {
        answers: answersArr,
        timeTaken: totalTime,
      });
      if (updateUser && res.data?.result?.user?.points) {
        updateUser({ points: res.data.result.user.points });
      }
      onFinish(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Submit failed");
      setSub(false);
      timer.start();
    }
  };

  const answered = Object.keys(answers).length;

  return (
    <div className="page">
      <div className="quiz-header card">
        <div className="quiz-progress-wrap">
          <div className="quiz-meta">
            <span>
              Question {idx + 1} of {questions.length}
            </span>
            <span>{answered} answered</span>
          </div>
          <div className="quiz-progress-full">
            <div
              className="quiz-progress-fill"
              style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <div className={`timer ${timer.isLow ? "warn" : ""}`}>
          {timer.display}
        </div>
      </div>

      <div className="question-card card">
        <div className="q-number">
          Question {idx + 1} · {current.topic} · {current.difficulty}
        </div>
        <div className="q-text">{current.text}</div>
        <div className="options">
          {(current.options || []).map((opt) => (
            <div
              key={opt.label}
              className={`option ${answers[current._id] === opt.label ? "selected" : ""}`}
              onClick={() => select(opt.label)}
            >
              <div
                className={`opt-label ${answers[current._id] === opt.label ? "sel" : ""}`}
              >
                {opt.label}
              </div>
              {opt.text}
            </div>
          ))}
        </div>
      </div>

      <div className="quiz-actions">
        <button
          className="btn-ghost"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
        >
          ← Previous
        </button>
        <div style={{ display: "flex", gap: "10px" }}>
          {idx < questions.length - 1 ? (
            <button
              className="btn-primary"
              onClick={() => setIdx((i) => i + 1)}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? "Submitting…"
                : `Submit Quiz (${answered}/${questions.length} answered)`}
            </button>
          )}
        </div>
      </div>

      <div className="q-dots">
        {questions.map((q, i) => (
          <div
            key={i}
            className={`q-dot ${i === idx ? "current" : ""} ${answers[q._id] ? "done" : ""}`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Results ───────────────────────────────────────────
function QuizResults({ result, onRetry }) {
  const {
    score,
    totalQuestions,
    percentage,
    pointsEarned,
    result: quiz,
  } = result;
  const grade = percentage >= 80 ? "🏆" : percentage >= 60 ? "👍" : "📚";

  return (
    <div className="page">
      <div className="results-hero card">
        <div className="results-emoji">{grade}</div>
        <div className="results-score">{percentage}%</div>
        <div className="results-sub">
          {score} of {totalQuestions} correct · +{pointsEarned} points earned
        </div>
        <button
          className="btn-primary"
          onClick={onRetry}
          style={{ marginTop: "16px" }}
        >
          Try Another Quiz
        </button>
      </div>

      <div className="section-title" style={{ marginTop: "24px" }}>
        Question Breakdown
      </div>
      {(quiz?.attempts || []).map((a, i) => (
        <div
          key={i}
          className={`breakdown-item card ${a.isCorrect ? "correct" : "wrong"}`}
        >
          <div className="breakdown-header">
            <span
              className={`result-badge ${a.isCorrect ? "correct" : "wrong"}`}
            >
              {a.isCorrect ? "✓ Correct" : "✗ Wrong"}
            </span>
            <span className="q-diff">{a.question?.difficulty}</span>
          </div>
          <div className="breakdown-q">{a.question?.text}</div>
          <div className="breakdown-answer">
            Your answer: <strong>{a.selectedOption || "Skipped"}</strong>
            {!a.isCorrect && (
              <>
                {" "}
                · Correct: <strong>{a.question?.answer}</strong>
              </>
            )}
          </div>
          {a.question?.explanation && (
            <div className="explanation">💡 {a.question.explanation}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────
export default function QuizPage() {
  const [phase, setPhase] = useState("setup");
  const [quizData, setQuizData] = useState(null);
  const [result, setResult] = useState(null);

  return (
    <>
      {phase === "setup" && (
        <QuizSetup
          onStart={(d) => {
            setQuizData(d);
            setPhase("active");
          }}
        />
      )}
      {phase === "active" && quizData && (
        <ActiveQuiz
          quizData={quizData}
          onFinish={(r) => {
            setResult(r);
            setPhase("results");
          }}
        />
      )}
      {phase === "results" && result && (
        <QuizResults
          result={result}
          onRetry={() => {
            setPhase("setup");
            setQuizData(null);
            setResult(null);
          }}
        />
      )}
    </>
  );
}
