import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initAllTranslations, HUB_TRANSLATIONS } from './translations';
import { BottomNav, TabType } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { ExitConfirmModal } from './components/ExitConfirmModal';
import { enableKeepAwake, disableKeepAwake, registerBackButtonHandler } from './services/nativeService';

import BubbleBreathingApp from '../Bubble-Breathing/src/App';
import HydrocicleApp from '../Hydrocicle/src/App';

import './styles/hub.css';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('hub');
  const [currentLang, setCurrentLang] = useState<string>(() => {
    return localStorage.getItem('omega_language') || 'es';
  });
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem('omega_theme') || 'dark';
  });
  const [currentZoom, setCurrentZoom] = useState<number>(() => {
    const saved = localStorage.getItem('omega_zoom');
    return saved ? Number(saved) : 100;
  });
  const [showExitModal, setShowExitModal] = useState(false);
  const pendingTabRef = useRef<TabType | null>(null);

  // Sync zoom / UI scale
  useEffect(() => {
    // Clear buggy CSS zoom property
    (document.documentElement.style as any).zoom = '';

    const scaleFactor = currentZoom / 100;
    document.documentElement.style.setProperty('--ui-scale', scaleFactor.toString());

    const clampedScale = Math.min(1.3, Math.max(0.85, scaleFactor));
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

  // Listen for sync events from sub-apps
  useEffect(() => {
    const handleSubappSync = (e: any) => {
      if (e.detail?.language) {
        setCurrentLang(e.detail.language);
      }
      if (e.detail?.theme) {
        setCurrentTheme(e.detail.theme);
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

  // Check if a sub-app is in an active session (by inspecting DOM or active screens)
  const isSessionActive = useCallback((): boolean => {
    if (activeTab === 'breathing') {
      const activeScreen = document.querySelector('#exerciseScreen, #retentionScreen, #recoveryScreen');
      return !!activeScreen;
    }
    if (activeTab === 'hydro') {
      const showerScreen = document.querySelector('.shower-screen');
      return !!showerScreen;
    }
    return false;
  }, [activeTab]);

  // Switch tabs with active session protection
  const handleSelectTab = useCallback((targetTab: TabType) => {
    if (targetTab === activeTab) return;

    if (isSessionActive()) {
      pendingTabRef.current = targetTab;
      setShowExitModal(true);
      return;
    }

    setActiveTab(targetTab);
  }, [activeTab, isSessionActive]);

  const handleConfirmExit = useCallback(() => {
    setShowExitModal(false);
    disableKeepAwake();
    if (pendingTabRef.current) {
      setActiveTab(pendingTabRef.current);
      pendingTabRef.current = null;
    } else {
      setActiveTab('hub');
    }
  }, []);

  const handleCancelExit = useCallback(() => {
    setShowExitModal(false);
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
      {/* Tab: Hub / Dashboard */}
      <div className={`omega-view ${activeTab === 'hub' ? '' : 'hidden'}`}>
        <Dashboard
          onNavigate={(tab) => setActiveTab(tab)}
          langDict={langDict}
          currentLang={currentLang}
          onLanguageChange={handleLanguageChange}
          currentTheme={currentTheme}
          onThemeToggle={toggleTheme}
          currentZoom={currentZoom}
          onZoomChange={setCurrentZoom}
        />
      </div>

      {/* Tab: Bubble-Breathing */}
      <div className={`omega-view view-bubble ${activeTab === 'breathing' ? '' : 'hidden'}`}>
        <BubbleBreathingApp />
      </div>

      {/* Tab: Hydrocicle */}
      <div className={`omega-view view-hydro ${activeTab === 'hydro' ? '' : 'hidden'}`}>
        <HydrocicleApp />
      </div>

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
