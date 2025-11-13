import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: number;
  created_at: string;
}

export interface Scan {
  id: number;
  taken_at: string;
  score: number;
  subs_posture: number;
  subs_symmetry: number;
  subs_skin: number;
  subs_hair: number;
  photo_uri: string | null;
}

export interface Action {
  id: number;
  title: string;
  category: string;
  minutes: number;
  tip_md: string;
}

export interface PlanItem {
  id: number;
  scan_id: number;
  action_id: number;
  status: 'todo' | 'done';
}

export interface Badge {
  id: number;
  code: string;
  title: string;
  earned_at: string;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
}

let db: SQLite.SQLiteDatabase | null = null;
const isWeb = Platform.OS === 'web';

// Web storage using AsyncStorage
const webStorage = {
  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
  async getAllKeys(): Promise<string[]> {
    return await AsyncStorage.getAllKeys();
  },
};

// Web database emulation
let webData: {
  users: User[];
  scans: Scan[];
  actions: Action[];
  plan_items: PlanItem[];
  badges: Badge[];
  settings: Setting[];
} = {
  users: [],
  scans: [],
  actions: [],
  plan_items: [],
  badges: [],
  settings: [],
};

async function initWebDatabase() {
  try {
    const stored = await webStorage.getItem('mirrorme_db');
    if (stored) {
      webData = JSON.parse(stored);
    }
    // Initialize user if not exists
    if (webData.users.length === 0) {
      webData.users.push({
        id: 1,
        created_at: new Date().toISOString(),
      });
      await saveWebData();
    }
  } catch (error) {
    console.error('Error initializing web database:', error);
    webData = {
      users: [{ id: 1, created_at: new Date().toISOString() }],
      scans: [],
      actions: [],
      plan_items: [],
      badges: [],
      settings: [],
    };
    await saveWebData();
  }
}

async function saveWebData() {
  try {
    await webStorage.setItem('mirrorme_db', JSON.stringify(webData));
  } catch (error) {
    console.error('Error saving web database:', error);
  }
}

export async function initDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (isWeb) {
    await initWebDatabase();
    return null; // Return null for web, we'll use webData directly
  }

  if (db) return db;

  try {
    db = await SQLite.openDatabaseAsync('mirrorme.db');
  } catch (error) {
    console.error('Error opening database:', error);
    // Fallback: try opening with a different name or in-memory
    try {
      db = await SQLite.openDatabaseAsync(':memory:');
    } catch (fallbackError) {
      console.error('Error opening fallback database:', fallbackError);
      throw fallbackError;
    }
  }

  // Create tables (only for native)
  try {
    if (!db) throw new Error('Database not initialized');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taken_at TEXT NOT NULL DEFAULT (datetime('now')),
        score INTEGER NOT NULL,
        subs_posture INTEGER NOT NULL,
        subs_symmetry INTEGER NOT NULL,
        subs_skin INTEGER NOT NULL,
        subs_hair INTEGER NOT NULL,
        photo_uri TEXT
      );

      CREATE TABLE IF NOT EXISTS actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        minutes INTEGER NOT NULL,
        tip_md TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS plan_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_id INTEGER NOT NULL,
        action_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'todo',
        FOREIGN KEY (scan_id) REFERENCES scans(id),
        FOREIGN KEY (action_id) REFERENCES actions(id)
      );

      CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        earned_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_scans_taken_at ON scans(taken_at);
      CREATE INDEX IF NOT EXISTS idx_plan_items_scan_id ON plan_items(scan_id);
    `);
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }

  // Initialize user if not exists
  if (db) {
    const userResult = await db.getFirstAsync<User>('SELECT * FROM users LIMIT 1');
    if (!userResult) {
      await db.runAsync('INSERT INTO users (created_at) VALUES (datetime("now"))');
    }
  }

  return db;
}

// User CRUD
export async function getUser(): Promise<User | null> {
  if (isWeb) {
    return webData.users[0] || null;
  }
  const database = await initDatabase();
  if (!database) return null;
  return await database.getFirstAsync<User>('SELECT * FROM users LIMIT 1');
}

// Scan CRUD
export async function createScan(scan: Omit<Scan, 'id'>): Promise<number> {
  if (isWeb) {
    const id = webData.scans.length > 0 ? Math.max(...webData.scans.map(s => s.id)) + 1 : 1;
    webData.scans.push({ ...scan, id });
    await saveWebData();
    return id;
  }
  const database = await initDatabase();
  if (!database) throw new Error('Database not initialized');
  const result = await database.runAsync(
    `INSERT INTO scans (taken_at, score, subs_posture, subs_symmetry, subs_skin, subs_hair, photo_uri)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      scan.taken_at,
      scan.score,
      scan.subs_posture,
      scan.subs_symmetry,
      scan.subs_skin,
      scan.subs_hair,
      scan.photo_uri || null,
    ]
  );
  return result.lastInsertRowId;
}

