import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import API from '../services/api';
import Navbar from '../components/Common/Navbar';
import RecommendationsPanel from '../components/Recommendations/RecommendationsPanel';

const BoardView = () => {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [newCardTitles, setNewCardTitles] = useState({}); // Map listId -> title
  const [lastActionTime, setLastActionTime] = useState(Date.now()); // Trigger for recommendations

  useEffect(() => {
    fetchBoard();
  }, [id]);

  const fetchBoard = async () => {
    try {
      const { data } = await API.get(`/boards/${id}`);
      setBoard(data);
    } catch (error) {
      console.error('Failed to fetch board', error);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Create a deep copy of the board to modify
    const newBoard = { ...board };
    const sourceListIndex = newBoard.lists.findIndex(l => l._id === source.droppableId);
    const destListIndex = newBoard.lists.findIndex(l => l._id === destination.droppableId);

    if (sourceListIndex === -1 || destListIndex === -1) return;

    const sourceList = { ...newBoard.lists[sourceListIndex] };
    const destList = { ...newBoard.lists[destListIndex] };
    
    // If moving in the same list
    if (source.droppableId === destination.droppableId) {
      const newCards = Array.from(sourceList.cards);
      const [movedCard] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, movedCard);
      
      sourceList.cards = newCards;
      newBoard.lists[sourceListIndex] = sourceList;
      setBoard(newBoard);

      // API Call
      try {
        await API.put(`/cards/${draggableId}`, {
            position: destination.index
        });
      } catch (error) {
        console.error('Failed to update card position', error);
        console.error('Failed to update card position', error);
        fetchBoard(); // Revert on error
      }
    } else {
      // Moving to different list
      const sourceCards = Array.from(sourceList.cards);
      const destCards = Array.from(destList.cards);
      const [movedCard] = sourceCards.splice(source.index, 1);
      
      // Update the card's listId locally
      const updatedCard = { ...movedCard, list: destination.droppableId };
      destCards.splice(destination.index, 0, updatedCard);

      sourceList.cards = sourceCards;
      destList.cards = destCards;
      
      newBoard.lists[sourceListIndex] = sourceList;
      newBoard.lists[destListIndex] = destList;
      setBoard(newBoard);
      setLastActionTime(Date.now()); // Trigger recommendations update

      // API Call
      try {
        await API.put(`/cards/${draggableId}`, {
            listId: destination.droppableId,
            position: destination.index
        });
      } catch (error) {
        console.error('Failed to update card list', error);
        fetchBoard(); // Revert on error
      }
    }
  };

  const createList = async (e) => {
    e.preventDefault();
    if (!newListTitle) return;
    try {
      await API.post('/lists', { title: newListTitle, boardId: id });
      setNewListTitle('');
      fetchBoard();
    } catch (error) {
      console.error('Failed to create list', error);
    }
  };

  const createCard = async (listId) => {
    const title = newCardTitles[listId];
    if (!title) return;
    try {
      await API.post('/cards', { title, listId, boardId: id });
      setNewCardTitles({ ...newCardTitles, [listId]: '' });
      fetchBoard();
      setLastActionTime(Date.now());
    } catch (error) {
      console.error('Failed to create card', error);
    }
  };

  const inviteUser = async () => {
    const email = prompt('Enter email to invite (User must be registered):');
    if (email) {
        try {
            await API.post(`/boards/${id}/invite`, { email });
            alert('User invited successfully!');
            fetchBoard();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to invite user');
        }
    }
  };

  const deleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list?')) return;
    try {
        await API.delete(`/lists/${listId}`);
        fetchBoard();
    } catch (error) {
        console.error('Failed to delete list', error);
    }
  };

  const deleteCard = async (cardId) => {
    try {
        await API.delete(`/cards/${cardId}`);
        fetchBoard();
    } catch (error) {
        console.error('Failed to delete card', error);
    }
  };

  if (!board) return <div className="p-8 text-center">Loading Board...</div>;

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      <Navbar />
      <div className="flex-1 p-6 overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{board.title}</h1>
          <div className="flex gap-2">
             <button onClick={inviteUser} className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm">
                Invite Member
             </button>
             <div className="flex -space-x-2">
                {board.members.map(m => (
                    <div key={m._id} className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs border-2 border-white" title={m.name}>
                        {m.name.charAt(0)}
                    </div>
                ))}
             </div>
          </div>
        </div>



        <RecommendationsPanel boardId={id} onApply={fetchBoard} lastUpdated={lastActionTime} />

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 items-start">
            {board.lists.map((list) => (
              <Droppable key={list._id} droppableId={list._id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-gray-100 p-4 rounded-lg shadow-sm w-72 flex-shrink-0"
                  >
                    <h3 className="font-semibold text-gray-700 mb-3 flex justify-between">
                        {list.title}
                        <div className="flex gap-2 items-center">
                            <span className="text-xs text-gray-400">{list.cards.length}</span>
                            <button 
                                onClick={() => deleteList(list._id)}
                                className="text-red-400 hover:text-red-600 text-xs"
                                title="Delete List"
                            >
                                🗑️
                            </button>
                        </div>
                    </h3>
                    
                    <div className="space-y-3 min-h-[50px]">
                      {list.cards.map((card, index) => (
                        <Draggable key={card._id} draggableId={card._id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-3 rounded shadow-sm hover:shadow-md transition text-sm border-l-4 border-transparent hover:border-blue-400 group"
                            >
                              <div className="flex justify-between items-start">
                                <p className="text-gray-800">{card.title}</p>
                                <button 
                                    onClick={() => deleteCard(card._id)}
                                    className="text-gray-300 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition"
                                    title="Delete Card"
                                >
                                    ✕
                                </button>
                              </div>
                              {card.dueDate && (
                                <span className="text-xs text-orange-500 block mt-1">
                                    📅 {new Date(card.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <input
                            type="text"
                            placeholder="+ Add a card"
                            className="w-full px-2 py-1 text-sm border rounded mb-2 focus:outline-none focus:border-blue-400"
                            value={newCardTitles[list._id] || ''}
                            onChange={(e) => setNewCardTitles({ ...newCardTitles, [list._id]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && createCard(list._id)}
                        />
                        {newCardTitles[list._id] && (
                            <button 
                                onClick={() => createCard(list._id)}
                                className="w-full bg-blue-500 text-white text-xs py-1 rounded hover:bg-blue-600"
                            >
                                Add Card
                            </button>
                        )}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}

            <div className="w-72 flex-shrink-0">
              <form onSubmit={createList} className="bg-white/50 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition">
                <input
                  type="text"
                  placeholder="+ Add another list"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent focus:outline-none"
                />
              </form>
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default BoardView;
