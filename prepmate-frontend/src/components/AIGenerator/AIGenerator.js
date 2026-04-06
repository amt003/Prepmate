import { useState } from "react";
import toast from "react-hot-toast";
import { aiAPI } from "../../api";

const TOPICS = [
  "Data Structures",
  "Algorithms",
  "Computer Networks",
  "DBMS",
  "OS",
  "AI & ML",
];
const DIFFS = ["Easy", "Medium", "Hard"];

export default function AIGenerator() {
  const [notes, setNotes] = useState("");
  const [topic, setTopic] = useState("Data Structures");
  const [diff, setDiff] = useState("Medium");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [saved, setSaved] = useState(new Set());
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    if (notes.trim().length < 20) {
      toast.error("Please enter at least 20 characters of notes");
      return;
    }
    setLoading(true);
    setQuestions([]);
    setSaved(new Set());
    try {
      const res = await aiAPI.generate({
        notes,
        topic,
        difficulty: diff,
        count,
      });
      setQuestions(res.data.questions);
      toast.success(`${res.data.count} questions generated! 🎉`);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Generation failed. Check your API key.",
      );
    } finally {
      setLoading(false);
    }
  };

  const saveSelected = async () => {
    const toSave = questions.filter((_, i) => !saved.has(i));
    if (toSave.length === 0) {
      toast("All questions already saved");
      return;
    }

    setSaving(true);
    try {
      const res = await aiAPI.save({
        questions: toSave,
        topic,
        difficulty: diff,
      });
      setSaved(new Set(questions.map((_, i) => i)));
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const saveOne = async (idx) => {
    try {
      await aiAPI.save({
        questions: [questions[idx]],
        topic,
        difficulty: diff,
      });
      setSaved((s) => new Set([...s, idx]));
      toast.success("Question added to bank! +3 pts");
    } catch (err) {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">AI Question Generator</div>
        <div className="page-sub">
          Paste your notes and let Claude AI create quiz-ready questions
        </div>
      </div>

      <div className="ai-box">
        <div className="ai-label">⚡ Powered by Claude AI</div>

        <div className="field-row">
          <div className="field">
            <label>Topic</label>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              {TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Difficulty</label>
            <select value={diff} onChange={(e) => setDiff(e.target.value)}>
              {DIFFS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Questions to generate</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[3, 5, 10, 15].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Your Notes</label>
          <textarea
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your lecture notes or topic description here…
e.g. 'A binary tree is a tree data structure where each node has at most two children. The left child is always less than the parent (in a BST), and the right child is always greater...'"
          />
        </div>

        <button className="btn-accent" onClick={generate} disabled={loading}>
          {loading ? (
            <span>
              ⚡ Generating<span className="dots">...</span>
            </span>
          ) : (
            "⚡ Generate Questions"
          )}
        </button>
      </div>

      {/* Generated questions */}
      {questions.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <div className="section-title" style={{ margin: 0 }}>
              Generated Questions ({questions.length})
            </div>
            <button
              className="btn-primary"
              onClick={saveSelected}
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : `Save All to Bank (+${questions.length * 3} pts)`}
            </button>
          </div>

          {questions.map((q, i) => (
            <div
              key={i}
              className={`card generated-card ${saved.has(i) ? "saved" : ""}`}
              style={{ marginBottom: "12px" }}
            >
              <div className="gen-header">
                <span className={`q-difficulty ${diff.toLowerCase()}`}>
                  {diff}
                </span>
                <span className="q-topic">{topic}</span>
                {saved.has(i) && <span className="saved-badge">✓ Saved</span>}
              </div>
              <div className="q-text" style={{ marginBottom: "12px" }}>
                {q.text}
              </div>
              <div className="gen-options">
                {q.options.map((opt) => (
                  <div
                    key={opt.label}
                    className={`gen-option ${opt.label === q.answer ? "correct" : ""}`}
                  >
                    <span className="opt-label">{opt.label}</span>
                    {opt.text}
                    {opt.label === q.answer && (
                      <span className="correct-mark">✓</span>
                    )}
                  </div>
                ))}
              </div>
              {q.explanation && (
                <div className="explanation">💡 {q.explanation}</div>
              )}
              {!saved.has(i) && (
                <button
                  className="btn-sm"
                  style={{ marginTop: "10px" }}
                  onClick={() => saveOne(i)}
                >
                  + Add to Question Bank
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
