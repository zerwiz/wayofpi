# Linux launcher assets

- **`../images/wayofpi-icon.png`** — Dock / app grid icon (512×512 raster, matches the squircle style used in the UI).
- **`../apps/wayofpi-ui/public/wayofpi-icon.svg`** — Vector variant for the web favicon and sharp scaling.
- **`wayofpi-launch.sh`** — Starts from the repo root; **defaults to Electron** (`WOP_USE_ELECTRON=1`) so the dock icon matches **`BrowserWindow`**. Use **`WOP_USE_ELECTRON=0`** before the command if you want the browser launcher instead.
- **`StartupWMClass=wayofpi`** (in the generated `.desktop`) plus **`app.setName("wayofpi")`** and **`desktopName`** in **`apps/wayofpi-ui/package.json`** help GNOME/KDE associate the running window with this menu entry.
- **`wayofpi.desktop.in`** — Freedesktop entry template; **`install-wayofpi-menuitem.sh`** expands `@REPO@` and installs the icon into **`hicolor`** so **`Icon=wayofpi`** resolves like other desktop apps.

After cloning, run once:

```bash
./linux/install-wayofpi-menuitem.sh
```

Then pin **Way of Pi** from the app menu to the dock.
