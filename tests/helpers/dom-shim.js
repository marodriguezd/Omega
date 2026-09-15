/**
 * DOM and Browser Environment Shim for Omega Opaque-Box E2E Tests.
 * Provides self-contained window, document, localStorage, navigator, and event bus
 * without requiring heavy browser binaries.
 */

class MockDOMTokenList {
  constructor(element) {
    this._element = element;
    this._tokens = new Set();
    this._syncFromClassName();
  }

  _syncFromClassName() {
    this._tokens.clear();
    const classes = (this._element._className || '').trim().split(/\s+/);
    for (const c of classes) {
      if (c) this._tokens.add(c);
    }
  }

  _syncToClassName() {
    this._element._className = Array.from(this._tokens).join(' ');
  }

  add(...tokens) {
    for (const token of tokens) {
      if (token) this._tokens.add(token);
    }
    this._syncToClassName();
  }

  remove(...tokens) {
    for (const token of tokens) {
      this._tokens.delete(token);
    }
    this._syncToClassName();
  }

  contains(token) {
    this._syncFromClassName();
    return this._tokens.has(token);
  }

  toggle(token, force) {
    this._syncFromClassName();
    const shouldAdd = force !== undefined ? force : !this._tokens.has(token);
    if (shouldAdd) {
      this.add(token);
    } else {
      this.remove(token);
    }
    return shouldAdd;
  }
}

class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.id = '';
    this._className = '';
    this.classList = new MockDOMTokenList(this);
    this.style = {
      _props: new Map(),
      setProperty(key, val) {
        this._props.set(key, String(val));
      },
      getPropertyValue(key) {
        return this._props.get(key) || '';
      },
      removeProperty(key) {
        this._props.delete(key);
      },
      get transform() { return this.getPropertyValue('transform'); },
      set transform(v) { this.setProperty('transform', v); },
      get opacity() { return this.getPropertyValue('opacity'); },
      set opacity(v) { this.setProperty('opacity', v); },
      get width() { return this.getPropertyValue('width'); },
      set width(v) { this.setProperty('width', v); },
      get zoom() { return this.getPropertyValue('zoom'); },
      set zoom(v) { this.setProperty('zoom', v); }
    };
    this.attributes = new Map();
    this.children = [];
    this.parentElement = null;
    this.textContent = '';
    this.innerHTML = '';
    this._listeners = new Map();
  }

  get className() {
    return this._className;
  }

  set className(val) {
    this._className = String(val || '');
    this.classList._syncFromClassName();
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === 'id') this.id = String(value);
    if (name === 'class') this.className = String(value);
  }

  getAttribute(name) {
    if (name === 'id') return this.id || null;
    if (name === 'class') return this.className || null;
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  hasAttribute(name) {
    if (name === 'id') return Boolean(this.id);
    if (name === 'class') return Boolean(this.className);
    return this.attributes.has(name);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === 'id') this.id = '';
    if (name === 'class') this.className = '';
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      child.parentElement = null;
      this.children.splice(idx, 1);
    }
    return child;
  }

  addEventListener(type, listener) {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, []);
    }
    this._listeners.get(type).push(listener);
  }

  removeEventListener(type, listener) {
    if (!this._listeners.has(type)) return;
    const list = this._listeners.get(type);
    const idx = list.indexOf(listener);
    if (idx !== -1) list.splice(idx, 1);
  }

  dispatchEvent(event) {
    const list = this._listeners.get(event.type) || [];
    event.target = this;
    for (const fn of list) {
      fn.call(this, event);
    }
    return !event.defaultPrevented;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    const parts = selector.split(',').map(s => s.trim());

    const matchesSingle = (el, sel) => {
      if (!sel) return false;
      // ID selector: #id
      if (sel.startsWith('#')) {
        const idName = sel.slice(1).split(/[. ]/)[0];
        if (el.id !== idName) return false;
        // Check remaining parts like #exerciseScreen.active
        const rest = sel.slice(1 + idName.length);
        if (rest.startsWith('.')) {
          return el.classList.contains(rest.slice(1));
        }
        return true;
      }
      // Class selector: .class
      if (sel.startsWith('.')) {
        const className = sel.slice(1);
        return el.classList.contains(className);
      }
      // Tag selector: div, button, nav
      if (el.tagName.toLowerCase() === sel.toLowerCase()) {
        return true;
      }
      return false;
    };

    const traverse = (node) => {
      for (const sel of parts) {
        if (matchesSingle(node, sel)) {
          results.push(node);
          break;
        }
      }
      for (const child of node.children) {
        traverse(child);
      }
    };

    for (const child of this.children) {
      traverse(child);
    }
    return results;
  }
}

class MockLocalStorage {
  constructor() {
    this._store = new Map();
    this._quotaExceeded = false;
  }

  getItem(key) {
    return this._store.has(key) ? this._store.get(key) : null;
  }

  setItem(key, value) {
    if (this._quotaExceeded) {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    }
    this._store.set(String(key), String(value));
  }

