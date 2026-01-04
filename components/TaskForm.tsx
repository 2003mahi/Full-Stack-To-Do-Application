
import React, { useState } from 'react';
import { Priority, Task } from '../types';
import { geminiService } from '../services/geminiService';

interface TaskFormProps {
  onAdd: (task: Task) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsAiLoading(true);
    try {
      // Use AI to generate metadata if we just have a title
      const aiData = await geminiService.suggestTaskBreakdown(title);
      
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: title.trim(),
        description: aiData.description,
        completed: false,
        priority: aiData.priority as Priority,
        category: aiData.category || 'General',
        createdAt: Date.now(),
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        subTasks: aiData.subTasks.map(st => ({
          id: crypto.randomUUID(),
          text: typeof st === 'string' ? st : st.text,
          completed: false,
          priority: typeof st === 'string' ? Priority.MEDIUM : st.priority
        }))
      };

      onAdd(newTask);
      setTitle('');
      setDueDate('');
    } catch (err) {
      // Fallback for failed AI
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: title.trim(),
        completed: false,
        priority: Priority.MEDIUM,
        category: 'General',
        createdAt: Date.now(),
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        subTasks: []
      };
      onAdd(newTask);
      setTitle('');
      setDueDate('');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="I want to plan a weekend trip to Tokyo..."
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-slate-700 placeholder:text-slate-400"
            disabled={isAiLoading}
          />
        </div>
        <div className="relative min-w-[180px]">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-slate-700 cursor-pointer"
            disabled={isAiLoading}
          />
          {!dueDate && (
            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-sm hidden md:block">
              Set due date...
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!title.trim() || isAiLoading}
          className="px-6 py-4 md:py-0 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {isAiLoading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Analyzing...
            </>
          ) : (
            <>
              <i className="fas fa-wand-sparkles"></i>
              Smart Add
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-slate-400 flex items-center gap-1.5 ml-1">
        <i className="fas fa-info-circle"></i>
        Gemini will automatically suggest subtasks, priority, and categories based on your title.
      </p>
    </form>
  );
};

export default TaskForm;