export async function getScans(limit?: number): Promise<Scan[]> {
  if (isWeb) {
    const scans = [...webData.scans].sort((a, b) => 
      new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime()
    );
    return limit ? scans.slice(0, limit) : scans;
  }
  const database = await initDatabase();
  if (!database) return [];
  const query = limit
    ? `SELECT * FROM scans ORDER BY taken_at DESC LIMIT ?`
    : `SELECT * FROM scans ORDER BY taken_at DESC`;
  const params = limit ? [limit] : [];
  return await database.getAllAsync<Scan>(query, params);
}

export async function getScan(id: number): Promise<Scan | null> {
  if (isWeb) {
    return webData.scans.find(s => s.id === id) || null;
  }
  const database = await initDatabase();
  if (!database) return null;
  return await database.getFirstAsync<Scan>('SELECT * FROM scans WHERE id = ?', [id]);
}

export async function getLatestScan(): Promise<Scan | null> {
  if (isWeb) {
    const scans = [...webData.scans].sort((a, b) => 
      new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime()
    );
    return scans[0] || null;
  }
  const database = await initDatabase();
  if (!database) return null;
  return await database.getFirstAsync<Scan>('SELECT * FROM scans ORDER BY taken_at DESC LIMIT 1');
}

// Action CRUD
export async function createAction(action: Omit<Action, 'id'>): Promise<number> {
  if (isWeb) {
    const id = webData.actions.length > 0 ? Math.max(...webData.actions.map(a => a.id)) + 1 : 1;
    webData.actions.push({ ...action, id });
    await saveWebData();
    return id;
  }
  const database = await initDatabase();
  if (!database) throw new Error('Database not initialized');
  const result = await database.runAsync(
    `INSERT INTO actions (title, category, minutes, tip_md) VALUES (?, ?, ?, ?)`,
    [action.title, action.category, action.minutes, action.tip_md]
  );
  return result.lastInsertRowId;
}

export async function getActions(): Promise<Action[]> {
  if (isWeb) {
    return webData.actions;
  }
  const database = await initDatabase();
  if (!database) return [];
  return await database.getAllAsync<Action>('SELECT * FROM actions');
}

export async function getAction(id: number): Promise<Action | null> {
  if (isWeb) {
    return webData.actions.find(a => a.id === id) || null;
  }
  const database = await initDatabase();
  if (!database) return null;
  return await database.getFirstAsync<Action>('SELECT * FROM actions WHERE id = ?', [id]);
}

// Plan Item CRUD
export async function createPlanItem(planItem: Omit<PlanItem, 'id'>): Promise<number> {
  if (isWeb) {
    const id = webData.plan_items.length > 0 ? Math.max(...webData.plan_items.map(p => p.id)) + 1 : 1;
    webData.plan_items.push({ ...planItem, id });
    await saveWebData();
    return id;
  }
  const database = await initDatabase();
  if (!database) throw new Error('Database not initialized');
  const result = await database.runAsync(
    `INSERT INTO plan_items (scan_id, action_id, status) VALUES (?, ?, ?)`,
    [planItem.scan_id, planItem.action_id, planItem.status]
  );
  return result.lastInsertRowId;
}

export async function getPlanItems(scanId: number): Promise<(PlanItem & { action: Action })[]> {
  if (isWeb) {
    const planItems = webData.plan_items
      .filter(pi => pi.scan_id === scanId)
      .map(pi => ({
        ...pi,
        action: webData.actions.find(a => a.id === pi.action_id)!,
      }))
      .filter(item => item.action);
    return planItems as (PlanItem & { action: Action })[];
  }
  const database = await initDatabase();
  if (!database) return [];
  return await database.getAllAsync<PlanItem & { action: Action }>(
    `SELECT pi.*, a.* FROM plan_items pi
     JOIN actions a ON pi.action_id = a.id
     WHERE pi.scan_id = ?
     ORDER BY pi.id`,
    [scanId]
  );
}

export async function updatePlanItemStatus(id: number, status: 'todo' | 'done'): Promise<void> {
  if (isWeb) {
    const item = webData.plan_items.find(p => p.id === id);
    if (item) {
      item.status = status;
      await saveWebData();
    }
    return;
  }
  const database = await initDatabase();
  if (!database) throw new Error('Database not initialized');
  await database.runAsync('UPDATE plan_items SET status = ? WHERE id = ?', [status, id]);
}

