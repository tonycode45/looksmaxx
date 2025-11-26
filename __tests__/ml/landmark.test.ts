import { extractLandmarks } from '@/ml/landmark';
import type { FaceLandmarks } from '@/ml/landmark';

describe('Landmark Extraction', () => {
  it('should extract landmarks from image URI', async () => {
    const landmarks = await extractLandmarks('file://test.jpg');
    
    expect(landmarks).toBeDefined();
    expect(landmarks.landmarks).toBeDefined();
    expect(Array.isArray(landmarks.landmarks)).toBe(true);
    expect(landmarks.landmarks.length).toBeGreaterThan(0);
  });

  it('should return landmarks with correct structure', async () => {
    const landmarks = await extractLandmarks('file://test.jpg');
    
    expect(landmarks).toHaveProperty('landmarks');
    expect(landmarks).toHaveProperty('confidence');
    expect(landmarks.landmarks.length).toBeGreaterThan(0);
    if (landmarks.confidence !== undefined) {
      expect(landmarks.confidence).toBeGreaterThan(0);
      expect(landmarks.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('should generate landmarks with valid coordinates', async () => {
    const landmarks = await extractLandmarks('file://test.jpg');
    
    landmarks.landmarks.forEach((point) => {
      expect(point).toHaveProperty('x');
      expect(point).toHaveProperty('y');
      expect(typeof point.x).toBe('number');
      expect(typeof point.y).toBe('number');
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(1);
    });
  });

  it('should generate symmetric landmarks', async () => {
    const landmarks = await extractLandmarks('file://test.jpg');
    
    // Check that nose tip is approximately centered
    const noseTip = landmarks.landmarks[4];
    if (noseTip) {
      expect(noseTip.x).toBeCloseTo(0.5, 0.2); // Within 20% of center
    }
  });

  it('should return consistent landmark count', async () => {
    const landmarks1 = await extractLandmarks('file://test1.jpg');
    const landmarks2 = await extractLandmarks('file://test2.jpg');
    
    // Should return same number of landmarks (468 for MediaPipe standard)
    expect(landmarks1.landmarks.length).toBe(landmarks2.landmarks.length);
  });
});

