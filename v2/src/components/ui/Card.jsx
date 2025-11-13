import React from 'react';

export const Card = ({ className = '', children, glow = false }) => (
  <div
    className={`rounded-3xl glass-strong shadow-2xl backdrop-blur-xl ${
      glow ? 'glow' : ''
    } ${className}`}
  >
    {children}
  </div>
);

