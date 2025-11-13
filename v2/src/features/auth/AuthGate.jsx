import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import AuthForm from './AuthForm';

export default function AuthGate({ children }) {
  const { ready, user, init } = useStore((s) => ({
    ready: s.ready,
    user: s.user,
    init: s.init,
  }));

  useEffect(() => {
    if (!ready) {
      init();
    }
  }, [init, ready]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#090013] via-[#120930] to-[#1b0f3f] text-slate-200">
        Loading MirrorMe…
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return children;
}

