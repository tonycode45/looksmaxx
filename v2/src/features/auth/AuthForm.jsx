import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const PASSWORD_MIN_LENGTH = 6;

export default function AuthForm() {
  const { signUp, logIn, authError, resetAuthError } = useStore((s) => ({
    signUp: s.signUp,
    logIn: s.logIn,
    authError: s.authError,
    resetAuthError: s.resetAuthError,
  }));
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;
    if (password.length < PASSWORD_MIN_LENGTH) return;

    try {
      resetAuthError();
      setSubmitting(true);
      if (mode === 'signup') {
        await signUp({ email: trimmedEmail, password });
      } else {
        await logIn({ email: trimmedEmail, password });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#090013] via-[#120930] to-[#1b0f3f] px-4">
      <Card className="w-full max-w-md p-8 glass-strong border border-white/10 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold gradient-text">MirrorMe</h1>
          <p className="text-slate-400 mt-2">
            {mode === 'signup'
              ? 'Create your account to start tracking your looksmax journey.'
              : 'Log back in to continue your progress.'}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="text-left">
            <label className="text-sm text-slate-300 block mb-2">Email</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-white/5 border-white/10"
              autoFocus
            />
          </div>

          <div className="text-left">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-300">Password</label>
              <span className="text-xs text-slate-500">Min {PASSWORD_MIN_LENGTH} characters</span>
            </div>
            <Input
              type="password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white/5 border-white/10"
            />
          </div>

          {authError && <p className="text-sm text-rose-400 text-center">{authError}</p>}

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 font-semibold"
            disabled={submitting}
          >
            {submitting ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Log In'}
          </Button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-400">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  resetAuthError();
                  setMode('login');
                }}
                className="text-purple-300 hover:text-purple-200 underline"
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Need an account?{' '}
              <button
                type="button"
                onClick={() => {
                  resetAuthError();
                  setMode('signup');
                }}
                className="text-purple-300 hover:text-purple-200 underline"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

