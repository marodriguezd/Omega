/**
 * Omega Wim Hof Method Unified Offline-First Store & Engine
 * Manages reactive local persistence, 20-day cold challenge, push-up retention test,
 * ice bath logging, hexagonal badges, and JSON backup portability.
 */

export interface BreathingSessionRecord {
  id: string;
  date: number;
  rounds: number;
  retentionTimes: number[];
  totalRetentionTime: number;
  breathsPerRound?: number;
  pace?: string;
  sensations?: string[];
}

export interface ColdSessionRecord {
  id: string;
  date: number;
  type: 'free_shower' | 'contrast' | 'ice_bath' | 'challenge';
  totalColdTime: number;
  totalWarmTime?: number;
  rounds?: number;
  waterTemp?: number;
  tempUnit?: 'C' | 'F';
  challengeDay?: number;
  notes?: string;
  sensations?: string[];
}

export interface PushUpRecord {
  id: string;
  date: number;
  pushUps: number;
  retentionSeconds: number;
}

export interface ChallengeDay {
  day: number;
  targetSec: number;
  completed: boolean;
  completedAt?: number;
  actualSec?: number;
}

export interface BadgeDefinition {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
  category: 'breathing' | 'cold' | 'streak' | 'challenge';
  unlocked: boolean;
  unlockedAt?: number;
}

export const INITIAL_CHALLENGE_DAYS: ChallengeDay[] = [
  // Week 1 (Days 1 - 5): 15 seconds
  { day: 1, targetSec: 15, completed: false },
  { day: 2, targetSec: 15, completed: false },
  { day: 3, targetSec: 15, completed: false },
  { day: 4, targetSec: 15, completed: false },
  { day: 5, targetSec: 15, completed: false },
  // Week 2 (Days 6 - 10): 30 seconds
  { day: 6, targetSec: 30, completed: false },
  { day: 7, targetSec: 30, completed: false },
  { day: 8, targetSec: 30, completed: false },
  { day: 9, targetSec: 30, completed: false },
  { day: 10, targetSec: 30, completed: false },
  // Week 3 (Days 11 - 15): 45 seconds
  { day: 11, targetSec: 45, completed: false },
  { day: 12, targetSec: 45, completed: false },
  { day: 13, targetSec: 45, completed: false },
  { day: 14, targetSec: 45, completed: false },
  { day: 15, targetSec: 45, completed: false },
  // Week 4 (Days 16 - 20): 60 seconds (1 minute)
  { day: 16, targetSec: 60, completed: false },
  { day: 17, targetSec: 60, completed: false },
  { day: 18, targetSec: 60, completed: false },
  { day: 19, targetSec: 60, completed: false },
  { day: 20, targetSec: 60, completed: false },
];

export const INITIAL_BADGES: BadgeDefinition[] = [
  { id: 'first_breath', titleKey: 'badgeFirstBreath', descKey: 'badgeFirstBreathDesc', icon: '🫁', category: 'breathing', unlocked: false },
  { id: 'first_ice', titleKey: 'badgeFirstIce', descKey: 'badgeFirstIceDesc', icon: '❄️', category: 'cold', unlocked: false },
  { id: 'retention_2m', titleKey: 'badgeRetention2m', descKey: 'badgeRetention2mDesc', icon: '⏱️', category: 'breathing', unlocked: false },
  { id: 'retention_3m', titleKey: 'badgeRetention3m', descKey: 'badgeRetention3mDesc', icon: '🌟', category: 'breathing', unlocked: false },
  { id: 'pushup_apnea', titleKey: 'badgePushUp', descKey: 'badgePushUpDesc', icon: '💪', category: 'breathing', unlocked: false },
  { id: 'ice_plunge', titleKey: 'badgeIcePlunge', descKey: 'badgeIcePlungeDesc', icon: '🧊', category: 'cold', unlocked: false },
  { id: 'streak_7', titleKey: 'badgeStreak7', descKey: 'badgeStreak7Desc', icon: '🔥', category: 'streak', unlocked: false },
  { id: 'streak_21', titleKey: 'badgeStreak21', descKey: 'badgeStreak21Desc', icon: '🏆', category: 'streak', unlocked: false },
  { id: 'challenge_week1', titleKey: 'badgeChallengeW1', descKey: 'badgeChallengeW1Desc', icon: '🛡️', category: 'challenge', unlocked: false },
  { id: 'challenge_completed', titleKey: 'badgeChallengeDone', descKey: 'badgeChallengeDoneDesc', icon: '👑', category: 'challenge', unlocked: false }
];

