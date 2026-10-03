/**
 * Application lifecycle / navigation abstraction.
 * - Android: Capacitor App 'backButton' listener (exit or history.back)
 * - Web/Electron: no-op registration (returns cleanup fn) — desktop
 *   window controls remain native; in-app back nav is handled by React state.
 */
import { App as CapApp } from '@capacitor/app';

export type BackButtonHandler = () => boolean | Promise<boolean>;

export function registerBackButtonHandler(handler: BackButtonHandler): () => void {
  let removeListener: (() => void) | null = null;
  let isCleanedUp = false;

  try {
    const promise = CapApp.addListener('backButton', async ({ canGoBack }) => {
      const handled = await handler();
      if (!handled) {
        if (!canGoBack) {
          await CapApp.exitApp().catch(() => undefined);
        } else if (typeof window !== 'undefined') {
          window.history.back();
        }
      }
    });

    promise
      .then((handle) => {
        if (isCleanedUp) {
          handle.remove();
        } else {
          removeListener = () => handle.remove();
        }
      })
      .catch((e) => {
        console.warn('addListener error:', e);
      });
  } catch {
    console.warn('Capacitor backButton listener not supported in this environment');
  }

  return () => {
    isCleanedUp = true;
    if (removeListener) removeListener();
  };
}
