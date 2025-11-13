import React from 'react';

export default function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-4xl mb-4">📸</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-zinc-400 mb-6">{description}</p>
      {action}
    </div>
  );
}

