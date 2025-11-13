import { describe, it, expect } from 'vitest';
import { scoreImage } from '../features/scan/scoring';

describe('scoreImage', () => {
  const makeBlob = () => new Blob(['fake'], { type: 'image/jpeg' });

  it('returns core facial metrics and SMV tiers', () => {
    const s = scoreImage(makeBlob());
    expect(s).toHaveProperty('overall');
    expect(s).toHaveProperty('smv');
    expect(s).toHaveProperty('eyeAesthetics');
    expect(s).toHaveProperty('midfaceHarmony');
    expect(s).toHaveProperty('jawStructure');
    expect(typeof s.smv.maleTier).toBe('string');
    expect(typeof s.smv.femaleTier).toBe('string');
  });

  it('keeps scores within expected bounds', () => {
    const s = scoreImage(makeBlob());
    expect(s.overall).toBeGreaterThanOrEqual(25);
    expect(s.overall).toBeLessThanOrEqual(100);
    expect(s.smv.score).toBeGreaterThanOrEqual(25);
    expect(s.smv.score).toBeLessThanOrEqual(100);
    expect(s.eyeAesthetics.score).toBeGreaterThanOrEqual(25);
    expect(s.eyeAesthetics.score).toBeLessThanOrEqual(100);
  });

  it('exposes feature flags for quick assessment', () => {
    const s = scoreImage(makeBlob());
    expect(s.featureFlags).toBeTruthy();
    expect(typeof s.featureFlags.maxilla).toBe('string');
    expect(typeof s.featureFlags.eyes).toBe('string');
  });
});