export interface WimHofStoreData {
  version: number;
  breathingHistory: BreathingSessionRecord[];
  coldHistory: ColdSessionRecord[];
  pushUpHistory: PushUpRecord[];
  challengeDays: ChallengeDay[];
  badges: BadgeDefinition[];
}

import { storageGetItem, storageGetJson, storageSetItem, storageSetJson } from '../platform/storage';

const STORAGE_KEYS = {
  STORE: 'omega_wimhof_store',
  BUBBLE_HISTORY: 'bubbleBreathingHistory',
  HYDRO_HISTORY: 'hydrocicleHistory',
  PUSHUP_HISTORY: 'omega_pushup_history',
  CHALLENGE: 'omega_challenge_days',
  BADGES: 'omega_badges'
};

function safeGetJson<T>(key: string, fallback: T): T {
  return storageGetJson<T>(key, fallback);
}

function safeSetJson(key: string, value: any): boolean {
  return storageSetJson(key, value);
}

/**
 * Loads entire unified state with automatic migration from existing sub-app histories
 */
export function loadWimHofStore(): WimHofStoreData {
  // Load primary store if present
  let store = safeGetJson<WimHofStoreData | null>(STORAGE_KEYS.STORE, null);

  // If absent or partial, build from backward-compatible keys
  if (!store || !store.version) {
    const legacyBubble = safeGetJson<any[]>(STORAGE_KEYS.BUBBLE_HISTORY, []);
    const legacyHydro = safeGetJson<any[]>(STORAGE_KEYS.HYDRO_HISTORY, []);
    const pushUps = safeGetJson<PushUpRecord[]>(STORAGE_KEYS.PUSHUP_HISTORY, []);
    const challenge = safeGetJson<ChallengeDay[]>(STORAGE_KEYS.CHALLENGE, INITIAL_CHALLENGE_DAYS);
    const badges = safeGetJson<BadgeDefinition[]>(STORAGE_KEYS.BADGES, INITIAL_BADGES);

    // Normalize legacy bubble records
    const normalizedBubble: BreathingSessionRecord[] = legacyBubble.map((b, idx) => ({
      id: b.id || `bb-${b.date || Date.now()}-${idx}`,
      date: Number(b.date) || Date.now(),
      rounds: Number(b.rounds || b.roundsCompleted || 1),
      retentionTimes: Array.isArray(b.retentionTimes) ? b.retentionTimes : (b.retentionSeconds ? [b.retentionSeconds] : [0]),
      totalRetentionTime: Number(b.totalRetentionTime || b.retentionSeconds || 0),
      breathsPerRound: b.breaths || b.breathsPerRound || 30,
      pace: b.speed || 'standard'
    }));

    // Normalize legacy hydro records
    const normalizedCold: ColdSessionRecord[] = legacyHydro.map((h, idx) => ({
      id: h.id || `hc-${h.date || Date.now()}-${idx}`,
      date: Number(h.date) || Date.now(),
      type: (h.type as any) || (h.preset === 'cold_shock' ? 'free_shower' : 'contrast'),
      totalColdTime: Number(h.totalColdTime || 0),
      totalWarmTime: Number(h.totalWarmTime || 0),
      rounds: Number(h.rounds || 1),
      waterTemp: h.waterTemp,
      tempUnit: h.tempUnit || 'C'
    }));

    store = {
      version: 1,
      breathingHistory: normalizedBubble,
      coldHistory: normalizedCold,
      pushUpHistory: pushUps,
      challengeDays: challenge.length === 20 ? challenge : INITIAL_CHALLENGE_DAYS,
      badges: badges.length >= INITIAL_BADGES.length ? badges : INITIAL_BADGES
    };

    safeSetJson(STORAGE_KEYS.STORE, store);
  }

  // Ensure all 20 challenge days and badge definitions exist
  if (!store.challengeDays || store.challengeDays.length !== 20) {
    store.challengeDays = INITIAL_CHALLENGE_DAYS;
  }
  if (!store.badges || store.badges.length < INITIAL_BADGES.length) {
    store.badges = INITIAL_BADGES;
  }

  // Bi-directional synchronization: reconcile any sessions recorded in sub-apps
  const legacyBubble = safeGetJson<any[]>(STORAGE_KEYS.BUBBLE_HISTORY, []);
  const legacyHydro = safeGetJson<any[]>(STORAGE_KEYS.HYDRO_HISTORY, []);
  let storeChanged = false;

  if (Array.isArray(legacyBubble) && legacyBubble.length > 0) {
    const existingIds = new Set(store.breathingHistory.map(b => String(b.id)));
    for (let idx = 0; idx < legacyBubble.length; idx++) {
      const b = legacyBubble[idx];
      const bId = String(b.id || `bb-${b.date || Date.now()}-${idx}`);
      if (!existingIds.has(bId)) {
        const rawDate = typeof b.date === 'string' ? new Date(b.date).getTime() : Number(b.date);
        const parsedDate = Number.isFinite(rawDate) ? rawDate : Date.now();
        const retTimes = Array.isArray(b.retentionTimes) ? b.retentionTimes : (b.retentionSeconds ? [b.retentionSeconds] : [0]);
        const totRet = Number(b.totalRetentionTime || b.retentionSeconds || 0);
        store.breathingHistory.push({
          id: bId,
          date: parsedDate,
          rounds: Number(b.rounds || b.roundsCompleted || 1),
          retentionTimes: retTimes,
          totalRetentionTime: totRet,
          breathsPerRound: b.breaths || b.breathsPerRound || 30,
          pace: b.pace || b.speed || 'standard',
          sensations: Array.isArray(b.sensations) ? b.sensations : undefined
        });
        existingIds.add(bId);
        storeChanged = true;
      }
    }
  }

  if (Array.isArray(legacyHydro) && legacyHydro.length > 0) {
    const existingIds = new Set(store.coldHistory.map(c => String(c.id)));
    for (let idx = 0; idx < legacyHydro.length; idx++) {
      const h = legacyHydro[idx];
      const hId = String(h.id || `hc-${h.date || Date.now()}-${idx}`);
      if (!existingIds.has(hId)) {
        const rawDate = typeof h.date === 'string' ? new Date(h.date).getTime() : Number(h.date);
        const parsedDate = Number.isFinite(rawDate) ? rawDate : Date.now();
        store.coldHistory.push({
          id: hId,
          date: parsedDate,
          type: (h.type as any) || (h.preset === 'cold_shock' ? 'free_shower' : 'contrast'),
          totalColdTime: Number(h.totalColdTime || 0),
          totalWarmTime: Number(h.totalWarmTime || 0),
          rounds: Number(h.rounds || 1),
          waterTemp: h.waterTemp,
          tempUnit: h.tempUnit || 'C',
          sensations: Array.isArray(h.sensations) ? h.sensations : undefined
        });
        existingIds.add(hId);
        storeChanged = true;
      }
    }
  }

  if (storeChanged) {
    store.breathingHistory.sort((a, b) => b.date - a.date);
    store.coldHistory.sort((a, b) => b.date - a.date);
    safeSetJson(STORAGE_KEYS.STORE, store);
  }

  return store;
}

