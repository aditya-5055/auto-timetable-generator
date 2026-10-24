import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6 text-slate-100">
      <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition">
        <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
          TimetableGen
        </h1>
      </Link>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300">
            <User size={16} className="text-indigo-400" />
            <span>{user.username}</span>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-lg bg-red-950/30 px-3 py-1.5 text-sm font-medium text-red-400 border border-red-900/30 hover:bg-red-900/20 transition-all duration-200"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
