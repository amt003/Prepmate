import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 15000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("prepmate_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("prepmate_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;

// ── Auth ─────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// ── Questions ─────────────────────────────────────────
export const questionsAPI = {
  list: (params) => api.get("/questions", { params }),
  get: (id) => api.get(`/questions/${id}`),
  create: (data) => api.post("/questions", data),
  delete: (id) => api.delete(`/questions/${id}`),
  upvote: (id) => api.post(`/questions/${id}/upvote`),
};

// ── Quizzes ───────────────────────────────────────────
export const quizzesAPI = {
  start: (data) => api.post("/quizzes/start", data),
  submit: (id, data) => api.post(`/quizzes/${id}/submit`, data),
  history: () => api.get("/quizzes/history"),
};

// ── Leaderboard ───────────────────────────────────────
export const leaderboardAPI = {
  get: (period) => api.get("/leaderboard", { params: { period } }),
  myRank: () => api.get("/leaderboard/me"),
};

// ── AI ────────────────────────────────────────────────
export const aiAPI = {
  generate: (data) => api.post("/ai/generate", data),
  save: (data) => api.post("/ai/save", data),
};
