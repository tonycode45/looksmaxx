import { create } from 'zustand';
import type { Scan, Action, PlanItem, Badge, Setting } from './db';
import * as db from './db';
import { initDatabase } from './db';

interface AppState {
  // State
  scans: Scan[];
  currentScan: Scan | null;
  planItems: (PlanItem & { action: Action })[];
  badges: Badge[];
  hasConsented: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  isLoading: boolean;

  // Actions
  init: () => Promise<void>;
  addScan: (scan: Omit<Scan, 'id'>) => Promise<void>;
  setCurrentScan: (scan: Scan | null) => void;
  loadPlanItems: (scanId: number) => Promise<void>;
  updatePlanItemStatus: (id: number, status: 'todo' | 'done') => Promise<void>;
  loadBadges: () => Promise<void>;
  checkAndAwardBadges: () => Promise<void>;
  setConsent: (consented: boolean) => Promise<void>;
  setReduceMotion: (enabled: boolean) => Promise<void>;
  setHighContrast: (enabled: boolean) => Promise<void>;
  refreshScans: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  scans: [],
  currentScan: null,
  planItems: [],
  badges: [],
  hasConsented: false,
  reduceMotion: false,
  highContrast: false,
  isLoading: false,

  // Initialize app
  init: async () => {
    set({ isLoading: true });
    try {
      await initDatabase();

      // Load consent status
      const consented = await db.getSetting('has_consented');
      const reduceMotion = await db.getSetting('reduce_motion');
      const highContrast = await db.getSetting('high_contrast');

      // Load scans
      const scans = await db.getScans();
      const latestScan = scans[0] || null;

      // Load badges
      const badges = await db.getBadges();

      set({
        hasConsented: consented === 'true',
        reduceMotion: reduceMotion === 'true',
        highContrast: highContrast === 'true',
        scans,
        currentScan: latestScan,
        badges,
        isLoading: false,
      });

      // Load plan items for latest scan if exists
      if (latestScan) {
        await get().loadPlanItems(latestScan.id);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      // Set default values on error
      set({
        hasConsented: false,
        reduceMotion: false,
        highContrast: false,
        scans: [],
        currentScan: null,
        badges: [],
        planItems: [],
        isLoading: false,
      });
    }
  },

  // Add a new scan
  addScan: async (scanData) => {
    try {
      const scanId = await db.createScan(scanData);
      const newScan = await db.getScan(scanId);
      if (!newScan) return;

      const scans = await db.getScans();
      set({ scans, currentScan: newScan });

      // Load plan items for new scan
      await get().loadPlanItems(newScan.id);

      // Check for badges
      await get().checkAndAwardBadges();
    } catch (error) {
      console.error('Error adding scan:', error);
    }
  },

  // Set current scan
  setCurrentScan: (scan) => {
    set({ currentScan: scan });
    if (scan) {
      get().loadPlanItems(scan.id);
    }
  },

  // Load plan items for a scan
  loadPlanItems: async (scanId) => {
    try {
      const planItems = await db.getPlanItems(scanId);
      set({ planItems });
    } catch (error) {
      console.error('Error loading plan items:', error);
    }
  },

  // Update plan item status
  updatePlanItemStatus: async (id, status) => {
    try {
      await db.updatePlanItemStatus(id, status);
      const { currentScan } = get();
      if (currentScan) {
        await get().loadPlanItems(currentScan.id);
      }
      await get().checkAndAwardBadges();
    } catch (error) {
      console.error('Error updating plan item:', error);
    }
  },

  // Load badges
  loadBadges: async () => {
    try {
      const badges = await db.getBadges();
      set({ badges });
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  },

  // Check and award badges
  checkAndAwardBadges: async () => {
    try {
      const scans = await db.getScans();
      const planItems = await db.getAllPlanItems();

      // First scan badge
      if (scans.length >= 1 && !(await db.hasBadge('first_scan'))) {
        await db.createBadge({
          code: 'first_scan',
          title: 'First Scan',
          earned_at: new Date().toISOString(),
        });
      }

      // Check streaks
      const completedScans = new Set<number>();
      for (const item of planItems) {
        if (item.status === 'done') {
          completedScans.add(item.scan_id);
        }
      }

      const scanDates = scans
        .filter((s) => completedScans.has(s.id))
        .map((s) => new Date(s.taken_at))
        .sort((a, b) => b.getTime() - a.getTime());

      // Check for 7-day streak
      if (scanDates.length >= 7) {
        let streak = 1;
        for (let i = 1; i < scanDates.length; i++) {
          const diff = Math.abs(
            (scanDates[i - 1].getTime() - scanDates[i].getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diff <= 1) {
            streak++;
          } else {
            break;
          }
        }
        if (streak >= 7 && !(await db.hasBadge('week_streak'))) {
          await db.createBadge({
            code: 'week_streak',
            title: '7 Day Streak',
            earned_at: new Date().toISOString(),
          });
        }
      }

      // Reload badges
      await get().loadBadges();
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  },

  // Set consent
  setConsent: async (consented) => {
    await db.setSetting('has_consented', consented.toString());
    set({ hasConsented: consented });
  },

  // Set reduce motion
  setReduceMotion: async (enabled) => {
    await db.setSetting('reduce_motion', enabled.toString());
    set({ reduceMotion: enabled });
  },

  // Set high contrast
  setHighContrast: async (enabled) => {
    await db.setSetting('high_contrast', enabled.toString());
    set({ highContrast: enabled });
  },

  // Refresh scans
  refreshScans: async () => {
    try {
      const scans = await db.getScans();
      const latestScan = scans[0] || null;
      set({ scans, currentScan: latestScan });
      if (latestScan) {
        await get().loadPlanItems(latestScan.id);
      }
    } catch (error) {
      console.error('Error refreshing scans:', error);
    }
  },
}));

