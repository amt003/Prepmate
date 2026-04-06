import { useState, useEffect } from 'react';
import { leaderboardAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const PERIODS = [
  { key: 'all',  label: 'All Time' },
  { key: 'week', label: 'This Week' },
  { key: 'today',label: 'Today' },
];

export default function Leaderboard() {
  const { user }    = useAuth();
  const { onlineCount, liveScores } = useSocket();
  const [period,  setPeriod]  = useState('all');
  const [board,   setBoard]   = useState([]);
  const [myRank,  setMyRank]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    leaderboardAPI.get(period)
      .then((r) => setBoard(r.data.board))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    leaderboardAPI.myRank().then((r) => setMyRank(r.data)).catch(() => {});
  }, []);

  // Merge live scores into board
  const displayBoard = liveScores.length > 0 ? liveScores : board;

  const medal = (rank) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  const initials = (name) =>
    name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-title">Leaderboard</div>
            <div className="page-sub">
              {onlineCount > 0 && <span className="online-badge">● {onlineCount} online</span>}
              {' '}Updated live
            </div>
          </div>
          {myRank && (
            <div className="my-rank-badge">
              Your rank: <strong>#{myRank.rank}</strong> of {myRank.total}
            </div>
          )}
        </div>
      </div>

      {/* Period selector */}
      <div className="chip-group" style={{ marginBottom: '20px' }}>
        {PERIODS.map((p) => (
          <button key={p.key} className={`chip ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      {!loading && displayBoard.length >= 3 && (
        <div className="podium">
          {[displayBoard[1], displayBoard[0], displayBoard[2]].map((u, i) => (
            <div key={u.id} className={`podium-item ${i === 1 ? 'first' : i === 0 ? 'second' : 'third'}`}>
              <div className="podium-medal">{i === 1 ? '🥇' : i === 0 ? '🥈' : '🥉'}</div>
              <div className="podium-avatar" style={{ background: 'var(--brand-light)', color: 'var(--brand-dark)' }}>
                {initials(u.name)}
              </div>
              <div className="podium-name">{u.name.split(' ')[0]}</div>
              <div className="podium-pts">{u.points} pts</div>
              <div className={`podium-block ${i === 1 ? 'tall' : i === 0 ? 'mid' : 'short'}`} />
            </div>
          ))}
        </div>
      )}

      {/* Full table */}
      <div className="card">
        <div className="lb-table-header">
          <span>Rank</span><span></span><span>Student</span>
          <span style={{ textAlign: 'center' }}>Quizzes</span>
          <span style={{ textAlign: 'right' }}>Points</span>
        </div>

        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : displayBoard.length === 0 ? (
          <div className="empty-state">No data yet for this period</div>
        ) : (
          displayBoard.map((u) => (
            <div key={u.id} className={`lb-row-full ${u.id === user?._id ? 'me' : ''}`}>
              <div className="lb-rank-cell">{medal(u.rank)}</div>
              <div className="lb-avatar-sm">{initials(u.name)}</div>
              <div className="lb-info">
                <span className="lb-name-text">{u.name} {u.id === user?._id ? <em>(you)</em> : ''}</span>
                <span className="lb-level">Level {u.level}</span>
              </div>
              <div className="lb-quizzes">{u.quizzes || '—'}</div>
              <div className="lb-pts">{u.points}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
