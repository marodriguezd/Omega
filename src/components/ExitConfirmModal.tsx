import React from 'react';

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
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">{langDict.confirmExitTitle || '¿Salir de la sesión?'}</h3>
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