  removeItem(key) {
    this._store.delete(String(key));
  }

  clear() {
    this._store.clear();
  }

  get length() {
    return this._store.size;
  }

  key(index) {
    const keys = Array.from(this._store.keys());
    return keys[index] || null;
  }

  simulateQuotaExceeded(enabled = true) {
    this._quotaExceeded = enabled;
  }
}

export function setupDOMEnvironment() {
  const documentElement = new MockElement('html');
  const head = new MockElement('head');
  const body = new MockElement('body');
  const root = new MockElement('div');
  root.id = 'root';

  documentElement.appendChild(head);
  documentElement.appendChild(body);
  body.appendChild(root);

  const localStorage = new MockLocalStorage();
  const listeners = new Map();

  const windowObj = {
    innerWidth: 390,
    innerHeight: 844,
    localStorage,
    document: {
      documentElement,
      head,
      body,
      getElementById(id) {
        return documentElement.querySelector(`#${id}`);
      },
      querySelector(selector) {
        return documentElement.querySelector(selector);
      },
      querySelectorAll(selector) {
        return documentElement.querySelectorAll(selector);
      },
      createElement(tag) {
        return new MockElement(tag);
      },
      addEventListener(type, listener) {
        if (!listeners.has(`doc:${type}`)) listeners.set(`doc:${type}`, []);
        listeners.get(`doc:${type}`).push(listener);
      },
      removeEventListener(type, listener) {
        if (!listeners.has(`doc:${type}`)) return;
        const list = listeners.get(`doc:${type}`);
        const idx = list.indexOf(listener);
        if (idx !== -1) list.splice(idx, 1);
      },
      dispatchEvent(event) {
        const list = listeners.get(`doc:${event.type}`) || [];
        for (const fn of list) {
          fn(event);
        }
        return true;
      }
    },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    removeEventListener(type, listener) {
      if (!listeners.has(type)) return;
      const list = listeners.get(type);
      const idx = list.indexOf(listener);
      if (idx !== -1) list.splice(idx, 1);
    },
    dispatchEvent(event) {
      const list = listeners.get(event.type) || [];
      for (const fn of list) {
        fn(event);
      }
      return true;
    },
    navigator: {
      userAgent: 'Mozilla/5.0 (Linux; Android 17; Omega) AppleWebKit/537.36',
      vibrate(pattern) {
        windowObj._lastVibration = pattern;
        return true;
      },
      wakeLock: {
        _sentinel: {
          released: false,
          async release() {
            this.released = true;
          }
        },
        async request(type) {
          if (windowObj._wakeLockShouldFail) {
            throw new Error('WakeLock request failed: Permission denied');
          }
          this._sentinel.released = false;
          return this._sentinel;
        }
      }
    },
    history: {
      _stack: ['/'],
      back() {
        if (this._stack.length > 1) this._stack.pop();
      }
    },
    performance: {
      now() {
        return Date.now();
      }
    },
    requestAnimationFrame(cb) {
      return setTimeout(() => cb(Date.now()), 16);
    },
    cancelAnimationFrame(id) {
      clearTimeout(id);
    },
    _lastVibration: null,
    _wakeLockShouldFail: false
  };

  class CustomEvent {
    constructor(type, eventInitDict = {}) {
      this.type = type;
      this.detail = eventInitDict.detail || null;
      this.bubbles = Boolean(eventInitDict.bubbles);
      this.cancelable = Boolean(eventInitDict.cancelable);
      this.defaultPrevented = false;
    }
  }

  windowObj.CustomEvent = CustomEvent;
  windowObj.Event = CustomEvent;

  const origDescriptors = {
    window: Object.getOwnPropertyDescriptor(globalThis, 'window'),
    document: Object.getOwnPropertyDescriptor(globalThis, 'document'),
    localStorage: Object.getOwnPropertyDescriptor(globalThis, 'localStorage'),
    navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
    CustomEvent: Object.getOwnPropertyDescriptor(globalThis, 'CustomEvent'),
    HTMLElement: Object.getOwnPropertyDescriptor(globalThis, 'HTMLElement')
  };

  const safeDefine = (prop, val) => {
    try {
      Object.defineProperty(globalThis, prop, {
        value: val,
        configurable: true,
        writable: true
      });
    } catch (e) {
      // fallback
    }
  };

  safeDefine('window', windowObj);
  safeDefine('document', windowObj.document);
  safeDefine('localStorage', localStorage);
  safeDefine('navigator', windowObj.navigator);
  safeDefine('CustomEvent', CustomEvent);
  safeDefine('HTMLElement', MockElement);

  return {
    window: windowObj,
    document: windowObj.document,
    localStorage,
    documentElement,
    root,
    cleanup() {
      for (const [prop, desc] of Object.entries(origDescriptors)) {
        try {
          if (desc) {
            Object.defineProperty(globalThis, prop, desc);
          } else {
            delete globalThis[prop];
          }
        } catch (e) {
          // ignore cleanup error
        }
      }
    }
  };
}
