import React from 'react';

export default function MetricChip({ label, value }) {
  const getColorClass = () => {
    if (value >= 80) return 'from-emerald-500 to-teal-500';
    if (value >= 60) return 'from-blue-500 to-cyan-500';
    if (value >= 40) return 'from-amber-500 to-yellow-500';
    return 'from-orange-500 to-red-500';
  };

  return (
    <div className="rounded-xl glass p-5 border border-white/5 hover:border-white/10 transition-all text-center">
      <div className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-medium">
        {label}
      </div>
      <div className={`text-4xl font-bold bg-gradient-to-r ${getColorClass()} bg-clip-text text-transparent`}>
        {value}
      </div>
    </div>
  );
}

