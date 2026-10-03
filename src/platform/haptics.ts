/**
 * Haptic feedback abstraction.
 * - Capacitor native (Android): @capacitor/haptics
 * - Web browser: navigator.vibrate
 * - Electron / desktop: safe no-op (no vibration actuators)
 */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import type { HapticType } from './types';
import { isElectron } from './runtime';

export type { HapticType };

export async function triggerHaptic(
  type: HapticType = 'light',
  pattern?: number | number[],
): Promise<void> {
  // 1. Electron / Desktop: safe no-op
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    return;
  }
  if (isElectron()) return;

  // 2. Capacitor Native Mobile
  try {
    if (Capacitor.isNativePlatform()) {
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          return;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          return;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          return;
        case 'selection':
          await Haptics.selectionChanged();
          return;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          return;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          return;
        default:
          await Haptics.impact({ style: ImpactStyle.Light });
          return;
      }
    }
  } catch {
    // fall through to web vibration
  }

  // 3. Web Browser Vibration API fallback
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      if (pattern !== undefined) {
        navigator.vibrate(pattern);
      } else {
        const fallbackDurations: Record<HapticType, number | number[]> = {
          light: 15,
          medium: 30,
          heavy: 50,
          selection: 10,
          success: [15, 50, 15],
          warning: [30, 50, 30],
        };
        navigator.vibrate(fallbackDurations[type] ?? 15);
      }
    } catch {
      // Silent no-op on platforms without vibration
    }
  }
}
