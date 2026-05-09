# Way of Pi: Protected vs. Fluent Extension Strategy (with PIP)

## 1. Vision
Maintain a stable, high-performance UI experience in `apps/wayofwork-ui` (Electron/Web) while staying agile and following the latest developments from `www.pi.dev` (Upstream Pi) for CLI/TUI usage. This is achieved by utilizing **PIP (Pi Infrastructure Package)** as a core dependency.

## 2. The Tiered Architecture

We will categorize extensions into three tiers to isolate stability from agility, leveraging PIP's broad library for the "Fluent" experience.

### Tier 1: Protected (Stable / UI-Critical)
*   **Location:** `.pi/extensions/protected/` (Way of Pi)
*   **Purpose:** Extensions required for the `wayofwork-ui` backend. These are "frozen" or surgically updated only after full UI regression testing.
*   **Safety:** Protected from upstream Pi updates that might change tool signatures or UI widget behavior.

### Tier 2: Fluent (Agile / PIP Upstream)
*   **Location:** `pip/extensions/` or `pip/.pi/extensions/`
*   **Purpose:** Standard extensions that follow `www.pi.dev` patterns. Managed by the PIP repository (`https://github.com/zerwiz/pip`).
*   **Use Case:** Interactive TUI use, experimental tools, and non-UI critical widgets.
*   **MANDATE:** NEVER EDIT the `pip/` directory. It is a read-only upstream submodule.

### Tier 3: Project (Custom / Local)
*   **Location:** `.pi/extensions/local/` or `.pi/extensions/fluent/`
*   **Purpose:** Tools specific to "Way of Pi" project management (e.g., `github-management.ts`).

---

## 3. The Single-Entry Dynamic Loader (`pi-loader.ts`)

To address stability issues in Pi 0.70.5+ (multiple `-e` flag instability) and resolve tool conflicts, we utilize a **Unified Dynamic Loader**.

### Entry Point
Instead of passing multiple `-e` flags, we pass exactly **ONE** flag pointing to Way of Pi's loader:
```bash
# Example from Way of Pi root
pi -e .pi/extensions/util/pi-loader.ts
```

### Loading Logic
1.  **Environment Variable:** `PI_STACK` (comma-separated list, e.g., `agent-team,damage-control`) defines what to load.
2.  **Manifest-Driven:** The loader uses category definitions to manage conflicts.
3.  **Conflict Resolution:** 
    *   **UI Cores:** If both `minimal` and `pure-focus` are requested, only the last one loads.
    *   **Tool Conflicts:** The loader checks for existing registrations to prevent naming collisions.
4.  **Updated Path Resolution Order:**
    1.  `.pi/extensions/protected/` (Way of Pi Protected)
    2.  `pip/extensions/` (Upstream Fluent)
    3.  `pip/.pi/extensions/` (Upstream Fluent)
    4.  `.pi/extensions/local/` (Local Custom)
    5.  `.pi/extensions/fluent/` (Project Fluent)
    6.  `extensions/` (Legacy root)

---

## 4. PIP as a Dependency
`Way of pi` will link to `https://github.com/zerwiz/pip` as its primary infrastructure provider. This allows the core `way-of-pi` repository to remain focused on its Electron UI and Project Management features, while offloading extension agility to PIP.

## 5. Resolving `web_search` Conflict
The PIP loader will handle the `web_search` conflict by:
- Detecting if `pi-web-access` (npm) is active.
- If `web-tools.ts` is in the `PI_STACK`, it will conditionally register tools ONLY if they aren't already provided by the npm package.

---

## 6. UI Backend Parity
The `apps/wayofwork-ui` server will:
1.  Set `PI_STACK` based on the active view.
2.  Set `WOP_PI_LOADER_PATH` to the PIP loader.
3.  Execute `pi -e $WOP_PI_LOADER_PATH`.

