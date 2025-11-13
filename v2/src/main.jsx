import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/routes';
import { ErrorBoundary } from './app/ErrorBoundary';
import './styles/globals.css';
import AuthGate from './features/auth/AuthGate';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthGate>
        <RouterProvider router={router} />
      </AuthGate>
    </ErrorBoundary>
  </React.StrictMode>
);

