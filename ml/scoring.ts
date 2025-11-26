import type { FaceLandmarks, FaceLandmark } from './landmark';
import {
  SCORE_RANGE,
  POSTURE_CONSTANTS,
  SYMMETRY_CONSTANTS,
  LANDMARK_RATIOS,
  PLACEHOLDER_SCORES,
  MATH_CONSTANTS,
} from './constants';

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
 * Scoring weights for different categories
 */
const SCORING_WEIGHTS = {
  posture: 0.25,
  symmetry: 0.25,
  skin: 0.25,
  hair: 0.25,
} as const;

/**
 * Minimum number of landmarks required for accurate scoring
 */
const MIN_LANDMARKS_FOR_SCORING = 10;

/**
 * Computes overall score and subscores from face landmarks.
 * 
 * @param landmarks - Face landmarks data containing array of landmark points
 * @returns ScoreResult with overall score (0-100) and individual subscores
 * 
 * @example
 * ```typescript
 * const result = computeScores(landmarks);
 * console.log(result.score); // Overall score
 * console.log(result.subscores.posture); // Posture subscore
 * ```
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
  const overallScore = Math.round(
    postureScore * SCORING_WEIGHTS.posture +
      symmetryScore * SCORING_WEIGHTS.symmetry +
      skinScore * SCORING_WEIGHTS.skin +
      hairScore * SCORING_WEIGHTS.hair
  );

  return {
    score: Math.max(SCORE_RANGE.MIN, Math.min(SCORE_RANGE.MAX, overallScore)),
    subscores: {
      posture: Math.max(SCORE_RANGE.MIN, Math.min(SCORE_RANGE.MAX, postureScore)),
      symmetry: Math.max(SCORE_RANGE.MIN, Math.min(SCORE_RANGE.MAX, symmetryScore)),
      skin: Math.max(SCORE_RANGE.MIN, Math.min(SCORE_RANGE.MAX, skinScore)),
      hair: Math.max(SCORE_RANGE.MIN, Math.min(SCORE_RANGE.MAX, hairScore)),
    },
  };
}

/**
 * Helper function to find landmark points with fallback indices
 * 
 * @param points - Array of landmark points
 * @param indices - Array of indices to try in order
 * @param fallback - Optional fallback index if none found
 * @returns Found landmark point or null
 */
function findLandmarkPoint(
  points: FaceLandmark[],
  indices: readonly number[],
  fallback?: number
): FaceLandmark | null {
  for (const idx of indices) {
    if (idx < points.length && points[idx]) return points[idx];
  }
  if (fallback !== undefined && fallback < points.length && points[fallback]) {
    return points[fallback];
  }
  return null;
}

/**
 * Finds the leftmost and rightmost points in the landmark array
 * 
 * @param points - Array of landmark points
 * @returns Object with leftmost and rightmost points
 */
function findExtremePoints(points: FaceLandmark[]): {
  leftmost: FaceLandmark;
  rightmost: FaceLandmark;
} {
  let leftmost = points[0];
  let rightmost = points[0];
  for (const point of points) {
    if (point.x < leftmost.x) leftmost = point;
    if (point.x > rightmost.x) rightmost = point;
  }
  return { leftmost, rightmost };
}

/**
 * Calculates basic posture score using vertical alignment estimation
 * Used as fallback when key landmarks are missing
 * 
 * @param points - Array of landmark points
 * @returns Posture score (0-100)
 */
function computeBasicPostureScore(points: FaceLandmark[]): number {
  const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const topY = Math.min(...points.map(p => p.y));
  const bottomY = Math.max(...points.map(p => p.y));
  
  // Estimate vertical alignment (centered = better)
  const verticalAlignment = 1 - Math.abs(avgX - POSTURE_CONSTANTS.CENTER_X) * 2; // 0-1 scale
  const headAngle = Math.abs(topY - bottomY) > POSTURE_CONSTANTS.HEAD_ANGLE_THRESHOLD ? 1 : 0.5;
  
  const score = verticalAlignment * POSTURE_CONSTANTS.VERTICAL_ALIGNMENT_WEIGHT + 
                headAngle * POSTURE_CONSTANTS.HEAD_ANGLE_WEIGHT;
  return Math.round(Math.max(SCORE_RANGE.MIN, Math.min(SCORE_RANGE.MAX, score)));
}

/**
 * Calculates head pitch angle (forward/backward tilt)
 * 
 * @param noseTip - Nose tip landmark point
 * @param chin - Chin landmark point
 * @returns Pitch angle in degrees (90° = ideal)
 */
