const express = require('express');
const router = express.Router();
const {
  getBoards,
  createBoard,
  getBoard,
  deleteBoard,
  inviteUser,
  getRecommendations
} = require('../controllers/boardController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getBoards).post(protect, createBoard);
router.route('/:id').get(protect, getBoard).delete(protect, deleteBoard);
router.route('/:id/invite').post(protect, inviteUser);
router.route('/:id/recommendations').get(protect, getRecommendations);

module.exports = router;
