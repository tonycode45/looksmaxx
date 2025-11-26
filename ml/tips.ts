import type { ScoreResult } from './scoring';
import type { Action } from '@/state/db';
import { strings } from '@/config/strings';

/**
 * Score thresholds for action categorization
 */
const SCORE_THRESHOLDS = {
  LOW: 60,
  MEDIUM: 80,
} as const;

/**
 * Maximum number of actions to generate
 */
const MAX_ACTIONS = 3;

/**
 * Generates up to 3 prioritized actions based on score results.
 * Actions are prioritized by lowest subscores first.
 * 
 * @param scoreResult - Score result containing overall score and subscores
 * @returns Array of actions (without IDs) prioritized by lowest scores
 * 
 * @example
 * ```typescript
 * const actions = generateActions(scoreResult);
 * // Returns actions for lowest scoring categories
 * ```
 */
export function generateActions(scoreResult: ScoreResult): Omit<Action, 'id'>[] {
  const { subscores } = scoreResult;
  const actions: Omit<Action, 'id'>[] = [];

  // Find the lowest subscore
  const subscoreEntries = Object.entries(subscores) as [keyof typeof subscores, number][];
  subscoreEntries.sort(([, a], [, b]) => a - b);

  // Generate action for lowest subscore
  const [lowestCategory, lowestScore] = subscoreEntries[0];
  actions.push(generateActionForCategory(lowestCategory, lowestScore));

  // Generate action for second lowest if different
  if (subscoreEntries.length > 1) {
    const [secondCategory, secondScore] = subscoreEntries[1];
    if (secondCategory !== lowestCategory) {
      actions.push(generateActionForCategory(secondCategory, secondScore));
    }
  }

  // Fill remaining slots with general tips
  while (actions.length < MAX_ACTIONS) {
    const remainingCategories = subscoreEntries
      .filter(([cat]) => !actions.some((a) => a.category === cat))
      .map(([cat, score]) => [cat, score] as [keyof typeof subscores, number]);

    if (remainingCategories.length > 0) {
      const [category, score] = remainingCategories[0];
      actions.push(generateActionForCategory(category, score));
    } else {
      // Fallback to general tips
      actions.push(generateGeneralAction());
    }
  }

  return actions.slice(0, MAX_ACTIONS);
}

/**
 * Generates an action for a specific category based on the score.
 * 
 * @param category - Category of the subscore (posture, symmetry, skin, hair)
 * @param score - Score value (0-100) for the category
 * @returns Action object without ID
 * 
 * @remarks
 * Actions are customized based on score thresholds:
 * - Low (< 60): More intensive actions with longer duration
 * - Medium/High (>= 60): Maintenance actions with shorter duration
 */
function generateActionForCategory(
  category: keyof ScoreResult['subscores'],
  score: number
): Omit<Action, 'id'> {
  const isLow = score < SCORE_THRESHOLDS.LOW;
  const isMedium = score >= SCORE_THRESHOLDS.LOW && score < SCORE_THRESHOLDS.MEDIUM;

  switch (category) {
    case 'posture':
      return {
        title: isLow ? 'Improve Posture' : 'Maintain Posture',
        category: 'posture',
        minutes: isLow ? 10 : 5,
        tip_md: isLow
          ? 'Stand tall: align your ears over your shoulders. Do 5×10s wall slides to strengthen your upper back.'
          : 'Keep ears over shoulders; 5×10s wall slides.',
      };

    case 'symmetry':
      return {
        title: isLow ? 'Balance Chewing' : 'Maintain Symmetry',
        category: 'symmetry',
        minutes: 5,
        tip_md: isLow
          ? 'Chew evenly today; alternate sides. This helps maintain facial symmetry over time.'
          : 'Chew evenly today; alternate sides.',
      };

    case 'skin':
      return {
        title: isLow ? 'Protect Your Skin' : 'Maintain Skin Care',
        category: 'skin',
        minutes: 2,
        tip_md: isLow
          ? 'SPF 30 before you head out; reapply in 2h. Hydrate: drink 600ml water now.'
          : 'SPF 30 before you head out; reapply in 2h.',
      };

    case 'hair':
      return {
        title: isLow ? 'Hair Care Routine' : 'Maintain Hair Volume',
        category: 'hair',
        minutes: isLow ? 15 : 5,
        tip_md: isLow
          ? 'Use volumizing products and proper styling techniques to enhance hair appearance.'
          : 'Maintain your current hair care routine.',
      };

    default:
      return generateGeneralAction();
  }
}

/**
 * Generates a general fallback action when no specific category actions are available.
 * 
 * @returns General action object without ID
 * 
 * @remarks
 * Used as a fallback when all categories have been covered or when
 * no specific improvements are needed.
 */
function generateGeneralAction(): Omit<Action, 'id'> {
  return {
    title: 'Stay Hydrated',
    category: 'general',
    minutes: 1,
    tip_md: 'Drink 600ml water now to stay hydrated and support overall health.',
  };
}

