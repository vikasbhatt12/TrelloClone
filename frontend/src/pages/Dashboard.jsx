import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/Common/Navbar';

const Dashboard = () => {
  const [boards, setBoards] = useState([]);
  const [newBoardTitle, setNewBoardTitle] = useState('');

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const { data } = await API.get('/boards');
      setBoards(data);
    } catch (error) {
      console.error('Failed to fetch boards', error);
    }
  };

  const createBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle) return;
    try {
      await API.post('/boards', { title: newBoardTitle });
      setNewBoardTitle('');
      fetchBoards();
    } catch (error) {
      console.error('Failed to create board', error);
    }
  };

  const deleteBoard = async (boardId) => {
    if (!window.confirm('Are you sure you want to delete this board?')) return;
    try {
      await API.delete(`/boards/${boardId}`);
      fetchBoards();
    } catch (error) {
      console.error('Failed to delete board', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Your Boards</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {boards.map((board) => (
            <div
              key={board._id}
              className="relative bg-white p-6 rounded-lg shadow hover:shadow-lg transition transform hover:-translate-y-1 border-l-4 border-blue-500 group"
            >
              <Link to={`/board/${board._id}`} className="block h-full flex flex-col justify-center items-center">
                <h3 className="text-lg font-semibold text-gray-800">{board._id === 'temp' ? 'Loading...' : board.title}</h3>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  deleteBoard(board._id);
                }}
                className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                title="Delete Board"
              >
                🗑️
              </button>
            </div>
          ))}

          <div className="bg-gray-200 p-6 rounded-lg shadow border-2 border-dashed border-gray-400 flex flex-col justify-center items-center">
            <form onSubmit={createBoard} className="w-full text-center">
              <input
                type="text"
                placeholder="New Board Title"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                className="w-full px-3 py-2 mb-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full transition"
              >
                Create Board
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
