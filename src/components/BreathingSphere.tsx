import React from 'react';

export type SpherePhase = 'breathing' | 'retention' | 'recovery' | 'hot' | 'cold' | 'idle';

export interface BreathingSphereProps {
  phase: SpherePhase;
  scale?: number;
  durationMs?: number;
  easing?: string;
  progress?: number; // 0 to 100 for perimeter progress ring
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

// Continuous curvature rounded hexagon (Wim Hof sacred geometry ice crystal)
// Generated mathematically with corner radii r=14 on R=86 inside a 200x200 viewBox
const ROUNDED_HEX_PATH =
  "M 87.88 21.00 Q 100.00 14.00 112.12 21.00 L 162.35 50.00 Q 174.48 57.00 174.48 71.00 L 174.48 129.00 Q 174.48 143.00 162.35 150.00 L 112.12 179.00 Q 100.00 186.00 87.88 179.00 L 37.65 150.00 Q 25.52 143.00 25.52 129.00 L 25.52 71.00 Q 25.52 57.00 37.65 50.00 Z";

// Outer concentric halo path (R=94, cr=16)
const ROUNDED_HEX_HALO_PATH =
  "M 86.75 13.50 Q 100.00 5.80 113.25 13.50 L 168.10 45.20 Q 181.40 52.90 181.40 68.30 L 181.40 131.70 Q 181.40 147.10 168.10 154.80 L 113.25 186.50 Q 100.00 194.20 86.75 186.50 L 31.90 154.80 Q 18.60 147.10 18.60 131.70 L 18.60 68.30 Q 18.60 52.90 31.90 45.20 Z";

const PHASE_THEMES: Record<SpherePhase, {
  gradId: string;
  startColor: string;
  endColor: string;
  glowColor: string;
  borderColor: string;
  progressColor: string;
}> = {
  breathing: {
    gradId: 'wimHofGradBreathing',
    startColor: '#ff9d00',
    endColor: '#ff6b00',
    glowColor: 'rgba(255, 157, 0, 0.45)',
    borderColor: 'rgba(255, 180, 0, 0.75)',
    progressColor: '#00f0ff'
  },
  retention: {
    gradId: 'wimHofGradRetention',
    startColor: '#00f0ff',
    endColor: '#0066cc',
    glowColor: 'rgba(0, 240, 255, 0.5)',
    borderColor: 'rgba(0, 240, 255, 0.9)',
    progressColor: '#ff7a00'
  },
  recovery: {
    gradId: 'wimHofGradRecovery',
    startColor: '#2ecc71',
    endColor: '#107c41',
    glowColor: 'rgba(46, 204, 113, 0.5)',
    borderColor: 'rgba(46, 204, 113, 0.85)',
    progressColor: '#00f0ff'
  },
  hot: {
    gradId: 'wimHofGradHot',
    startColor: '#ff7a00',
    endColor: '#d32f2f',
    glowColor: 'rgba(255, 122, 0, 0.5)',
    borderColor: 'rgba(255, 157, 0, 0.8)',
    progressColor: '#00f0ff'
  },
  cold: {
    gradId: 'wimHofGradCold',
    startColor: '#00d2ff',
    endColor: '#004499',
    glowColor: 'rgba(0, 210, 255, 0.5)',
    borderColor: 'rgba(0, 240, 255, 0.85)',
    progressColor: '#ff7a00'
  },
  idle: {
    gradId: 'wimHofGradIdle',
    startColor: '#3a506b',
    endColor: '#101720',
    glowColor: 'rgba(76, 161, 175, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    progressColor: '#4ca1af'
  }
};

/**
 * Organic Wim Hof Rounded Hexagon Breathing Sphere Component
 * Embodies the official Wim Hof Method sacred geometry (rounded ice crystal)
 * with continuous smooth curvature, concentric luminous halos, specular glass reflection,
 * and integrated perimeter progress tracking.
 */
export const BreathingSphere: React.FC<BreathingSphereProps> = ({
  phase,
  scale = 1.0,
  durationMs = 300,
  easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
  progress,
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
  const theme = PHASE_THEMES[phase] || PHASE_THEMES.idle;

  const sphereStyle: React.CSSProperties = {
    transform: `scale(${scale}) translateZ(0)`,
    transition: durationMs > 0 ? `transform ${durationMs}ms ${easing}` : 'none',
    borderRadius: 'var(--omega-radius-bubble, 50%)',
    aspectRatio: '1 / 1',
    willChange: 'transform, opacity',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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

  const clampedProgress = progress !== undefined ? Math.max(0, Math.min(100, progress)) : undefined;

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
        {/* SVG Wim Hof Rounded Hexagon Geometry & Glow Layers */}
        <svg
          className="wimhof-hex-svg"
          viewBox="0 0 200 200"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
            pointerEvents: 'none'
          }}
        >
          <defs>
            {/* Linear phase gradient */}
            <linearGradient id={theme.gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isLastBreath ? '#ffc107' : theme.startColor} />
              <stop offset="100%" stopColor={isLastBreath ? '#ff5722' : theme.endColor} />
            </linearGradient>

            {/* Glass specular sheen gradient */}
            <linearGradient id="wimHofGlassSheen" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
              <stop offset="40%" stopColor="rgba(255, 255, 255, 0.12)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.0)" />
            </linearGradient>

            {/* Soft luminous glow filter */}
            <filter id="wimHofHaloGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Layer 1: Outer Concentric Luminous Halo */}
          <path
            d={ROUNDED_HEX_HALO_PATH}
            fill={theme.glowColor}
            opacity={isLastBreath ? 0.85 : isPulsing ? 0.7 : 0.4}
            filter="url(#wimHofHaloGlow)"
            className="wimhof-halo-ring"
          />

          {/* Layer 2: Main Filled Rounded Hexagon Body */}
          <path
            d={ROUNDED_HEX_PATH}
            fill={`url(#${theme.gradId})`}
            stroke={theme.borderColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Layer 3: Glass Reflection Sheen */}
          <path
            d={ROUNDED_HEX_PATH}
            fill="url(#wimHofGlassSheen)"
            opacity="0.75"
          />

          {/* Layer 4: Integrated Perimeter Progress Ring */}
          {clampedProgress !== undefined && (
            <>
              {/* Progress track background */}
              <path
                d={ROUNDED_HEX_PATH}
                pathLength="100"
                fill="none"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Active progress stroke */}
              <path
                d={ROUNDED_HEX_PATH}
                pathLength="100"
                fill="none"
                stroke={theme.progressColor}
                strokeWidth="4"
                strokeDasharray="100"
                strokeDashoffset={100 - clampedProgress}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.25s linear',
                  filter: `drop-shadow(0 0 6px ${theme.progressColor})`
                }}
              />
            </>
          )}
        </svg>

        {/* Central Content Slot */}
        <div 
          className={`breath-counter${isLastBreath ? ' last-breath' : ''}`}
          style={{ position: 'relative', zIndex: 10 }}
        >
          {icon !== undefined ? icon : counter}
        </div>
      </div>
    </div>
  );
};

export default BreathingSphere;
