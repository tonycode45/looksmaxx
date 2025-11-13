import React from 'react';

export const Slider = ({ value, onChange, min = 0, max = 100, className = '', ...props }) => (
  <input
    type="range"
    min={min}
    max={max}
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    className={`w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-500 ${className}`}
    {...props}
  />
);

