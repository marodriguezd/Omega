/**
 * Zen Audio & Sensory Feedback Service (Milestone 3 - Wim Hof Aesthetic)
 * High-fidelity Web Audio API synthesis tuned to 432Hz natural harmonics.
 * Replaces abrasive square waves and raw beeps with meditative singing bowls
 * and smooth breath guidance cues.
 */

import { triggerHaptic } from '../platform/haptics';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio API not supported:', e);
    return null;
  }
}

/**
 * Creates a synthetic resonant singing bowl chime.
 * Fundamental frequency f0 + natural overtone partials + soft exponential decay.
 */
export function playSingingBowl(
  fundamental: number,
  durationSec: number,
  volume: number,
  partials: { ratio: number; gain: number }[] = [
    { ratio: 1.0, gain: 1.0 },
    { ratio: 1.5, gain: 0.35 },
    { ratio: 2.76, gain: 0.18 }
  ]
) {
  if (volume <= 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0001, now);
  // Gentle attack to avoid click
  masterGain.gain.linearRampToValueAtTime(Math.min(1, volume * 1.4), now + 0.04);
  // Exponential organic decay
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
  masterGain.connect(ctx.destination);

  partials.forEach(({ ratio, gain }) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(fundamental * ratio, now);

    oscGain.gain.setValueAtTime(gain, now);
    osc.connect(oscGain);
    oscGain.connect(masterGain);

    osc.start(now);
    osc.stop(now + durationSec + 0.05);

    osc.onended = () => {
      try {
        osc.disconnect();
        oscGain.disconnect();
      } catch (_) {}
    };
  });

  setTimeout(() => {
    try {
      masterGain.disconnect();
    } catch (_) {}
  }, (durationSec + 0.1) * 1000);
}

/**
 * Frequency-ramped chime for continuous breath guidance (rising for inhale, falling for exhale)
 */
function playBreathChime(
  startFreq: number,
  endFreq: number,
  durationMs: number,
  volume: number
) {
  if (volume <= 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const durSec = durationMs / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + durSec);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(volume * 0.75, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durSec);

  osc.onended = () => {
    try {
      osc.disconnect();
      gain.disconnect();
    } catch (_) {}
  };
}

// ============================================================================
// Public Wim Hof Sensory Cues
// ============================================================================

/**
 * Soft rising chime for inhalation start
 */
export function playInhaleCue(volume: number, durationMs: number = 800) {
  playBreathChime(324, 432, durationMs, volume);
  triggerHaptic('light', 20);
}

/**
 * Grounding soft release chime for exhalation start
 */
export function playExhaleCue(volume: number, durationMs: number = 600) {
  playBreathChime(432, 288, durationMs, volume * 0.85);
  triggerHaptic('selection', 15);
}

/**
 * Resonant singing bowl chord marking the final breath before retention
 */
export function playLastBreathCue(volume: number) {
  playSingingBowl(216, 2.2, volume * 1.2, [
    { ratio: 1.0, gain: 1.0 },
    { ratio: 1.5, gain: 0.5 },
    { ratio: 2.0, gain: 0.3 },
    { ratio: 2.76, gain: 0.25 }
  ]);
  triggerHaptic('heavy', [100, 60, 180]);
}

/**
 * Meditative singing bowl strike for each elapsed minute of apnea retention
 */
export function playRetentionMinuteCue(volume: number, _minuteCount: number = 1) {
  playSingingBowl(432, 2.5, volume, [
    { ratio: 1.0, gain: 1.0 },
    { ratio: 1.5, gain: 0.4 },
    { ratio: 2.76, gain: 0.3 }
  ]);
  triggerHaptic('medium', [80, 50, 80]);
}

/**
 * Deep gong/bowl marking the start or end of the 15-second recovery breath hold
 */
export function playRecoveryCue(volume: number) {
  playSingingBowl(180, 2.8, volume * 1.1, [
    { ratio: 1.0, gain: 1.0 },
    { ratio: 1.5, gain: 0.45 },
    { ratio: 2.38, gain: 0.25 }
  ]);
  triggerHaptic('success', [120, 60, 120]);
}

/**
 * Smooth singing bowl chime for HydroCycle contrast shower transitions
 */
export function playTransitionCue(targetPhase: 'hot' | 'cold', volume: number) {
  if (targetPhase === 'cold') {
    // Crisp glacial bell (432Hz -> 576Hz)
    playSingingBowl(576, 1.8, volume, [
      { ratio: 1.0, gain: 1.0 },
      { ratio: 1.5, gain: 0.4 },
      { ratio: 2.76, gain: 0.2 }
    ]);
    triggerHaptic('medium', [100, 80, 150]);
  } else {
    // Warm fire bell (324Hz -> 432Hz)
    playSingingBowl(324, 1.8, volume, [
      { ratio: 1.0, gain: 1.0 },
      { ratio: 1.5, gain: 0.45 },
      { ratio: 2.0, gain: 0.25 }
    ]);
    triggerHaptic('light', [80, 60, 120]);
  }
}

/**
 * 3-note harmonic arpeggio for session completion fanfare
 */
export function playCompletionFanfare(volume: number) {
  const notes = [432, 540, 648, 864];
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playSingingBowl(freq, 2.4, volume * 0.9, [
        { ratio: 1.0, gain: 1.0 },
        { ratio: 1.5, gain: 0.35 }
      ]);
    }, idx * 180);
  });
  triggerHaptic('success', [100, 80, 100, 80, 250]);
}

/**
 * Soft warning chime for the final 5, 4, 3, 2, 1 countdown seconds
 */
export function playCountdownBeep(volume: number, secondsRemaining: number) {
  const pitch = secondsRemaining === 1 ? 576 : 432;
  playSingingBowl(pitch, 0.4, volume * 0.7, [
    { ratio: 1.0, gain: 1.0 }
  ]);
  triggerHaptic('light', 35);
}
