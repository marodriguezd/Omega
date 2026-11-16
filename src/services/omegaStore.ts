// Unified offline-first store for sessions, challenge progression, and badges.

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
  // Week 1 (days 1-5, 15s)
  { day: 1, targetSec: 15, completed: false },
  { day: 2, targetSec: 15, completed: false },
  { day: 3, targetSec: 15, completed: false },
  { day: 4, targetSec: 15, completed: false },
  { day: 5, targetSec: 15, completed: false },
  // Week 2 (days 6-10, 30s)
  { day: 6, targetSec: 30, completed: false },
  { day: 7, targetSec: 30, completed: false },
  { day: 8, targetSec: 30, completed: false },
  { day: 9, targetSec: 30, completed: false },
  { day: 10, targetSec: 30, completed: false },
  // Week 3 (days 11-15, 45s)
  { day: 11, targetSec: 45, completed: false },
  { day: 12, targetSec: 45, completed: false },
  { day: 13, targetSec: 45, completed: false },
  { day: 14, targetSec: 45, completed: false },
  { day: 15, targetSec: 45, completed: false },
  // Week 4 (days 16-20, 60s)
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

// Load unified store with migration from legacy sub-app keys.
export function loadWimHofStore(): WimHofStoreData {
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

  // Reconcile sessions recorded in sub-apps
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

  evaluateAndPersistBadges(store);
  return store;
}

// Compute active habit streak from all recorded sessions in store.
export function computeStoreStreak(store: WimHofStoreData): number {
  const dates: Date[] = [
    ...store.breathingHistory.map(b => new Date(b.date)),
    ...store.coldHistory.map(c => new Date(c.date)),
    ...store.pushUpHistory.map(p => new Date(p.date))
  ].filter(d => !isNaN(d.getTime()));

  if (dates.length === 0) return 0;

  const dateSet = new Set(
    dates.map(d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  );

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (!dateSet.has(todayStr) && !dateSet.has(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  let checkDate = dateSet.has(todayStr) ? new Date(today) : new Date(yesterday);

  while (true) {
    const curStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (dateSet.has(curStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Evaluate and unlock badges based on session metrics and streak.
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

  const maxRetention = store.breathingHistory.reduce((max, s) => {
    const highestInSession = Math.max(...(s.retentionTimes || [0]));
    return Math.max(max, highestInSession);
  }, 0);

  if (maxRetention >= 120) unlock('retention_2m');
  if (maxRetention >= 180) unlock('retention_3m');

  if (store.pushUpHistory.length > 0) unlock('pushup_apnea');

  if (store.coldHistory.some(c => c.type === 'ice_bath')) unlock('ice_plunge');

  if (currentStreak >= 7) unlock('streak_7');
  if (currentStreak >= 21) unlock('streak_21');

  const completedCount = store.challengeDays.filter(d => d.completed).length;
  if (completedCount >= 5) unlock('challenge_week1');
  if (completedCount >= 20) unlock('challenge_completed');

  return changed;
}

// Evaluate badges and immediately persist state to storage if changed.
export function evaluateAndPersistBadges(store: WimHofStoreData, currentStreak?: number): boolean {
  const streak = currentStreak !== undefined ? currentStreak : computeStoreStreak(store);
  const changed = evaluateBadges(store, streak);
  if (changed) {
    safeSetJson(STORAGE_KEYS.BADGES, store.badges);
    safeSetJson(STORAGE_KEYS.STORE, store);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('omega-badge-unlocked', { detail: { badges: store.badges } }));
    }
  }
  return changed;
}

// Record breathing session with backward-compatible key synchronization.
export function recordBreathingSession(session: BreathingSessionRecord): boolean {
  const store = loadWimHofStore();
  store.breathingHistory.unshift(session);

  // Sync backward compatibility for Bubble-Breathing
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
  evaluateAndPersistBadges(store);
  broadcastStoreUpdate();
  return true;
}

// Update existing breathing session record.
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
    evaluateAndPersistBadges(store);
    broadcastStoreUpdate();
    return true;
  }
  return false;
}

// Record cold session and update corresponding challenge day if present.
export function recordColdSession(session: ColdSessionRecord): boolean {
  const store = loadWimHofStore();
  store.coldHistory.unshift(session);

  if (session.challengeDay && session.challengeDay >= 1 && session.challengeDay <= 20) {
    const dayItem = store.challengeDays.find(d => d.day === session.challengeDay);
    if (dayItem) {
      dayItem.completed = true;
      dayItem.completedAt = session.date;
      dayItem.actualSec = session.totalColdTime;
      safeSetJson(STORAGE_KEYS.CHALLENGE, store.challengeDays);
    }
  }

  // Sync backward compatibility for HydroCycle
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
  evaluateAndPersistBadges(store);
  broadcastStoreUpdate();
  return true;
}

// Update existing cold session record.
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
    evaluateAndPersistBadges(store);
    broadcastStoreUpdate();
    return true;
  }
  return false;
}

// Record push-up session.
export function recordPushUpSession(record: PushUpRecord): boolean {
  const store = loadWimHofStore();
  store.pushUpHistory.unshift(record);
  safeSetJson(STORAGE_KEYS.PUSHUP_HISTORY, store.pushUpHistory);
  safeSetJson(STORAGE_KEYS.STORE, store);
  evaluateAndPersistBadges(store);
  broadcastStoreUpdate();
  return true;
}

// Update challenge day progress.
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
  evaluateAndPersistBadges(store);
  broadcastStoreUpdate();
  return true;
}

