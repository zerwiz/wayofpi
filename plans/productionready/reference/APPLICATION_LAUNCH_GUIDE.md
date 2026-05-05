# Way of Pi: Application Launch Guide

This guide explains how to start Way of Pi once it has been installed on your system.

## 1. Linux
Way of Pi integrates with the standard Linux application menu (GNOME, KDE, XFCE, etc.).

### First-Time Setup
Run the following script from your clone or installation directory:
```bash
./linux/install-wayofpi-menuitem.sh
```

### Launching
1.  Open your **Applications Grid** (usually by pressing the Super/Windows key).
2.  Search for **Way of Pi**.
3.  Click the Way of Pi icon to launch.
4.  *Optional:* Right-click the icon and select **Add to Favorites** or **Pin to Dash** for quick access from your dock.

---

## 2. macOS
Way of Pi follows standard macOS application patterns.

### First-Time Setup
If you downloaded the `.dmg`, drag the **Way of Pi** app to your **Applications** folder.

### Launching
1.  Open **Launchpad** or use **Spotlight** (Cmd + Space).
2.  Search for **Way of Pi**.
3.  Press Enter to launch.
4.  *Optional:* Drag the icon from the Applications folder to your **Dock** to pin it.

---

## 3. Windows
Way of Pi integrates with the Windows Start Menu.

### First-Time Setup
Run the `scripts/install.ps1` script to install dependencies and create a shortcut.

### Launching
1.  Press the **Start** key.
2.  Search for **Way of Pi**.
3.  Click the application to launch.
4.  *Optional:* Right-click and select **Pin to Taskbar**.

---

## 4. Developer Launch (Terminal)
If you are developing the system and want to see real-time logs in your terminal:

### Standard Desktop (Electron)
```bash
./start-wayofpi-electron.sh
```

### Web UI Only (Browser)
```bash
./start-wayofpi-ui.sh --web
```

### Troubleshooting
If the application fails to start, run the doctor script to check for common issues:
```bash
./doctor.sh
```

---
**Default Credentials:** `admin` / `admin`
