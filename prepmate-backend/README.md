# PrepMate Backend API

Collaborative Exam Prep Platform — Node.js + Express + MongoDB

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env
# Edit .env and fill in your MONGO_URI, JWT_SECRET, ANTHROPIC_API_KEY

# 3. Run in development
npm run dev

# 4. Run in production
npm start
```

---

## Project Structure

```
prepmate-backend/
├── server.js              # Entry point
├── .env.example           # Environment variable template
├── models/
│   ├── User.js            # User schema (auth, stats, streak, badges)
│   ├── Question.js        # Question schema (MCQ, topic, difficulty, attempts)
│   └── Quiz.js            # Quiz schema (questions, submissions, scores)
├── routes/
│   ├── auth.js            # Register, login, /me
│   ├── questions.js       # CRUD for question bank
│   ├── quizzes.js         # Create, fetch, submit quizzes
│   ├── leaderboard.js     # Rankings by points
│   └── ai.js              # Claude AI question generation
└── middleware/
    └── auth.js            # JWT protect middleware
```

---

## API Reference

All protected routes require:  
`Authorization: Bearer <token>`

---

### Auth

| Method | Endpoint              | Auth | Description            |
|--------|-----------------------|------|------------------------|
| POST   | /api/auth/register    | No   | Create account         |
| POST   | /api/auth/login       | No   | Login, get token       |
| GET    | /api/auth/me          | Yes  | Get current user       |

**Register body:**
```json
{ "name": "Arjun K", "email": "arjun@example.com", "password": "secret123" }
```

---

### Questions

| Method | Endpoint              | Auth | Description                        |
|--------|-----------------------|------|------------------------------------|
| GET    | /api/questions        | Yes  | List questions (filter & paginate) |
| GET    | /api/questions/:id    | Yes  | Get single question                |
| POST   | /api/questions        | Yes  | Add a question                     |
| PUT    | /api/questions/:id    | Yes  | Edit your question                 |
| DELETE | /api/questions/:id    | Yes  | Delete your question               |

**GET query params:** `?topic=Algorithms&difficulty=Hard&search=sorting&page=1&limit=20`

**POST body:**
```json
{
  "text": "What is the time complexity of binary search?",
  "options": [
    { "label": "A", "text": "O(n)" },
    { "label": "B", "text": "O(log n)" },
    { "label": "C", "text": "O(n²)" },
    { "label": "D", "text": "O(1)" }
  ],
  "correctOption": "B",
  "explanation": "Binary search halves the search space each step.",
  "topic": "Algorithms",
  "difficulty": "Easy",
  "tags": ["searching", "divide-and-conquer"]
}
```

---

### Quizzes

| Method | Endpoint                  | Auth | Description              |
|--------|---------------------------|------|--------------------------|
| GET    | /api/quizzes              | Yes  | List public quizzes      |
| GET    | /api/quizzes/:id          | Yes  | Get quiz (no answers)    |
| POST   | /api/quizzes              | Yes  | Create a quiz            |
| POST   | /api/quizzes/:id/submit   | Yes  | Submit quiz answers      |

**POST /api/quizzes body:**
```json
{
  "title": "Data Structures Sprint",
  "topic": "Data Structures",
  "difficulty": "Mixed",
  "questionIds": ["<id1>", "<id2>", "<id3>"],
  "timeLimitMinutes": 10,
  "isPublic": true
}
```

**POST /api/quizzes/:id/submit body:**
```json
{
  "answers": [
    { "questionId": "<id1>", "selectedOption": "B" },
    { "questionId": "<id2>", "selectedOption": "A" }
  ],
  "timeTaken": 480
}
```

**Submit response:**
```json
{
  "score": 8,
  "total": 10,
  "percentage": 80,
  "pointsEarned": 80,
  "attempts": [...]
}
```

---

### Leaderboard

| Method | Endpoint          | Auth | Description             |
|--------|-------------------|------|-------------------------|
| GET    | /api/leaderboard  | Yes  | Top users by points     |

**GET query params:** `?limit=20`

---

### AI Question Generator

| Method | Endpoint          | Auth | Description                         |
|--------|-------------------|------|-------------------------------------|
| POST   | /api/ai/generate  | Yes  | Generate MCQs from notes via Claude |
| POST   | /api/ai/save      | Yes  | Save generated questions to bank    |

**POST /api/ai/generate body:**
```json
{
  "notes": "A binary tree is a tree data structure where each node has at most two children...",
  "topic": "Data Structures",
  "difficulty": "Medium",
  "count": 5
}
```

**POST /api/ai/save body:**
```json
{
  "questions": [...],   // from /generate response
  "topic": "Data Structures",
  "difficulty": "Medium"
}
```

---

## Points System

| Action              | Points     |
|---------------------|------------|
| Correct answer      | +10 pts    |
| Adding a question   | tracked    |

Leaderboard ranks users by total points.

---

## Topics Supported

`Data Structures` · `Algorithms` · `DBMS` · `Networks` · `OS` · `AI & ML` · `Mixed` · `Other`
