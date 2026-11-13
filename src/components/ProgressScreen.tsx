import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Award, 
  Calendar, 
  Download, 
  Upload, 
  Timer, 
  Snowflake, 
  Wind, 
  Flame, 
  CheckCircle2, 
  ShieldCheck,
  TrendingUp,
  FileCheck,
  ChevronDown,
  ChevronUp,
  History,
  Lock
} from 'lucide-react';
import { 
  loadWimHofStore, 
  WimHofStoreData, 
  evaluateBadges, 
  triggerBackupDownload, 
  importBackupJson 
} from '../services/omegaStore';
import { formatTimeSeconds } from '../hooks/useOmegaStats';
import { RoundRetentionBarChart } from './RoundRetentionBarChart';

interface ProgressScreenProps {
  langDict: Record<string, string>;
  combinedStreak: number;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ langDict, combinedStreak }) => {
  const [storeData, setStoreData] = useState<WimHofStoreData>(() => loadWimHofStore());
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [expandedSessionIds, setExpandedSessionIds] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleSessionExpand = (id: string) => {
    setExpandedSessionIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const refreshData = () => {
    const updated = loadWimHofStore();
    evaluateBadges(updated, combinedStreak);
    setStoreData(updated);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('omega-store-update', refreshData);
    window.addEventListener('omega-sync', refreshData);
    return () => {
      window.removeEventListener('omega-store-update', refreshData);
      window.removeEventListener('omega-sync', refreshData);
      if (importTimeoutRef.current) {
        clearTimeout(importTimeoutRef.current);
      }
    };
  }, [combinedStreak]);

  const { totalBreathing, totalRetentionSec, maxRetentionSec, totalColdSessions, totalColdSec, maxColdSec } = useMemo(() => {
    const totalB = storeData.breathingHistory.length;
    const totalRetSec = storeData.breathingHistory.reduce((sum, s) => sum + (s.totalRetentionTime || 0), 0);
    const maxRetSec = storeData.breathingHistory.reduce((max, s) => {
      const top = Math.max(...(s.retentionTimes || [0]));
      return Math.max(max, top);
    }, 0);

    const totalCold = storeData.coldHistory.length;
    const totalC = storeData.coldHistory.reduce((sum, s) => sum + (s.totalColdTime || 0), 0);
    const maxC = storeData.coldHistory.reduce((max, s) => Math.max(max, s.totalColdTime || 0), 0);

    return {
      totalBreathing: totalB,
      totalRetentionSec: totalRetSec,
      maxRetentionSec: maxRetSec,
      totalColdSessions: totalCold,
      totalColdSec: totalC,
      maxColdSec: maxC
    };
  }, [storeData.breathingHistory, storeData.coldHistory]);

  // 28-day activity heatmap indexed by date aligned to calendar weeks.
  const { heatmapDays, weekDayHeaders } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Monday-based week index (0 = Monday, ..., 6 = Sunday)
    const currentDayOfWeek = (today.getDay() + 6) % 7;

    // Start on Monday of 3 weeks ago (4 full weeks = 28 days total)
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - currentDayOfWeek);
    const startDate = new Date(currentMonday);
    startDate.setDate(currentMonday.getDate() - 21);

    const days = [];
    for (let i = 0; i < 28; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86400000;

      const isToday = d.getTime() === today.getTime();
      const isFuture = d.getTime() > today.getTime();

      const hasBreath = storeData.breathingHistory.some(b => b.date >= dayStart && b.date < dayEnd);
      const hasCold = storeData.coldHistory.some(c => c.date >= dayStart && c.date < dayEnd);

      days.push({
        date: d,
        dayOfMonth: d.getDate(),
        isToday,
        isFuture,
        hasBreath,
        hasCold,
        level: (hasBreath && hasCold) ? 2 : (hasBreath || hasCold) ? 1 : 0
      });
    }

    const headers = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    return { heatmapDays: days, weekDayHeaders: headers };
  }, [storeData.breathingHistory, storeData.coldHistory]);

  const monthRangeLabel = useMemo(() => {
    if (!heatmapDays || heatmapDays.length === 0) return '';
    const first = heatmapDays[0].date;
    const last = heatmapDays[heatmapDays.length - 1].date;
    const m1 = first.toLocaleString('es', { month: 'long' });
    const y1 = first.getFullYear();
    const m2 = last.toLocaleString('es', { month: 'long' });
    const y2 = last.getFullYear();
    if (m1 === m2 && y1 === y2) {
      return `${m1.charAt(0).toUpperCase() + m1.slice(1)} ${y1}`;
    }
    return `${m1.charAt(0).toUpperCase() + m1.slice(1)} – ${m2.charAt(0).toUpperCase() + m2.slice(1)} ${y2}`;
  }, [heatmapDays]);

  const monthlyAdherence = useMemo(() => {
    const eligibleDays = heatmapDays.filter(d => !d.isFuture);
    const activeCount = eligibleDays.filter(d => d.level > 0).length;
    const pct = eligibleDays.length > 0 ? Math.round((activeCount / eligibleDays.length) * 100) : 0;
    return { activeCount, totalCount: eligibleDays.length, pct };
  }, [heatmapDays]);

  const getBadgeProgress = (badgeId: string) => {
    switch (badgeId) {
      case 'first_breath': {
        const cur = Math.min(1, storeData.breathingHistory.length);
        return { current: cur, target: 1, label: `${cur}/1 sesión`, pct: (cur / 1) * 100 };
      }
      case 'first_ice': {
        const cur = Math.min(1, storeData.coldHistory.length);
        return { current: cur, target: 1, label: `${cur}/1 sesión`, pct: (cur / 1) * 100 };
      }
      case 'retention_2m': {
        const cur = Math.min(120, maxRetentionSec);
        return { current: cur, target: 120, label: `${cur}/120s`, pct: Math.round((cur / 120) * 100) };
      }
      case 'retention_3m': {
        const cur = Math.min(180, maxRetentionSec);
        return { current: cur, target: 180, label: `${cur}/180s`, pct: Math.round((cur / 180) * 100) };
      }
      case 'pushup_apnea': {
        const cur = Math.min(1, storeData.pushUpHistory.length);
        return { current: cur, target: 1, label: `${cur}/1 test`, pct: (cur / 1) * 100 };
      }
      case 'ice_plunge': {
        const hasIce = storeData.coldHistory.some(c => c.type === 'ice_bath');
        return { current: hasIce ? 1 : 0, target: 1, label: `${hasIce ? 1 : 0}/1 baño`, pct: hasIce ? 100 : 0 };
      }
      case 'streak_7': {
        const cur = Math.min(7, combinedStreak);
        return { current: cur, target: 7, label: `${cur}/7 días`, pct: Math.round((cur / 7) * 100) };
      }
      case 'streak_21': {
        const cur = Math.min(21, combinedStreak);
        return { current: cur, target: 21, label: `${cur}/21 días`, pct: Math.round((cur / 21) * 100) };
      }
      case 'challenge_week1': {
        const completedCount = storeData.challengeDays.filter(d => d.completed).length;
        const cur = Math.min(5, completedCount);
        return { current: cur, target: 5, label: `${cur}/5 días`, pct: Math.round((cur / 5) * 100) };
      }
      case 'challenge_completed': {
        const completedCount = storeData.challengeDays.filter(d => d.completed).length;
        const cur = Math.min(20, completedCount);
        return { current: cur, target: 20, label: `${cur}/20 días`, pct: Math.round((cur / 20) * 100) };
      }
      default:
        return { current: 0, target: 1, label: '0/1', pct: 0 };
    }
  };

  const recentBreathingSessions = useMemo(() => {
    return storeData.breathingHistory
      .slice()
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);
  }, [storeData.breathingHistory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = importBackupJson(text);
      if (result.success) {
        setImportStatus(langDict.importSuccessMsg || '¡Datos restaurados con éxito!');
        refreshData();
      } else {
        setImportStatus(result.message || 'Error al importar datos.');
      }
      if (importTimeoutRef.current) clearTimeout(importTimeoutRef.current);
      importTimeoutRef.current = setTimeout(() => setImportStatus(null), 4000);
    };
    reader.onerror = () => {
      setImportStatus('Error al leer el archivo seleccionado.');
      if (importTimeoutRef.current) clearTimeout(importTimeoutRef.current);
      importTimeoutRef.current = setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div 
      className="screen" 
      style={{ 
        justifyContent: 'flex-start', 
        overflowY: 'auto', 
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        paddingTop: 'calc(0.85rem + env(safe-area-inset-top, 0px))', 
        paddingBottom: '3.5rem', 
        paddingLeft: 'calc(1rem + env(safe-area-inset-left, 0px))', 
        paddingRight: 'calc(1rem + env(safe-area-inset-right, 0px))' 
      }}
    >
      <div className="glass-card streak-card" style={{ width: '100%', marginBottom: '1rem' }}>
        <div className="streak-info">
          <div className="streak-flame zen-hex-badge">
            <img src="/assets/zen-icon.svg" alt="Zen" />
          </div>
          <div className="streak-text">
            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{langDict.tabProgress || 'Progreso y Vitalidad'}</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-muted)' }}>
              {langDict.combinedStreak || 'Racha Activa'}: {combinedStreak} {langDict.daysUnit || 'días'}
            </p>
          </div>
        </div>
        <div className="routine-badge" style={{ background: 'rgba(255, 122, 0, 0.2)', color: 'var(--omega-warm-amber, #ff7a00)' }}>
          {storeData.badges.filter(b => b.unlocked).length}/{storeData.badges.length} {langDict.badgesTitle || 'Insignias'}
        </div>
      </div>

      <div className="glass-card" style={{ width: '100%', marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', color: 'var(--zen-teal-primary, #00a896)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={18} />
          <span>{langDict.heatmapTitle || 'Calendario de Vitalidad (Últimas 4 semanas)'}</span>
        </h4>

        {/* Month range and adherence subheader */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 0.75rem', padding: '0.45rem 0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)', textTransform: 'capitalize' }}>
            {monthRangeLabel}
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--zen-teal-accent, #02c39a)', fontWeight: 600 }}>
            {monthlyAdherence.activeCount}/{monthlyAdherence.totalCount} días ({monthlyAdherence.pct}%)
          </span>
        </div>

        {/* Week day headers L, M, X, J, V, S, D */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem', marginBottom: '0.35rem' }}>
          {weekDayHeaders.map((h, i) => (
            <div 
              key={i} 
              style={{ 
                textAlign: 'center', 
                fontSize: '0.72rem', 
                fontWeight: 700, 
                color: 'var(--color-muted)',
                opacity: 0.75,
                padding: '0.1rem 0'
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* 28-day numeric grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
          {heatmapDays.map((d, idx) => {
            let bg = 'rgba(255, 255, 255, 0.04)';
            let borderColor = 'rgba(255, 255, 255, 0.08)';
            if (d.level === 2) {
              bg = 'linear-gradient(135deg, rgba(0, 168, 150, 0.5), rgba(46, 204, 113, 0.6))';
              borderColor = 'var(--zen-teal-primary, #00a896)';
            } else if (d.level === 1) {
              bg = d.hasBreath ? 'rgba(0, 168, 150, 0.35)' : 'rgba(2, 128, 144, 0.35)';
              borderColor = d.hasBreath ? '#00a896' : '#028090';
            }

            return (
              <div
                key={idx}
                title={`${d.date.toLocaleDateString()}: ${d.level === 2 ? 'Respiración + Frío' : d.hasBreath ? 'Respiración' : d.hasCold ? 'Frío' : 'Sin sesión'}`}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 'var(--omega-radius-squircle-sm, 8px)',
                  background: d.isFuture ? 'rgba(255, 255, 255, 0.015)' : bg,
                  border: d.isToday 
                    ? '2px solid var(--zen-teal-accent, #02c39a)' 
                    : `1px solid ${d.isFuture ? 'rgba(255, 255, 255, 0.04)' : borderColor}`,
                  boxShadow: d.isToday ? '0 0 10px rgba(0, 168, 150, 0.45)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: d.isToday ? 800 : 600,
                  color: d.isToday ? '#fff' : d.isFuture ? 'rgba(255, 255, 255, 0.2)' : d.level > 0 ? '#fff' : 'var(--color-muted)',
                  position: 'relative'
                }}
              >
                {d.dayOfMonth}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', marginTop: '0.85rem', fontSize: '0.72rem', color: 'var(--color-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255, 157, 0, 0.6)' }} />
            Respiración
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(0, 240, 255, 0.6)' }} />
            Frío
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#2ecc71' }} />
            Ambos (100%)
          </span>
        </div>
      </div>

      <div className="metrics-grid" style={{ width: '100%', marginBottom: '1.2rem' }}>
        <div className="metric-box">
          <div className="metric-icon" style={{ background: 'rgba(255, 122, 0, 0.2)', color: '#ff7a00' }}>
            <Wind size={18} />
          </div>
          <div className="metric-data">
            <h5>{totalBreathing}</h5>
            <p>{langDict.totalBreathingSessions || 'Sesiones respiración'}</p>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-icon" style={{ background: 'rgba(0, 240, 255, 0.2)', color: '#00f0ff' }}>
            <Timer size={18} />
          </div>
          <div className="metric-data">
            <h5>{formatTimeSeconds(totalRetentionSec)}</h5>
            <p>{langDict.totalRetentionTime || 'Total apnea'}</p>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-icon" style={{ background: 'rgba(255, 157, 0, 0.2)', color: '#ff9d00' }}>
            <Flame size={18} />
          </div>
          <div className="metric-data">
            <h5>{formatTimeSeconds(maxRetentionSec)}</h5>
            <p>Récord de apnea</p>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-icon" style={{ background: 'rgba(0, 210, 255, 0.2)', color: '#00d2ff' }}>
            <Snowflake size={18} />
          </div>
          <div className="metric-data">
            <h5>{formatTimeSeconds(totalColdSec)}</h5>
            <p>{langDict.totalColdTime || 'Total en frío'}</p>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ width: '100%', marginBottom: '1.2rem' }}>
        <h4 style={{ margin: '0 0 0.4rem', fontSize: '1rem', color: 'var(--omega-primary-cyan, #00f0ff)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <History size={19} />
          <span>{langDict.recentBreathingHistory || 'Historial de Respiración'}</span>
        </h4>
        <p style={{ margin: '0 0 0.85rem', fontSize: '0.78rem', color: 'var(--color-muted)' }}>
          {langDict.recentBreathingHistoryDesc || 'Desglose de apnea ronda por ronda estilo Wim Hof'}
        </p>

        {storeData.breathingHistory.length === 0 ? (
          <div 
            className="empty-state-card"
            style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem 1rem',
              borderRadius: 'var(--omega-radius-squircle-sm, 12px)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.08)',
              gap: '0.6rem',
              textAlign: 'center'
            }}
          >
            <div 
              style={{
                width: '2.8rem',
                height: '2.8rem',
                borderRadius: '50%',
                background: 'rgba(0, 168, 150, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--zen-teal-primary, #00a896)',
                opacity: 0.75
              }}
            >
              <Wind size={22} />
            </div>
            <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.85rem', opacity: 0.8 }}>
              {langDict.noBreathingHistoryYet || 'No hay sesiones registradas aún.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {recentBreathingSessions.map((session, sIdx) => {
                const isExpanded = expandedSessionIds[session.id] ?? (sIdx === 0);
                const sessionDate = new Date(session.date);
                const dateStr = sessionDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const roundCount = session.rounds || (session.retentionTimes ? session.retentionTimes.length : 1);
                const maxHold = session.retentionTimes && session.retentionTimes.length > 0 
                  ? Math.max(...session.retentionTimes) 
                  : (session.totalRetentionTime || 0);

                return (
                  <div
                    key={session.id || sIdx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--color-glass-border)',
                      borderRadius: 'var(--omega-radius-squircle-sm, 10px)',
                      padding: '0.7rem 0.85rem',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div
                      onClick={() => toggleSessionExpand(session.id || String(sIdx))}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                          {dateStr}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                          {roundCount} {langDict.roundLabel ? `${langDict.roundLabel}s` : 'rondas'} • Max: <strong style={{ color: 'var(--omega-warm-amber, #ff7a00)' }}>{formatTimeSeconds(maxHold)}</strong>
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--omega-primary-cyan, #00f0ff)' }}>
                          {formatTimeSeconds(session.totalRetentionTime || 0)}
                        </span>
                        {isExpanded ? <ChevronUp size={16} color="var(--color-muted)" /> : <ChevronDown size={16} color="var(--color-muted)" />}
                      </div>
                    </div>

                    {session.sensations && session.sensations.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
                        {session.sensations.map(s => (
                          <span
                            key={s}
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 7px',
                              borderRadius: '9999px',
                              background: 'rgba(0, 240, 255, 0.12)',
                              border: '1px solid rgba(0, 240, 255, 0.28)',
                              color: 'var(--omega-primary-cyan, #00f0ff)',
                              fontWeight: 600
                            }}
                          >
                            {langDict[`sensation_${s}`] || s}
                          </span>
                        ))}
                      </div>
                    )}

                    {isExpanded && session.retentionTimes && session.retentionTimes.length > 0 && (
                      <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                        <RoundRetentionBarChart
                          retentionTimes={session.retentionTimes}
                          bestRetentionSec={maxRetentionSec}
                          compact={false}
                          langDict={langDict}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div className="glass-card" style={{ width: '100%', marginBottom: '1.2rem' }}>
        <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--omega-warm-amber, #ff7a00)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Award size={20} />
          <span>{langDict.badgesTitle || 'Insignias Hexagonales de Logro'}</span>
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
          {storeData.badges.map(b => {
            const title = (langDict[b.titleKey] as string) || b.titleKey;
            const desc = (langDict[b.descKey] as string) || b.descKey;
            const prog = getBadgeProgress(b.id);

            return (
              <div
                key={b.id}
                style={{
                  background: b.unlocked 
                    ? 'linear-gradient(145deg, rgba(255, 122, 0, 0.16) 0%, rgba(255, 122, 0, 0.04) 100%)' 
                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
                  border: b.unlocked 
                    ? '1.5px solid var(--omega-warm-amber, #ff7a00)' 
                    : '1px solid var(--color-glass-border)',
                  borderTop: b.unlocked 
                    ? '1.5px solid rgba(255, 180, 0, 0.8)' 
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 'var(--omega-radius-squircle-md, 18px)',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '0.35rem',
                  boxShadow: b.unlocked ? '0 4px 16px rgba(255, 122, 0, 0.25)' : 'none',
                  opacity: b.unlocked ? 1 : 0.85,
                  minHeight: '12rem',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box'
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    position: 'relative',
                    filter: b.unlocked ? 'drop-shadow(0 0 8px rgba(255, 122, 0, 0.6))' : 'grayscale(0.85)'
                  }}
                >
                  <svg
                    viewBox="0 0 200 200"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                  >
                    <defs>
                      <linearGradient id={`metallicBevel-${b.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
                        <stop offset="30%" stopColor="rgba(190, 205, 215, 0.45)" />
                        <stop offset="70%" stopColor="rgba(80, 95, 110, 0.6)" />
                        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.4)" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 87.88 21.00 Q 100.00 14.00 112.12 21.00 L 162.35 50.00 Q 174.48 57.00 174.48 71.00 L 174.48 129.00 Q 174.48 143.00 162.35 150.00 L 112.12 179.00 Q 100.00 186.00 87.88 179.00 L 37.65 150.00 Q 25.52 143.00 25.52 129.00 L 25.52 71.00 Q 25.52 57.00 37.65 50.00 Z"
                      fill={b.unlocked ? 'rgba(255, 122, 0, 0.25)' : 'rgba(255, 255, 255, 0.05)'}
                      stroke={b.unlocked ? 'var(--omega-warm-amber, #ff7a00)' : `url(#metallicBevel-${b.id})`}
                      strokeWidth="6"
                    />
                  </svg>
                  <span>{b.icon}</span>
                  {!b.unlocked && (
                    <div 
                      style={{ 
                        position: 'absolute', 
                        bottom: -2, 
                        right: -2, 
                        background: 'rgba(15, 32, 39, 0.9)', 
                        border: '1px solid rgba(255, 255, 255, 0.3)', 
                        borderRadius: '50%', 
                        width: '18px', 
                        height: '18px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'rgba(255, 255, 255, 0.85)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                      }}
                    >
                      <Lock size={10} />
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: b.unlocked ? '#fff' : 'var(--color-muted)' }}>
                    {title}
                  </div>
                  <div style={{ fontSize: '0.69rem', color: 'var(--color-muted)', lineHeight: 1.3, marginTop: '0.2rem' }}>
                    {desc}
                  </div>
                </div>

                <div style={{ width: '100%', marginTop: 'auto', paddingTop: '0.45rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: b.unlocked ? '#2ecc71' : 'var(--color-muted)', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600 }}>{b.unlocked ? 'Desbloqueado' : 'Progreso'}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{prog.label}</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: b.unlocked ? '100%' : `${prog.pct}%`, 
                        height: '100%', 
                        background: b.unlocked ? 'linear-gradient(90deg, #ff7a00, #ff9d00)' : 'linear-gradient(90deg, #00a896, #02c39a)', 
                        borderRadius: '2px',
                        transition: 'width 0.3s ease' 
                      }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card" style={{ width: '100%', marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: 'var(--omega-text-primary, #f0f6fc)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={18} color="#2ecc71" />
          <span>{langDict.backupTitle || 'Privacidad y Copias de Seguridad'}</span>
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', margin: '0 0 1rem' }}>
          Tus datos se guardan 100% de forma local y privada en tu dispositivo. Puedes exportar o restaurar tu historial cuando quieras.
        </p>

        {importStatus && (
          <div style={{ padding: '0.6rem', marginBottom: '0.8rem', borderRadius: '8px', background: 'rgba(46, 204, 113, 0.2)', border: '1px solid #2ecc71', fontSize: '0.8rem', color: '#fff', textAlign: 'center' }}>
            {importStatus}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="modal-btn secondary"
            onClick={triggerBackupDownload}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.7rem' }}
          >
            <Download size={16} />
            <span>{langDict.exportBackupBtn || 'Exportar (JSON)'}</span>
          </button>

          <button
            className="modal-btn secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.7rem' }}
          >
            <Upload size={16} />
            <span>{langDict.importBackupBtn || 'Restaurar (JSON)'}</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressScreen;
