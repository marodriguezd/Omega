import React from 'react';
import { Home, Wind, Droplets, Award, TrendingUp } from 'lucide-react';

export type TabType = 'hub' | 'breathing' | 'hydro' | 'challenges' | 'progress';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  langDict: Record<string, string>;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, langDict }) => {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Navegación móvil principal">
      <button
        className={`nav-tab tab-hub ${activeTab === 'hub' ? 'active' : ''}`}
        onClick={() => onSelectTab('hub')}
        aria-label={langDict.tabHub || 'Inicio'}
        aria-current={activeTab === 'hub' ? 'page' : undefined}
      >
        {activeTab === 'hub' && <span className="nav-tab-indicator active" />}
        <Home size={22} />
        <span className="nav-tab-label">{langDict.tabHub || 'Inicio'}</span>
      </button>

      <button
        className={`nav-tab tab-breathing ${activeTab === 'breathing' ? 'active' : ''}`}
        onClick={() => onSelectTab('breathing')}
        aria-label={langDict.tabBreathing || 'Respiración'}
        aria-current={activeTab === 'breathing' ? 'page' : undefined}
      >
        {activeTab === 'breathing' && <span className="nav-tab-indicator active" />}
        <Wind size={22} />
        <span className="nav-tab-label">{langDict.tabBreathing || 'Respiración'}</span>
      </button>

      <button
        className={`nav-tab tab-hydro ${activeTab === 'hydro' ? 'active' : ''}`}
        onClick={() => onSelectTab('hydro')}
        aria-label={langDict.tabHydro || 'Frío'}
        aria-current={activeTab === 'hydro' ? 'page' : undefined}
      >
        {activeTab === 'hydro' && <span className="nav-tab-indicator active" />}
        <Droplets size={22} />
        <span className="nav-tab-label">{langDict.tabHydro || 'Frío'}</span>
      </button>

      <button
        className={`nav-tab tab-challenges ${activeTab === 'challenges' ? 'active' : ''}`}
        onClick={() => onSelectTab('challenges')}
        aria-label={langDict.tabChallenges || 'Desafíos'}
        aria-current={activeTab === 'challenges' ? 'page' : undefined}
      >
        {activeTab === 'challenges' && <span className="nav-tab-indicator active" />}
        <Award size={22} />
        <span className="nav-tab-label">{langDict.tabChallenges || 'Desafíos'}</span>
      </button>

      <button
        className={`nav-tab tab-progress ${activeTab === 'progress' ? 'active' : ''}`}
        onClick={() => onSelectTab('progress')}
        aria-label={langDict.tabProgress || 'Progreso'}
        aria-current={activeTab === 'progress' ? 'page' : undefined}
      >
        {activeTab === 'progress' && <span className="nav-tab-indicator active" />}
        <TrendingUp size={22} />
        <span className="nav-tab-label">{langDict.tabProgress || 'Progreso'}</span>
      </button>
    </nav>
  );
};

