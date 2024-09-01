import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="w-full bg-gray-800 p-6">
      <div className="container mx-auto flex justify-center">
        <Link to="/" className="text-3xl font-extrabold text-white">
          Collaborative Drawing Board
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
