import React from 'react';
import { Home, Wind, Droplets } from 'lucide-react';

export type TabType = 'hub' | 'breathing' | 'hydro';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  langDict: Record<string, string>;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, langDict }) => {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-tab tab-hub ${activeTab === 'hub' ? 'active' : ''}`}
        onClick={() => onSelectTab('hub')}
        aria-label={langDict.tabHub || 'Inicio'}
      >
        {activeTab === 'hub' && <span className="nav-tab-indicator" />}
        <Home size={22} />
        <span className="nav-tab-label">{langDict.tabHub || 'Inicio'}</span>
      </button>

      <button
        className={`nav-tab tab-breathing ${activeTab === 'breathing' ? 'active' : ''}`}
        onClick={() => onSelectTab('breathing')}
        aria-label={langDict.tabBreathing || 'Respiración'}
      >
        {activeTab === 'breathing' && <span className="nav-tab-indicator" />}
        <Wind size={22} />
        <span className="nav-tab-label">{langDict.tabBreathing || 'Respiración'}</span>
      </button>

      <button
        className={`nav-tab tab-hydro ${activeTab === 'hydro' ? 'active' : ''}`}
        onClick={() => onSelectTab('hydro')}
        aria-label={langDict.tabHydro || 'Duchas'}
      >
        {activeTab === 'hydro' && <span className="nav-tab-indicator" />}
        <Droplets size={22} />
        <span className="nav-tab-label">{langDict.tabHydro || 'Duchas'}</span>
      </button>
    </nav>
  );
};
