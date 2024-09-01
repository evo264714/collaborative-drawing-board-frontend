import React, { useState } from 'react';
import { createBoard } from '../Api';

const CreateBoard = ({ onCreateBoard }) => {
  const [boardName, setBoardName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (boardName.trim() === '') {
      setError('Board name cannot be empty');
      return;
    }
    try {
      const newBoard = await createBoard(boardName);
      onCreateBoard(newBoard);
      setBoardName('');
      setError(''); 
    } catch (error) {
      setError('Failed to create board. Please try again.');
      console.error('Failed to create board:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex flex-col sm:flex-row items-center mb-4 my-8">
        <input
          type="text"
          value={boardName}
          onChange={(e) => setBoardName(e.target.value)}
          placeholder="Enter board name"
          className="p-3 border border-gray-600 rounded bg-gray-800 text-white placeholder-gray-400 mb-2 sm:mb-0 sm:mr-2"
        />
        <button
          type="submit"
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded w-full sm:w-auto"
        >
          Create Board
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
};

export default CreateBoard;

