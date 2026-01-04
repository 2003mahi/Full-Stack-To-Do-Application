
import React from 'react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filter: 'all' | 'pending' | 'completed';
  onFilterChange: (f: 'all' | 'pending' | 'completed') => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange, filter, onFilterChange }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text"
            placeholder="Search tasks, descriptions..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            {f}
          </button>
        ))}
      </div>
    </header>
  );
};

export default Header;
