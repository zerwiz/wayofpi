# Way of Pi & PIP Integration

## Dependency Model
Way of Pi will treat PIP as a core infrastructure dependency. 

### Local Development
In the local development environment, `Way of pi` links to `/home/zerwiz/pip`.

### GitHub Integration
For production/deployment, Way of Pi will reference `https://github.com/zerwiz/pip` (likely via a git submodule or a dedicated installation script).

## Extension Tiering
We will merge the "Protected vs Fluent" strategy with PIP:

1.  **Protected Tier (Way of Pi)**: Located in `.pi/extensions/protected/`. Managed by `apps/wayofpi-ui`. These are high-stability versions of critical tools.
2.  **Fluent Tier (PIP)**: Located in `/home/zerwiz/pip/.pi/extensions/`. These follow the latest Pi developments.

## The Unified Loader
The `pi-loader.ts` from PIP will be updated to search the Way of Pi `protected/` directory first.

### Search Order Update:
1.  `.pi/extensions/protected/` (Way of Pi Stable)
2.  `/home/zerwiz/pip/extensions/` (Upstream Fluent)
3.  `/home/zerwiz/pip/.pi/extensions/` (Upstream Fluent)
4.  `.pi/extensions/local/` (Project Custom)

## UI Implementation
`apps/wayofpi-ui` server will:
1.  Set `PI_STACK` based on the requested view (e.g., `agent-team,session-memory`).
2.  Set `WOP_PI_LOADER_PATH` to PIP's `pi-loader.ts`.
3.  Spawn `pi -e $WOP_PI_LOADER_PATH`.
