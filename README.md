# 📚 Prepmate - Collaborative Exam Preparation Platform

A full-stack platform for students to collaborate on exam preparation, take quizzes, compete on leaderboards, and contribute questions.

## 🎯 Features

- **Quiz System**: Create and take customized quizzes by topic and difficulty
- **Question Bank**: Community-driven question repository with voting
- **AI Generator**: Auto-generate questions using AI
- **Leaderboard**: Real-time rankings and competitive scoring
- **Gamification**: Points, levels, streaks, and badges
- **Class-Based Access**: Organize students by class/section
- **Question Stats**: View available questions by topic and difficulty
- **User Profiles**: Track personal progress and topic mastery

## 🏗️ Project Structure

```
Prepmate/
├── prepmate-backend/          # Express.js REST API
│   ├── models/                # MongoDB schemas
│   ├── controllers/           # Business logic
│   ├── routes/                # API endpoints
│   ├── middleware/            # Auth, validation
│   ├── config/                # Database, socket config
│   └── server.js              # Main server entry
│
└── prepmate-frontend/         # React.js UI
    ├── src/
    │   ├── components/        # React components
    │   ├── context/           # Global state (Auth)
    │   ├── api/               # API client
    │   ├── hooks/             # Custom hooks
    │   └── App.js             # Main app
    └── public/                # Static files
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- npm/yarn

### Backend Setup

```bash
cd prepmate-backend
npm install

# Create .env file
cat > .env << EOF
MONGO_URI=mongodb://localhost:27017/prepmate
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
EOF

npm start
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd prepmate-frontend
npm install

# Create .env file
cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
EOF

npm start
```

Frontend runs on `http://localhost:3000`

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Register with name, email, password, class
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/me` - Get current user profile

### Questions

- `GET /api/questions` - List questions (with filters)
- `GET /api/questions/stats/count` - Get question counts by topic/difficulty
- `POST /api/questions` - Create new question
- `DELETE /api/questions/:id` - Delete question (owner only)
- `POST /api/questions/:id/upvote` - Upvote question

### Quizzes

- `POST /api/quizzes/start` - Start a new quiz
- `POST /api/quizzes/:id/submit` - Submit quiz answers
- `GET /api/quizzes/history` - Get user's quiz history

### Leaderboard

- `GET /api/leaderboard` - Get global leaderboard
- `GET /api/leaderboard/me` - Get user's rank

### AI

- `POST /api/ai/generate` - Generate questions using AI

## 🔐 Environment Variables

### Backend (.env)

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:5000/api
```

## 🛠️ Tech Stack

### Backend

- **Express.js** - REST API framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Socket.io** - Real-time updates
- **bcryptjs** - Password hashing

### Frontend

- **React** - UI framework
- **Axios** - HTTP client
- **React Router** - Navigation
- **React Hot Toast** - Notifications
- **Context API** - State management

## 📊 Database Schema

### User

```javascript
{
  name, email, password, class,
  points, level, streak, lastActiveDate,
  stats: { totalQuizzes, totalQuestions, correctAnswers, questionsAdded },
  topicProgress: Map,
  badges: [{ name, awardedAt }],
  role: 'student' | 'admin'
}
```

### Question

```javascript
{
  text, options: [{ label, text }], answer, explanation,
  topic, difficulty,
  createdBy, isAIGenerated, isApproved,
  timesAttempted, timesCorrect,
  upvotes: [userId]
}
```

### Quiz

```javascript
{
  user, topic, difficulty,
  questions: [questionIds],
  totalQuestions,
  answers: [{ questionId, selectedOption, timeTaken }],
  score, attempts,
  createdAt
}
```

## 🎮 Key Features Guide

### Taking a Quiz

1. Go to "Take Quiz" → Select topic, difficulty, and number of questions
2. Answer questions (timer included)
3. Submit and see results with accuracy %

### Adding Questions

1. Go to "Question Bank" → Add new question
2. Fill details: text, options (A-D), correct answer, explanation
3. Questions require admin approval before quiz use
4. Earn 5 points per approved question

### AI Generator

1. Go to "AI Generator"
2. Enter topic and select difficulty
3. AI generates unique practice questions

### Viewing Stats

1. Go to "Question Stats" (📊)
2. See breakdown of questions by topic/difficulty
3. Green = 10+ questions, Yellow = 5-9, Red = <5

## 📈 Roadmap

- [ ] Real-time collaboration on quizzes
- [ ] Advanced analytics dashboard
- [ ] Mobile app
- [ ] Discussion forums per topic
- [ ] Downloadable practice papers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👥 Team

Created as a collaborative exam prep platform for students.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Happy Studying! 🎓**
