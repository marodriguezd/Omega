import React, { useState } from 'react';
import { 
  Flame, 
  Wind, 
  Droplets, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Sun, 
  Moon, 
  Clock, 
  Activity,
  Timer,
  ZoomIn,
  Award,
  TrendingUp,
  Snowflake,
  Info
} from 'lucide-react';
import { useOmegaStats, formatTimeSeconds } from '../hooks/useOmegaStats';
import { ZoomModal } from './ZoomModal';
import { PushUpModal } from './PushUpModal';
import { AboutModal } from './AboutModal';
import { TabType } from './BottomNav';

interface DashboardProps {
  onNavigate: (tab: TabType) => void;
  langDict: Record<string, string>;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  currentTheme: string;
  onThemeToggle: () => void;
  currentZoom: number;
  onZoomChange: (zoom: number) => void;
}

const LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: '简体中文', flag: '🇨🇳' }
];

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  langDict,
  currentLang,
  onLanguageChange,
  currentTheme,
  onThemeToggle,
  currentZoom,
  onZoomChange,
}) => {
  const { stats } = useOmegaStats();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isPushUpModalOpen, setIsPushUpModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const activeLang = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="hub-dashboard">
      <header className="hub-header">
        <div className="hub-brand">
          <div className="hub-logo-badge zen-hex-badge">
            <img src="/assets/zen-icon.svg" alt="Zen" />
          </div>
          <div className="hub-brand-titles">
            <h1>{langDict.omegaTitle || 'Zen'}</h1>
            <p>{langDict.omegaSubtitle || 'Hub de Bienestar y Vitalidad'}</p>
          </div>
        </div>

        <div className="hub-header-actions">
          <button
            className="hub-icon-btn zoom-btn"
            onClick={() => setIsZoomModalOpen(true)}
            title={langDict.zoomLabel || 'Escala / Zoom'}
          >
            <ZoomIn size={18} />
          </button>

          <button
            className="hub-icon-btn about-btn"
            onClick={() => setIsAboutModalOpen(true)}
            title={langDict.aboutBtnTitle || 'Acerca de Zen'}
          >
            <Info size={18} />
          </button>

          <div className="hub-lang-container">
            <button
              className="hub-icon-btn lang-btn"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              title={langDict.langIndicator || 'Idioma'}
            >
              <span>{activeLang.flag}</span>
            </button>

            {isLangDropdownOpen && (
              <>
                <div 
                  className="lang-overlay active" 
                  onClick={() => setIsLangDropdownOpen(false)} 
                />
                <div className="lang-dropdown hub-lang-dropdown open" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, left: 'auto', zIndex: 1000 }}>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      className={`lang-option ${currentLang === lang.code ? 'active' : ''}`}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                    >
                      <span className="lang-flag">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            className="hub-icon-btn theme-toggle-btn"
            onClick={onThemeToggle}
            title="Cambiar tema"
          >
            {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <div className="dashboard-grid hub-cards-grid">
        <div className="dashboard-col dashboard-col-primary">
          <div className="glass-card streak-card">
        <div className="streak-info">
          <div className="streak-flame">🔥</div>
          <div className="streak-text">
            <h3>{stats.combinedStreak} {langDict.daysUnit || 'días'}</h3>
            <p>{langDict.combinedStreak || 'Racha Activa'}</p>
          </div>
        </div>
        <div className="routine-badge">
          {stats.habitsCompletedToday}/2 {langDict.habitsCompleted || 'completado'}
        </div>
      </div>

      <div className="glass-card">
        <h3 className="routine-title">
          <span>{langDict.todayGoal || 'Rutina de Hoy'}</span>
          {stats.habitsCompletedToday === 2 && (
            <span className="routine-badge">100%</span>
          )}
        </h3>

        <div className="routine-item" onClick={() => onNavigate('breathing')} role="button" tabIndex={0}>
          <div className="routine-item-left">
            <div className="routine-icon-box breathing">
              <Wind size={20} />
            </div>
            <div>
              <div className="routine-item-label">Bubble Breathing</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--color-muted)' }}>
                {stats.isBreathingDoneToday
                  ? (langDict.breathingDone || 'Completado hoy')
                  : (langDict.breathingPending || 'Pendiente')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {stats.isBreathingDoneToday ? (
              <CheckCircle2 size={22} color="#2ecc71" />
            ) : (
              <Circle size={22} color="var(--color-muted)" />
            )}
            <ChevronRight size={16} color="var(--color-muted)" />
          </div>
        </div>

        <div className="routine-item" onClick={() => onNavigate('hydro')} role="button" tabIndex={0}>
          <div className="routine-item-left">
            <div className="routine-icon-box hydro">
              <Droplets size={20} />
            </div>
            <div>
              <div className="routine-item-label">HydroCycle</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--color-muted)' }}>
                {stats.isHydroDoneToday
                  ? (langDict.hydroDone || 'Completado hoy')
                  : (langDict.hydroPending || 'Pendiente')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {stats.isHydroDoneToday ? (
              <CheckCircle2 size={22} color="#2ecc71" />
            ) : (
              <Circle size={22} color="var(--color-muted)" />
            )}
            <ChevronRight size={16} color="var(--color-muted)" />
          </div>
        </div>
      </div>

      <div className="quick-cards">
        <div className="quick-card breathing-card" onClick={() => onNavigate('breathing')}>
          <div className="quick-card-top">
            <div className="quick-card-icon">
              <Wind size={22} />
            </div>
            <ChevronRight size={18} color="var(--color-muted)" />
          </div>
          <div>
            <h4>Bubble Breathing</h4>
            <p>{langDict.bubbleDesc || 'Ciclos de respiración profunda y apnea guiada.'}</p>
          </div>
          <div className="quick-card-action">
            <span>{langDict.startBreathingBtn || 'Abrir'}</span>
            <ChevronRight size={14} />
          </div>
        </div>

        <div className="quick-card hydro-card" onClick={() => onNavigate('hydro')}>
          <div className="quick-card-top">
            <div className="quick-card-icon">
              <Droplets size={22} />
            </div>
            <ChevronRight size={18} color="var(--color-muted)" />
          </div>
          <div>
            <h4>HydroCycle</h4>
            <p>{langDict.hydroDesc || 'Duchas de contraste calor-frío y adaptación.'}</p>
          </div>
          <div className="quick-card-action">
            <span>{langDict.startHydroBtn || 'Abrir'}</span>
            <ChevronRight size={14} />
          </div>
        </div>

        <div className="quick-card" style={{ borderColor: 'rgba(255, 122, 0, 0.4)' }} onClick={() => onNavigate('challenges')}>
          <div className="quick-card-top">
            <div className="quick-card-icon" style={{ background: 'rgba(255, 122, 0, 0.2)', color: 'var(--omega-warm-amber, #ff7a00)' }}>
              <Award size={22} />
            </div>
            <ChevronRight size={18} color="var(--color-muted)" />
          </div>
          <div>
            <h4>{langDict.challengeTitle || 'Reto de 20 Días'}</h4>
            <p>{langDict.challengeSubtitle || '4 semanas de adaptación progresiva al agua fría.'}</p>
          </div>
          <div className="quick-card-action">
            <span style={{ color: 'var(--omega-warm-amber, #ff7a00)' }}>Ver Reto</span>
            <ChevronRight size={14} />
          </div>
        </div>

        <div className="quick-card" style={{ borderColor: 'rgba(255, 157, 0, 0.4)' }} onClick={() => setIsPushUpModalOpen(true)}>
          <div className="quick-card-top">
            <div className="quick-card-icon" style={{ background: 'rgba(255, 157, 0, 0.2)', color: '#ff9d00' }}>
              <Flame size={22} />
            </div>
            <ChevronRight size={18} color="var(--color-muted)" />
          </div>
          <div>
            <h4>{langDict.pushUpTitle || 'Test de Flexiones'}</h4>
            <p>{langDict.pushUpDesc || 'Flexiones en apnea sin aire en los pulmones.'}</p>
          </div>
          <div className="quick-card-action">
            <span style={{ color: '#ff9d00' }}>Hacer Test</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
        </div>

        <div className="dashboard-col dashboard-col-secondary">
          <div className="metrics-grid">
            <div className="metric-box">
              <div className="metric-icon" style={{ background: 'rgba(0, 168, 150, 0.2)', color: '#00a896' }}>
                <Activity size={18} />
              </div>
              <div className="metric-data">
                <h5>{stats.totalBreathingSessions}</h5>
                <p>{langDict.totalBreathingSessions || 'Sesiones respiración'}</p>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon" style={{ background: 'rgba(255, 157, 0, 0.2)', color: '#ff9d00' }}>
                <Timer size={18} />
              </div>
              <div className="metric-data">
                <h5>{formatTimeSeconds(stats.totalRetentionSeconds)}</h5>
                <p>{langDict.totalRetentionTime || 'Total apnea'}</p>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon" style={{ background: 'rgba(2, 128, 144, 0.2)', color: '#028090' }}>
                <Droplets size={18} />
              </div>
              <div className="metric-data">
                <h5>{stats.totalHydroSessions}</h5>
                <p>{langDict.totalHydroSessions || 'Sesiones de ducha'}</p>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon" style={{ background: 'rgba(0, 201, 167, 0.2)', color: '#00c9a7' }}>
                <Clock size={18} />
              </div>
              <div className="metric-data">
                <h5>{formatTimeSeconds(stats.totalColdSeconds)}</h5>
                <p>{langDict.totalColdTime || 'Total en frío'}</p>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="routine-title">
              <span>{langDict.recentActivityTitle || 'Actividad Reciente'}</span>
            </h3>

            {stats.recentActivities.length === 0 ? (
              <div 
                className="empty-state-card"
                style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.8rem 1rem',
                  borderRadius: 'var(--omega-radius-squircle-sm, 12px)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.08)',
                  gap: '0.5rem',
                  textAlign: 'center'
                }}
              >
                <div 
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    background: 'rgba(0, 168, 150, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--zen-teal-primary, #00a896)',
                    opacity: 0.8
                  }}
                >
                  <Activity size={20} />
                </div>
                <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.82rem', opacity: 0.85 }}>
                  {langDict.noRecentActivity || 'No hay sesiones registradas todavía.'}
                </p>
              </div>
            ) : (
          <div className="activity-list">
            {stats.recentActivities.map(act => (
              <div key={act.id} className="activity-item">
                <div className="activity-item-left">
                  <div
                    className="metric-icon"
                    style={{
                      background: act.type === 'breathing' ? 'rgba(76, 161, 175, 0.2)' : 'rgba(52, 152, 219, 0.2)',
                      color: act.type === 'breathing' ? '#4ca1af' : '#3498db',
                    }}
                  >
                    {act.type === 'breathing' ? <Wind size={16} /> : <Droplets size={16} />}
                  </div>
                  <div>
                    <div className="activity-title">{act.title}</div>
                    <div className="activity-date">
                      {new Date(act.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {act.sensations && act.sensations.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                        {act.sensations.map(s => (
                          <span
                            key={s}
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 5px',
                              borderRadius: '8px',
                              background: act.type === 'breathing' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(0, 210, 255, 0.12)',
                              border: act.type === 'breathing' ? '1px solid rgba(0, 240, 255, 0.25)' : '1px solid rgba(0, 210, 255, 0.25)',
                              color: act.type === 'breathing' ? '#00f0ff' : '#00d2ff',
                              fontWeight: 600
                            }}
                          >
                            {langDict[`sensation_${s}`] || s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="activity-item-right">
                  <div className="activity-detail">{act.detail}</div>
                  <div className="activity-summary">{act.summary}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

        </div>
      </div>

      <ZoomModal
        isOpen={isZoomModalOpen}
        currentZoom={currentZoom}
        onZoomChange={onZoomChange}
        onClose={() => setIsZoomModalOpen(false)}
        langDict={langDict}
      />

      <PushUpModal
        isOpen={isPushUpModalOpen}
        onClose={() => setIsPushUpModalOpen(false)}
        langDict={langDict}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        langDict={langDict}
      />
    </div>
  );
};
