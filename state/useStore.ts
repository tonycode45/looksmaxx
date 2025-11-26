import { create } from 'zustand';
import type { Scan, Action, PlanItem, Badge, Setting } from './db';
import * as db from './db';
import { initDatabase } from './db';

/**
 * Application state interface for Zustand store.
 * Manages scans, plan items, badges, and user preferences.
 */
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
  isSavingScan: boolean;
  isUpdatingPlanItem: boolean;
  isCheckingBadges: boolean;

  // Actions
  init: () => Promise<void>;
  addScan: (scan: Omit<Scan, 'id'>) => Promise<Scan | null>;
  setCurrentScan: (scan: Scan | null) => void;
  loadPlanItems: (scanId: number) => Promise<void>;
  updatePlanItemStatus: (id: number, status: 'todo' | 'done') => Promise<void>;
  loadBadges: () => Promise<void>;
  checkAndAwardBadges: () => Promise<void>;
  setConsent: (consented: boolean) => Promise<void>;
  setReduceMotion: (enabled: boolean) => Promise<void>;
  setHighContrast: (enabled: boolean) => Promise<void>;
  refreshScans: () => Promise<void>;
  resetAfterDelete: () => void;
}

/**
 * Main application store using Zustand.
 * Provides state management for scans, plan items, badges, and settings.
 * 
 * @example
 * ```typescript
 * const { scans, addScan, init } = useStore();
 * await init();
 * await addScan(scanData);
 * ```
 */
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
  isSavingScan: false,
  isUpdatingPlanItem: false,
  isCheckingBadges: false,

  /**
   * Initializes the application by loading database and user preferences.
   * Should be called once when the app starts.
   * 
   * @throws Logs error to console if initialization fails, but sets safe defaults
   */
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

  /**
   * Adds a new scan to the database and updates the store.
   * Automatically loads plan items and checks for badge eligibility.
   * 
   * @param scanData - Scan data without ID (ID will be generated)
   * @returns Created scan or null if creation failed
   * @throws Logs error to console if scan creation fails
   */
  addScan: async (scanData) => {
    set({ isSavingScan: true });
    try {
      const scanId = await db.createScan(scanData);
      const newScan = await db.getScan(scanId);
      if (!newScan) {
        set({ isSavingScan: false });
        return null;
      }

      // Optimize: Only reload scans list, don't reload all data
      const scans = await db.getScans();
      set({ scans, currentScan: newScan, isSavingScan: false });

      // Load plan items for new scan
      await get().loadPlanItems(newScan.id);

      // Check for badges
      await get().checkAndAwardBadges();

      return newScan;
    } catch (error) {
      console.error('Error adding scan:', error);
      set({ isSavingScan: false });
      return null;
    }
  },

  /**
   * Sets the currently active scan and loads its plan items.
   * 
   * @param scan - Scan to set as current, or null to clear current scan
   */
  setCurrentScan: (scan) => {
    set({ currentScan: scan });
    if (scan) {
      get().loadPlanItems(scan.id);
    }
  },

  /**
   * Loads plan items for a specific scan.
   * 
   * @param scanId - ID of the scan to load plan items for
   * @throws Logs error to console if loading fails
   */
  loadPlanItems: async (scanId) => {
    try {
      const planItems = await db.getPlanItems(scanId);
      set({ planItems });
    } catch (error) {
      console.error('Error loading plan items:', error);
    }
  },

  /**
   * Updates the status of a plan item (todo/done).
   * Automatically reloads plan items and checks for badges.
   * 
   * @param id - ID of the plan item to update
   * @param status - New status ('todo' or 'done')
   * @throws Logs error to console if update fails
   */
  updatePlanItemStatus: async (id, status) => {
    set({ isUpdatingPlanItem: true });
    try {
      await db.updatePlanItemStatus(id, status);
      const { currentScan } = get();
      if (currentScan) {
        await get().loadPlanItems(currentScan.id);
      }
      set({ isUpdatingPlanItem: false });
      await get().checkAndAwardBadges();
    } catch (error) {
      console.error('Error updating plan item:', error);
      set({ isUpdatingPlanItem: false });
    }
  },

  /**
   * Loads all badges from the database.
   * 
   * @throws Logs error to console if loading fails
   */
  loadBadges: async () => {
    try {
      const badges = await db.getBadges();
      set({ badges });
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  },

  /**
   * Checks badge eligibility and awards badges if criteria are met.
   * Currently checks for:
   * - First scan badge
   * - 7-day streak badge
   * 
   * @throws Logs error to console if badge checking fails
   */
  checkAndAwardBadges: async () => {
    set({ isCheckingBadges: true });
    try {
      // Optimize: Only get scans count and relevant plan items
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
      set({ isCheckingBadges: false });
    } catch (error) {
      console.error('Error checking badges:', error);
      set({ isCheckingBadges: false });
    }
  },

  /**
   * Sets user consent status and persists to database.
   * 
   * @param consented - Whether user has consented
   */
  setConsent: async (consented) => {
    await db.setSetting('has_consented', consented.toString());
    set({ hasConsented: consented });
  },

  /**
   * Sets reduce motion preference for accessibility.
   * 
   * @param enabled - Whether to reduce motion animations
   */
  setReduceMotion: async (enabled) => {
    await db.setSetting('reduce_motion', enabled.toString());
    set({ reduceMotion: enabled });
  },

  /**
   * Sets high contrast preference for accessibility.
   * 
   * @param enabled - Whether to enable high contrast mode
   */
  setHighContrast: async (enabled) => {
    await db.setSetting('high_contrast', enabled.toString());
    set({ highContrast: enabled });
  },

  /**
   * Refreshes the scans list from the database.
   * Updates current scan and loads plan items if a scan exists.
   * 
   * @throws Logs error to console if refresh fails
   */
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

	  /**
	   * Resets local state after deleting all data so UI matches the cleared DB.
	   */
	  resetAfterDelete: () => {
	    set({
	      scans: [],
	      currentScan: null,
	      planItems: [],
	      badges: [],
	      hasConsented: false,
	      reduceMotion: false,
	      highContrast: false,
	    });
	  },
	}));
