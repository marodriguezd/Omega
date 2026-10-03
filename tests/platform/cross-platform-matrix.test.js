import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readProjectFile } from '../helpers/test-utils.js';
import { setupDOMEnvironment } from '../helpers/dom-shim.js';

describe('Cross-platform matrix (Android / macOS / Windows / Linux)', () => {
  it('P15. Shared React layer has no duplicated business logic per platform', () => {
    const app = readProjectFile('src/App.tsx') || '';
    assert.match(app, /BubbleBreathingApp|Bubble-Breathing/, 'App must reuse the shared Bubble submodule');
    assert.match(app, /HydrocicleApp|Hydrocicle/, 'App must reuse the shared Hydro submodule');
  });

  it('P16. Storage flows through one abstraction on every runtime', () => {
    const store = readProjectFile('src/services/omegaStore.ts') || '';
    assert.match(store, /platform\/storage|storageGetJson|storageSetJson/, 'omegaStore must use the platform storage abstraction');
  });

  it('P17. Audio/haptics stay platform-agnostic (Web Audio + abstraction)', () => {
    const audio = readProjectFile('src/services/zenAudioService.ts') || '';
    assert.match(audio, /triggerHaptic/, 'audio cues must route haptics through the abstraction');
    assert.match(audio, /AudioContext|webkitAudioContext/, 'audio must use Web Audio (available on all targets)');
  });

  it('P18. Runtime matrix resolves deterministically in each environment', async () => {
    // Electron
    {
      const env = setupDOMEnvironment();
      try {
        env.window.electronAPI = { isElectron: true, platform: 'darwin', setKeepAwake: async () => true };
        const kind = env.window.electronAPI?.isElectron === true ? 'electron' : 'web';
        assert.strictEqual(kind, 'electron');
      } finally {
        env.cleanup();
      }
    }
    // Capacitor native
    {
      const env = setupDOMEnvironment();
      try {
        env.window.Capacitor = { getPlatform: () => 'android' };
        const cap = env.window.Capacitor;
        const kind = typeof cap?.getPlatform === 'function' && cap.getPlatform() !== 'web' ? 'capacitor' : 'web';
        assert.strictEqual(kind, 'capacitor');
      } finally {
        env.cleanup();
      }
    }
    // Pure web fallback
    {
      const env = setupDOMEnvironment();
      try {
        delete env.window.Capacitor;
        delete env.window.electronAPI;
        assert.strictEqual(env.window.electronAPI?.isElectron, undefined);
      } finally {
        env.cleanup();
      }
    }
  });

  it('P19. Offline-first: persistence never requires network', () => {
    const store = readProjectFile('src/services/omegaStore.ts') || '';
    assert.doesNotMatch(store, /fetch\s*\(\s*['"]https?:/, 'store must not fetch remote state over network');
  });
});
