import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

import AuthPage from "./components/Auth/AuthPage";
import Dashboard from "./components/Dashboard/Dashboard";
import QuizPage from "./components/Quiz/QuizPage";
import QuestionBank from "./components/QuestionBank/QuestionBank";
import AIGenerator from "./components/AIGenerator/AIGenerator";
import Leaderboard from "./components/Leaderboard/Leaderboard";
import QuestionStats from "./components/QuestionStats/QuestionStats";

import "./App.css";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: "/", icon: "⊞", label: "Dashboard" },
    { to: "/quiz", icon: "?", label: "Take Quiz" },
    { to: "/bank", icon: "📚", label: "Question Bank" },
    { to: "/ai", icon: "⚡", label: "AI Generator" },
    { to: "/stats", icon: "📊", label: "Question Stats" },
    { to: "/leaderboard", icon: "📈", label: "Leaderboard" },
  ];

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">✓</div>
        <div className="logo-text">
          PrepMate<span>collaborative exams</span>
        </div>
      </div>
      <nav className="nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="user-area">
        <div className="avatar">
          {user?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="user-info">
          <div className="user-name">{user?.name}</div>
          <div className="user-level">
            Level {user?.level} · {user?.points} pts
          </div>
        </div>
        <button
          className="logout-btn"
          onClick={() => {
            logout();
            navigate("/login");
          }}
          title="Logout"
        >
          ⏻
        </button>
      </div>
    </aside>
  );
}

function AppLayout() {
  return (
    <SocketProvider>
      <div className="shell">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/bank" element={<QuestionBank />} />
            <Route path="/ai" element={<AIGenerator />} />
            <Route path="/stats" element={<QuestionStats />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
      </div>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: "Sora, sans-serif", fontSize: "14px" },
          }}
        />
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
