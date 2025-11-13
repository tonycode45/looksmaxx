import React, { useState } from 'react';
import { useCamera } from '../features/scan/useCamera';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

const ANGLES = [
  { id: 'front', label: 'Front View', emoji: '📷', description: 'Face the camera directly' },
  { id: 'side', label: 'Side Profile', emoji: '👤', description: 'Turn your head to the side' },
  { id: 'threeQuarter', label: '3/4 Profile', emoji: '📐', description: 'Turn at a 45° angle' },
];

export default function MultiAngleCamera({ onComplete, onCancel }) {
  const { videoRef, ready, snap, error, retry } = useCamera();
  const [currentAngle, setCurrentAngle] = useState(0);
  const [capturedImages, setCapturedImages] = useState({});
  const [count, setCount] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const { prefs } = useStore((s) => ({ prefs: s.prefs }));

  const currentAngleData = ANGLES[currentAngle];
  const isLastAngle = currentAngle === ANGLES.length - 1;
  const allCaptured = Object.keys(capturedImages).length === ANGLES.length;

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);
    try {
      await retry();
    } catch (e) {
      console.error('Retry failed:', e);
    } finally {
      setRetrying(false);
    }
  };

  const handleSnap = async () => {
    if (!ready || capturing) return;
    
    setCapturing(true);
    setCount(3);
    
    // Countdown
    for (let i = 2; i >= 0; i--) {
      await new Promise((r) => setTimeout(() => {
        setCount(i);
        r();
      }, 1000));
    }
    
    try {
      const { blob, url } = await snap();
      const angleId = currentAngleData.id;
      setCapturedImages(prev => ({ ...prev, [angleId]: { blob, url } }));
      
      // Move to next angle or complete
      if (isLastAngle) {
        // All angles captured, complete
        setTimeout(() => {
          onComplete(capturedImages);
        }, 500);
      } else {
        // Move to next angle
        setCurrentAngle(prev => prev + 1);
      }
    } catch (error) {
      console.error('Capture error:', error);
      alert('Failed to capture image. Please try again.');
    } finally {
      setCapturing(false);
      setCount(0);
    }
  };

  const handleSkip = () => {
    if (isLastAngle) {
      // Complete with what we have
      onComplete(capturedImages);
    } else {
      // Skip to next angle
      setCurrentAngle(prev => prev + 1);
    }
  };

  if (error) {
    const isPermissionDenied = error.includes('permission denied') || error.includes('NotAllowedError');
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);

    return (
      <Card className="p-8 max-w-md mx-auto">
        <div className="flex flex-col items-center gap-6">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-2xl font-bold text-red-400 mb-2">Camera Access Required</p>
            <p className="text-sm text-slate-300 mb-4">{error}</p>
            
            {isPermissionDenied && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-left w-full">
                <p className="text-sm font-semibold text-red-300 mb-3">How to enable camera access:</p>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  {isSafari ? (
                    <>
                      <li>Click the camera icon (🚫) in Safari's address bar</li>
                      <li>Select "Allow" for camera access</li>
                      <li>Or go to Safari → Settings → Websites → Camera</li>
                      <li>Find "localhost" and set it to "Allow"</li>
                      <li>Then click "Retry" below or refresh the page</li>
                    </>
                  ) : isChrome ? (
                    <>
                      <li>Click the lock icon (🔒) in Chrome's address bar</li>
                      <li>Find "Camera" and set it to "Allow"</li>
                      <li>Or go to Settings → Privacy → Site Settings → Camera</li>
                      <li>Add "localhost" to allowed list</li>
                      <li>Then click "Retry" below or refresh the page</li>
                    </>
                  ) : (
                    <>
                      <li>Click the lock/camera icon in your browser's address bar</li>
                      <li>Set camera permission to "Allow"</li>
                      <li>Then click "Retry" below or refresh the page</li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3 w-full">
            {onCancel && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleRetry}
              disabled={retrying}
            >
              {retrying ? 'Retrying...' : '🔄 Retry Camera Access'}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Progress Indicator */}
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">
            {currentAngle + 1} of {ANGLES.length}
          </span>
          <span className="text-sm text-slate-400">
            {Math.round(((currentAngle + 1) / ANGLES.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentAngle + 1) / ANGLES.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Angle Instructions */}
      <Card className="p-6 w-full max-w-md text-center glow">
        <div className="text-5xl mb-3">{currentAngleData.emoji}</div>
        <h3 className="text-2xl font-bold gradient-text mb-2">{currentAngleData.label}</h3>
        <p className="text-slate-300 text-sm">{currentAngleData.description}</p>
      </Card>

      {/* Camera View */}
      <div className="relative rounded-3xl overflow-hidden w-full max-w-md aspect-[3/4] bg-gradient-to-br from-slate-900 to-indigo-900 shadow-2xl glow">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        <div className="absolute inset-0 pointer-events-none ring-4 ring-purple-500/60 rounded-[2rem] shadow-inner" />
        <AnimatePresence>
          {count > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={prefs.reduceMotion ? { duration: 0 } : {}}
              className="absolute inset-0 grid place-items-center z-10 bg-black/40 backdrop-blur-sm"
            >
              <div className="text-9xl font-black text-white drop-shadow-2xl bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {count}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Captured Preview Thumbnails */}
      {Object.keys(capturedImages).length > 0 && (
        <div className="flex gap-2 w-full max-w-md justify-center">
          {ANGLES.map((angle, idx) => (
            <div
              key={angle.id}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                capturedImages[angle.id]
                  ? 'border-purple-500'
                  : 'border-slate-700'
              }`}
            >
              {capturedImages[angle.id] ? (
                <img
                  src={capturedImages[angle.id].url}
                  alt={angle.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                  {idx + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 w-full max-w-md">
        {onCancel && (
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
            disabled={capturing}
          >
            Cancel
          </Button>
        )}
        <Button
          variant="secondary"
          className="px-4"
          onClick={handleSkip}
          disabled={capturing}
        >
          Skip
        </Button>
        <Button
          variant="primary"
          className="flex-1 glow-strong"
          onClick={handleSnap}
          disabled={!ready || capturing}
        >
          {capturing ? 'Capturing...' : count > 0 ? count : isLastAngle ? '✅ Complete' : '📸 Capture'}
        </Button>
      </div>

      {!ready && !error && (
        <p className="text-sm text-slate-400 text-center">Preparing camera...</p>
      )}
    </div>
  );
}

