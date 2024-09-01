
const API_URL = 'https://collaborative-drawing-board-backend.onrender.com/api/boards';


export const fetchBoards = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching boards:', error);
    return [];
  }
};


export const createBoard = async (name) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, elements: [] }),
    });
    if (!response.ok) {
      throw new Error('Failed to create board');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating board:', error);
    throw error;
  }
};

export const joinBoard = async (boardId) => {
  try {
    const response = await fetch(`${API_URL}/${boardId}`, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error('Failed to join board');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error joining board:', error);
    throw error; 
  }
};
