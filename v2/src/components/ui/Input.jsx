import React from 'react';

export const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full px-4 py-2 rounded-xl bg-zinc-800 border border-white/10 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 ${className}`}
    {...props}
  />
);

