import React from 'react';
import { Minus, Plus, RotateCcw, ZoomIn } from 'lucide-react';
import { useModalAnimation } from '../hooks/useModalAnimation';

interface ZoomModalProps {
  isOpen: boolean;
  currentZoom: number;
  onZoomChange: (zoom: number) => void;
  onClose: () => void;
  langDict: Record<string, string>;
}

const PRESETS = [100, 125, 150, 175, 200];

export const ZoomModal: React.FC<ZoomModalProps> = ({
  isOpen,
  currentZoom,
  onZoomChange,
  onClose,
  langDict,
}) => {
  const { mounted, active } = useModalAnimation(isOpen, 200);

  if (!mounted) return null;

  const handleDecrement = () => {
    const next = Math.max(80, currentZoom - 10);
    onZoomChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(220, currentZoom + 10);
    onZoomChange(next);
  };

  return (
    <div 
      className={`modal-overlay ${active ? 'open active' : 'closing'}`} 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="zoom-modal-title"
    >
      <div className="modal-content zoom-modal-content" onClick={e => e.stopPropagation()}>
        <div className="zoom-modal-header">
          <div className="zoom-modal-icon-badge">
            <ZoomIn size={22} />
          </div>
          <div>
            <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem' }}>
              {langDict.zoomLabel || 'Escala / Zoom'}
            </h3>
            <p className="modal-desc" style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>
              {langDict.zoomDesc || 'Ajusta el tamaño visual de la aplicación.'}
            </p>
          </div>
        </div>

        <div className="zoom-display-badge">
          <span className="zoom-value">{currentZoom}%</span>
        </div>

        <div className="zoom-stepper">
          <button 
            className="zoom-step-btn" 
            onClick={handleDecrement}
            disabled={currentZoom <= 80}
            aria-label="Disminuir zoom"
          >
            <Minus size={20} />
          </button>

          <input
            type="range"
            min="80"
            max="220"
            step="5"
            value={currentZoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="zoom-slider"
          />

          <button 
            className="zoom-step-btn" 
            onClick={handleIncrement}
            disabled={currentZoom >= 220}
            aria-label="Aumentar zoom"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="zoom-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              className={`zoom-preset-btn ${currentZoom === preset ? 'active' : ''} ${preset === 150 ? 'recommended' : ''}`}
              onClick={() => onZoomChange(preset)}
            >
              {preset}%
              {preset === 150 && <span className="zoom-preset-star">★</span>}
            </button>
          ))}
        </div>

        <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
          <button 
            className="modal-btn secondary" 
            onClick={() => onZoomChange(100)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <RotateCcw size={16} />
            <span>{langDict.zoomReset || '100%'}</span>
          </button>
          <button className="modal-btn primary" onClick={onClose}>
            {langDict.zoomClose || 'Listo'}
          </button>
        </div>
      </div>
    </div>
  );
};
