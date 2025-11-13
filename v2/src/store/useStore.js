import { create } from 'zustand';
import { db } from './db';
import { prefsDefault } from './schema';
import { hashPassword } from '../lib/auth';

export const useStore = create((set, get) => ({
  ready: false,
  initializing: false,
  user: null,
  authError: null,
  scans: [],
  prefs: { ...prefsDefault },
  stats: { streak: 0, weeklyAverage: 0, totalScans: 0 },
  resetAuthError: () => set({ authError: null }),

  init: async () => {
    if (get().initializing || get().ready) {
      return;
    }
    set({ initializing: true });
    try {
      const meta = await db.meta.get('prefs');
      const prefs = { ...prefsDefault, ...(meta?.value || {}) };
      if (!meta) {
        await db.meta.put({ key: 'prefs', value: prefs });
      }

      let user = null;
      if (prefs.activeUserId != null) {
        user = await db.users.get(prefs.activeUserId);
        if (!user) {
          prefs.activeUserId = null;
          await db.meta.put({ key: 'prefs', value: prefs });
        }
      }

      set({ prefs, user, authError: null });

      if (user) {
        await get().loadUserData(user.id);
      } else {
        set({
          scans: [],
          stats: { streak: 0, weeklyAverage: 0, totalScans: 0 },
        });
      }
    } catch (error) {
      console.error('Error initializing store:', error);
      set({
        user: null,
        scans: [],
        prefs: { ...prefsDefault },
        stats: { streak: 0, weeklyAverage: 0, totalScans: 0 },
        authError: 'Failed to initialize app data.',
      });
    } finally {
      set({ ready: true, initializing: false });
    }
  },

  loadUserData: async (userId) => {
    try {
      const scans = await db.scans.where('userId').equals(userId).sortBy('createdAt');
      const ordered = scans.reverse();
      set({ scans: ordered });
      get().recalc();
    } catch (error) {
      console.error('Error loading user data:', error);
      set({
        scans: [],
        stats: { streak: 0, weeklyAverage: 0, totalScans: 0 },
      });
    }
  },

  signUp: async ({ email, password }) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const passwordHash = await hashPassword(password);
      const existing = await db.users.where('email').equals(normalizedEmail).first();

      if (existing) {
        if (existing.passwordHash === passwordHash) {
          const prefs = { ...get().prefs, activeUserId: existing.id };
          await db.meta.put({ key: 'prefs', value: prefs });
          set({ user: existing, prefs, authError: null });
          await get().loadUserData(existing.id);
        } else {
          set({ authError: 'Account already exists.' });
        }
        return;
      }

      const userId = await db.users.add({
        email: normalizedEmail,
        passwordHash,
        createdAt: Date.now(),
      });

      try {
        await db.scans.where('userId').equals(null).modify((scan) => {
          scan.userId = userId;
        });
      } catch (e) {
        console.warn('Unable to adopt unassigned scans', e);
      }

      const prefs = { ...get().prefs, activeUserId: userId };
      await db.meta.put({ key: 'prefs', value: prefs });
      const user = await db.users.get(userId);

      set({ user, prefs, authError: null });
      await get().loadUserData(userId);
    } catch (error) {
      console.error('Error signing up:', error);
      set({ authError: 'Failed to create account.' });
    }
  },

  logIn: async ({ email, password }) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const user = await db.users.where('email').equals(normalizedEmail).first();
      if (!user) {
        set({ authError: 'Account not found.' });
        return;
      }

      const passwordHash = await hashPassword(password);
      if (user.passwordHash !== passwordHash) {
        set({ authError: 'Incorrect password.' });
        return;
      }

      const prefs = { ...get().prefs, activeUserId: user.id };
      await db.meta.put({ key: 'prefs', value: prefs });

      set({ user, prefs, authError: null });
      await get().loadUserData(user.id);
    } catch (error) {
      console.error('Error logging in:', error);
      set({ authError: 'Unable to log in.' });
    }
  },

  logOut: async () => {
    try {
      const prefs = { ...get().prefs, activeUserId: null };
      await db.meta.put({ key: 'prefs', value: prefs });
      set({
        user: null,
        prefs,
        scans: [],
        stats: { streak: 0, weeklyAverage: 0, totalScans: 0 },
        authError: null,
      });
    } catch (error) {
      console.error('Error logging out:', error);
      set({ authError: 'Unable to log out.' });
    }
  },

  addScan: async (scan) => {
    const userId = get().user?.id;
    if (!userId) {
      throw new Error('Not authenticated');
    }
    try {
      await db.scans.add({ ...scan, userId });
      await get().loadUserData(userId);
    } catch (error) {
      console.error('Error adding scan:', error);
      throw error;
    }
  },

  setPrefs: async (next) => {
    const updated = { ...get().prefs, ...next };
    set({ prefs: updated });
    await db.meta.put({ key: 'prefs', value: updated });
  },

  clearAllData: async () => {
    try {
      await db.delete();
      set({
        user: null,
        prefs: { ...prefsDefault },
        scans: [],
        stats: { streak: 0, weeklyAverage: 0, totalScans: 0 },
      });
      location.reload();
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  },

  recalc: () => {
    const scans = get().scans;
    const totalScans = scans.length;
    const streak = calcStreak(scans.map((s) => s.createdAt));
    const weeklyAverage = calcWeeklyAvg(scans);
    set({ stats: { streak, weeklyAverage, totalScans } });
  },
}));

function calcStreak(tsList) {
  if (!tsList.length) return 0;
  tsList = [...tsList].sort((a, b) => b - a);
  let streak = 0;
  let cur = new Date();
  cur.setHours(0, 0, 0, 0);

  for (let t of tsList) {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === cur.getTime()) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else if (d.getTime() === cur.getTime() - 86400000) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else break;
  }
  return streak;
}

function avg(arr) {
  return Math.round(arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length));
}

function calcWeeklyAvg(scans) {
  const weekAgo = Date.now() - 7 * 86400000;
  const recent = scans.filter((s) => s.createdAt >= weekAgo);
  return avg(recent.map((s) => s.scores.overall || 0));
}
