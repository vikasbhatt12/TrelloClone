const List = require('../models/List');
const Board = require('../models/Board');

// @desc    Create a new list
// @route   POST /api/lists
// @access  Private
const createList = async (req, res) => {
  const { title, boardId } = req.body;

  if (!title || !boardId) {
    return res.status(400).json({ message: 'Please add title and boardId' });
  }

  const board = await Board.findById(boardId);
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }

  // Check access
  if (board.owner.toString() !== req.user.id && !board.members.includes(req.user.id)) {
    return res.status(401).json({ message: 'User not authorized' });
  }

  const list = await List.create({
    title,
    board: boardId,
  });

  res.status(200).json(list);
};

// @desc    Update a list
// @route   PUT /api/lists/:id
// @access  Private
const updateList = async (req, res) => {
  const list = await List.findById(req.params.id);

  if (!list) {
    return res.status(404).json({ message: 'List not found' });
  }

  const board = await Board.findById(list.board);
  if (board.owner.toString() !== req.user.id && !board.members.includes(req.user.id)) {
    return res.status(401).json({ message: 'User not authorized' });
  }

  const updatedList = await List.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedList);
};

// @desc    Delete a list
// @route   DELETE /api/lists/:id
// @access  Private
const deleteList = async (req, res) => {
  const list = await List.findById(req.params.id);

  if (!list) {
    return res.status(404).json({ message: 'List not found' });
  }

  const board = await Board.findById(list.board);
  if (board.owner.toString() !== req.user.id && !board.members.includes(req.user.id)) {
    return res.status(401).json({ message: 'User not authorized' });
  }

  await list.deleteOne();

  res.status(200).json({ id: req.params.id });
};

module.exports = {
  createList,
  updateList,
  deleteList,
};
