import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initAllTranslations, HUB_TRANSLATIONS } from './translations';
import { BottomNav, TabType } from './components/BottomNav';
import { NavigationRail } from './components/NavigationRail';
import { Dashboard } from './components/Dashboard';
import { ExitConfirmModal } from './components/ExitConfirmModal';
import { enableKeepAwake, disableKeepAwake, registerBackButtonHandler } from './services/nativeService';

import BubbleBreathingApp from '../Bubble-Breathing/src/App';
import HydrocicleApp from '../Hydrocicle/src/App';
import { ChallengesScreen } from './components/ChallengesScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { useOmegaStats } from './hooks/useOmegaStats';

import './styles/hub.css';
import './styles/responsive.css';
import './styles/animations.css';

export function App() {
  const { stats } = useOmegaStats();
  const [activeTab, setActiveTab] = useState<TabType>('hub');
  const [currentLang, setCurrentLang] = useState<string>(() => {
    return localStorage.getItem('omega_language') || 'es';
  });
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem('omega_theme') || 'dark';
  });
  const [currentZoom, setCurrentZoom] = useState<number>(() => {
    const saved = localStorage.getItem('omega_zoom');
    if (!saved) return 100;
    const parsed = Number(saved);
    return Number.isFinite(parsed) ? Math.min(220, Math.max(80, parsed)) : 100;
  });
  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.min(220, Math.max(80, newZoom));
    setCurrentZoom(clamped);
  };
  const [showExitModal, setShowExitModal] = useState(false);
  const pendingTabRef = useRef<TabType | null>(null);

  // Sync zoom / UI scale
  useEffect(() => {
    // Clear buggy CSS zoom property
    (document.documentElement.style as any).zoom = '';

    const scaleFactor = currentZoom / 100;
    document.documentElement.style.setProperty('--ui-scale', scaleFactor.toString());

    const clampedScale = Math.min(2.2, Math.max(0.8, scaleFactor));
    document.documentElement.style.setProperty('--ui-scale-clamped', clampedScale.toString());

    localStorage.setItem('omega_zoom', currentZoom.toString());
  }, [currentZoom]);

  // Initialize and merge translations
  useEffect(() => {
    initAllTranslations();
  }, []);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('omega_theme', currentTheme);

    // Sync theme to sub-apps configurations
    try {
      const bCfg = JSON.parse(localStorage.getItem('bubbleBreathingConfig') || '{}');
      bCfg.theme = currentTheme;
      localStorage.setItem('bubbleBreathingConfig', JSON.stringify(bCfg));
    } catch (e) {}

    try {
      const hCfg = JSON.parse(localStorage.getItem('hydrocicleConfig') || '{}');
      hCfg.theme = currentTheme;
      localStorage.setItem('hydrocicleConfig', JSON.stringify(hCfg));
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('omega-sync'));
  }, [currentTheme]);

  // Sync language
  const handleLanguageChange = useCallback((lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem('omega_language', lang);

    try {
      const bCfg = JSON.parse(localStorage.getItem('bubbleBreathingConfig') || '{}');
      bCfg.language = lang;
      localStorage.setItem('bubbleBreathingConfig', JSON.stringify(bCfg));
    } catch (e) {}

    try {
      const hCfg = JSON.parse(localStorage.getItem('hydrocicleConfig') || '{}');
      hCfg.language = lang;
      localStorage.setItem('hydrocicleConfig', JSON.stringify(hCfg));
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('omega-sync'));
  }, []);

  // Session state event tracker from sub-apps
  const sessionStatesRef = useRef<{ bubble: boolean; hydro: boolean; challenge: boolean }>({
    bubble: false,
    hydro: false,
    challenge: false,
  });

  useEffect(() => {
    const handleSessionState = (e: any) => {
      if (e.detail?.app === 'bubble' || e.detail?.app === 'hydro' || e.detail?.app === 'challenge') {
        sessionStatesRef.current[e.detail.app as 'bubble' | 'hydro' | 'challenge'] = Boolean(e.detail.active);
      }
    };
    window.addEventListener('omega-session-state', handleSessionState as EventListener);
    return () => {
      window.removeEventListener('omega-session-state', handleSessionState as EventListener);
    };
  }, []);

  // Listen for sync events from sub-apps
  useEffect(() => {
    const handleSubappSync = (e: any) => {
      if (e.detail?.language) {
        setCurrentLang(e.detail.language);
      }
      if (e.detail?.theme) {
        setCurrentTheme(e.detail.theme);
      }
      if (e.detail?.type) {
        window.dispatchEvent(new CustomEvent('omega-sync'));
      }
    };
    window.addEventListener('subapp-sync', handleSubappSync);
    return () => {
      window.removeEventListener('subapp-sync', handleSubappSync);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setCurrentTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Check if a sub-app is in an active session (by inspecting event bus and scoped DOM screens)
  const isSessionActive = useCallback((): boolean => {
    if (activeTab === 'breathing') {
      if (sessionStatesRef.current.bubble) return true;
      const activeScreen = document.querySelector(
        '.view-bubble #exerciseScreen.active, .view-bubble #exerciseScreen, .view-bubble #retentionScreen, .view-bubble #recoveryScreen, #exerciseScreen.active, #exerciseScreen, #retentionScreen, #recoveryScreen'
      );
      return !!activeScreen;
    }
    if (activeTab === 'hydro') {
      if (sessionStatesRef.current.hydro) return true;
      const showerScreen = document.querySelector(
        '.view-hydro #exerciseScreen.active, .view-hydro #exerciseScreen, .view-hydro .shower-screen, #exerciseScreen.active, .shower-screen'
      );
      return !!showerScreen;
    }
    if (activeTab === 'challenges') {
      if (sessionStatesRef.current.challenge) return true;
      const challengeScreen = document.querySelector('.view-challenges .screen.active');
      return !!challengeScreen;
    }
    return false;
  }, [activeTab]);

  // Switch tabs with active session protection
  const handleSelectTab = useCallback((targetTab: TabType) => {
    if (targetTab === activeTab) return;

    if (isSessionActive()) {
      pendingTabRef.current = targetTab;
      window.dispatchEvent(new CustomEvent('omega-pause-session', { detail: { pause: true } }));
      setShowExitModal(true);
      return;
    }

    setActiveTab(targetTab);
  }, [activeTab, isSessionActive]);

  const handleConfirmExit = useCallback(() => {
    setShowExitModal(false);
    disableKeepAwake();
    window.dispatchEvent(new CustomEvent('omega-pause-session', { detail: { pause: false, exit: true } }));
    if (pendingTabRef.current) {
      setActiveTab(pendingTabRef.current);
      pendingTabRef.current = null;
    } else {
      setActiveTab('hub');
    }
  }, []);

  const handleCancelExit = useCallback(() => {
    setShowExitModal(false);
    window.dispatchEvent(new CustomEvent('omega-pause-session', { detail: { pause: false } }));
    pendingTabRef.current = null;
  }, []);

  // Keep Awake management: activate when in exercise/shower tab
  useEffect(() => {
    if (activeTab === 'breathing' || activeTab === 'hydro') {
      enableKeepAwake();
    } else {
      disableKeepAwake();
    }
  }, [activeTab]);

  // Android Back Button handler
  useEffect(() => {
    const cleanup = registerBackButtonHandler(() => {
      if (showExitModal) {
        setShowExitModal(false);
        return true;
      }

      if (activeTab !== 'hub') {
        if (isSessionActive()) {
          pendingTabRef.current = 'hub';
          window.dispatchEvent(new CustomEvent('omega-pause-session', { detail: { pause: true } }));
          setShowExitModal(true);
          return true;
        }
        setActiveTab('hub');
        return true;
      }

      // In hub root: return false so Capacitor exits the app
      return false;
    });

    return () => {
      cleanup();
    };
  }, [activeTab, isSessionActive, showExitModal]);

  const langDict = (HUB_TRANSLATIONS[currentLang] || HUB_TRANSLATIONS['es']) as Record<string, string>;

  return (
    <div className="omega-app">
      {/* Desktop Navigation Rail (>=768px) */}
      <NavigationRail
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        langDict={langDict}
        currentTheme={currentTheme}
        onThemeToggle={toggleTheme}
      />

      {/* View Container with GPU-accelerated Cross-Fade */}
      <main className="omega-views-container">
        {/* Tab: Hub / Dashboard */}
        <div 
          className={`omega-view view-hub ${activeTab === 'hub' ? 'active' : 'hidden'}`}
          aria-hidden={activeTab !== 'hub'}
        >
          <Dashboard
            onNavigate={(tab) => setActiveTab(tab)}
            langDict={langDict}
            currentLang={currentLang}
            onLanguageChange={handleLanguageChange}
            currentTheme={currentTheme}
            onThemeToggle={toggleTheme}
            currentZoom={currentZoom}
            onZoomChange={handleZoomChange}
          />
        </div>

        {/* Tab: Bubble-Breathing */}
        <div 
          className={`omega-view view-bubble ${activeTab === 'breathing' ? 'active' : 'hidden'}`}
          aria-hidden={activeTab !== 'breathing'}
        >
          <BubbleBreathingApp />
        </div>

        {/* Tab: Hydrocicle */}
        <div 
          className={`omega-view view-hydro ${activeTab === 'hydro' ? 'active' : 'hidden'}`}
          aria-hidden={activeTab !== 'hydro'}
        >
          <HydrocicleApp />
        </div>

        {/* Tab: Challenges (20-Day Cold Challenge) */}
        <div 
          className={`omega-view view-challenges ${activeTab === 'challenges' ? 'active' : 'hidden'}`}
          aria-hidden={activeTab !== 'challenges'}
        >
          <ChallengesScreen langDict={langDict} />
        </div>

        {/* Tab: Progress & Badges */}
        <div 
          className={`omega-view view-progress ${activeTab === 'progress' ? 'active' : 'hidden'}`}
          aria-hidden={activeTab !== 'progress'}
        >
          <ProgressScreen langDict={langDict} combinedStreak={stats.combinedStreak} />
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        langDict={langDict}
      />

      {/* Modal on attempt to exit active session */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
        langDict={langDict}
      />
    </div>
  );
}

export default App;