// Reset 20-day challenge back to day 1.
export function resetChallenge(): void {
  const store = loadWimHofStore();
  store.challengeDays = INITIAL_CHALLENGE_DAYS.map(d => ({ ...d }));
  safeSetJson(STORAGE_KEYS.CHALLENGE, store.challengeDays);
  safeSetJson(STORAGE_KEYS.STORE, store);
  broadcastStoreUpdate();
}

// Dispatch cross-view sync events.
export function broadcastStoreUpdate(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('omega-sync'));
  window.dispatchEvent(new CustomEvent('omega-store-update'));
}

// Export state and settings as JSON string.
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

// Copy state and settings JSON to clipboard (universal offline fallback).
export async function copyBackupJsonToClipboard(): Promise<boolean> {
  try {
    const jsonStr = exportBackupJson();
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(jsonStr);
      return true;
    }
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = jsonStr;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
    return false;
  } catch (err) {
    console.error('Failed to copy backup to clipboard:', err);
    return false;
  }
}

// Share backup JSON via native Web Share API (mobile/Android compatible).
export async function shareBackupJson(): Promise<boolean> {
  try {
    const jsonStr = exportBackupJson();
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `omega_wimhof_backup_${dateStr}.json`;
      if (typeof File !== 'undefined' && typeof navigator.canShare === 'function') {
        const file = new File([jsonStr], filename, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Omega Wim Hof Backup',
            files: [file]
          });
          return true;
        }
      }
      await navigator.share({
        title: 'Omega Wim Hof Backup',
        text: jsonStr
      });
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Web Share API not supported or cancelled:', err);
    return false;
  }
}

// Trigger file download of backup JSON.
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

// Import state from JSON payload with schema normalization and optional merge deduplication.
export function importBackupJson(rawJson: string, mode: 'merge' | 'overwrite' = 'merge'): { success: boolean; message?: string } {
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

    let finalBreathing = sanitizedBreathing;
    let finalCold = sanitizedCold;
    let finalPushUps = Array.isArray(data.pushUpHistory) ? data.pushUpHistory : [];
    let finalChallenge = Array.isArray(data.challengeDays) && data.challengeDays.length === 20 ? data.challengeDays : INITIAL_CHALLENGE_DAYS;
    let finalBadges = Array.isArray(data.badges) ? data.badges : INITIAL_BADGES;

    if (mode === 'merge') {
      const existing = loadWimHofStore();

      // Merge breathing sessions deduplicating by ID or timestamp
      const breathingMap = new Map<string, BreathingSessionRecord>();
      existing.breathingHistory.forEach(b => breathingMap.set(String(b.id), b));
      sanitizedBreathing.forEach(b => {
        const id = String(b.id);
        const dupByDate = existing.breathingHistory.some(eb => Math.abs(eb.date - b.date) < 1000);
        if (!breathingMap.has(id) && !dupByDate) {
          breathingMap.set(id, b);
        }
      });
      finalBreathing = Array.from(breathingMap.values()).sort((a, b) => b.date - a.date);

      // Merge cold sessions deduplicating by ID or timestamp
      const coldMap = new Map<string, ColdSessionRecord>();
      existing.coldHistory.forEach(c => coldMap.set(String(c.id), c));
      sanitizedCold.forEach(c => {
        const id = String(c.id);
        const dupByDate = existing.coldHistory.some(ec => Math.abs(ec.date - c.date) < 1000);
        if (!coldMap.has(id) && !dupByDate) {
          coldMap.set(id, c);
        }
      });
      finalCold = Array.from(coldMap.values()).sort((a, b) => b.date - a.date);

      // Merge push-ups
      const pushUpMap = new Map<string, PushUpRecord>();
      existing.pushUpHistory.forEach(p => pushUpMap.set(String(p.id), p));
      finalPushUps.forEach(p => {
        const id = String(p.id);
        if (!pushUpMap.has(id)) {
          pushUpMap.set(id, p);
        }
      });
      finalPushUps = Array.from(pushUpMap.values()).sort((a, b) => b.date - a.date);

      // Merge challenge days (keep completed days)
      finalChallenge = existing.challengeDays.map(exDay => {
        const impDay = finalChallenge.find(d => d.day === exDay.day);
        if (!impDay) return exDay;
        const isCompleted = exDay.completed || impDay.completed;
        return {
          day: exDay.day,
          targetSec: exDay.targetSec,
          completed: isCompleted,
          completedAt: exDay.completedAt || impDay.completedAt,
          actualSec: Math.max(exDay.actualSec || 0, impDay.actualSec || 0) || undefined
        };
      });

      // Merge badges (keep unlocked badges)
      finalBadges = existing.badges.map(exBadge => {
        const impBadge = finalBadges.find(b => b.id === exBadge.id);
        const unlocked = exBadge.unlocked || (impBadge ? impBadge.unlocked : false);
        return {
          ...exBadge,
          unlocked,
          unlockedAt: exBadge.unlockedAt || (impBadge ? impBadge.unlockedAt : undefined)
        };
      });
    }

    const store: WimHofStoreData = {
      version: 1,
      breathingHistory: finalBreathing,
      coldHistory: finalCold,
      pushUpHistory: finalPushUps,
      challengeDays: finalChallenge,
      badges: finalBadges
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

    evaluateAndPersistBadges(store);
    broadcastStoreUpdate();
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error al procesar el archivo JSON.' };
  }
}