function calculatePitchAngle(noseTip: FaceLandmark, chin: FaceLandmark): number {
  const verticalDist = chin.y - noseTip.y;
  const horizontalDist = Math.abs(chin.x - noseTip.x);
  return horizontalDist > POSTURE_CONSTANTS.MIN_HORIZONTAL_DISTANCE 
    ? Math.atan2(verticalDist, horizontalDist) * MATH_CONSTANTS.DEGREES_PER_RADIAN
    : POSTURE_CONSTANTS.IDEAL_PITCH;
}

/**
 * Calculates head roll angle (left/right tilt)
 * 
 * @param leftEar - Left ear landmark point
 * @param rightEar - Right ear landmark point
 * @returns Roll angle in degrees (0° = ideal)
 */
function calculateRollAngle(leftEar: FaceLandmark, rightEar: FaceLandmark): number {
  const earYDiff = Math.abs(leftEar.y - rightEar.y);
  const earXDiff = Math.abs(leftEar.x - rightEar.x);
  return earXDiff > POSTURE_CONSTANTS.MIN_HORIZONTAL_DISTANCE
    ? Math.atan2(earYDiff, earXDiff) * MATH_CONSTANTS.DEGREES_PER_RADIAN
    : 0;
}

/**
 * Computes posture score from head pitch and roll angles
 * 
 * @param pitchAngle - Head pitch angle in degrees
 * @param rollAngle - Head roll angle in degrees
 * @returns Posture score (0-100)
 */
function scoreFromAngles(pitchAngle: number, rollAngle: number): number {
  // Ideal posture: pitch ~90°, roll ~0°
  const pitchScore = Math.max(
    SCORE_RANGE.MIN,
    SCORE_RANGE.MAX - Math.abs(pitchAngle - POSTURE_CONSTANTS.IDEAL_PITCH) * POSTURE_CONSTANTS.PITCH_TOLERANCE_MULTIPLIER
  );
  const rollScore = Math.max(
    SCORE_RANGE.MIN,
    SCORE_RANGE.MAX - rollAngle * POSTURE_CONSTANTS.ROLL_MULTIPLIER
  );
  
  return Math.round((pitchScore + rollScore) / 2);
}

/**
 * Computes posture score from landmarks.
 * Uses head pitch/roll variance and neck angle estimates.
 * 
 * The score is based on:
 * - Head pitch (forward/backward tilt) - ideal is 90°
 * - Head roll (left/right tilt) - ideal is 0°
 * 
 * @param points - Array of face landmark points
 * @returns Posture score from 0-100, where 100 is perfect posture
 * 
 * @remarks
 * Falls back to basic estimation if key landmarks (nose, chin, ears) are missing.
 * Returns 50 (neutral) if insufficient landmarks are provided.
 */
function computePostureScore(points: FaceLandmarks['landmarks']): number {
  if (points.length < MIN_LANDMARKS_FOR_SCORING) return SCORE_RANGE.NEUTRAL;

  // Key points for posture estimation with multiple fallback options
  // MediaPipe standard indices: nose tip (4), chin (175), ears (234, 454)
  const noseTip = findLandmarkPoint(
    points,
    [4, 168, 0],
    Math.floor(points.length * LANDMARK_RATIOS.NOSE_TIP_FALLBACK)
  ) || points[0];
  const chin = findLandmarkPoint(
    points,
    [175, 18, 17],
    Math.floor(points.length * LANDMARK_RATIOS.CHIN_FALLBACK)
  ) || points[points.length - 1];
  
  // For ears, try multiple indices or use leftmost/rightmost points
  let leftEar = findLandmarkPoint(points, [234, 127, 33]);
  let rightEar = findLandmarkPoint(points, [454, 356, 263]);
  
  // If we don't have ears, use leftmost and rightmost points
  if (!leftEar || !rightEar) {
    const { leftmost, rightmost } = findExtremePoints(points);
    leftEar = leftEar || leftmost;
    rightEar = rightEar || rightmost;
  }

  // Fallback to basic estimation if key landmarks are missing
  if (!noseTip || !chin || !leftEar || !rightEar) {
    return computeBasicPostureScore(points);
  }

  // Calculate angles and score
  const pitchAngle = calculatePitchAngle(noseTip, chin);
  const rollAngle = calculateRollAngle(leftEar, rightEar);
  
  return scoreFromAngles(pitchAngle, rollAngle);
}

/**
 * MediaPipe landmark indices for key facial features
 */
const LANDMARK_INDICES = {
  LEFT_EYE: [33, 159],
  RIGHT_EYE: [263, 386],
  NOSE_TIP: [4, 168],
  MOUTH_LEFT: [61, 78],
  MOUTH_RIGHT: [291, 308],
} as const;

