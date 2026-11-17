export interface SubAppSyncDetail {
  language?: string;
  theme?: string;
  type?: string;
  app?: string;
}

export interface OmegaSessionStateDetail {
  active: boolean;
  isPaused?: boolean;
  app: 'bubble' | 'hydro' | 'challenge';
}

export interface OmegaPauseSessionDetail {
  pause: boolean;
  exit?: boolean;
}

export interface OmegaTabChangeDetail {
  tab: string;
}

declare global {
  interface WindowEventMap {
    'omega-sync': CustomEvent<void>;
    'subapp-sync': CustomEvent<SubAppSyncDetail>;
    'omega-session-state': CustomEvent<OmegaSessionStateDetail>;
    'omega-pause-session': CustomEvent<OmegaPauseSessionDetail>;
    'omega-store-update': CustomEvent<void>;
    'omega-tab-change': CustomEvent<OmegaTabChangeDetail>;
  }
}
