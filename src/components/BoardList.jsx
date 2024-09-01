import React, { useState, useEffect } from 'react';
import { fetchBoards } from '../Api';

const BoardList = ({ onSelectBoard }) => {
  const [boards, setBoards] = useState([]);

  useEffect(() => {
    const getBoards = async () => {
      const boards = await fetchBoards();
      setBoards(boards);
    };
    getBoards();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4 text-white">Boards</h2>
      <ul className="space-y-2">
        {boards.map((board) => (
          <li key={board._id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg shadow-md">
            <span className="text-lg font-medium text-white">{board.name}</span>
            <button
              onClick={() => onSelectBoard(board._id)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Join
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BoardList;
