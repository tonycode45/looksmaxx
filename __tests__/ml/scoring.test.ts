import { computeScores } from '@/ml/scoring';
import type { FaceLandmarks } from '@/ml/landmark';

describe('computeScores', () => {
  it('should compute scores from valid landmarks', () => {
    const landmarks: FaceLandmarks = {
      landmarks: Array.from({ length: 468 }, (_, i) => ({
        x: 0.5 + (Math.random() - 0.5) * 0.2,
        y: 0.5 + (Math.random() - 0.5) * 0.2,
        z: (Math.random() - 0.5) * 0.1,
      })),
      confidence: 0.95,
    };

    const result = computeScores(landmarks);

    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('subscores');
    expect(result.subscores).toHaveProperty('posture');
    expect(result.subscores).toHaveProperty('symmetry');
    expect(result.subscores).toHaveProperty('skin');
    expect(result.subscores).toHaveProperty('hair');

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);

    Object.values(result.subscores).forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  it('should handle empty landmarks', () => {
    const landmarks: FaceLandmarks = {
      landmarks: [],
      confidence: 0,
    };

    const result = computeScores(landmarks);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should clamp scores to 0-100 range', () => {
    const landmarks: FaceLandmarks = {
      landmarks: Array.from({ length: 468 }, () => ({
        x: 0,
        y: 0,
        z: 0,
      })),
      confidence: 0.5,
    };

    const result = computeScores(landmarks);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);

    Object.values(result.subscores).forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});

