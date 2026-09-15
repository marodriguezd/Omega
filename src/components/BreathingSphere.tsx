import React from 'react';

export type SpherePhase = 'breathing' | 'retention' | 'recovery' | 'hot' | 'cold' | 'idle';

export interface BreathingSphereProps {
  phase: SpherePhase;
  scale?: number;
  durationMs?: number;
  easing?: string;
  isLastBreath?: boolean;
  isPulsing?: boolean;
  counter?: number | string | React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  size?: number | string;
}

/**
 * Organic Breathing Sphere Component
 * Replaces sharp 6-point polygon clip-paths with an organic, fluid,
 * GPU-accelerated breathing bubble inspired by the Wim Hof Method app
 * and Android 17 / Material Expressive continuous squircle geometry.
 */
export const BreathingSphere: React.FC<BreathingSphereProps> = ({
  phase,
  scale = 1.0,
  durationMs = 300,
  easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
  isLastBreath = false,
  isPulsing = false,
  counter,
  icon,
  onClick,
  className = '',
  style = {},
  id,
  size
}) => {
  const sphereStyle: React.CSSProperties = {
    transform: `scale(${scale}) translateZ(0)`,
    transition: durationMs > 0 ? `transform ${durationMs}ms ${easing}` : 'none',
    borderRadius: 'var(--omega-radius-bubble, 50%)',
    aspectRatio: '1 / 1',
    willChange: 'transform, opacity',
    ...(size ? { width: size, height: size } : {}),
    ...style
  };

  const sphereClasses = [
    'breathing-sphere',
    'hexagon', // Maintained as backwards-compatible CSS alias
    `phase-${phase}`,
    isLastBreath ? 'last-breath' : '',
    isPulsing ? 'pulsing' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="breathing-sphere-container hexagon-container">
      <div
        id={id}
        className={sphereClasses}
        style={sphereStyle}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className={`breath-counter${isLastBreath ? ' last-breath' : ''}`}>
          {icon !== undefined ? icon : counter}
        </div>
      </div>
    </div>
  );
};

export default BreathingSphere;