/**
 * Evaluates and unlocks badges based on current state
 */
export function evaluateBadges(store: WimHofStoreData, currentStreak: number): boolean {
  let changed = false;
  const now = Date.now();

  const unlock = (badgeId: string) => {
    const b = store.badges.find(x => x.id === badgeId);
    if (b && !b.unlocked) {
      b.unlocked = true;
      b.unlockedAt = now;
      changed = true;
    }
  };

  if (store.breathingHistory.length > 0) unlock('first_breath');
  if (store.coldHistory.length > 0) unlock('first_ice');

  // Max retention time
  const maxRetention = store.breathingHistory.reduce((max, s) => {
    const highestInSession = Math.max(...(s.retentionTimes || [0]));
    return Math.max(max, highestInSession);
  }, 0);

  if (maxRetention >= 120) unlock('retention_2m');
  if (maxRetention >= 180) unlock('retention_3m');

  // Pushups
  if (store.pushUpHistory.length > 0) unlock('pushup_apnea');

  // Ice plunge
  if (store.coldHistory.some(c => c.type === 'ice_bath')) unlock('ice_plunge');

  // Streaks
  if (currentStreak >= 7) unlock('streak_7');
  if (currentStreak >= 21) unlock('streak_21');

  // Challenge days
  const completedCount = store.challengeDays.filter(d => d.completed).length;
  if (completedCount >= 5) unlock('challenge_week1');
  if (completedCount >= 20) unlock('challenge_completed');

  return changed;
}

