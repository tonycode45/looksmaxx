import { generateActions } from '@/ml/tips';
import type { ScoreResult } from '@/ml/scoring';

describe('generateActions', () => {
  it('should generate 3 actions', () => {
    const scoreResult: ScoreResult = {
      score: 75,
      subscores: {
        posture: 80,
        symmetry: 70,
        skin: 75,
        hair: 80,
      },
    };

    const actions = generateActions(scoreResult);
    expect(actions.length).toBe(3);
  });

  it('should prioritize lowest scoring categories', () => {
    const scoreResult: ScoreResult = {
      score: 60,
      subscores: {
        posture: 50, // Lowest
        symmetry: 60,
        skin: 70,
        hair: 80,
      },
    };

    const actions = generateActions(scoreResult);
    expect(actions[0].category).toBe('posture');
    expect(actions[1].category).toBe('symmetry');
  });

  it('should generate actions for all categories when scores are equal', () => {
    const scoreResult: ScoreResult = {
      score: 75,
      subscores: {
        posture: 75,
        symmetry: 75,
        skin: 75,
        hair: 75,
      },
    };

    const actions = generateActions(scoreResult);
    expect(actions.length).toBe(3);
    // Should include at least posture and symmetry
    const categories = actions.map(a => a.category);
    expect(categories).toContain('posture');
  });

  it('should generate low-intensity actions for high scores', () => {
    const scoreResult: ScoreResult = {
      score: 85,
      subscores: {
        posture: 85,
        symmetry: 85,
        skin: 85,
        hair: 85,
      },
    };

    const actions = generateActions(scoreResult);
    actions.forEach(action => {
      // High scores should have shorter durations (maintenance actions)
      expect(action.minutes).toBeLessThanOrEqual(10);
    });
  });

  it('should generate high-intensity actions for low scores', () => {
    const scoreResult: ScoreResult = {
      score: 50,
      subscores: {
        posture: 40, // Low score
        symmetry: 50,
        skin: 60,
        hair: 70,
      },
    };

    const actions = generateActions(scoreResult);
    const postureAction = actions.find(a => a.category === 'posture');
    expect(postureAction).toBeDefined();
    if (postureAction) {
      expect(postureAction.minutes).toBeGreaterThanOrEqual(10);
      expect(postureAction.title).toContain('Improve');
    }
  });

  it('should include tip_md for all actions', () => {
    const scoreResult: ScoreResult = {
      score: 75,
      subscores: {
        posture: 70,
        symmetry: 70,
        skin: 75,
        hair: 80,
      },
    };

    const actions = generateActions(scoreResult);
    actions.forEach(action => {
      expect(action).toHaveProperty('tip_md');
      expect(typeof action.tip_md).toBe('string');
      expect(action.tip_md.length).toBeGreaterThan(0);
    });
  });

  it('should handle edge case with very low scores', () => {
    const scoreResult: ScoreResult = {
      score: 30,
      subscores: {
        posture: 20,
        symmetry: 25,
        skin: 30,
        hair: 35,
      },
    };

    const actions = generateActions(scoreResult);
    expect(actions.length).toBe(3);
    // All actions should be improvement-focused
    actions.forEach(action => {
      expect(action.minutes).toBeGreaterThan(0);
    });
  });
});
