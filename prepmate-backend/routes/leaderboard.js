const express = require('express');
const { protect } = require('../middleware/auth');
const { getLeaderboard, getMyRank } = require('../controllers/leaderboardController');

const router = express.Router();

router.get('/',    protect, getLeaderboard);
router.get('/me',  protect, getMyRank);

module.exports = router;
