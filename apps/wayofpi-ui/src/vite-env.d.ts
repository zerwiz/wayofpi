/// <reference types="vite/client" />

/** Electron main exposes this via `electron/preload.mjs` (desktop shell only). */
interface WopShellApi {
	reload: () => Promise<void>;
	reloadHard: () => Promise<void>;
	toggleDevtools: () => Promise<void>;
}

declare global {
	interface Window {
		wopShell?: WopShellApi;
	}
}

export {};
