import React from 'react';

export const Switch = ({ checked, onChange, className = '', ...props }) => (
  <label className={`inline-flex items-center cursor-pointer ${className}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
      {...props}
    />
    <div
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
        checked
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg glow'
          : 'bg-slate-700'
      }`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${
          checked ? 'translate-x-6' : ''
        }`}
      />
    </div>
  </label>
);

