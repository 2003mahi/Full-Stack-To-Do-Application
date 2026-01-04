
import React, { useState } from 'react';
import { Task, Priority, SubTask } from '../types';
import { geminiService } from '../services/geminiService';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newSubTaskText, setNewSubTaskText] = useState('');
  const [newSubTaskDate, setNewSubTaskDate] = useState('');
  const [newSubTaskPriority, setNewSubTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [isAiSubTaskLoading, setIsAiSubTaskLoading] = useState(false);

  // Main Task Edit states
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [editDueDate, setEditDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );

  // Sub-task Edit states
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const [editSubTaskText, setEditSubTaskText] = useState('');
  const [editSubTaskDate, setEditSubTaskDate] = useState('');
  const [editSubTaskPriority, setEditSubTaskPriority] = useState<Priority>(Priority.MEDIUM);

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.HIGH: return 'text-rose-500 bg-rose-50 border-rose-100';
      case Priority.MEDIUM: return 'text-amber-600 bg-amber-50 border-amber-100';
      case Priority.LOW: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const getSubTaskPriorityDot = (p?: Priority) => {
    switch (p) {
      case Priority.HIGH: return 'bg-rose-500';
      case Priority.MEDIUM: return 'bg-amber-500';
      case Priority.LOW: return 'bg-emerald-500';
      default: return 'bg-slate-300';
    }
  };

  const now = Date.now();
  const isOverdue = task.dueDate && !task.completed && task.dueDate < now;
  const isApproaching = task.dueDate && !task.completed && !isOverdue && (task.dueDate - now) < (24 * 60 * 60 * 1000);

  const getRelativeTime = (timestamp: number, completed: boolean) => {
    if (completed) return '';
    const diff = timestamp - now;
    const absDiff = Math.abs(diff);
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    
    if (diff < 0) {
      if (absDiff < 1000 * 60 * 60 * 24) return 'Overdue today';
      return `Overdue by ${days} day${days === 1 ? '' : 's'}`;
    }
    if (diff < 1000 * 60 * 60 * 24) return 'Due today';
    if (diff < 2000 * 60 * 60 * 24) return 'Due tomorrow';
    return `In ${days} days`;
  };

  const toggleSubTask = (subTaskId: string) => {
    const updatedSubTasks = task.subTasks.map(st => 
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate(task.id, { subTasks: updatedSubTasks });
  };

  const deleteSubTask = (subTaskId: string) => {
    const updatedSubTasks = task.subTasks.filter(st => st.id !== subTaskId);
    onUpdate(task.id, { subTasks: updatedSubTasks });
  };

  const startEditingSubTask = (st: SubTask) => {
    setEditingSubTaskId(st.id);
    setEditSubTaskText(st.text);
    setEditSubTaskDate(st.dueDate ? new Date(st.dueDate).toISOString().split('T')[0] : '');
    setEditSubTaskPriority(st.priority || Priority.MEDIUM);
  };

  const saveSubTaskEdit = (subTaskId: string) => {
    const updatedSubTasks = task.subTasks.map(st => 
      st.id === subTaskId 
        ? { 
            ...st, 
            text: editSubTaskText.trim(), 
            priority: editSubTaskPriority,
            dueDate: editSubTaskDate ? new Date(editSubTaskDate).getTime() : undefined 
          } 
        : st
    );
    onUpdate(task.id, { subTasks: updatedSubTasks });
    setEditingSubTaskId(null);
  };

  const handleAddSubTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTaskText.trim()) return;

    const newSubTask: SubTask = {
      id: crypto.randomUUID(),
      text: newSubTaskText.trim(),
      completed: false,
      priority: newSubTaskPriority,
      dueDate: newSubTaskDate ? new Date(newSubTaskDate).getTime() : undefined
    };

    onUpdate(task.id, {
      subTasks: [...task.subTasks, newSubTask]
    });
    setNewSubTaskText('');
    setNewSubTaskDate('');
    setNewSubTaskPriority(Priority.MEDIUM);
  };

  const handleSaveEdit = () => {
    onUpdate(task.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      priority: editPriority,
      dueDate: editDueDate ? new Date(editDueDate).getTime() : undefined
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setIsEditing(false);
  };

  const toggleEditMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      setIsExpanded(true);
    }
    setIsEditing(!isEditing);
  };

  const completionPercentage = task.subTasks.length > 0 
    ? Math.round((task.subTasks.filter(st => st.completed).length / task.subTasks.length) * 100)
    : 0;

  return (
    <div 
      className={`group relative overflow-hidden bg-white rounded-2xl border transition-all duration-500 ease-in-out hover:shadow-md ${
        task.completed 
          ? 'opacity-60 border-slate-100 bg-slate-50/50 scale-[0.99] translate-y-0.5' 
          : 'border-slate-200 shadow-sm'
      } ${isOverdue ? 'border-rose-200 ring-1 ring-rose-50' : ''}`}
    >
      {/* Visual Accent Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        task.completed ? 'bg-slate-200' : (isOverdue ? 'bg-rose-500' : (isApproaching ? 'bg-amber-500' : 'bg-blue-500'))
      } transition-colors duration-500`}></div>

      <div className="p-5 flex items-start gap-4">
        <button 
          onClick={() => onToggle(task.id)}
          className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
            task.completed 
              ? 'bg-blue-500 border-blue-500 text-white animate-check shadow-lg shadow-blue-500/20' 
              : 'border-slate-300 text-transparent hover:border-blue-400 hover:scale-110'
          }`}
        >
          <i className={`fas fa-check text-[10px] transition-transform duration-300 ${task.completed ? 'scale-110' : 'scale-0'}`}></i>
        </button>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-3 mb-1">
            <h3 className={`text-lg font-semibold truncate transition-all duration-500 ${
              task.completed 
                ? 'text-slate-400' 
                : 'text-slate-800'
            }`}>
              <span className={`strike-through-animate ${task.completed ? 'active' : ''}`}>
                {task.title}
              </span>
            </h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-opacity duration-500 ${
              task.completed ? 'opacity-40' : 'opacity-100'
            } ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            {isOverdue && (
              <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[9px] font-bold uppercase animate-pulse shadow-sm shadow-rose-500/20">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                Overdue
              </span>
            )}
            {isApproaching && (
              <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold uppercase shadow-sm shadow-amber-500/20">
                <i className="fas fa-clock mr-1"></i>
                Soon
              </span>
            )}
          </div>
          
          <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs transition-all duration-500 ${
            task.completed ? 'text-slate-300' : 'text-slate-500'
          }`}>
            <span className="flex items-center gap-1">
              <i className="fas fa-folder opacity-70"></i>
              {task.category}
            </span>
            {task.dueDate && (
              <span className={`flex items-center gap-1 font-medium transition-all duration-300 group/date relative ${
                isOverdue ? 'text-rose-600' : isApproaching ? 'text-amber-600' : (task.completed ? 'text-slate-300' : 'text-slate-500')
              }`}>
                <i className={`fas ${isOverdue ? 'fa-circle-exclamation animate-bounce' : isApproaching ? 'fa-clock' : 'fa-calendar'} ${isOverdue ? 'text-rose-500' : isApproaching ? 'text-amber-500' : 'opacity-70'}`}></i>
                Due: {new Date(task.dueDate).toLocaleDateString()}
                {!task.completed && (
                  <span className="ml-1 opacity-70 italic">({getRelativeTime(task.dueDate, task.completed)})</span>
                )}
              </span>
            )}
            <span className="flex items-center gap-1">
              <i className="fas fa-calendar-day opacity-70"></i>
              Created: {new Date(task.createdAt).toLocaleDateString()}
            </span>
            {task.subTasks.length > 0 && (
              <span className={`flex items-center gap-1 font-medium transition-colors duration-500 ${
                task.completed ? 'text-slate-300' : 'text-blue-600'
              }`}>
                <i className="fas fa-list-ul"></i>
                {task.subTasks.filter(s => s.completed).length}/{task.subTasks.length} Subtasks
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={toggleEditMode}
            className={`p-2 rounded-lg transition-all ${isEditing ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
            title="Edit task"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            title="Toggle details"
          >
            <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} transition-transform duration-300`}></i>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
            title="Delete task"
          >
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
        isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-5 pb-5 pt-0 border-t border-slate-50 mt-1">
          {/* Urgent Notification Banner */}
          {!task.completed && (isOverdue || isApproaching) && (
            <div className={`mt-4 mb-2 p-3 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-1 ${
              isOverdue ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-amber-50 border-amber-100 text-amber-800'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOverdue ? 'bg-rose-100' : 'bg-amber-100'}`}>
                <i className={`fas ${isOverdue ? 'fa-fire text-rose-600' : 'fa-hourglass-start text-amber-600'} text-sm`}></i>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide">
                  {isOverdue ? 'Immediate Action Required' : 'Upcoming Deadline'}
                </p>
                <p className="text-[11px] opacity-90">
                  {isOverdue 
                    ? `This task was due ${new Date(task.dueDate!).toLocaleDateString()}. Complete it as soon as possible.` 
                    : `This task is approaching its deadline within the next 24 hours.`
                  }
                </p>
              </div>
            </div>
          )}

          {isEditing ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Title</label>
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Task title"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Due Date</label>
                  <input 
                    type="date" 
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                <textarea 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                  placeholder="Task description..."
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1 max-w-[150px]">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Priority</label>
                  <select 
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value={Priority.LOW}>Low</option>
                    <option value={Priority.MEDIUM}>Medium</option>
                    <option value={Priority.HIGH}>High</option>
                  </select>
                </div>
                <div className="flex gap-2 self-end">
                  <button 
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-xs font-bold uppercase text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {task.description && (
                <p className={`text-sm mb-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic transition-colors duration-500 mt-4 ${
                  task.completed ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {task.description}
                </p>
              )}
            </>
          )}

          <div className="space-y-2 mt-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex justify-between items-center">
              <span>Smart Checklist</span>
              <div className="flex items-center gap-2">
                <span className={completionPercentage === 100 ? 'text-emerald-500' : ''}>{completionPercentage}% Complete</span>
                <span>({task.subTasks.length} items)</span>
              </div>
            </div>

            {task.subTasks.length > 0 && (
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                <div 
                  className={`h-full transition-all duration-500 ${completionPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            )}
            
            {task.subTasks.length > 0 && task.subTasks.map((st) => {
              const isEditingSub = editingSubTaskId === st.id;
              const stOverdue = st.dueDate && !st.completed && st.dueDate < now;
              const stApproaching = st.dueDate && !st.completed && !stOverdue && (st.dueDate - now) < (24 * 60 * 60 * 1000);
              
              return (
                <div key={st.id} className="flex flex-col gap-1 p-2 hover:bg-slate-50 rounded-lg transition-all group/subitem">
                  {isEditingSub ? (
                    <div className="flex flex-col gap-2 p-2 bg-white border border-blue-200 rounded-lg shadow-sm animate-in fade-in zoom-in-95 duration-200">
                      <input 
                        type="text"
                        value={editSubTaskText}
                        onChange={(e) => setEditSubTaskText(e.target.value)}
                        className="w-full text-sm px-2 py-1 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        autoFocus
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                            <i className="fas fa-calendar-alt text-[10px] text-slate-400"></i>
                            <input 
                              type="date"
                              value={editSubTaskDate}
                              onChange={(e) => setEditSubTaskDate(e.target.value)}
                              className="text-[10px] text-slate-600 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                            />
                          </div>
                          <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                            <i className="fas fa-flag text-[10px] text-slate-400"></i>
                            <select 
                              value={editSubTaskPriority}
                              onChange={(e) => setEditSubTaskPriority(e.target.value as Priority)}
                              className="text-[10px] text-slate-600 bg-transparent border-none p-0 focus:ring-0 cursor-pointer outline-none"
                            >
                              <option value={Priority.LOW}>Low</option>
                              <option value={Priority.MEDIUM}>Med</option>
                              <option value={Priority.HIGH}>High</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-auto">
                          <button onClick={() => setEditingSubTaskId(null)} className="px-2 py-1 text-[10px] text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                          <button onClick={() => saveSubTaskEdit(st.id)} className="px-2 py-1 text-[10px] bg-blue-600 text-white rounded shadow-sm">Save</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={st.completed} 
                            onChange={() => toggleSubTask(st.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                          />
                          <span className={`text-sm transition-all duration-300 ${
                            st.completed ? 'line-through text-slate-300' : 'text-slate-700'
                          }`}>
                            {st.text}
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="opacity-0 group-hover/subitem:opacity-100 flex items-center gap-1 transition-opacity">
                            <button 
                              onClick={() => startEditingSubTask(st)}
                              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                            >
                              <i className="fas fa-edit text-[10px]"></i>
                            </button>
                            <button 
                              onClick={() => deleteSubTask(st.id)}
                              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                            >
                              <i className="fas fa-trash-alt text-[10px]"></i>
                            </button>
                          </div>
                          {st.priority && (
                            <span 
                              title={`Priority: ${st.priority}`}
                              className={`w-2 h-2 rounded-full ${getSubTaskPriorityDot(st.priority)} shadow-sm opacity-60 transition-opacity`}
                            ></span>
                          )}
                        </div>
                      </div>
                      {st.dueDate && (
                        <div className={`ml-7 text-[10px] font-medium flex items-center gap-1.5 ${
                          st.completed ? 'text-slate-300' : (stOverdue ? 'text-rose-500' : stApproaching ? 'text-amber-500' : 'text-slate-400')
                        }`}>
                          <i className={`fas ${stOverdue ? 'fa-circle-exclamation' : 'fa-calendar-day'} scale-90`}></i>
                          {new Date(st.dueDate).toLocaleDateString()}
                          {!st.completed && <span>({getRelativeTime(st.dueDate, st.completed)})</span>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            <div className="mt-4 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <form onSubmit={handleAddSubTask} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center text-slate-300">
                    <i className={`fas ${isAiSubTaskLoading ? 'fa-spinner fa-spin' : 'fa-plus'} text-[10px]`}></i>
                  </div>
                  <input
                    type="text"
                    placeholder="Add a new sub-task..."
                    value={newSubTaskText}
                    onChange={(e) => setNewSubTaskText(e.target.value)}
                    className="flex-1 text-sm bg-transparent border-none focus:ring-0 placeholder:text-slate-300 text-slate-600 py-1"
                    disabled={task.completed || isAiSubTaskLoading}
                  />
                </div>
                
                {newSubTaskText && (
                  <div className="flex flex-wrap items-center justify-between gap-3 ml-7 pt-1 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        <i className="fas fa-calendar-plus text-[10px] text-slate-400"></i>
                        <input 
                          type="date"
                          value={newSubTaskDate}
                          onChange={(e) => setNewSubTaskDate(e.target.value)}
                          className="text-[10px] text-slate-500 border-none p-0 focus:ring-0 bg-transparent cursor-pointer"
                          disabled={task.completed || isAiSubTaskLoading}
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        <i className="fas fa-flag text-[10px] text-slate-400"></i>
                        <select 
                          value={newSubTaskPriority}
                          onChange={(e) => setNewSubTaskPriority(e.target.value as Priority)}
                          className="text-[10px] text-slate-500 border-none p-0 focus:ring-0 bg-transparent cursor-pointer outline-none"
                          disabled={task.completed || isAiSubTaskLoading}
                        >
                          <option value={Priority.LOW}>Low Priority</option>
                          <option value={Priority.MEDIUM}>Medium Priority</option>
                          <option value={Priority.HIGH}>High Priority</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        type="submit" 
                        disabled={isAiSubTaskLoading}
                        className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-slate-300"
                      >
                        {isAiSubTaskLoading ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-plus text-[8px]"></i>
                        )}
                        Add Sub-task
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
