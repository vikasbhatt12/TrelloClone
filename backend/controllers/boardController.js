const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const User = require('../models/User');
const { suggestDueDate, suggestListMovement, findRelatedCards } = require('../services/recommendationEngine');

// @desc    Get all boards for current user
// @route   GET /api/boards
// @access  Private
const getBoards = async (req, res) => {
  const boards = await Board.find({
    $or: [{ owner: req.user.id }, { members: req.user.id }],
  });
  res.status(200).json(boards);
};

// @desc    Create a new board
// @route   POST /api/boards
// @access  Private
const createBoard = async (req, res) => {
  if (!req.body.title) {
    return res.status(400).json({ message: 'Please add a title' });
  }

  const board = await Board.create({
    title: req.body.title,
    owner: req.user.id,
    members: [],
  });

  res.status(200).json(board);
};

// @desc    Get single board with lists and cards
// @route   GET /api/boards/:id
// @access  Private
const getBoard = async (req, res) => {
  const board = await Board.findById(req.params.id).populate('members', 'name email');

  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }

  // Check access
  if (board.owner.toString() !== req.user.id && !board.members.some(m => m._id.toString() === req.user.id)) {
    return res.status(401).json({ message: 'User not authorized' });
  }

  // Fetch lists and cards
  const lists = await List.find({ board: board._id }).sort('position');
  const cards = await Card.find({ board: board._id }).populate('members', 'name email');

  // Structure response
  const boardData = {
    ...board._doc,
    lists: lists.map(list => ({
      ...list._doc,
      cards: cards.filter(card => card.list.toString() === list._id.toString())
    }))
  };

  res.status(200).json(boardData);
};

// @desc    Delete a board
// @route   DELETE /api/boards/:id
// @access  Private
const deleteBoard = async (req, res) => {
  const board = await Board.findById(req.params.id);

  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }

  // Only owner can delete
  if (board.owner.toString() !== req.user.id) {
    return res.status(401).json({ message: 'User not authorized' });
  }

  await board.deleteOne();
  // Optional: Delete associated lists and cards
  await List.deleteMany({ board: board._id });
  await Card.deleteMany({ board: board._id });

  res.status(200).json({ id: req.params.id });
};

// @desc    Invite user to board
// @route   POST /api/boards/:id/invite
// @access  Private
const inviteUser = async (req, res) => {
  const board = await Board.findById(req.params.id);
  const { email } = req.body;

  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }

  if (board.owner.toString() !== req.user.id) {
    return res.status(401).json({ message: 'Only owner can invite' });
  }

  const userToInvite = await User.findOne({ email });
  if (!userToInvite) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (board.members.includes(userToInvite._id) || board.owner.toString() === userToInvite._id.toString()) {
    return res.status(400).json({ message: 'User already a member' });
  }

  board.members.push(userToInvite._id);
  await board.save();

  res.status(200).json(board);
};

// @desc    Get recommendations for the board
// @route   GET /api/boards/:id/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
  const board = await Board.findById(req.params.id);
  if (!board) return res.status(404).json({ message: 'Board not found' });

  // Check access
  if (board.owner.toString() !== req.user.id && !board.members.includes(req.user.id)) {
    return res.status(401).json({ message: 'User not authorized' });
  }

  const lists = await List.find({ board: board._id });
  const cards = await Card.find({ board: board._id });

  const recommendations = [];

  cards.forEach(card => {
    // Due Date Suggestions
    if (!card.dueDate) {
      const suggestedDate = suggestDueDate(card.title, card.description || '');
      if (suggestedDate) {
        recommendations.push({
          type: 'due_date',
          cardId: card._id,
          cardTitle: card.title,
          suggestedDate,
          reason: 'Based on keywords in title/description'
        });
      }
    }

    // List Movement Suggestions
    const currentList = lists.find(l => l._id.toString() === card.list.toString());
    if (currentList) {
      const suggestedListId = suggestListMovement(card.title, card.description || '', lists);
      if (suggestedListId && suggestedListId.toString() !== currentList._id.toString()) {
        const suggestedList = lists.find(l => l._id.toString() === suggestedListId.toString());
        recommendations.push({
          type: 'move_card',
          cardId: card._id,
          cardTitle: card.title,
          fromList: currentList.title,
          toList: suggestedList.title,
          toListId: suggestedList._id,
          reason: 'Based on status keywords'
        });
      }
    }

    // Related Cards
    const related = findRelatedCards(card, cards);
    if (related.length > 0) {
        // Only show if not already obvious? For now just show.
        recommendations.push({
            type: 'related_cards',
            cardId: card._id,
            cardTitle: card.title,
            relatedCards: related.map(r => ({ id: r._id, title: r.title })),
            reason: 'Shared keywords or members'
        });
    }
  });

  res.status(200).json(recommendations);
};

module.exports = {
  getBoards,
  createBoard,
  getBoard,
  deleteBoard,
  inviteUser,
  getRecommendations
};
