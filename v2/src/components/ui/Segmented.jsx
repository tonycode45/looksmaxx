import React from 'react';

export const Segmented = ({ options, value, onChange, className = '' }) => (
  <div className={`inline-flex rounded-xl bg-zinc-800 p-1 ${className}`}>
    {options.map((option) => (
      <button
        key={option.value}
        onClick={() => onChange(option.value)}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          value === option.value
            ? 'bg-sky-500 text-black'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