/**
 * Saves a new breathing session and maintains bi-directional backward compatibility
 */
export function recordBreathingSession(session: BreathingSessionRecord): boolean {
  const store = loadWimHofStore();
  store.breathingHistory.unshift(session);

  // Sync backward compatibility for Bubble-Breathing & tests
  const legacyRecord = {
    id: session.id,
    date: session.date,
    rounds: session.rounds,
    roundsCompleted: session.rounds,
    retentionTimes: session.retentionTimes,
    retentionSeconds: session.totalRetentionTime,
    totalRetentionTime: session.totalRetentionTime,
    breaths: session.breathsPerRound || 30,
    speed: session.pace || 'standard',
    sensations: session.sensations
  };

  const legacyList = safeGetJson<any[]>(STORAGE_KEYS.BUBBLE_HISTORY, []);
  legacyList.unshift(legacyRecord);
  safeSetJson(STORAGE_KEYS.BUBBLE_HISTORY, legacyList);

  safeSetJson(STORAGE_KEYS.STORE, store);
  broadcastStoreUpdate();
  return true;
}

/**
 * Updates an existing breathing session record
 */
export function updateBreathingSession(id: string, updates: Partial<BreathingSessionRecord>): boolean {
  const store = loadWimHofStore();
  const session = store.breathingHistory.find(s => s.id === id);
  if (session) {
    Object.assign(session, updates);
    safeSetJson(STORAGE_KEYS.STORE, store);
    const legacyList = safeGetJson<any[]>(STORAGE_KEYS.BUBBLE_HISTORY, []);
    const leg = legacyList.find(s => s.id === id);
    if (leg) {
      Object.assign(leg, updates);
      safeSetJson(STORAGE_KEYS.BUBBLE_HISTORY, legacyList);
    }
    broadcastStoreUpdate();
    return true;
  }
  return false;
}

/**
 * Saves a cold exposure session (shower, contrast, or ice bath)
 */
export function recordColdSession(session: ColdSessionRecord): boolean {
  const store = loadWimHofStore();
  store.coldHistory.unshift(session);

  // If attached to challenge day, mark as completed
  if (session.challengeDay && session.challengeDay >= 1 && session.challengeDay <= 20) {
    const dayItem = store.challengeDays.find(d => d.day === session.challengeDay);
    if (dayItem) {
      dayItem.completed = true;
      dayItem.completedAt = session.date;
      dayItem.actualSec = session.totalColdTime;
      safeSetJson(STORAGE_KEYS.CHALLENGE, store.challengeDays);
    }
  }

  // Sync backward compatibility for HydroCycle & tests
  const legacyRecord = {
    id: session.id,
    date: session.date,
    preset: session.type === 'contrast' ? 'classic' : 'cold_shock',
    rounds: session.rounds || 1,
    totalColdTime: session.totalColdTime,
    totalWarmTime: session.totalWarmTime || 0,
    waterTemp: session.waterTemp,
    tempUnit: session.tempUnit,
    sensations: session.sensations
  };

  const legacyList = safeGetJson<any[]>(STORAGE_KEYS.HYDRO_HISTORY, []);
  legacyList.unshift(legacyRecord);
  safeSetJson(STORAGE_KEYS.HYDRO_HISTORY, legacyList);

  safeSetJson(STORAGE_KEYS.STORE, store);
  broadcastStoreUpdate();
  return true;
}

