import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, color }) => {
  return (
    <div className="bg-zinc-950 p-5 lg:p-6 rounded-2xl shadow-xl border border-zinc-900 flex items-center gap-4 transition-all hover:shadow-2xl hover:border-zinc-800 hover:-translate-y-1 h-full min-w-0">
      <div className={`p-3.5 lg:p-4 rounded-2xl ${color} shadow-sm flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] lg:text-xs font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap overflow-visible">
          {label}
        </p>
        <h3 className="text-lg lg:text-xl font-extrabold text-zinc-100 mt-0.5 whitespace-nowrap overflow-visible">
          {value}
        </h3>
        {trend && (
          <p className="text-xs font-semibold text-emerald-500 mt-1">
            {trend}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;