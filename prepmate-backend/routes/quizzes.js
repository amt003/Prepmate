const express = require('express');
const { protect } = require('../middleware/auth');
const { startQuiz, submitQuiz, getHistory } = require('../controllers/quizController');

const router = express.Router();

router.post('/start',     protect, startQuiz);
router.post('/:id/submit', protect, submitQuiz);
router.get('/history',    protect, getHistory);

module.exports = router;