/**
 * Minimum interpupillary distance threshold (normalized coordinates)
 */
const MIN_IPD_THRESHOLD = 0.01;

/**
 * Minimum landmarks required for symmetry calculation
 */
const MIN_LANDMARKS_FOR_SYMMETRY = 20;

/**
 * Calculates interpupillary distance (IPD) between two eye points
 * 
 * @param leftEye - Left eye landmark point
 * @param rightEye - Right eye landmark point
 * @returns IPD distance in normalized coordinates
 */
function calculateInterpupillaryDistance(
  leftEye: FaceLandmark,
  rightEye: FaceLandmark
): number {
  return Math.sqrt(
    Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
  );
}

/**
 * Computes symmetry score using fallback method when key landmarks are unavailable.
 * Splits face into left/right halves and compares distances from center line.
 * 
 * @param points - Array of landmark points
 * @returns Symmetry score (0-100)
 */
function computeSymmetryScoreFallback(points: FaceLandmark[]): number {
  const midPoint = Math.floor(points.length / 2);
  const leftPoints = points.slice(0, midPoint);
  const rightPoints = points.slice(midPoint).reverse();
  
  let totalAsymmetry = 0;
  const pairsToCheck = Math.min(
    leftPoints.length,
    rightPoints.length,
    SYMMETRY_CONSTANTS.MAX_PAIRS_TO_CHECK
  );
  
  for (let i = 0; i < pairsToCheck; i++) {
    const left = leftPoints[i];
    const right = rightPoints[i];
    if (!left || !right) continue;
    
    // Distance from center vertical line
    const leftDist = Math.abs(left.x - SYMMETRY_CONSTANTS.CENTER_X);
    const rightDist = Math.abs(right.x - SYMMETRY_CONSTANTS.CENTER_X);
    const asymmetry = Math.abs(leftDist - rightDist);
    totalAsymmetry += asymmetry;
  }
  
  const avgAsymmetry = pairsToCheck > 0 
    ? totalAsymmetry / pairsToCheck 
    : SYMMETRY_CONSTANTS.DEFAULT_ASYMMETRY;
  const symmetryScore = Math.max(
    SCORE_RANGE.MIN,
    SCORE_RANGE.MAX - avgAsymmetry * SYMMETRY_CONSTANTS.FALLBACK_MULTIPLIER
  );
  
  return Math.round(symmetryScore);
}

/**
 * Finds symmetric landmark pairs for comparison
 * 
 * @param points - Array of landmark points
 * @returns Array of [left, right] landmark pairs
 */
function findSymmetricPairs(points: FaceLandmark[]): Array<[FaceLandmark, FaceLandmark]> {
  const symmetricPairs: Array<[FaceLandmark, FaceLandmark]> = [];
  
  // Try multiple index combinations (MediaPipe standard + fallbacks)
  const possiblePairs = [
    [33, 263], [159, 386], [61, 291], [78, 308], // MediaPipe standard
    [1, Math.floor(points.length * LANDMARK_RATIOS.FIRST_POINT_FALLBACK)], // Fallback first/last
    [
      Math.floor(points.length * LANDMARK_RATIOS.LEFT_SIDE_FALLBACK),
      Math.floor(points.length * LANDMARK_RATIOS.RIGHT_SIDE_FALLBACK)
    ], // Left/right
    [
      Math.floor(points.length * LANDMARK_RATIOS.MORE_LEFT_SIDE_FALLBACK),
      Math.floor(points.length * LANDMARK_RATIOS.MORE_RIGHT_SIDE_FALLBACK)
    ], // More left/right
  ];
  
  for (const [leftIdx, rightIdx] of possiblePairs) {
    const left = points[leftIdx];
    const right = points[rightIdx];
    if (left && right) {
      symmetricPairs.push([left, right]);
    }
  }
  
  return symmetricPairs;
}

/**
 * Calculates asymmetry between a pair of symmetric landmarks
 * 
 * @param left - Left landmark point
 * @param right - Right landmark point
 * @param noseTip - Nose tip point (center reference)
 * @param ipd - Interpupillary distance for normalization
 * @returns Normalized asymmetry value
 */
function calculatePairAsymmetry(
  left: FaceLandmark,
  right: FaceLandmark,
  noseTip: FaceLandmark,
  ipd: number
): number {
  const leftDist = Math.sqrt(
    Math.pow(left.x - noseTip.x, 2) + Math.pow(left.y - noseTip.y, 2)
  );
  const rightDist = Math.sqrt(
    Math.pow(right.x - noseTip.x, 2) + Math.pow(right.y - noseTip.y, 2)
  );
  
  return Math.abs(leftDist - rightDist) / ipd;
}

