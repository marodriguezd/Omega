import React, { useState, useEffect, useRef } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Circle, 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  Snowflake, 
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { 
  loadWimHofStore, 
  ChallengeDay, 
  updateChallengeDay, 
  resetChallenge,
  recordColdSession
} from '../services/omegaStore';
import { BreathingSphere } from './BreathingSphere';
import { playTransitionCue, playCompletionFanfare, playCountdownBeep } from '../services/zenAudioService';
import { enableKeepAwake, disableKeepAwake, triggerHaptic } from '../services/nativeService';

interface ChallengesScreenProps {
  langDict: Record<string, string>;
}

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({ langDict }) => {
  const [storeData, setStoreData] = useState(() => loadWimHofStore());
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const store = loadWimHofStore();
    const firstPending = store.challengeDays.find(d => !d.completed);
    return firstPending ? firstPending.day : 20;
  });

  // Active challenge session runner
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedSecRef = useRef(0);

  const refreshData = () => {
    const updated = loadWimHofStore();
    setStoreData(updated);
  };

  useEffect(() => {
    window.addEventListener('omega-store-update', refreshData);
    window.addEventListener('omega-sync', refreshData);
    return () => {
      window.removeEventListener('omega-store-update', refreshData);
      window.removeEventListener('omega-sync', refreshData);
    };
  }, []);

  // Listen for global pause/exit events from Hub
  useEffect(() => {
    const handlePause = (e: any) => {
      if (e.detail?.exit) {
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
        setIsSessionActive(false);
        setIsPlaying(false);
        disableKeepAwake();
      } else if (e.detail?.pause !== undefined) {
        if (e.detail.pause) {
          setIsPlaying(false);
        }
      }
    };
    window.addEventListener('omega-pause-session', handlePause);
    return () => {
      window.removeEventListener('omega-pause-session', handlePause);
    };
  }, []);

  // Track session state to protect navigation
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('omega-session-state', {
      detail: { app: 'challenge', active: isSessionActive }
    }));
  }, [isSessionActive]);

  const currentDayItem = storeData.challengeDays.find(d => d.day === selectedDay) || storeData.challengeDays[0];
  const completedCount = storeData.challengeDays.filter(d => d.completed).length;
  const progressPercent = Math.round((completedCount / 20) * 100);

  // Group days by weeks
  const weeks = [
    { number: 1, title: langDict.week1Title || 'Semana 1: Adaptación (15s)', days: storeData.challengeDays.slice(0, 5) },
    { number: 2, title: langDict.week2Title || 'Semana 2: Resiliencia (30s)', days: storeData.challengeDays.slice(5, 10) },
    { number: 3, title: langDict.week3Title || 'Semana 3: Fortaleza (45s)', days: storeData.challengeDays.slice(10, 15) },
    { number: 4, title: langDict.week4Title || 'Semana 4: Maestría (60s)', days: storeData.challengeDays.slice(15, 20) }
  ];

  const startDaySession = (day: ChallengeDay) => {
    setSelectedDay(day.day);
    setTimeLeft(day.targetSec);
    accumulatedSecRef.current = 0;
    startTimeRef.current = Date.now();
    setIsSessionActive(true);
    setIsPlaying(true);
    enableKeepAwake();
    playTransitionCue('cold', 0.8);
    triggerHaptic('medium');
  };

  const stopDaySession = () => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setIsSessionActive(false);
    setIsPlaying(false);
    disableKeepAwake();
  };

  // Timer loop for challenge session
  useEffect(() => {
    if (!isSessionActive || !isPlaying) {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    const targetDuration = currentDayItem.targetSec;

    const tick = () => {
      if (!startTimeRef.current) return;
      const now = Date.now();
      const elapsedSec = accumulatedSecRef.current + Math.floor((now - startTimeRef.current) / 1000);
      const remaining = Math.max(0, targetDuration - elapsedSec);
      setTimeLeft(remaining);

      // Final countdown beeps
      if (remaining > 0 && remaining <= 5) {
        playCountdownBeep(0.7, remaining);
      }

      if (remaining <= 0) {
        // Day Challenge Finished!
        playCompletionFanfare(0.9);
        triggerHaptic('success');
        updateChallengeDay(currentDayItem.day, true, targetDuration);
        recordColdSession({
          id: `challenge-day-${currentDayItem.day}-${Date.now()}`,
          date: Date.now(),
          type: 'challenge',
          totalColdTime: targetDuration,
          challengeDay: currentDayItem.day,
          notes: `Reto 20 Días - Día ${currentDayItem.day}`
        });
        stopDaySession();
        refreshData();
        return;
      }

      timerRef.current = requestAnimationFrame(tick);
    };

    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [isSessionActive, isPlaying, currentDayItem]);

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      if (startTimeRef.current) {
        accumulatedSecRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
      }
      setIsPlaying(false);
    } else {
      startTimeRef.current = Date.now();
      setIsPlaying(true);
    }
  };

  // Active Session View
  if (isSessionActive) {
    const targetSec = currentDayItem.targetSec;
    const elapsed = targetSec - timeLeft;
    const ringPercent = targetSec > 0 ? (elapsed / targetSec) * 100 : 0;

    return (
      <div className="screen active" style={{ justifyContent: 'space-evenly', padding: '1.5rem 1rem' }}>
        <div className="round-info" style={{ color: 'var(--omega-warm-amber, #ff7a00)', fontWeight: 700 }}>
          {langDict.challengeTitle || 'Reto de 20 Días'} • {langDict.dayLabel || 'Día'} {currentDayItem.day}
        </div>

        <div className="instruction" style={{ color: 'var(--omega-cold-blue, #00d2ff)', fontSize: '1.4rem', fontWeight: 700 }}>
          {langDict.coldPhase || 'Agua Fría'} ({targetSec}s)
        </div>

        <BreathingSphere
          phase="cold"
          scale={isPlaying ? 1.05 : 1.0}
          isPulsing={isPlaying}
          progress={ringPercent}
          icon={<Snowflake size={52} color="white" />}
          onClick={handleTogglePlayPause}
        />

        <div className="timer-display" style={{ margin: '0.4rem 0', color: '#fff', fontWeight: 800 }}>
          {timeLeft}s
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', textAlign: 'center' }}>
          {langDict.horseStanceGuide || 'Respira hondo y calmado, relaja los hombros y abraza el frío.'}
        </div>

        <div className="controls-panel" style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <button 
            className="control-btn" 
            title="Cancelar"
            onClick={stopDaySession}
          >
            <RotateCcw size={22} />
          </button>
          <button 
            className="control-btn primary-btn" 
            onClick={handleTogglePlayPause}
            title={isPlaying ? 'Pausa' : 'Reanudar'}
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
          </button>
        </div>
      </div>
    );
  }

  // Challenge Overview & Roadmap
  return (
    <div className="screen" style={{ justifyContent: 'flex-start', overflowY: 'auto', padding: '1rem' }}>
      {/* Header Banner */}
      <div className="glass-card streak-card" style={{ width: '100%', marginBottom: '1rem' }}>
        <div className="streak-info">
          <div className="streak-flame" style={{ fontSize: '2.4rem' }}>❄️</div>
          <div className="streak-text">
            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{langDict.challengeTitle || 'Reto de 20 Días'}</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-muted)' }}>
              {langDict.challengeSubtitle || '4 semanas de adaptación al agua fría'}
            </p>
          </div>
        </div>
        <div className="routine-badge" style={{ background: 'rgba(0, 240, 255, 0.2)', color: '#00f0ff' }}>
          {completedCount}/20 ({progressPercent}%)
        </div>
      </div>

      {/* Selected Day Quick Action Card */}
      <div 
        className="glass-card" 
        style={{ 
          width: '100%', 
          marginBottom: '1.2rem',
          border: '1px solid var(--omega-warm-amber, #ff7a00)',
          boxShadow: '0 4px 20px rgba(255, 122, 0, 0.15)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--omega-warm-amber, #ff7a00)" />
            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
              {langDict.dayLabel || 'Día'} {currentDayItem.day} ({currentDayItem.targetSec}s)
            </h4>
          </div>
          <span style={{ 
            fontSize: '0.75rem', 
            padding: '0.2rem 0.6rem', 
            borderRadius: '12px',
            background: currentDayItem.completed ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 157, 0, 0.2)',
            color: currentDayItem.completed ? '#2ecc71' : '#ff9d00',
            fontWeight: 600
          }}>
            {currentDayItem.completed ? (langDict.completedBadge || 'Completado') : (langDict.pendingBadge || 'Pendiente')}
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', margin: '0.4rem 0 1rem' }}>
          Dúchate con agua caliente normalmente. Al terminar, gira al agua fría y mantén la calma durante {currentDayItem.targetSec} segundos.
        </p>

        <button 
          className="start-button" 
          onClick={() => startDaySession(currentDayItem)}
          style={{ 
            width: '100%', 
            background: 'linear-gradient(135deg, var(--omega-warm-amber, #ff7a00), var(--omega-cold-blue, #00d2ff))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Play size={18} fill="currentColor" />
          <span>{langDict.startDayChallengeBtn || 'Iniciar Día'} {currentDayItem.day} ({currentDayItem.targetSec}s)</span>
        </button>
      </div>

      {/* 4-Week Schedule Grid */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {weeks.map(w => (
          <div key={w.number} className="glass-card" style={{ width: '100%' }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: 'var(--omega-primary-cyan, #00f0ff)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Snowflake size={16} />
              <span>{w.title}</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {w.days.map(d => {
                const isSelected = d.day === selectedDay;
                return (
                  <button
                    key={d.day}
                    onClick={() => setSelectedDay(d.day)}
                    style={{
                      background: d.completed 
                        ? 'rgba(46, 204, 113, 0.18)' 
                        : isSelected 
                          ? 'rgba(255, 122, 0, 0.25)' 
                          : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected 
                        ? '2px solid var(--omega-warm-amber, #ff7a00)' 
                        : d.completed 
                          ? '1px solid rgba(46, 204, 113, 0.5)' 
                          : '1px solid var(--color-glass-border)',
                      borderRadius: 'var(--omega-radius-squircle-sm, 12px)',
                      padding: '0.6rem 0.2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.2rem',
                      cursor: 'pointer',
                      color: '#fff',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>D{d.day}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>{d.targetSec}s</span>
                    {d.completed ? (
                      <CheckCircle2 size={16} color="#2ecc71" />
                    ) : (
                      <Circle size={16} color="var(--color-muted)" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Reset Option */}
      <div style={{ textAlign: 'center', padding: '0.5rem' }}>
        <button
          onClick={() => {
            if (confirm('¿Deseas reiniciar el Reto de 20 Días al Día 1?')) {
              resetChallenge();
              refreshData();
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-muted)',
            fontSize: '0.78rem',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          {langDict.resetChallengeBtn || 'Reiniciar Reto al Día 1'}
        </button>
      </div>
    </div>
  );
};

export default ChallengesScreen;
