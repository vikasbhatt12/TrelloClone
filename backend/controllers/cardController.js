const Card = require('../models/Card');
const List = require('../models/List');
const Board = require('../models/Board');

// @desc    Create a new card
// @route   POST /api/cards
// @access  Private
const createCard = async (req, res) => {
  const { title, listId, boardId } = req.body;

  if (!title || !listId || !boardId) {
    return res.status(400).json({ message: 'Please add title, listId and boardId' });
  }

  const board = await Board.findById(boardId);
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }

  if (board.owner.toString() !== req.user.id && !board.members.includes(req.user.id)) {
    return res.status(401).json({ message: 'User not authorized' });
  }

  const card = await Card.create({
    title,
    list: listId,
    board: boardId,
  });

  res.status(200).json(card);
};

// @desc    Update a card
// @route   PUT /api/cards/:id
// @access  Private
const updateCard = async (req, res) => {
  const card = await Card.findById(req.params.id);

  if (!card) {
    return res.status(404).json({ message: 'Card not found' });
  }

  const board = await Board.findById(card.board);
  if (board.owner.toString() !== req.user.id && !board.members.includes(req.user.id)) {
    return res.status(401).json({ message: 'User not authorized' });
  }

  // Map listId to list if present
  const updateData = { ...req.body };
  if (updateData.listId) {
    updateData.list = updateData.listId;
    delete updateData.listId;
  }

  const updatedCard = await Card.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
  }).populate('members', 'name email');

  res.status(200).json(updatedCard);
};

// @desc    Delete a card
// @route   DELETE /api/cards/:id
// @access  Private
const deleteCard = async (req, res) => {
  const card = await Card.findById(req.params.id);

  if (!card) {
    return res.status(404).json({ message: 'Card not found' });
  }

  const board = await Board.findById(card.board);
  if (board.owner.toString() !== req.user.id && !board.members.includes(req.user.id)) {
    return res.status(401).json({ message: 'User not authorized' });
  }

  await card.deleteOne();

  res.status(200).json({ id: req.params.id });
};

module.exports = {
  createCard,
  updateCard,
  deleteCard,
};
