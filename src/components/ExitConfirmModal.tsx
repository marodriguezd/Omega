import React from 'react';
import { useModalAnimation } from '../hooks/useModalAnimation';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  langDict: Record<string, string>;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  langDict,
}) => {
  const { mounted, active } = useModalAnimation(isOpen, 200);

  if (!mounted) return null;

  return (
    <div 
      className={`modal-overlay ${active ? 'open active' : 'closing'}`}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 id="exit-modal-title" className="modal-title">
          {langDict.confirmExitTitle || '¿Salir de la sesión?'}
        </h3>
        <p className="modal-desc">
          {langDict.confirmExitMsg || 'Tienes un ejercicio en curso. Si sales ahora, se cancelará el progreso actual.'}
        </p>
        <div className="modal-actions">
          <button className="modal-btn secondary" onClick={onCancel}>
            {langDict.cancelBtn || 'Continuar'}
          </button>
          <button className="modal-btn primary" onClick={onConfirm}>
            {langDict.confirmExitBtn || 'Salir al Hub'}
          </button>
        </div>
      </div>
    </div>
  );
};
