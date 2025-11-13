import type { FaceLandmarks } from './landmark';

export interface ScoreResult {
  score: number;
  subscores: {
    posture: number;
    symmetry: number;
    skin: number;
    hair: number;
  };
}

/**
 * Compute subscores from face landmarks
 */
export function computeScores(landmarks: FaceLandmarks): ScoreResult {
  const { landmarks: points } = landmarks;

  // Posture score: head pitch/roll variance; neck angle
  const postureScore = computePostureScore(points);

  // Symmetry score: left/right landmark distances normalized by interpupillary distance
  const symmetryScore = computeSymmetryScore(points);

  // Skin score: basic brightness/contrast uniformity (stubbed for now)
  const skinScore = computeSkinScore(points);

  // Hair score: edge density around hairline (stubbed for now)
  const hairScore = computeHairScore(points);

  // Overall score: weighted average
  const weights = {
    posture: 0.25,
    symmetry: 0.25,
    skin: 0.25,
    hair: 0.25,
  };

  const overallScore = Math.round(
    postureScore * weights.posture +
      symmetryScore * weights.symmetry +
      skinScore * weights.skin +
      hairScore * weights.hair
  );

  return {
    score: Math.max(0, Math.min(100, overallScore)),
    subscores: {
      posture: Math.max(0, Math.min(100, postureScore)),
      symmetry: Math.max(0, Math.min(100, symmetryScore)),
      skin: Math.max(0, Math.min(100, skinScore)),
      hair: Math.max(0, Math.min(100, hairScore)),
    },
  };
}

/**
 * Compute posture score from landmarks
 * Uses head pitch/roll variance and neck angle estimates
 */
function computePostureScore(points: FaceLandmarks['landmarks']): number {
  if (points.length < 10) return 50;

  // Helper to find points with fallback indices
  const getPoint = (indices: number[], fallback?: number) => {
    for (const idx of indices) {
      if (idx < points.length && points[idx]) return points[idx];
    }
    if (fallback !== undefined && fallback < points.length && points[fallback]) {
      return points[fallback];
    }
    return null;
  };

  // Key points for posture estimation with multiple fallback options
  const noseTip = getPoint([4, 168, 0, Math.floor(points.length * 0.5)]) || points[0];
  const chin = getPoint([175, 18, 17, Math.floor(points.length * 0.8)]) || points[points.length - 1];
  
  // For ears, try multiple indices or use leftmost/rightmost points
  const leftEar = getPoint([234, 127, 33, 0]);
  const rightEar = getPoint([454, 356, 263, points.length - 1]);
  
  // If we don't have ears, use leftmost and rightmost points
  let finalLeftEar = leftEar;
  let finalRightEar = rightEar;
  
  if (!finalLeftEar || !finalRightEar) {
    // Find leftmost and rightmost points
    let leftmost = points[0];
    let rightmost = points[0];
    for (const point of points) {
      if (point.x < leftmost.x) leftmost = point;
      if (point.x > rightmost.x) rightmost = point;
    }
    finalLeftEar = finalLeftEar || leftmost;
    finalRightEar = finalRightEar || rightmost;
  }

  if (!noseTip || !chin || !finalLeftEar || !finalRightEar) {
    // Fallback: use basic head angle estimation
    const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const topY = Math.min(...points.map(p => p.y));
    const bottomY = Math.max(...points.map(p => p.y));
    
    // Estimate vertical alignment
    const verticalAlignment = 1 - Math.abs(avgX - 0.5) * 2; // 0-1 scale
    const headAngle = Math.abs(topY - bottomY) > 0.1 ? 1 : 0.5;
    
    return Math.round(Math.max(0, Math.min(100, (verticalAlignment * 70 + headAngle * 30))));
  }

  // Estimate head pitch (forward/backward tilt)
  const verticalDist = chin.y - noseTip.y;
  const horizontalDist = Math.abs(chin.x - noseTip.x);
  const pitchAngle = horizontalDist > 0.001 
    ? Math.atan2(verticalDist, horizontalDist) * (180 / Math.PI)
    : 90;

  // Estimate head roll (left/right tilt)
  const earYDiff = Math.abs(finalLeftEar.y - finalRightEar.y);
  const earXDiff = Math.abs(finalLeftEar.x - finalRightEar.x);
  const rollAngle = earXDiff > 0.001
    ? Math.atan2(earYDiff, earXDiff) * (180 / Math.PI)
    : 0;

  // Ideal posture: pitch ~90°, roll ~0°
  // Adjust scoring to be less harsh
  const pitchScore = Math.max(0, 100 - Math.abs(pitchAngle - 90) * 1.5);
  const rollScore = Math.max(0, 100 - rollAngle * 2);

  return Math.round((pitchScore + rollScore) / 2);
}

/**
 * Compute symmetry score from landmarks
 * Compares left/right landmark distances normalized by interpupillary distance
 */
