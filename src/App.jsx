import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import BoardList from "./components/BoardList";
import CreateBoard from "./components/CreateBoard";
import "./styles.css";
import Board from "./components/Board";

const App = () => {
  const navigate = useNavigate();
  const [selectedBoardId, setSelectedBoardId] = useState(null);

  const handleSelectBoard = (boardId) => {
    setSelectedBoardId(boardId);
    navigate(`/board/${boardId}`);
  };

  const handleCreateBoard = async (newBoard) => {
    setSelectedBoardId(newBoard._id);
    navigate(`/board/${newBoard._id}`);
  };

  return (
    <div className="app min-h-screen bg-gray-900 flex flex-col">
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={
            <div className="space-y-8">
              <CreateBoard onCreateBoard={handleCreateBoard} />
              <BoardList onSelectBoard={handleSelectBoard} />
            </div>
          }
        />
        <Route
          path="/board/:id"
          element={<Board boardId={selectedBoardId} />}
        />
      </Routes>
    </div>
  );
};

export default App;
