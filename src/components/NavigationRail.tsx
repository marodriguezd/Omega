import React from 'react';
import { Home, Wind, Droplets, Moon, Sun, ZoomIn } from 'lucide-react';
import { TabType } from './BottomNav';

export interface NavigationRailProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  langDict: Record<string, string>;
  currentTheme?: string;
  onThemeToggle?: () => void;
  onZoomClick?: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab,
  onSelectTab,
  langDict,
  currentTheme = 'dark',
  onThemeToggle,
  onZoomClick,
}) => {
  return (
    <aside 
      className="navigation-rail desktop-nav-rail" 
      aria-label="Desktop Navigation Rail"
      data-testid="navigation-rail"
      role="navigation"
    >
      {/* Top Section: Brand Logo Badge */}
      <div className="rail-top">
        <div 
          className="rail-logo-badge" 
          onClick={() => onSelectTab('hub')}
          title="Omega Hub"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onSelectTab('hub');
            }
          }}
        >
          Ω
        </div>
      </div>

      {/* Middle Section: Navigation Tab Items */}
      <nav className="rail-nav nav-rail-items" aria-label="Navegación principal">
        <button
          className={`rail-tab nav-rail-item tab-hub ${activeTab === 'hub' ? 'active' : ''}`}
          onClick={() => onSelectTab('hub')}
          aria-label={langDict.tabHub || 'Inicio'}
          title={langDict.tabHub || 'Inicio'}
          aria-current={activeTab === 'hub' ? 'page' : undefined}
          data-tab="hub"
        >
          {activeTab === 'hub' && <span className="nav-tab-indicator rail-indicator active" />}
          <div className="nav-rail-icon-wrapper">
            <Home size={22} />
          </div>
          <span className="rail-tab-label nav-rail-label nav-tab-label">{langDict.tabHub || 'Inicio'}</span>
        </button>

        <button
          className={`rail-tab nav-rail-item tab-breathing ${activeTab === 'breathing' ? 'active' : ''}`}
          onClick={() => onSelectTab('breathing')}
          aria-label={langDict.tabBreathing || 'Respiración'}
          title={langDict.tabBreathing || 'Respiración'}
          aria-current={activeTab === 'breathing' ? 'page' : undefined}
          data-tab="breathing"
        >
          {activeTab === 'breathing' && <span className="nav-tab-indicator rail-indicator active" />}
          <div className="nav-rail-icon-wrapper">
            <Wind size={22} />
          </div>
          <span className="rail-tab-label nav-rail-label nav-tab-label">{langDict.tabBreathing || 'Respiración'}</span>
        </button>

        <button
          className={`rail-tab nav-rail-item tab-hydro ${activeTab === 'hydro' ? 'active' : ''}`}
          onClick={() => onSelectTab('hydro')}
          aria-label={langDict.tabHydro || 'Duchas'}
          title={langDict.tabHydro || 'Duchas'}
          aria-current={activeTab === 'hydro' ? 'page' : undefined}
          data-tab="hydro"
        >
          {activeTab === 'hydro' && <span className="nav-tab-indicator rail-indicator active" />}
          <div className="nav-rail-icon-wrapper">
            <Droplets size={22} />
          </div>
          <span className="rail-tab-label nav-rail-label nav-tab-label">{langDict.tabHydro || 'Duchas'}</span>
        </button>
      </nav>

      {/* Bottom Section: Theme & Zoom Quick Actions */}
      <div className="rail-bottom">
        {onZoomClick && (
          <button
            className="rail-action-btn zoom-btn"
            onClick={onZoomClick}
            aria-label={langDict.zoomLabel || 'Escala / Zoom'}
            title={langDict.zoomLabel || 'Escala / Zoom'}
          >
            <ZoomIn size={18} />
          </button>
        )}

        {onThemeToggle && (
          <button
            className="rail-action-btn theme-toggle-btn"
            onClick={onThemeToggle}
            aria-label="Cambiar tema"
            title="Cambiar tema"
          >
            {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
      </div>
    </aside>
  );
};

export default NavigationRail;
