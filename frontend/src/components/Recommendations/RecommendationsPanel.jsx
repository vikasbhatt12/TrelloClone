import { useState, useEffect } from 'react';
import API from '../../services/api';

const RecommendationsPanel = ({ boardId, onApply, lastUpdated }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (boardId) {
      fetchRecommendations();
    }
  }, [boardId, lastUpdated]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/boards/${boardId}/recommendations`);
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to fetch recommendations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (rec) => {
    try {
      if (rec.type === 'due_date') {
        await API.put(`/cards/${rec.cardId}`, { dueDate: rec.suggestedDate });
      } else if (rec.type === 'move_card') {
        await API.put(`/cards/${rec.cardId}`, { listId: rec.toListId });
      }
      // Refresh recommendations and board
      fetchRecommendations();
      if (onApply) onApply();
    } catch (error) {
      console.error('Failed to apply recommendation', error);
    }
  };

  if (loading) return <div className="p-4 text-gray-500">Loading insights...</div>;
  if (recommendations.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg shadow-sm border border-indigo-100 mb-6">
      <h3 className="text-lg font-bold text-indigo-800 mb-3 flex items-center gap-2">
        ✨ Smart Recommendations
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec, index) => (
          <div key={index} className="bg-white p-3 rounded shadow-sm border-l-4 border-indigo-400">
            <p className="text-sm font-semibold text-gray-800 mb-1">{rec.cardTitle}</p>
            <p className="text-xs text-gray-600 mb-2">{rec.reason}</p>
            
            {rec.type === 'due_date' && (
              <div className="flex justify-between items-center">
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Set Due: {new Date(rec.suggestedDate).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleApply(rec)}
                  className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                >
                  Apply
                </button>
              </div>
            )}

            {rec.type === 'move_card' && (
              <div className="flex justify-between items-center">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Move to: {rec.toList}
                </span>
                <button
                  onClick={() => handleApply(rec)}
                  className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                >
                  Apply
                </button>
              </div>
            )}

            {rec.type === 'related_cards' && (
              <div>
                <p className="text-xs text-gray-500">Related:</p>
                <ul className="list-disc list-inside text-xs text-gray-700">
                  {rec.relatedCards.map(r => (
                    <li key={r.id}>{r.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationsPanel;
