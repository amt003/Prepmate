import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../api";

export default function QuestionStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/questions/stats/count");
      if (res.data.success) {
        setStats(res.data.stats);
      } else {
        toast.error(res.data.message || "Failed to load stats");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Error loading question stats",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const difficulties = ["Easy", "Medium", "Hard"];

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Loading stats...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="page">
        <div className="empty-state">No data available</div>
      </div>
    );
  }

  // Calculate total
  const totalQuestions = Object.values(stats).reduce((sum, topicStats) => {
    return sum + Object.values(topicStats).reduce((s, count) => s + count, 0);
  }, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Question Bank Stats</div>
        <div className="page-sub">
          Available questions by topic and difficulty
        </div>
      </div>

      <div className="card">
        <div
          style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "600" }}
        >
          Total Questions: {totalQuestions}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "12px",
                  fontWeight: "600",
                }}
              >
                Topic
              </th>
              {difficulties.map((diff) => (
                <th
                  key={diff}
                  style={{
                    textAlign: "center",
                    padding: "12px",
                    fontWeight: "600",
                    minWidth: "100px",
                  }}
                >
                  {diff}
                </th>
              ))}
              <th
                style={{
                  textAlign: "center",
                  padding: "12px",
                  fontWeight: "600",
                  minWidth: "100px",
                }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(stats)
              .sort()
              .map((topic) => {
                const topicStats = stats[topic];
                const topicTotal = Object.values(topicStats).reduce(
                  (s, count) => s + count,
                  0,
                );

                return (
                  <tr key={topic} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px", fontWeight: "500" }}>
                      {topic}
                    </td>
                    {difficulties.map((diff) => (
                      <td
                        key={diff}
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          backgroundColor: topicStats[diff]
                            ? "#f5f5f5"
                            : "transparent",
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: topicStats[diff]
                              ? topicStats[diff] < 5
                                ? "#fec8d8"
                                : topicStats[diff] < 10
                                  ? "#fff9c4"
                                  : "#c8e6c9"
                              : "transparent",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontWeight: "600",
                          }}
                        >
                          {topicStats[diff] || 0}
                        </span>
                      </td>
                    ))}
                    <td
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        fontWeight: "600",
                        color: "#1976d2",
                      }}
                    >
                      {topicTotal}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        <div style={{ marginTop: "20px", fontSize: "12px", color: "#999" }}>
          <div>🟩 10+ questions available</div>
          <div>🟨 5-9 questions available</div>
          <div>🟥 Less than 5 questions</div>
        </div>
      </div>
    </div>
  );
}
