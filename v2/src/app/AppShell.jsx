import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Home, LineChart, Settings } from 'lucide-react';
import OnboardingSheet from '../features/onboarding/OnboardingSheet';
import { ToastContainer } from '../components/Toast';

export default function AppShell() {
  const { prefs, ready } = useStore((s) => ({ prefs: s.prefs, ready: s.ready }));
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (ready && !prefs.hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [ready, prefs.hasSeenOnboarding]);

  return (
    <div className={`min-h-dvh text-slate-100 ${prefs.highContrast ? 'border-white/30' : ''}`}>
      <header
        className={`sticky top-0 z-10 border-b ${
          prefs.highContrast ? 'border-white/30' : 'border-white/10'
        } glass-strong backdrop-blur-xl`}
      >
        <div className="mx-auto max-w-4xl px-4 py-4">
          <h1 className="text-2xl font-bold gradient-text">MirrorMe</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>

      <nav
        className={`fixed bottom-0 inset-x-0 border-t ${
          prefs.highContrast ? 'border-white/30' : 'border-white/10'
        } glass-strong backdrop-blur-xl`}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-3">
          <Tab to="/" icon={<Home size={22} />}>
            Home
          </Tab>
          <Tab to="/progress" icon={<LineChart size={22} />}>
            Progress
          </Tab>
          <Tab to="/settings" icon={<Settings size={22} />}>
            Settings
          </Tab>
        </div>
      </nav>

      <div className="h-16" />
      <OnboardingSheet isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
      <ToastContainer />
    </div>
  );
}

const Tab = ({ to, icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to === '/' && location.pathname === '/');
  
  return (
    <NavLink
      to={to}
      end
      className={`flex flex-col items-center justify-center gap-1 py-3 transition-all duration-300 ${
        isActive
          ? 'text-purple-400 scale-110'
          : 'text-slate-400 hover:text-slate-200 hover:scale-105'
      }`}
    >
      {icon}
      <span className="text-xs font-medium sr-only sm:not-sr-only">{children}</span>
      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
    </NavLink>
  );
};

