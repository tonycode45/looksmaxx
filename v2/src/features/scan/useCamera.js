import { useEffect, useRef, useState } from 'react';

export function useCamera() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  const requestCamera = async () => {
    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const s = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });
      streamRef.current = s;
      setStream(s);
      setError(null);
      setReady(false); // Reset ready state
    } catch (e) {
      console.error('Camera error:', e);
      if (e.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else if (e.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera.');
      } else {
        setError(`Camera error: ${e.message}`);
      }
      setStream(null);
      setReady(false);
    }
  };

  useEffect(() => {
    requestCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      video.srcObject = stream;
      
      const handleLoadedMetadata = () => {
        setReady(true);
      };
      
      const handleError = (e) => {
        console.error('Video error:', e);
        setError('Failed to load video stream');
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('error', handleError);
      
      // Fallback: set ready after a short delay if metadata doesn't load
      const timeout = setTimeout(() => {
        if (video.readyState >= 2) {
          setReady(true);
        }
      }, 1000);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('error', handleError);
        clearTimeout(timeout);
      };
    }
  }, [stream]);

  const snap = async () => {
    const video = videoRef.current;
    if (!video || !ready) {
      throw new Error('Video not ready');
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;
    const ctx = canvas.getContext('2d');
    
    // Flip horizontally to match the unflipped preview (video is displayed with scaleX(-1))
    // This ensures the captured photo is NOT flipped, like a regular phone selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        0.9
      );
    });
    
    const url = URL.createObjectURL(blob);
    return { blob, url };
  };

  return { videoRef, ready, snap, error, retry: requestCamera };
}

