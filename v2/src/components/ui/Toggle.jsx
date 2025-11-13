import React from 'react';

export const Toggle = ({ checked, onChange, className = '', ...props }) => (
  <button
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-sky-500' : 'bg-zinc-700'
    } ${className}`}
    onClick={() => onChange(!checked)}
    {...props}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

