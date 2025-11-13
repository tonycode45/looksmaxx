import React from 'react';

export const Button = ({ as: Tag = 'button', variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg glow hover:glow-strong',
    secondary: 'bg-slate-800/80 hover:bg-slate-700/80 text-white border border-white/10',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white',
    ghost: 'bg-transparent hover:bg-white/5 text-white border border-white/10',
  };

  return (
    <Tag
      className={`px-6 py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${variants[variant]} ${className}`}
      {...props}
    />
  );
};

