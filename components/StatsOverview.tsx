
import React from 'react';
import { TaskStats } from '../types';

interface StatsOverviewProps {
  stats: TaskStats;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const cards = [
    { label: 'Total Tasks', value: stats.total, icon: 'fa-list-check', color: 'blue' },
    { label: 'Completed', value: stats.completed, icon: 'fa-check-double', color: 'green' },
    { label: 'Active', value: stats.pending, icon: 'fa-hourglass-half', color: 'amber' },
    { label: 'Urgent', value: stats.highPriority, icon: 'fa-fire', color: 'rose' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 transition-transform hover:scale-[1.02]">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${card.color}-50 text-${card.color}-600`}>
            <i className={`fas ${card.icon} text-lg`}></i>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{card.value}</div>
            <div className="text-sm text-slate-500 font-medium">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;