/**
 * Computes symmetry score from landmarks.
 * Compares left/right landmark distances normalized by interpupillary distance.
 * 
 * The score measures facial symmetry by:
 * - Finding symmetric landmark pairs (eyes, mouth corners, etc.)
 * - Comparing distances from center reference point (nose tip)
 * - Normalizing by interpupillary distance
 * 
 * @param points - Array of face landmark points
 * @param useFallback - Force use of fallback method (for testing/recursion)
 * @returns Symmetry score from 0-100, where 100 is perfect symmetry
 * 
 * @remarks
 * Falls back to simpler method if insufficient landmarks or if IPD is too small.
 * Returns 50 (neutral) if insufficient landmarks are provided.
 */
function computeSymmetryScore(points: FaceLandmarks['landmarks'], useFallback = false): number {
  if (points.length < MIN_LANDMARKS_FOR_SCORING) return SCORE_RANGE.NEUTRAL;

  // Fallback method: use general face symmetry with available points
  if (useFallback || points.length < MIN_LANDMARKS_FOR_SYMMETRY) {
    return computeSymmetryScoreFallback(points);
  }

  // Find key facial features
  const findEyePoint = (indices: readonly number[], fallbackIndex: number) => {
    const point = findLandmarkPoint(points, indices, fallbackIndex);
    return point || points[fallbackIndex];
  };

  const leftEye = findEyePoint(
    LANDMARK_INDICES.LEFT_EYE,
    Math.floor(points.length * LANDMARK_RATIOS.LEFT_EYE_FALLBACK)
  );
  const rightEye = findEyePoint(
    LANDMARK_INDICES.RIGHT_EYE,
    Math.floor(points.length * LANDMARK_RATIOS.RIGHT_EYE_FALLBACK)
  );
  const noseTip = findLandmarkPoint(
    points,
    LANDMARK_INDICES.NOSE_TIP,
    Math.floor(points.length * LANDMARK_RATIOS.NOSE_TIP_FALLBACK)
  ) || points[Math.floor(points.length * LANDMARK_RATIOS.NOSE_TIP_FALLBACK)];

  if (!leftEye || !rightEye || !noseTip) {
    return computeSymmetryScore(points, true); // Use fallback
  }

  // Calculate interpupillary distance
  const ipd = calculateInterpupillaryDistance(leftEye, rightEye);

  if (ipd < MIN_IPD_THRESHOLD) {
    return computeSymmetryScore(points, true); // Use fallback
  }

  // Find symmetric pairs
  const symmetricPairs = findSymmetricPairs(points);

  if (symmetricPairs.length === 0) {
    return computeSymmetryScore(points, true); // Use fallback
  }

  // Calculate total asymmetry across all pairs
  let totalAsymmetry = 0;
  for (const [left, right] of symmetricPairs) {
    totalAsymmetry += calculatePairAsymmetry(left, right, noseTip, ipd);
  }

  const avgAsymmetry = totalAsymmetry / symmetricPairs.length;
  // Most faces have some asymmetry, so we want scores in 60-90 range for normal faces
  const symmetryScore = Math.max(
    SCORE_RANGE.MIN,
    SCORE_RANGE.MAX - avgAsymmetry * SYMMETRY_CONSTANTS.SYMMETRY_MULTIPLIER
  );

  return Math.round(symmetryScore);
}

/**
 * Computes skin score from landmarks.
 * 
 * @param points - Array of face landmark points
 * @returns Skin score from 0-100
 * 
 * @remarks
 * Currently stubbed - would analyze image texture, brightness uniformity,
 * and contrast in a real implementation. For now returns a placeholder value.
 * 
 * @todo Implement actual skin texture analysis using image data
 */
function computeSkinScore(points: FaceLandmarks['landmarks']): number {
  // In a real implementation, this would analyze the image texture
  // For now, return a placeholder score
  // TODO: Replace with actual skin analysis
  return PLACEHOLDER_SCORES.SKIN_DEFAULT;
}

/**
 * Computes hair score from landmarks.
 * 
 * @param points - Array of face landmark points
 * @returns Hair score from 0-100
 * 
 * @remarks
 * Currently stubbed - would analyze hairline edge density and hair volume
 * in a real implementation. For now returns a placeholder value.
 * 
 * @todo Implement actual hairline analysis using edge detection
 */
function computeHairScore(points: FaceLandmarks['landmarks']): number {
  // In a real implementation, this would analyze edge density around hairline
  // For now, return a placeholder score
  // TODO: Replace with actual hair analysis
  return PLACEHOLDER_SCORES.HAIR_DEFAULT;
}

