import React from 'react';
import { Info, Wind, Snowflake, Flame, Trophy, ShieldCheck, Heart } from 'lucide-react';
import { useModalAnimation } from '../hooks/useModalAnimation';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  langDict: Record<string, string>;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  langDict,
}) => {
  const { mounted, active } = useModalAnimation(isOpen, 200);

  if (!mounted) return null;

  return (
    <div 
      className={`modal-overlay ${active ? 'open active' : 'closing'}`} 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div 
        className="modal-content about-modal-content" 
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          width: '90%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          borderRadius: '1.25rem',
          background: 'var(--color-surface, rgba(16, 22, 34, 0.95))',
          border: '1px solid var(--color-glass-border, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          overflow: 'hidden',
          color: 'var(--color-text, #ffffff)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div 
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4ca1af, #3498db)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(52, 152, 219, 0.4)',
              fontWeight: 800,
              fontSize: '1.5rem',
              color: '#0a0e13',
              flexShrink: 0
            }}
          >
            Ω
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 id="about-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {langDict.omegaTitle || 'Omega'}
              </h3>
              <span 
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(76, 161, 175, 0.2)',
                  color: '#4ca1af',
                  fontWeight: 600,
                  border: '1px solid rgba(76, 161, 175, 0.35)'
                }}
              >
                v1.0.1
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--color-muted, #94a3b8)' }}>
              {langDict.omegaSubtitle || 'Hub de Bienestar y Vitalidad'}
            </p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div 
          style={{ 
            overflowY: 'auto', 
            paddingRight: '4px',
            fontSize: '0.86rem',
            lineHeight: 1.5,
            color: 'var(--color-text, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {/* Description */}
          <div 
            style={{ 
              background: 'rgba(255, 255, 255, 0.04)', 
              padding: '0.85rem', 
              borderRadius: '0.75rem', 
              border: '1px solid rgba(255, 255, 255, 0.06)' 
            }}
          >
            <p style={{ margin: 0 }}>
              {langDict.aboutDesc || 
                'Omega es una plataforma libre y open source diseñada para la maestría de la respiración consciente y la exposición progresiva al agua fría inspirada en el Método Wim Hof. Todo funciona 100% offline en tu dispositivo con privacidad total.'}
            </p>
          </div>

          {/* Pillars List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <div style={{ color: '#4ca1af', marginTop: '2px' }}><Wind size={18} /></div>
              <div>
                <strong>{langDict.aboutPillar1Title || 'Bubble Breathing'}:</strong>{' '}
                <span style={{ color: 'var(--color-muted, #94a3b8)' }}>
                  {langDict.aboutPillar1Desc || 'Respiración profunda rítmica, apnea de retención y recuperación con geometría sagrada hexagonal.'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <div style={{ color: '#3498db', marginTop: '2px' }}><Snowflake size={18} /></div>
              <div>
                <strong>{langDict.aboutPillar2Title || 'HydroCycle'}:</strong>{' '}
                <span style={{ color: 'var(--color-muted, #94a3b8)' }}>
                  {langDict.aboutPillar2Desc || 'Terapia de contraste y adaptación al frío con avisos de audio 432Hz y respuesta háptica táctil.'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <div style={{ color: '#ff7a00', marginTop: '2px' }}><Flame size={18} /></div>
              <div>
                <strong>{langDict.aboutPillar3Title || 'Reto de 20 Días'}:</strong>{' '}
                <span style={{ color: 'var(--color-muted, #94a3b8)' }}>
                  {langDict.aboutPillar3Desc || '4 semanas de adaptación progresiva a duchas frías de 15s a 60s con registro diario.'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <div style={{ color: '#2ecc71', marginTop: '2px' }}><Trophy size={18} /></div>
              <div>
                <strong>{langDict.aboutPillar4Title || 'Progreso & Flexiones'}:</strong>{' '}
                <span style={{ color: 'var(--color-muted, #94a3b8)' }}>
                  {langDict.aboutPillar4Desc || 'Test de flexiones en apnea, mapa de calor de 28 días y 10 insignias hexagonales coleccionables.'}
                </span>
              </div>
            </div>
          </div>

          {/* Privacy & Offline banner */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              padding: '0.75rem', 
              borderRadius: '0.75rem', 
              background: 'rgba(46, 204, 113, 0.1)', 
              border: '1px solid rgba(46, 204, 113, 0.25)',
              fontSize: '0.8rem',
              color: '#2ecc71'
            }}
          >
            <ShieldCheck size={20} style={{ flexShrink: 0 }} />
            <span>
              {langDict.aboutOfflineLabel || '100% Offline-first. Sin telemetría, sin cuentas requeridas y sin anuncios.'}
            </span>
          </div>

          {/* Open source license & author */}
          <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--color-muted, #94a3b8)', marginTop: '0.25rem' }}>
            <p style={{ margin: '0 0 0.35rem' }}>
              Licencia MIT • Código Abierto
            </p>
            <p style={{ margin: '0 0 0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              Creado con <Heart size={13} color="#e74c3c" fill="#e74c3c" /> para la comunidad de biohacking y respiración consciente.
            </p>
            <p style={{ margin: 0, fontSize: '0.68rem', opacity: 0.75, lineHeight: 1.35 }}>
              Proyecto independiente sin afiliación con Innerfire B.V. ni Wim Hof. Práctica bajo tu propia responsabilidad; nunca realices hiperventilación o retenciones dentro del agua ni de pie.
            </p>
          </div>
        </div>

        {/* Footer Close Button */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="hub-btn primary"
            onClick={onClose}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: '0.75rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #4ca1af, #3498db)',
              color: '#0a0e13',
              border: 'none',
              boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)'
            }}
          >
            {langDict.zoomClose || 'Listo'}
          </button>
        </div>
      </div>
    </div>
  );
};