/**
 * Updates an existing cold session record
 */
export function updateColdSession(id: string, updates: Partial<ColdSessionRecord>): boolean {
  const store = loadWimHofStore();
  const session = store.coldHistory.find(s => s.id === id);
  if (session) {
    Object.assign(session, updates);
    safeSetJson(STORAGE_KEYS.STORE, store);
    const legacyList = safeGetJson<any[]>(STORAGE_KEYS.HYDRO_HISTORY, []);
    const leg = legacyList.find(s => s.id === id);
    if (leg) {
      Object.assign(leg, updates);
      safeSetJson(STORAGE_KEYS.HYDRO_HISTORY, legacyList);
    }
    broadcastStoreUpdate();
    return true;
  }
  return false;
}

/**
 * Saves a push-up apnea session
 */
export function recordPushUpSession(record: PushUpRecord): boolean {
  const store = loadWimHofStore();
  store.pushUpHistory.unshift(record);
  safeSetJson(STORAGE_KEYS.PUSHUP_HISTORY, store.pushUpHistory);
  safeSetJson(STORAGE_KEYS.STORE, store);
  broadcastStoreUpdate();
  return true;
}

/**
 * Marks or updates a 20-Day Challenge Day
 */
export function updateChallengeDay(dayNumber: number, completed: boolean, actualSec?: number): boolean {
  const store = loadWimHofStore();
  const dayItem = store.challengeDays.find(d => d.day === dayNumber);
  if (!dayItem) return false;

  dayItem.completed = completed;
  dayItem.completedAt = completed ? Date.now() : undefined;
  if (actualSec !== undefined) {
    dayItem.actualSec = actualSec;
  }

  safeSetJson(STORAGE_KEYS.CHALLENGE, store.challengeDays);
  safeSetJson(STORAGE_KEYS.STORE, store);
  broadcastStoreUpdate();
  return true;
}

/**
 * Resets the 20-Day Challenge back to Day 1
 */
export function resetChallenge(): void {
  const store = loadWimHofStore();
  store.challengeDays = INITIAL_CHALLENGE_DAYS.map(d => ({ ...d }));
  safeSetJson(STORAGE_KEYS.CHALLENGE, store.challengeDays);
  safeSetJson(STORAGE_KEYS.STORE, store);
  broadcastStoreUpdate();
}

/**
 * Dispatches sync events across window and storage listeners
 */
export function broadcastStoreUpdate(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('omega-sync'));
  window.dispatchEvent(new CustomEvent('omega-store-update'));
}

/**
 * Exports complete application state into a clean JSON string
 */
