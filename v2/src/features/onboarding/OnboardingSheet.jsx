import React from 'react';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { useStore } from '../../store/useStore';

export default function OnboardingSheet({ isOpen, onClose }) {
  const { setPrefs } = useStore((s) => ({ setPrefs: s.setPrefs }));

  const handleAccept = async () => {
    await setPrefs({ hasSeenOnboarding: true });
    onClose();
  };

  return (
    <Sheet isOpen={isOpen} onClose={handleAccept}>
      <div className="p-8 space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">✨</div>
          <h2 className="text-3xl font-bold mb-3 gradient-text">Your glow-up, your data.</h2>
          <p className="text-slate-300 leading-relaxed">
            All analysis runs on your device. You control exports and deletes. We'll ask for camera
            permission to scan your face.
          </p>
        </div>
        <Button variant="primary" className="w-full py-4 text-lg font-bold" onClick={handleAccept}>
          I Agree
        </Button>
      </div>
    </Sheet>
  );
}

