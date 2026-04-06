import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const CLASSES = [
  "INTMCA-2022-2027",
  "INTMCA-2023-2028",
  "INTMCA-2024-2029",
  "INTMCA-2025-2030",
  "BCA 2024-2027",
  "BCA 2025-2028",
  "MCA 2025-2027",
];

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    class: CLASSES[0],
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        toast.success("Welcome back!");
      } else {
        await register(form.name, form.email, form.password, form.class);
        toast.success("Account created! 🎉");
      }
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">✓</div>
          <div className="auth-logo-text">PrepMate</div>
        </div>

        <h2 className="auth-title">
          {mode === "login" ? "Welcome back" : "Join your batch"}
        </h2>
        <p className="auth-sub">
          {mode === "login"
            ? "Sign in to continue your prep streak"
            : "Start contributing and competing with your batch"}
        </p>

        <form onSubmit={handle} className="auth-form">
          {mode === "register" && (
            <>
              <div className="field">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Arjun Kumar"
                  required
                  value={form.name}
                  onChange={set("name")}
                />
              </div>
              <div className="field">
                <label>Class / Section</label>
                <select value={form.class} onChange={set("class")} required>
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@college.edu"
              required
              value={form.email}
              onChange={set("email")}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              value={form.password}
              onChange={set("password")}
            />
          </div>
          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading
              ? "Please wait…"
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Register" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
