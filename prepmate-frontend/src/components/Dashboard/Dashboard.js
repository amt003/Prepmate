import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { quizzesAPI, leaderboardAPI, questionsAPI } from "../../api";

const TOPICS = [
  { name: "Data Structures", icon: "💻", color: "green" },
  { name: "Algorithms", icon: "🧮", color: "purple" },
  { name: "Computer Networks", icon: "🌐", color: "amber" },
  { name: "DBMS", icon: "🗄️", color: "coral" },
  { name: "OS", icon: "🔒", color: "blue" },
  { name: "AI & ML", icon: "🧠", color: "pink" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [topBoard, setTopBoard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [qStats, setQStats] = useState({});

  useEffect(() => {
    quizzesAPI
      .history()
      .then((r) => setHistory(r.data.quizzes))
      .catch(() => {});
    leaderboardAPI
      .get("all")
      .then((r) => setTopBoard(r.data.board.slice(0, 5)))
      .catch(() => {});
    leaderboardAPI
      .myRank()
      .then((r) => setMyRank(r.data))
      .catch(() => {});

    // Get question counts per topic
    Promise.all(
      TOPICS.map((t) =>
        questionsAPI
          .list({ topic: t.name, limit: 1 })
          .then((r) => ({ [t.name]: r.data.total })),
      ),
    )
      .then((arr) => setQStats(Object.assign({}, ...arr)))
      .catch(() => {});
  }, []);

  const accuracy = user?.stats?.totalQuestions
    ? Math.round((user.stats.correctAnswers / user.stats.totalQuestions) * 100)
    : 0;

  // Topic progress from user
  const getProgress = (topic) => {
    const tp = user?.topicProgress?.[topic];
    if (!tp || !tp.attempted) return 0;
    return Math.round((tp.correct / tp.attempted) * 100);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">
          Good day, {user?.name?.split(" ")[0]} 👋
        </div>
        <div className="page-sub">
          {user?.class && (
            <span
              style={{
                marginRight: "16px",
                fontWeight: "600",
                color: "#0066cc",
              }}
            >
              📚 Class: {user.class}
            </span>
          )}
          {user?.streak > 0
            ? `🔥 ${user.streak}-day streak! Keep it going.`
            : "Start a quiz to begin your streak!"}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        {[
          {
            label: "Questions Solved",
            value: user?.stats?.totalQuestions || 0,
          },
          { label: "Accuracy Rate", value: `${accuracy}%` },
          { label: "Current Streak", value: `${user?.streak || 0}d` },
          { label: "My Rank", value: myRank ? `#${myRank.rank}` : "—" },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Topics */}
      <div className="section-title">Topics</div>
      <div className="three-col">
        {TOPICS.map((t) => {
          const pct = getProgress(t.name);
          return (
            <div
              key={t.name}
              className={`topic-card ${t.color}`}
              onClick={() => navigate("/quiz", { state: { topic: t.name } })}
            >
              <div className={`topic-icon ${t.color}`}>{t.icon}</div>
              <div className="topic-name">{t.name}</div>
              <div className="topic-count">{qStats[t.name] || 0} questions</div>
              <div className="progress-row">
                <span className="progress-label">Progress</span>
                <span className="progress-pct">{pct}%</span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className={`progress-bar-fill ${t.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="two-col">
        {/* Recent quiz history */}
        <div className="card">
          <div className="card-title">Recent Quizzes</div>
          {history.length === 0 ? (
            <div className="empty-state">No quizzes yet — take one!</div>
          ) : (
            history.slice(0, 5).map((q, i) => (
              <div className="activity-item" key={i}>
                <div
                  className="activity-dot"
                  style={{
                    background:
                      q.score / q.totalQuestions >= 0.7
                        ? "var(--brand)"
                        : "#D85A30",
                  }}
                />
                <div className="activity-text">
                  <span>{q.topic}</span> — {q.score}/{q.totalQuestions} correct
                </div>
                <div className="activity-time">+{q.pointsEarned}pts</div>
              </div>
            ))
          )}
        </div>

        {/* Mini leaderboard */}
        <div className="card">
          <div className="card-title">Top Performers</div>
          {topBoard.map((u) => (
            <div
              className={`lb-row ${u.id === user?._id ? "me" : ""}`}
              key={u.id}
            >
              <div
                className={`lb-rank ${u.rank === 1 ? "gold" : u.rank === 2 ? "silver" : u.rank === 3 ? "bronze" : ""}`}
              >
                #{u.rank}
              </div>
              <div
                className="lb-avatar"
                style={{
                  background: "var(--brand-light)",
                  color: "var(--brand-dark)",
                }}
              >
                {u.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="lb-name">
                {u.name} {u.id === user?._id ? "(you)" : ""}
                <small>{u.points} pts</small>
              </div>
              <div className="lb-score">{u.points}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
