import { contextBridge, ipcRenderer } from "electron";

/** Exposed to the renderer as `window.wopShell` (Electron only). */
contextBridge.exposeInMainWorld("wopShell", {
	reload: () => ipcRenderer.invoke("wop-shell:reload"),
	reloadHard: () => ipcRenderer.invoke("wop-shell:reload-hard"),
	toggleDevtools: () => ipcRenderer.invoke("wop-shell:toggle-devtools"),
	/** File → Close Window / Exit — `window.close()` is unreliable under Electron. */
	closeWindow: () => ipcRenderer.invoke("wop-shell:close-window"),
	/** Open **`http(s):`** in the **system default browser** (use when you explicitly want an external app). */
	openExternalUrl: (url) => ipcRenderer.invoke("wop-shell:open-external-url", url),
	/**
	 * Native save dialog (Electron). Renderer should POST `save_code_workspace_file` to the Bun server with the returned path.
	 * @param {string} [suggestedName] default filename, e.g. `wayof-pi.code-workspace`
	 */
	saveWorkspaceFileAs: (suggestedName) => ipcRenderer.invoke("wop-shell:save-workspace-file", suggestedName),
	/** Native save dialog; renderer converts absolute → workspace-relative before `PUT /api/file`. */
	saveFileAs: (payload) => ipcRenderer.invoke("wop-shell:save-file", payload),
	/** Electron dev: spawn Bun API if Vite proxy target is down. */
	startWayOfPiBunServer: () => ipcRenderer.invoke("wop-shell:start-wayofpi-bun-server"),
});
