const Card = require('../models/Card');
const List = require('../models/List');

/**
 * Suggests a due date based on the card's title and description.
 * @param {string} title 
 * @param {string} description 
 * @returns {Date|null} Suggested due date or null
 */
const suggestDueDate = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  const today = new Date();

  if (text.includes('urgent') || text.includes('asap')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  if (text.includes('this week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }

  if (text.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Default fallback if no keywords found but recommendation requested? 
  // For now, return null if no strong signal.
  return null;
};

/**
 * Suggests which list a card should move to based on keywords.
 * @param {string} description 
 * @param {Array} lists - Array of List objects in the board
 * @returns {string|null} ID of the suggested list or null
 */
const suggestListMovement = (title, description, lists) => {
  const text = `${title} ${description}`.toLowerCase();

  // Define keywords mapping to standard list names
  const keywords = {
    'todo': ['plan', 'idea', 'backlog'],
    'inprogress': ['started', 'working', 'ongoing', 'current'],
    'done': ['completed', 'fixed', 'finished', 'done', 'shipped']
  };

  // Helper to find a list by name similarity
  const findListId = (type) => {
    const list = lists.find(l => {
      const name = l.title.toLowerCase().replace(/\s/g, '');
      return name.includes(type) || (type === 'todo' && name.includes('to do'));
    });
    return list ? list._id : null;
  };

  if (keywords.done.some(k => text.includes(k))) return findListId('done');
  if (keywords.inprogress.some(k => text.includes(k))) return findListId('inprogress');
  if (keywords.todo.some(k => text.includes(k))) return findListId('todo');

  return null;
};

/**
 * Finds related cards based on text similarity or shared members.
 * @param {Object} card - The card to find relations for
 * @param {Array} allBoardCards - All other cards on the board
 * @returns {Array} Array of related card objects
 */
const findRelatedCards = (card, allBoardCards) => {
  if (!card || !allBoardCards) return [];

  const cardText = `${card.title} ${card.description || ''}`.toLowerCase();
  const cardWords = cardText.split(/\s+/).filter(w => w.length > 3); // Simple filter

  return allBoardCards.filter(other => {
    if (other._id.toString() === card._id.toString()) return false;

    const otherText = `${other.title} ${other.description || ''}`.toLowerCase();
    
    // Check for shared keywords
    const hasSharedKeywords = cardWords.some(word => otherText.includes(word));
    
    // Check for shared members
    const hasSharedMembers = card.members.some(m => 
      other.members.map(om => om.toString()).includes(m.toString())
    );

    return hasSharedKeywords || hasSharedMembers;
  });
};

module.exports = {
  suggestDueDate,
  suggestListMovement,
  findRelatedCards
};
