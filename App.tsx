
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Priority, TaskStats } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import StatsOverview from './components/StatsOverview';

const STORAGE_KEY = 'gemini-tasks-ai-data';

type SortOption = 'createdAt' | 'dueDate' | 'priority';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');

  // Load initial data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading tasks", e);
      }
    }
  }, []);

  // Sync with local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const categories = useMemo(() => {
    const cats = new Set(tasks.map(t => t.category));
    return ['All', ...Array.from(cats)];
  }, [tasks]);

  const stats: TaskStats = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending: tasks.filter(t => !t.completed).length,
      highPriority: tasks.filter(t => t.priority === Priority.HIGH && !t.completed).length
    };
  }, [tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    // 1. Filter
    const filtered = tasks.filter(task => {
      const matchesFilter = filter === 'all' 
        ? true 
        : filter === 'completed' ? task.completed : !task.completed;
      
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = activeCategory === 'All' || task.category === activeCategory;

      return matchesFilter && matchesSearch && matchesCategory;
    });

    // 2. Sort
    return [...filtered].sort((a, b) => {
      if (sortBy === 'createdAt') {
        return b.createdAt - a.createdAt; // Newest first
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate - b.dueDate; // Soonest first
      }
      if (sortBy === 'priority') {
        const priorityMap = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
        const scoreA = priorityMap[a.priority] || 0;
        const scoreB = priorityMap[b.priority] || 0;
        if (scoreA !== scoreB) return scoreB - scoreA; // High priority first
        return b.createdAt - a.createdAt;
      }
      return 0;
    });
  }, [tasks, filter, searchQuery, activeCategory, sortBy]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        categories={categories} 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory}
        stats={stats}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <Header 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery} 
          filter={filter}
          onFilterChange={setFilter}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-8">
            <StatsOverview stats={stats} />
            
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <i className="fas fa-plus-circle text-blue-500"></i>
                Create New Task
              </h2>
              <TaskForm onAdd={addTask} />
            </section>

            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <i className="fas fa-tasks text-indigo-500"></i>
                    Tasks ({filteredAndSortedTasks.length})
                  </h2>
                  <div className="text-xs text-slate-500 mt-1">
                    {activeCategory !== 'All' && <span className="mr-2">Category: <b>{activeCategory}</b></span>}
                    {filter !== 'all' && <span>Showing: <b>{filter}</b></span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400 ml-2 uppercase tracking-wider">Sort by:</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="text-sm font-medium text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer outline-none py-1 pr-8"
                  >
                    <option value="createdAt">Date Created</option>
                    <option value="dueDate">Due Date</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>
              </div>
              
              <TaskList 
                tasks={filteredAndSortedTasks} 
                onToggle={toggleTask} 
                onDelete={deleteTask} 
                onUpdate={updateTask}
              />

              {filteredAndSortedTasks.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-clipboard-list text-slate-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-medium text-slate-600">No tasks found</h3>
                  <p className="text-slate-400">Try adjusting your filters or add a new task above.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
