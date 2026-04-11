/**
 * Electron shell for Way of Pi UI.
 * - Dev: loads Vite (proxies /api and /ws to Bun on 3333).
 * - Prod: loads the Bun server’s static + API origin (same process as `npm run start`).
 */
import { app, BrowserWindow, ipcMain, Menu, shell } from "electron";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const preloadPath = path.join(__dirname, "preload.mjs");

// Prefer overlay-style scrollbars where Chromium still exposes them (Windows Electron vs Chrome).
app.commandLine.appendSwitch("enable-features", "OverlayScrollbar");

const isMac = process.platform === "darwin";
const isDev = process.env.ELECTRON_DEV === "1";

/*
 * Electron builds the default File/Edit/View/Window/Help menu at **ready** unless the app
 * has already called setApplicationMenu — see electron#35512. Doing this only inside
 * app.whenReady() is too late; the bar stays. Clear it as soon as the main module loads.
 */
if (!isMac) {
	Menu.setApplicationMenu(null);
}

/**
 * macOS: minimal system menu (Quit, Hide, …). Windows/Linux: keep null (in-app MenuBar only).
 */
function setChromeMenus() {
	if (isMac) {
		Menu.setApplicationMenu(
			Menu.buildFromTemplate([
				{
					label: app.name,
					submenu: [
						{ role: "about" },
						{ type: "separator" },
						{ role: "services" },
						{ type: "separator" },
						{ role: "hide" },
						{ role: "hideOthers" },
						{ role: "unhide" },
						{ type: "separator" },
						{ role: "quit" },
					],
				},
			]),
		);
	} else {
		Menu.setApplicationMenu(null);
	}
}

/** Windows/Linux: default menu can still attach to the frame; strip it on every window. */
if (!isMac) {
	app.on("browser-window-created", (_event, win) => {
		win.removeMenu();
		win.setMenuBarVisibility(false);
	});
}

function registerWopShellIpc() {
	ipcMain.handle("wop-shell:reload", (event) => {
		BrowserWindow.fromWebContents(event.sender)?.webContents.reload();
	});
	ipcMain.handle("wop-shell:reload-hard", (event) => {
		BrowserWindow.fromWebContents(event.sender)?.webContents.reloadIgnoringCache();
	});
	ipcMain.handle("wop-shell:toggle-devtools", (event) => {
		const wc = BrowserWindow.fromWebContents(event.sender)?.webContents;
		if (!wc) return;
		if (wc.isDevToolsOpened()) wc.closeDevTools();
		else wc.openDevTools({ mode: "detach" });
	});
}

const devUrl = process.env.WOP_ELECTRON_DEV_URL || "http://127.0.0.1:5173";
const serverPort = process.env.WOP_SERVER_PORT || "3333";
const prodUrl =
	process.env.WOP_ELECTRON_PROD_URL || `http://127.0.0.1:${serverPort}/`;

function createWindow() {
	const win = new BrowserWindow({
		width: 1400,
		height: 900,
		minWidth: 800,
		minHeight: 600,
		title: "Way of Pi",
		autoHideMenuBar: !isMac,
		webPreferences: {
			preload: preloadPath,
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: true,
		},
	});

	if (!isMac) {
		win.removeMenu();
		win.setMenuBarVisibility(false);
	}

	const url = isDev ? devUrl : prodUrl;
	void win.loadURL(url);

	win.webContents.setWindowOpenHandler(({ url: target }) => {
		void shell.openExternal(target);
		return { action: "deny" };
	});
}

app.whenReady().then(() => {
	registerWopShellIpc();
	setChromeMenus();
	createWindow();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