export function exportBackupJson(): string {
  const store = loadWimHofStore();
  const exportPayload = {
    appName: 'Omega Wim Hof Method Suite',
    exportedAt: new Date().toISOString(),
    version: store.version,
    data: store,
    configs: {
      omega_language: storageGetItem('omega_language') || 'es',
      omega_theme: storageGetItem('omega_theme') || 'dark',
      omega_zoom: storageGetItem('omega_zoom') || '100',
      bubbleBreathingConfig: safeGetJson('bubbleBreathingConfig', {}),
      hydrocicleConfig: safeGetJson('hydrocicleConfig', {})
    }
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Triggers a download of the exported JSON file in browser or mobile WebView
 */
export function triggerBackupDownload(): boolean {
  try {
    const jsonStr = exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `omega_wimhof_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to trigger backup download:', err);
    return false;
  }
}

/**
 * Imports state from JSON string with schema validation and atomic recovery
 */
export function importBackupJson(rawJson: string): { success: boolean; message?: string } {
  try {
    const parsed = JSON.parse(rawJson);
    const data = parsed.data || parsed;

    if (!Array.isArray(data.breathingHistory) || !Array.isArray(data.coldHistory)) {
      return { success: false, message: 'Formato JSON inválido: faltan campos de historial.' };
    }

    // Sanitize imported records
    const sanitizedBreathing: BreathingSessionRecord[] = data.breathingHistory
      .filter((b: any) => b && typeof b === 'object')
      .map((b: any, idx: number) => ({
        id: String(b.id || `bb-imported-${idx}`),
        date: Number(b.date) || Date.now(),
        rounds: Number(b.rounds || 1),
        retentionTimes: Array.isArray(b.retentionTimes) ? b.retentionTimes.map(Number) : [Number(b.totalRetentionTime || b.retentionSeconds || 0)],
        totalRetentionTime: Number(b.totalRetentionTime || b.retentionSeconds || 0),
        breathsPerRound: Number(b.breathsPerRound || b.breaths || 30),
        pace: typeof b.pace === 'string' ? b.pace : typeof b.speed === 'string' ? b.speed : 'standard',
        sensations: Array.isArray(b.sensations) ? b.sensations.filter((s: any) => typeof s === 'string') : undefined
      }));

    const sanitizedCold: ColdSessionRecord[] = data.coldHistory
      .filter((c: any) => c && typeof c === 'object')
      .map((c: any, idx: number) => ({
        id: String(c.id || `hc-imported-${idx}`),
        date: Number(c.date) || Date.now(),
        type: c.type || (c.preset === 'cold_shock' ? 'free_shower' : 'contrast'),
        totalColdTime: Number(c.totalColdTime || 0),
        totalWarmTime: Number(c.totalWarmTime || 0),
        rounds: Number(c.rounds || 1),
        waterTemp: typeof c.waterTemp === 'number' ? c.waterTemp : undefined,
        tempUnit: c.tempUnit === 'F' ? 'F' : 'C',
        challengeDay: typeof c.challengeDay === 'number' ? c.challengeDay : undefined,
        notes: typeof c.notes === 'string' ? c.notes : undefined,
        sensations: Array.isArray(c.sensations) ? c.sensations.filter((s: any) => typeof s === 'string') : undefined
      }));

    // Save imported store
    const store: WimHofStoreData = {
      version: 1,
      breathingHistory: sanitizedBreathing,
      coldHistory: sanitizedCold,
      pushUpHistory: Array.isArray(data.pushUpHistory) ? data.pushUpHistory : [],
      challengeDays: Array.isArray(data.challengeDays) && data.challengeDays.length === 20 ? data.challengeDays : INITIAL_CHALLENGE_DAYS,
      badges: Array.isArray(data.badges) ? data.badges : INITIAL_BADGES
    };

    safeSetJson(STORAGE_KEYS.STORE, store);
    safeSetJson(STORAGE_KEYS.CHALLENGE, store.challengeDays);
    safeSetJson(STORAGE_KEYS.PUSHUP_HISTORY, store.pushUpHistory);
    safeSetJson(STORAGE_KEYS.BADGES, store.badges);

    // Sync legacy keys
    safeSetJson(STORAGE_KEYS.BUBBLE_HISTORY, store.breathingHistory);
    safeSetJson(STORAGE_KEYS.HYDRO_HISTORY, store.coldHistory);

    // Restore configs if included
    if (parsed.configs) {
      if (parsed.configs.omega_language) storageSetItem('omega_language', parsed.configs.omega_language);
      if (parsed.configs.omega_theme) storageSetItem('omega_theme', parsed.configs.omega_theme);
      if (parsed.configs.omega_zoom) storageSetItem('omega_zoom', parsed.configs.omega_zoom);
      if (parsed.configs.bubbleBreathingConfig) safeSetJson('bubbleBreathingConfig', parsed.configs.bubbleBreathingConfig);
      if (parsed.configs.hydrocicleConfig) safeSetJson('hydrocicleConfig', parsed.configs.hydrocicleConfig);
    }

    broadcastStoreUpdate();
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error al procesar el archivo JSON.' };
  }
}
