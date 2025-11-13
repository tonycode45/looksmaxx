import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AppShell from './AppShell';
import HomePage from '../features/home/HomePage';
import ProgressPage from '../features/progress/ProgressPage';
import SettingsPage from '../features/settings/SettingsPage';

function ErrorPage({ error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-3xl p-6 border border-red-500/50">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Route Error</h2>
        <p className="text-zinc-300 mb-4">{error?.message || 'An error occurred'}</p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 rounded-xl font-semibold text-black"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <HomePage />, errorElement: <ErrorPage /> },
      { path: '/progress', element: <ProgressPage />, errorElement: <ErrorPage /> },
      { path: '/settings', element: <SettingsPage />, errorElement: <ErrorPage /> },
    ],
  },
]);

