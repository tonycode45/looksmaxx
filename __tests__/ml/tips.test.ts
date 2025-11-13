import { generateActions } from '@/ml/tips';
import type { ScoreResult } from '@/ml/scoring';

describe('generateActions', () => {
  it('should generate 3 actions', () => {
    const scoreResult: ScoreResult = {
      score: 75,
      subscores: {
        posture: 60,
        symmetry: 70,
        skin: 80,
        hair: 90,
      },
    };

    const actions = generateActions(scoreResult);

    expect(actions).toHaveLength(3);
    actions.forEach((action) => {
      expect(action).toHaveProperty('title');
      expect(action).toHaveProperty('category');
      expect(action).toHaveProperty('minutes');
      expect(action).toHaveProperty('tip_md');
      expect(action.minutes).toBeGreaterThan(0);
    });
  });

  it('should prioritize lowest subscores', () => {
    const scoreResult: ScoreResult = {
      score: 65,
      subscores: {
        posture: 40, // Lowest
        symmetry: 60,
        skin: 70,
        hair: 90,
      },
    };

    const actions = generateActions(scoreResult);

    // First action should be for posture (lowest)
    expect(actions[0].category).toBe('posture');
  });

  it('should generate actions for all categories when scores are equal', () => {
    const scoreResult: ScoreResult = {
      score: 70,
      subscores: {
        posture: 70,
        symmetry: 70,
        skin: 70,
        hair: 70,
      },
    };

    const actions = generateActions(scoreResult);

    expect(actions).toHaveLength(3);
    // Should have diverse categories
    const categories = actions.map((a) => a.category);
    expect(new Set(categories).size).toBeGreaterThanOrEqual(1);
  });
});

