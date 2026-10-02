import React, { useState, useEffect, useRef } from 'react';
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
  FileCheck
} from 'lucide-react';
import { 
  loadWimHofStore, 
  WimHofStoreData, 
  evaluateBadges, 
  triggerBackupDownload, 
  importBackupJson 
} from '../services/omegaStore';
import { formatTimeSeconds } from '../hooks/useOmegaStats';

interface ProgressScreenProps {
  langDict: Record<string, string>;
  combinedStreak: number;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ langDict, combinedStreak }) => {
  const [storeData, setStoreData] = useState<WimHofStoreData>(() => loadWimHofStore());
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    };
  }, [combinedStreak]);

  // Aggregate Metrics
  const totalBreathing = storeData.breathingHistory.length;
  const totalRetentionSec = storeData.breathingHistory.reduce((sum, s) => sum + (s.totalRetentionTime || 0), 0);
  const maxRetentionSec = storeData.breathingHistory.reduce((max, s) => {
    const top = Math.max(...(s.retentionTimes || [0]));
    return Math.max(max, top);
  }, 0);

  const totalColdSessions = storeData.coldHistory.length;
  const totalColdSec = storeData.coldHistory.reduce((sum, s) => sum + (s.totalColdTime || 0), 0);
  const maxColdSec = storeData.coldHistory.reduce((max, s) => Math.max(max, s.totalColdTime || 0), 0);

  // Generate 28-day / 4-week activity heatmap
  const generateHeatmapDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Look back 28 days
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86400000;

      const hasBreath = storeData.breathingHistory.some(b => b.date >= dayStart && b.date < dayEnd);
      const hasCold = storeData.coldHistory.some(c => c.date >= dayStart && c.date < dayEnd);

      days.push({
        date: d,
        dayOfMonth: d.getDate(),
        hasBreath,
        hasCold,
        level: (hasBreath && hasCold) ? 2 : (hasBreath || hasCold) ? 1 : 0
      });
    }
    return days;
  };

  const heatmapDays = generateHeatmapDays();

  // Handle JSON Import
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
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="screen" style={{ justifyContent: 'flex-start', overflowY: 'auto', padding: '1rem', paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div className="glass-card streak-card" style={{ width: '100%', marginBottom: '1rem' }}>
        <div className="streak-info">
          <div className="streak-flame" style={{ fontSize: '2.4rem' }}>Ω</div>
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

      {/* Vitality Heatmap Calendar */}
      <div className="glass-card" style={{ width: '100%', marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', color: 'var(--omega-primary-cyan, #00f0ff)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={18} />
          <span>{langDict.heatmapTitle || 'Calendario de Vitalidad (Últimas 4 semanas)'}</span>
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
          {heatmapDays.map((d, idx) => {
            let bg = 'rgba(255, 255, 255, 0.04)';
            let borderColor = 'rgba(255, 255, 255, 0.08)';
            if (d.level === 2) {
              bg = 'linear-gradient(135deg, rgba(255, 122, 0, 0.5), rgba(46, 204, 113, 0.6))';
              borderColor = 'var(--omega-warm-amber, #ff7a00)';
            } else if (d.level === 1) {
              bg = d.hasBreath ? 'rgba(255, 157, 0, 0.35)' : 'rgba(0, 240, 255, 0.35)';
              borderColor = d.hasBreath ? '#ff9d00' : '#00f0ff';
            }

            return (
              <div
                key={idx}
                title={`${d.date.toLocaleDateString()}: ${d.level === 2 ? 'Respiración + Frío' : d.hasBreath ? 'Respiración' : d.hasCold ? 'Frío' : 'Sin sesión'}`}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 'var(--omega-radius-squircle-sm, 8px)',
                  background: bg,
                  border: `1px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: d.level > 0 ? '#fff' : 'var(--color-muted)'
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

      {/* Metric Cards Grid */}
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

      {/* Hexagonal Badges Showcase */}
      <div className="glass-card" style={{ width: '100%', marginBottom: '1.2rem' }}>
        <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--omega-warm-amber, #ff7a00)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Award size={20} />
          <span>{langDict.badgesTitle || 'Insignias Hexagonales de Logro'}</span>
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
          {storeData.badges.map(b => {
            const title = (langDict[b.titleKey] as string) || b.titleKey;
            const desc = (langDict[b.descKey] as string) || b.descKey;

            return (
              <div
                key={b.id}
                style={{
                  background: b.unlocked 
                    ? 'rgba(255, 122, 0, 0.12)' 
                    : 'rgba(255, 255, 255, 0.03)',
                  border: b.unlocked 
                    ? '1.5px solid var(--omega-warm-amber, #ff7a00)' 
                    : '1px solid var(--color-glass-border)',
                  borderRadius: 'var(--omega-radius-squircle-md, 18px)',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '0.4rem',
                  boxShadow: b.unlocked ? '0 4px 16px rgba(255, 122, 0, 0.2)' : 'none',
                  opacity: b.unlocked ? 1 : 0.55
                }}
              >
                {/* Hexagonal Motif Badge Container */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    position: 'relative',
                    filter: b.unlocked ? 'drop-shadow(0 0 8px rgba(255, 122, 0, 0.6))' : 'grayscale(1)'
                  }}
                >
                  <svg
                    viewBox="0 0 200 200"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                  >
                    <path
                      d="M 87.88 21.00 Q 100.00 14.00 112.12 21.00 L 162.35 50.00 Q 174.48 57.00 174.48 71.00 L 174.48 129.00 Q 174.48 143.00 162.35 150.00 L 112.12 179.00 Q 100.00 186.00 87.88 179.00 L 37.65 150.00 Q 25.52 143.00 25.52 129.00 L 25.52 71.00 Q 25.52 57.00 37.65 50.00 Z"
                      fill={b.unlocked ? 'rgba(255, 122, 0, 0.25)' : 'rgba(255, 255, 255, 0.05)'}
                      stroke={b.unlocked ? 'var(--omega-warm-amber, #ff7a00)' : 'rgba(255, 255, 255, 0.2)'}
                      strokeWidth="6"
                    />
                  </svg>
                  <span>{b.icon}</span>
                </div>

                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: b.unlocked ? '#fff' : 'var(--color-muted)' }}>
                  {title}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)', lineHeight: 1.3 }}>
                  {desc}
                </div>

                {b.unlocked && (
                  <span style={{ fontSize: '0.65rem', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                    <CheckCircle2 size={12} /> Desbloqueado
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Offline Data Portability & Backup */}
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
