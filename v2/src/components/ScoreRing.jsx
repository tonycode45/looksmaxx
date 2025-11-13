import React from 'react';

export default function ScoreRing({ value = 68, size = 160, stroke = 14, label = 'Score' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = value / 100;

  const getGradient = () => {
    if (value >= 80) return 'url(#gradient-green)';
    if (value >= 60) return 'url(#gradient-blue)';
    if (value >= 40) return 'url(#gradient-yellow)';
    return 'url(#gradient-red)';
  };

  const getTextColor = () => {
    if (value >= 80) return 'text-emerald-300';
    if (value >= 60) return 'text-blue-300';
    if (value >= 40) return 'text-amber-300';
    return 'text-rose-300';
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
        <linearGradient id="gradient-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id="gradient-red" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f87171" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={getGradient()}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${c * p} ${c * (1 - p)}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-1000"
        filter="url(#glow)"
      />
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <text
        x="50%"
        y="46%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="48"
        fontWeight="800"
        className={getTextColor()}
      >
        {value}
      </text>
      <text
        x="50%"
        y="64%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="14"
        opacity="0.6"
        className="text-slate-300"
      >
        {label}
      </text>
    </svg>
  );
}

