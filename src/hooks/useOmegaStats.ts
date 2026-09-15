import { useState, useEffect, useCallback } from 'react';

export interface RecentActivityItem {
  id: string;
  type: 'breathing' | 'hydro';
  date: string;
  title: string;
  summary: string;
  detail: string;
}

export interface OmegaStats {
  totalBreathingSessions: number;
  totalRetentionSeconds: number;
  totalHydroSessions: number;
  totalColdSeconds: number;
  isBreathingDoneToday: boolean;
  isHydroDoneToday: boolean;
  habitsCompletedToday: number;
  combinedStreak: number;
  recentActivities: RecentActivityItem[];
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Deduplicate dates by YYYY-MM-DD
  const dateStrings = Array.from(
    new Set(dates.map(d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`))
  ).sort().reverse();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (!dateStrings.includes(todayStr) && !dateStrings.includes(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  let checkDate = dateStrings.includes(todayStr) ? new Date(today) : new Date(yesterday);

  while (true) {
    const curStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (dateStrings.includes(curStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function formatTimeSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function useOmegaStats() {
  const [stats, setStats] = useState<OmegaStats>({
    totalBreathingSessions: 0,
    totalRetentionSeconds: 0,
    totalHydroSessions: 0,
    totalColdSeconds: 0,
    isBreathingDoneToday: false,
    isHydroDoneToday: false,
    habitsCompletedToday: 0,
    combinedStreak: 0,
    recentActivities: [],
  });

  const loadStats = useCallback(() => {
    let breathingHistory: any[] = [];
    let hydroHistory: any[] = [];

    try {
      const bData = localStorage.getItem('bubbleBreathingHistory');
      if (bData) breathingHistory = JSON.parse(bData);
    } catch (e) {
      console.error(e);
    }

    try {
      const hData = localStorage.getItem('hydrocicleHistory');
      if (hData) hydroHistory = JSON.parse(hData);
    } catch (e) {
      console.error(e);
    }

    const today = new Date();
    let totalRetention = 0;
    let totalCold = 0;
    let isBreathingToday = false;
    let isHydroToday = false;
    const allDates: Date[] = [];
    const activities: RecentActivityItem[] = [];

    breathingHistory.forEach((item: any) => {
      const d = new Date(item.date);
      allDates.push(d);
      totalRetention += Number(item.retentionSeconds) || 0;
      if (isSameDay(d, today)) isBreathingToday = true;

      activities.push({
        id: item.id || `b-${item.date}`,
        type: 'breathing',
        date: item.date,
        title: 'Bubble Breathing',
        summary: `${item.rounds || 1} rondas`,
        detail: `Apnea: ${formatTimeSeconds(item.retentionSeconds || 0)}`,
      });
    });

    hydroHistory.forEach((item: any) => {
      const d = new Date(item.date);
      allDates.push(d);
      totalCold += Number(item.totalColdTime) || 0;
      if (isSameDay(d, today)) isHydroToday = true;

      activities.push({
        id: item.id || `h-${item.date}`,
        type: 'hydro',
        date: item.date,
        title: 'HydroCycle',
        summary: `${item.rounds || 1} rondas`,
        detail: `Frío: ${formatTimeSeconds(item.totalColdTime || 0)}`,
      });
    });

    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const habitsDone = (isBreathingToday ? 1 : 0) + (isHydroToday ? 1 : 0);
    const streak = calculateStreak(allDates);

    setStats({
      totalBreathingSessions: breathingHistory.length,
      totalRetentionSeconds: totalRetention,
      totalHydroSessions: hydroHistory.length,
      totalColdSeconds: totalCold,
      isBreathingDoneToday: isBreathingToday,
      isHydroDoneToday: isHydroToday,
      habitsCompletedToday: habitsDone,
      combinedStreak: streak,
      recentActivities: activities.slice(0, 10),
    });
  }, []);

  useEffect(() => {
    loadStats();
    window.addEventListener('storage', loadStats);
    window.addEventListener('omega-sync', loadStats);
    window.addEventListener('subapp-sync', loadStats);
    return () => {
      window.removeEventListener('storage', loadStats);
      window.removeEventListener('omega-sync', loadStats);
      window.removeEventListener('subapp-sync', loadStats);
    };
  }, [loadStats]);

  return { stats, refreshStats: loadStats };
}
