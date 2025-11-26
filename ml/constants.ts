/**
 * Constants for ML scoring algorithms
 */

/**
 * Score range constants
 */
export const SCORE_RANGE = {
  MIN: 0,
  MAX: 100,
  NEUTRAL: 50, // Default/fallback score
} as const;

/**
 * Posture scoring constants
 */
export const POSTURE_CONSTANTS = {
  /** Ideal pitch angle in degrees (90° = head upright) */
  IDEAL_PITCH: 90,
  /** Tolerance multiplier for pitch scoring */
  PITCH_TOLERANCE_MULTIPLIER: 1.5,
  /** Roll angle multiplier for scoring */
  ROLL_MULTIPLIER: 2,
  /** Vertical alignment weight in fallback calculation */
  VERTICAL_ALIGNMENT_WEIGHT: 70,
  /** Head angle weight in fallback calculation */
  HEAD_ANGLE_WEIGHT: 30,
  /** Threshold for determining if head angle is valid */
  HEAD_ANGLE_THRESHOLD: 0.1,
  /** Center X coordinate in normalized space */
  CENTER_X: 0.5,
  /** Minimum horizontal distance threshold for angle calculation */
  MIN_HORIZONTAL_DISTANCE: 0.001,
} as const;

/**
 * Symmetry scoring constants
 */
export const SYMMETRY_CONSTANTS = {
  /** Fallback multiplier for symmetry scoring */
  FALLBACK_MULTIPLIER: 80,
  /** Main symmetry multiplier */
  SYMMETRY_MULTIPLIER: 120,
  /** Center X coordinate in normalized space */
  CENTER_X: 0.5,
  /** Default asymmetry value when no pairs found */
  DEFAULT_ASYMMETRY: 0.1,
  /** Maximum pairs to check in fallback method */
  MAX_PAIRS_TO_CHECK: 10,
} as const;

/**
 * Landmark position ratios (for fallback point selection)
 */
export const LANDMARK_RATIOS = {
  /** Ratio for nose tip fallback (middle of face) */
  NOSE_TIP_FALLBACK: 0.5,
  /** Ratio for chin fallback (lower part of face) */
  CHIN_FALLBACK: 0.8,
  /** Ratio for left eye fallback */
  LEFT_EYE_FALLBACK: 0.3,
  /** Ratio for right eye fallback */
  RIGHT_EYE_FALLBACK: 0.7,
  /** Ratio for first point fallback */
  FIRST_POINT_FALLBACK: 0.9,
  /** Ratio for left side fallback */
  LEFT_SIDE_FALLBACK: 0.2,
  /** Ratio for right side fallback */
  RIGHT_SIDE_FALLBACK: 0.8,
  /** Ratio for more left side fallback */
  MORE_LEFT_SIDE_FALLBACK: 0.3,
  /** Ratio for more right side fallback */
  MORE_RIGHT_SIDE_FALLBACK: 0.7,
} as const;

/**
 * Skin and hair scoring constants (placeholders)
 */
export const PLACEHOLDER_SCORES = {
  /** Default skin score (placeholder) */
  SKIN_DEFAULT: 75,
  /** Default hair score (placeholder) */
  HAIR_DEFAULT: 80,
} as const;

/**
 * Mathematical constants
 */
export const MATH_CONSTANTS = {
  /** Degrees per radian */
  DEGREES_PER_RADIAN: 180 / Math.PI,
  /** Minimum threshold for division operations */
  MIN_DIVISION_THRESHOLD: 0.001,
} as const;

