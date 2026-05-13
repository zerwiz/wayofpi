/// <reference types="vite/client" />

declare module "*.css";
declare module "@xterm/xterm/css/xterm.css";

interface WopShellApi {
  reload: () => Promise<void>;
  reloadHard: () => Promise<void>;
  toggleDevtools: () => Promise<void>;
  closeWindow?: () => Promise<void>;
  openExternalUrl: (url: string) => Promise<void>;
  startWayOfPiBunServer?: () => Promise<{ ok: boolean; message?: string; alreadyRunning?: boolean; staleServer?: boolean }>;
}

declare global {
  interface Window {
    wopShell?: WopShellApi;
  }
}

export {};