// Badge CRUD
export async function createBadge(badge: Omit<Badge, 'id'>): Promise<number> {
  if (isWeb) {
    const existing = webData.badges.find(b => b.code === badge.code);
    if (existing) return existing.id;
    const id = webData.badges.length > 0 ? Math.max(...webData.badges.map(b => b.id)) + 1 : 1;
    webData.badges.push({ ...badge, id });
    await saveWebData();
    return id;
  }
  const database = await initDatabase();
  if (!database) throw new Error('Database not initialized');
  const result = await database.runAsync(
    `INSERT OR IGNORE INTO badges (code, title, earned_at) VALUES (?, ?, ?)`,
    [badge.code, badge.title, badge.earned_at]
  );
  return result.lastInsertRowId;
}

export async function getBadges(): Promise<Badge[]> {
  if (isWeb) {
    return [...webData.badges].sort((a, b) => 
      new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime()
    );
  }
  const database = await initDatabase();
  if (!database) return [];
  return await database.getAllAsync<Badge>('SELECT * FROM badges ORDER BY earned_at DESC');
}

export async function hasBadge(code: string): Promise<boolean> {
  if (isWeb) {
    return webData.badges.some(b => b.code === code);
  }
  const database = await initDatabase();
  if (!database) return false;
  const badge = await database.getFirstAsync<Badge>('SELECT * FROM badges WHERE code = ?', [code]);
  return !!badge;
}

// Settings CRUD
export async function getSetting(key: string): Promise<string | null> {
  if (isWeb) {
    const setting = webData.settings.find(s => s.key === key);
    return setting?.value || null;
  }
  const database = await initDatabase();
  if (!database) return null;
  const setting = await database.getFirstAsync<Setting>('SELECT * FROM settings WHERE key = ?', [key]);
  return setting?.value || null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  if (isWeb) {
    const existingIndex = webData.settings.findIndex(s => s.key === key);
    if (existingIndex >= 0) {
      webData.settings[existingIndex].value = value;
    } else {
      const id = webData.settings.length > 0 ? Math.max(...webData.settings.map(s => s.id)) + 1 : 1;
      webData.settings.push({ id, key, value });
    }
    await saveWebData();
    return;
  }
  const database = await initDatabase();
  if (!database) throw new Error('Database not initialized');
  await database.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    [key, value]
  );
}

// Data export
export async function exportAllData(): Promise<{
  users: User[];
  scans: Scan[];
  actions: Action[];
  plan_items: PlanItem[];
  badges: Badge[];
  settings: Setting[];
}> {
  if (isWeb) {
    return { ...webData };
  }
  const database = await initDatabase();
  if (!database) {
    return {
      users: [],
      scans: [],
      actions: [],
      plan_items: [],
      badges: [],
      settings: [],
    };
  }
  return {
    users: await database.getAllAsync<User>('SELECT * FROM users'),
    scans: await database.getAllAsync<Scan>('SELECT * FROM scans'),
    actions: await database.getAllAsync<Action>('SELECT * FROM actions'),
    plan_items: await database.getAllAsync<PlanItem>('SELECT * FROM plan_items'),
    badges: await database.getAllAsync<Badge>('SELECT * FROM badges'),
    settings: await database.getAllAsync<Setting>('SELECT * FROM settings'),
  };
}

// Get all plan items
export async function getAllPlanItems(): Promise<PlanItem[]> {
  if (isWeb) {
    return [...webData.plan_items].sort((a, b) => {
      if (a.scan_id !== b.scan_id) return a.scan_id - b.scan_id;
      return a.id - b.id;
    });
  }
  const database = await initDatabase();
  if (!database) return [];
  return await database.getAllAsync<PlanItem>('SELECT * FROM plan_items ORDER BY scan_id, id');
}

// Delete all data
export async function deleteAllData(): Promise<void> {
  if (isWeb) {
    webData = {
      users: [{ id: 1, created_at: new Date().toISOString() }],
      scans: [],
      actions: [],
      plan_items: [],
      badges: [],
      settings: [],
    };
    await saveWebData();
    return;
  }
  const database = await initDatabase();
  if (!database) throw new Error('Database not initialized');
  await database.execAsync(`
    DELETE FROM plan_items;
    DELETE FROM badges;
    DELETE FROM scans;
    DELETE FROM actions;
    DELETE FROM settings;
  `);
}

