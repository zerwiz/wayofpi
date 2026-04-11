import { contextBridge, ipcRenderer } from "electron";

/** Exposed to the renderer as `window.wopShell` (Electron only). */
contextBridge.exposeInMainWorld("wopShell", {
	reload: () => ipcRenderer.invoke("wop-shell:reload"),
	reloadHard: () => ipcRenderer.invoke("wop-shell:reload-hard"),
	toggleDevtools: () => ipcRenderer.invoke("wop-shell:toggle-devtools"),
});
