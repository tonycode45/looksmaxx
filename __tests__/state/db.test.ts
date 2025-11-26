import * as db from '@/state/db';
import type { Scan, Action, PlanItem, Badge } from '@/state/db';

describe('Database Operations', () => {
  beforeEach(async () => {
    // Clean up before each test
    await db.deleteAllData();
    await db.initDatabase();
  });

  describe('Scan Operations', () => {
    it('should create a scan', async () => {
      const scanData: Omit<Scan, 'id'> = {
        taken_at: new Date().toISOString(),
        score: 75,
        subs_posture: 80,
        subs_symmetry: 70,
        subs_skin: 75,
        subs_hair: 80,
        photo_uri: 'file://test.jpg',
      };

      const scanId = await db.createScan(scanData);
      expect(scanId).toBeGreaterThan(0);

      const scan = await db.getScan(scanId);
      expect(scan).toBeTruthy();
      expect(scan?.score).toBe(75);
      expect(scan?.subs_posture).toBe(80);
    });

    it('should get all scans ordered by date', async () => {
      const now = new Date().toISOString();
      const earlier = new Date(Date.now() - 1000).toISOString();

      await db.createScan({
        taken_at: now,
        score: 75,
        subs_posture: 80,
        subs_symmetry: 70,
        subs_skin: 75,
        subs_hair: 80,
        photo_uri: null,
      });

      await db.createScan({
        taken_at: earlier,
        score: 80,
        subs_posture: 85,
        subs_symmetry: 75,
        subs_skin: 80,
        subs_hair: 85,
        photo_uri: null,
      });

      const scans = await db.getScans();
      expect(scans.length).toBe(2);
      expect(scans[0].score).toBe(75); // Most recent first
      expect(scans[1].score).toBe(80);
    });

    it('should get latest scan', async () => {
      const now = new Date().toISOString();
      const earlier = new Date(Date.now() - 1000).toISOString();

      await db.createScan({
        taken_at: earlier,
        score: 70,
        subs_posture: 75,
        subs_symmetry: 65,
        subs_skin: 70,
        subs_hair: 75,
        photo_uri: null,
      });

      await db.createScan({
        taken_at: now,
        score: 80,
        subs_posture: 85,
        subs_symmetry: 75,
        subs_skin: 80,
        subs_hair: 85,
        photo_uri: null,
      });

      const latest = await db.getLatestScan();
      expect(latest).toBeTruthy();
      expect(latest?.score).toBe(80);
    });

    it('should limit scans when limit is provided', async () => {
      // Create 5 scans
      for (let i = 0; i < 5; i++) {
        await db.createScan({
          taken_at: new Date(Date.now() - i * 1000).toISOString(),
          score: 70 + i,
          subs_posture: 75,
          subs_symmetry: 65,
          subs_skin: 70,
          subs_hair: 75,
          photo_uri: null,
        });
      }

      const scans = await db.getScans(3);
      expect(scans.length).toBe(3);
    });
  });

  describe('Action Operations', () => {
    it('should create an action', async () => {
      const actionData: Omit<Action, 'id'> = {
        title: 'Test Action',
        category: 'posture',
        minutes: 10,
        tip_md: 'Test tip',
      };

      const actionId = await db.createAction(actionData);
      expect(actionId).toBeGreaterThan(0);

      const action = await db.getAction(actionId);
      expect(action).toBeTruthy();
      expect(action?.title).toBe('Test Action');
    });

    it('should get all actions', async () => {
      await db.createAction({
        title: 'Action 1',
        category: 'posture',
        minutes: 10,
        tip_md: 'Tip 1',
      });

      await db.createAction({
        title: 'Action 2',
        category: 'skin',
        minutes: 5,
        tip_md: 'Tip 2',
      });

      const actions = await db.getActions();
      expect(actions.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Plan Item Operations', () => {
    it('should create a plan item', async () => {
      const scanId = await db.createScan({
        taken_at: new Date().toISOString(),
        score: 75,
        subs_posture: 80,
        subs_symmetry: 70,
        subs_skin: 75,
        subs_hair: 80,
        photo_uri: null,
      });

      const actionId = await db.createAction({
        title: 'Test Action',
        category: 'posture',
        minutes: 10,
        tip_md: 'Test tip',
      });

      const planItemId = await db.createPlanItem({
        scan_id: scanId,
        action_id: actionId,
        status: 'todo',
      });

      expect(planItemId).toBeGreaterThan(0);

      const planItems = await db.getPlanItems(scanId);
      expect(planItems.length).toBe(1);
      expect(planItems[0].status).toBe('todo');
    });

    it('should update plan item status', async () => {
      const scanId = await db.createScan({
        taken_at: new Date().toISOString(),
        score: 75,
        subs_posture: 80,
        subs_symmetry: 70,
        subs_skin: 75,
        subs_hair: 80,
        photo_uri: null,
      });

      const actionId = await db.createAction({
        title: 'Test Action',
        category: 'posture',
        minutes: 10,
        tip_md: 'Test tip',
      });

      const planItemId = await db.createPlanItem({
        scan_id: scanId,
        action_id: actionId,
        status: 'todo',
      });

      await db.updatePlanItemStatus(planItemId, 'done');

      const planItems = await db.getPlanItems(scanId);
      expect(planItems[0].status).toBe('done');
    });
  });

  describe('Badge Operations', () => {
    it('should create a badge', async () => {
      const badgeId = await db.createBadge({
        code: 'test_badge',
        title: 'Test Badge',
        earned_at: new Date().toISOString(),
      });

      expect(badgeId).toBeGreaterThan(0);

      const badges = await db.getBadges();
      expect(badges.length).toBe(1);
      expect(badges[0].code).toBe('test_badge');
    });

    it('should check if badge exists', async () => {
      await db.createBadge({
        code: 'test_badge',
        title: 'Test Badge',
        earned_at: new Date().toISOString(),
      });

      const exists = await db.hasBadge('test_badge');
      expect(exists).toBe(true);

      const notExists = await db.hasBadge('nonexistent');
      expect(notExists).toBe(false);
    });
  });

  describe('Settings Operations', () => {
    it('should set and get a setting', async () => {
      await db.setSetting('test_key', 'test_value');

      const value = await db.getSetting('test_key');
      expect(value).toBe('test_value');
    });

    it('should return null for non-existent setting', async () => {
      const value = await db.getSetting('nonexistent');
      expect(value).toBeNull();
    });
  });
});

