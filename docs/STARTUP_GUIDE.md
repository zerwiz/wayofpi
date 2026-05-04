# Way of Pi: Startup & Connectivity Guide

This document explains how to start the Way of Pi application, the differences between Electron and Browser modes, and how to access the UI over your local network or the internet.

## 1. Startup Modes

Way of Pi is designed as an **Electron-first** desktop application, but it can also run as a standard web application in your browser.

### Electron Mode (Recommended)
This is the primary way to use Way of Pi. It provides a dedicated window that associates correctly with your OS dock/taskbar.

*   **Command:** `./start-wayofpi.sh` (defaults to Electron)
*   **Alternative:** `./start-wayofpi-electron.sh`
*   **Justfile:** `just wayofpi-electron`
*   **Linux Menu:** The "Way of Pi" entry in your applications menu launches this mode.

### Browser Mode (Web Shell)
Use this mode if you want to use your own browser (e.g., for mobile testing, Chrome extensions, or multiple tabs).

*   **Command:** `./start-wayofpi.sh --web`
*   **Environment Variable:** `WOP_USE_ELECTRON=0 ./start-wayofpi.sh`
*   **Justfile:** `just wayofpi-full`

---

## 2. Network Reachability

### Local Network (LAN) Access
The Vite development server is configured to bind to `0.0.0.0`, allowing any device on your local network to access the UI.

1.  Find your host machine's LAN IP (e.g., `192.168.1.5`).
2.  Open `http://192.168.1.5:5173` on your other device (phone, tablet, laptop).
3.  **HMR (Hot Module Replacement)** is enabled for LAN access, so changes will sync in real-time.

### Internet Access (ngrok)
You can reach your Way of Pi instance from anywhere in the world using the built-in ngrok integration.

1.  Open **Settings** inside Way of Pi.
2.  Navigate to the **ngrok** section.
3.  Install/Configure your ngrok authtoken.
4.  Start the tunnel.
5.  Access the provided public URL (e.g., `https://random-id.ngrok-free.app`).

**Note:** When accessed via a public tunnel, the **Tunnel Gate** (Basic Auth) will automatically prompt you for credentials if configured in Settings.

---

## 3. Linux Desktop Integration

Way of Pi includes a script to install a native desktop entry.

*   **Install:** `./linux/install-wayofpi-menuitem.sh`
*   **Function:** Creates a `wayofpi.desktop` file in `~/.local/share/applications/` and installs high-resolution icons.
*   **Launcher:** Uses `linux/wayofpi-launch.sh` which ensures proper environment variables and port cleanup before starting.

---

## 4. Troubleshooting & Maintenance

### Port Cleanup
If the app fails to start because "Port is already in use", the startup scripts will automatically attempt to kill stale processes on:
*   **3333** (Bun API)
*   **5173** (Vite UI)

### Dependency Management
The scripts automatically check for `node_modules` and run `bun install` if they are missing or out of date.

### Backward Compatibility
A symlink `start-wayofpi-ui.sh` points to `start-wayofpi.sh` for compatibility with older documentation and scripts.
