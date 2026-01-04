
import React from 'react';
import { TaskStats } from '../types';

interface SidebarProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  stats: TaskStats;
}

const Sidebar: React.FC<SidebarProps> = ({ categories, activeCategory, onCategoryChange, stats }) => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col border-r border-slate-800">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fas fa-brain text-white"></i>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">GeminiTasks</span>
        </div>

        <nav className="space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
            Navigation
          </div>
          <button 
            onClick={() => onCategoryChange('All')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeCategory === 'All' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <i className="fas fa-layer-group w-5"></i>
            Dashboard
          </button>
        </nav>

        <div className="mt-8">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
            Smart Categories
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
            {categories.filter(c => c !== 'All').map(cat => (
              <button 
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors capitalize ${activeCategory === cat ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <i className="fas fa-tag text-xs text-slate-500"></i>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto p-6 space-y-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Total Progress</span>
            <span className="text-xs font-bold text-blue-400">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500" 
              style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
        <div className="text-xs text-slate-500 text-center">
          Powered by Gemini 3 Flash
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