function computeSymmetryScore(points: FaceLandmarks['landmarks'], useFallback = false): number {
  if (points.length < 10) return 50;

  // Fallback method: use general face symmetry with available points
  if (useFallback || points.length < 20) {
    // Split points into left and right halves
    const midPoint = Math.floor(points.length / 2);
    const leftPoints = points.slice(0, midPoint);
    const rightPoints = points.slice(midPoint).reverse();
    
    let totalAsymmetry = 0;
    const pairsToCheck = Math.min(leftPoints.length, rightPoints.length, 10);
    
    for (let i = 0; i < pairsToCheck; i++) {
      const left = leftPoints[i];
      const right = rightPoints[i];
      if (!left || !right) continue;
      
      // Distance from center vertical line
      const leftDist = Math.abs(left.x - 0.5);
      const rightDist = Math.abs(right.x - 0.5);
      const asymmetry = Math.abs(leftDist - rightDist);
      totalAsymmetry += asymmetry;
    }
    
    const avgAsymmetry = pairsToCheck > 0 ? totalAsymmetry / pairsToCheck : 0.1;
    // Adjust scoring to give better results (most faces have some asymmetry)
    const symmetryScore = Math.max(0, 100 - avgAsymmetry * 80);
    return Math.round(symmetryScore);
  }

  // Use more robust point selection - try multiple indices and use first available
  const getPoint = (indices: number[]) => {
    for (const idx of indices) {
      if (idx < points.length && points[idx]) return points[idx];
    }
    return null;
  };

  // Try to find eyes (multiple possible indices)
  const leftEye = getPoint([33, 159, 1, Math.floor(points.length * 0.3)]) || points[0];
  const rightEye = getPoint([263, 386, 2, Math.floor(points.length * 0.7)]) || points[Math.floor(points.length * 0.9)];
  const noseTip = getPoint([4, 168, 0, Math.floor(points.length * 0.5)]) || points[Math.floor(points.length * 0.5)];

  if (!leftEye || !rightEye || !noseTip) {
    return computeSymmetryScore(points, true); // Use fallback
  }

  // Interpupillary distance
  const ipd = Math.sqrt(
    Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
  );

  if (ipd < 0.01) {
    // If IPD is too small, use fallback method
    return computeSymmetryScore(points, true); // Use fallback
  }

  // Sample multiple symmetric pairs - use more points for better accuracy
  const symmetricPairs: Array<[FaceLandmark | undefined, FaceLandmark | undefined]> = [];
  
  // Try multiple index combinations
  const possiblePairs = [
    [33, 263], [159, 386], [61, 291], [78, 308], // MediaPipe standard
    [1, Math.floor(points.length * 0.9)], // Fallback first/last
    [Math.floor(points.length * 0.2), Math.floor(points.length * 0.8)], // Left/right
    [Math.floor(points.length * 0.3), Math.floor(points.length * 0.7)], // More left/right
  ];
  
  for (const [leftIdx, rightIdx] of possiblePairs) {
    const left = points[leftIdx];
    const right = points[rightIdx];
    if (left && right) {
      symmetricPairs.push([left, right]);
    }
  }

  // If we have no pairs, use fallback
  if (symmetricPairs.length === 0) {
    return computeSymmetryScore(points, true); // Use fallback
  }

  let totalAsymmetry = 0;
  for (const [left, right] of symmetricPairs) {
    if (!left || !right) continue;

    const leftDist = Math.sqrt(
      Math.pow(left.x - noseTip.x, 2) + Math.pow(left.y - noseTip.y, 2)
    );
    const rightDist = Math.sqrt(
      Math.pow(right.x - noseTip.x, 2) + Math.pow(right.y - noseTip.y, 2)
    );

    const asymmetry = Math.abs(leftDist - rightDist) / ipd;
    totalAsymmetry += asymmetry;
  }

  const avgAsymmetry = symmetricPairs.length > 0 ? totalAsymmetry / symmetricPairs.length : 0.1;
  // Adjust multiplier to get better scores (less harsh)
  // Most faces have some asymmetry, so we want scores in 60-90 range for normal faces
  const symmetryScore = Math.max(0, 100 - avgAsymmetry * 120);

  return Math.round(symmetryScore);
}

/**
 * Compute skin score (stubbed - would analyze image texture)
 */
function computeSkinScore(points: FaceLandmarks['landmarks']): number {
  // In a real implementation, this would analyze the image texture
  // For now, return a randomized score with some variance
  return Math.round(60 + Math.random() * 30);
}

/**
 * Compute hair score (stubbed - would analyze hairline edge density)
 */
function computeHairScore(points: FaceLandmarks['landmarks']): number {
  // In a real implementation, this would analyze edge density around hairline
  // For now, return a randomized score with some variance
  return Math.round(70 + Math.random() * 20);
}

