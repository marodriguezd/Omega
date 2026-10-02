import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Plus, Check, Award, Flame } from 'lucide-react';
import { BreathingSphere } from './BreathingSphere';
import { recordPushUpSession } from '../services/omegaStore';
import { playSingingBowl, playRetentionMinuteCue, playCompletionFanfare } from '../services/zenAudioService';
import { enableKeepAwake, disableKeepAwake, triggerHaptic } from '../services/nativeService';

interface PushUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  langDict: Record<string, string>;
}

export const PushUpModal: React.FC<PushUpModalProps> = ({ isOpen, onClose, langDict }) => {
  const [phase, setPhase] = useState<'idle' | 'holding' | 'finished'>('idle');
  const [pushUps, setPushUps] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPhase('idle');
      setPushUps(0);
      setSeconds(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      disableKeepAwake();
    }
  }, [isOpen]);

  useEffect(() => {
    if (phase !== 'holding') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    enableKeepAwake();

    const tick = () => {
      if (!startTimeRef.current) return;
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setSeconds(elapsed);

      // Minute chime
      if (elapsed > 0 && elapsed % 60 === 0) {
        playRetentionMinuteCue(0.8, Math.floor(elapsed / 60));
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase]);

  if (!isOpen) return null;

  const startTest = () => {
    setPushUps(0);
    setSeconds(0);
    setPhase('holding');
    triggerHaptic('medium');
  };

  const handleIncrement = () => {
    setPushUps(prev => prev + 1);
    triggerHaptic('light');
  };

  const finishTest = () => {
    setPhase('finished');
    disableKeepAwake();
    playCompletionFanfare(0.8);
    triggerHaptic('success');

    // Save record
    recordPushUpSession({
      id: `pushup-${Date.now()}`,
      date: Date.now(),
      pushUps,
      retentionSeconds: seconds
    });
  };

  return (
    <div className="zoom-modal-overlay active" onClick={onClose}>
      <div 
        className="zoom-modal-content glass-card" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 420, textAlign: 'center', position: 'relative' }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: 'var(--color-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.25rem', color: 'var(--omega-warm-amber, #ff7a00)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <Award size={22} />
          <span>{langDict.pushUpTitle || 'Test de Flexiones en Apnea'}</span>
        </h3>

        <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', margin: '0 0 1.2rem' }}>
          {langDict.pushUpDesc || 'Haz 30 respiraciones profundas, suelta el aire por completo y realiza todas las flexiones posibles antes de respirar.'}
        </p>

        {phase === 'idle' && (
          <div>
            <div style={{ margin: '2rem 0' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--omega-warm-amber, #ff7a00)' }}>
                0
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                {langDict.pushUpCountLabel || 'Flexiones'}
              </div>
            </div>

            <button
              className="start-button"
              onClick={startTest}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--omega-warm-amber, #ff7a00), #ff9d00)',
                color: '#0a0e13',
                fontWeight: 700
              }}
            >
              {langDict.startPushUpBtn || 'Comenzar Test en Apnea'}
            </button>
          </div>
        )}

        {phase === 'holding' && (
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--omega-primary-cyan, #00f0ff)', marginBottom: '0.5rem' }}>
              Apnea activa: {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
            </div>

            {/* Tap area to increment pushups */}
            <div
              onClick={handleIncrement}
              style={{
                width: 180,
                height: 180,
                margin: '1rem auto',
                borderRadius: '50%',
                background: 'rgba(255, 122, 0, 0.15)',
                border: '3px solid var(--omega-warm-amber, #ff7a00)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                boxShadow: '0 0 25px rgba(255, 122, 0, 0.35)',
                transition: 'transform 0.1s ease'
              }}
            >
              <div style={{ fontSize: '3.6rem', fontWeight: 900, color: '#fff' }}>
                {pushUps}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--omega-warm-amber, #ff7a00)', fontWeight: 600 }}>
                ¡TOCA POR CADA FLEXIÓN!
              </div>
            </div>

            <button
              className="start-button"
              onClick={finishTest}
              style={{
                width: '100%',
                marginTop: '1rem',
                background: 'var(--omega-success-green, #2ecc71)',
                color: '#fff',
                fontWeight: 700
              }}
            >
              {langDict.recordPushUpBtn || 'Terminar y Registrar Récord'}
            </button>
          </div>
        )}

        {phase === 'finished' && (
          <div>
            <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(46, 204, 113, 0.15)', border: '1px solid #2ecc71', margin: '1rem 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>🎉</div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#2ecc71' }}>
                ¡Excelente Trabajo!
              </h4>
              <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0' }}>
                {pushUps} flexiones
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                Tiempo en apnea: {seconds} segundos
              </div>
            </div>

            <button
              className="modal-btn primary"
              onClick={onClose}
              style={{ width: '100%', padding: '0.8rem', background: 'var(--omega-warm-amber, #ff7a00)', color: '#0a0e13', fontWeight: 700 }}
            >
              Cerrar y Ver Progreso
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PushUpModal;
