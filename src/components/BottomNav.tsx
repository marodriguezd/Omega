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
        aria-label={langDict.tabHydro || 'Duchas'}
        aria-current={activeTab === 'hydro' ? 'page' : undefined}
      >
        {activeTab === 'hydro' && <span className="nav-tab-indicator active" />}
        <Droplets size={22} />
        <span className="nav-tab-label">{langDict.tabHydro || 'Duchas'}</span>
      </button>
    </nav>
  );
};
