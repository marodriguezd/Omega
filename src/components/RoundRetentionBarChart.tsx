import React from 'react';
import { Trophy, Clock, TrendingUp } from 'lucide-react';

export function formatTimeDigital(seconds: number): string {
  const safeSec = Number.isFinite(seconds) && seconds >= 0 ? Math.round(seconds) : 0;
  const m = Math.floor(safeSec / 60);
  const s = Math.floor(safeSec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export interface RoundRetentionBarChartProps {
  retentionTimes: number[];
  bestRetentionSec?: number;
  compact?: boolean;
  langDict?: Record<string, string>;
}

export const RoundRetentionBarChart: React.FC<RoundRetentionBarChartProps> = ({
  retentionTimes,
  bestRetentionSec = 0,
  compact = false,
  langDict = {}
}) => {
  const validTimes = Array.isArray(retentionTimes)
    ? retentionTimes.map(t => (Number.isFinite(t) && t >= 0 ? Math.round(t) : 0))
    : [];

  if (validTimes.length === 0) {
    return null;
  }

  const maxInSession = Math.max(...validTimes, 1);
  const totalRetention = validTimes.reduce((acc, t) => acc + t, 0);
  const avgRetention = Math.round(totalRetention / validTimes.length);
  const bestRoundIndex = validTimes.indexOf(Math.max(...validTimes));

  return (
    <div
      className="round-retention-chart"
      style={{
        width: '100%',
        background: compact ? 'transparent' : 'rgba(255, 255, 255, 0.03)',
        borderRadius: 'var(--omega-radius-squircle-md, 14px)',
        border: compact ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
        padding: compact ? '0.4rem 0' : '0.85rem 1rem',
        marginTop: compact ? '0.35rem' : '0.85rem',
        marginBottom: compact ? '0.35rem' : '0.85rem',
        boxSizing: 'border-box'
      }}
    >
      {!compact && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            paddingBottom: '0.4rem'
          }}
        >
          <span
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: 'var(--omega-primary-cyan, #00f0ff)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <TrendingUp size={16} />
            {langDict.retentionGraphTitle || 'Retención por Ronda'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
            {langDict.avgRetentionLabel || 'Promedio'}: {formatTimeDigital(avgRetention)}
          </span>
        </div>
      )}

      {/* Round Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '0.4rem' : '0.6rem' }}>
        {validTimes.map((sec, idx) => {
          const widthPct = Math.max(12, Math.round((sec / maxInSession) * 100));
          const isBestRound = idx === bestRoundIndex && validTimes.length > 1;
          const isAllTimeBest = bestRetentionSec > 0 && sec >= bestRetentionSec;

          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {/* Round Label */}
              <div
                style={{
                  minWidth: compact ? '26px' : '36px',
                  fontSize: compact ? '0.74rem' : '0.82rem',
                  fontWeight: 600,
                  color: isBestRound ? 'var(--omega-warm-amber, #ff7a00)' : 'var(--color-muted)',
                  textAlign: 'left'
                }}
              >
                R{idx + 1}
              </div>

              {/* Bar track and fill */}
              <div
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: 'var(--omega-radius-squircle-sm, 6px)',
                  height: compact ? '16px' : '22px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {/* Bar Fill */}
                <div
                  style={{
                    width: `${widthPct}%`,
                    height: '100%',
                    background: isBestRound
                      ? 'linear-gradient(90deg, #00d2ff 0%, #ff7a00 100%)'
                      : 'linear-gradient(90deg, rgba(0, 210, 255, 0.45) 0%, rgba(0, 240, 255, 0.8) 100%)',
                    borderRadius: 'var(--omega-radius-squircle-sm, 6px)',
                    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />

                {/* Inner / Overlaid Duration Label */}
                <span
                  style={{
                    position: 'absolute',
                    right: '8px',
                    fontSize: compact ? '0.7rem' : '0.78rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    letterSpacing: '0.02em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {isAllTimeBest && <Trophy size={11} color="#ffd700" />}
                  {formatTimeDigital(sec)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Aggregate Footer */}
      {!compact && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.75rem',
            paddingTop: '0.45rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.75rem',
            color: 'var(--color-muted)'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={13} />
            Total: <strong style={{ color: '#fff' }}>{formatTimeDigital(totalRetention)}</strong>
          </span>
          <span>
            {langDict.roundLabel ? `${langDict.roundLabel}s` : 'Rondas'}: <strong style={{ color: '#fff' }}>{validTimes.length}</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Trophy size={13} color="var(--omega-warm-amber, #ff7a00)" />
            Max: <strong style={{ color: 'var(--omega-warm-amber, #ff7a00)' }}>{formatTimeDigital(maxInSession)}</strong>
          </span>
        </div>
      )}
    </div>
  );
};
