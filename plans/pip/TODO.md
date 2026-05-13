# PIP Integration TODO

## Setup & Dependencies
- [ ] Clone `https://github.com/zerwiz/pip` into the workspace as a submodule (in `pip/` directory).
- [ ] Ensure `pip` is up to date (`git submodule update --remote`).
- [ ] Configure `Way of Pi` to treat `pip` as a core dependency.

## Core Infrastructure (Unified Loader)
- [ ] Update PIP's `pi-loader.ts` to prioritize Way of Pi's `protected/` directory.
- [ ] Implement Search Order:
    1. `.pi/extensions/protected/` (Way of Pi Stable)
    2. `pip/extensions/` (Upstream Fluent)
    3. `pip/.pi/extensions/` (Upstream Fluent)
    4. `.pi/extensions/local/` (Project Custom)

## UI & Server Integration (`apps/wayofwork-ui`)
- [ ] Update server to set `PI_STACK` dynamically.
- [ ] Set `WOP_PI_LOADER_PATH` to point to PIP's `pi-loader.ts`.
- [ ] Update spawn logic to use `pi -e $WOP_PI_LOADER_PATH`.

## Extension Management
- [ ] Verify "Protected vs Fluent" tiering strategy.
- [ ] Test conflict resolution for `ui-core` extensions.
- [ ] Audit `PI_STACK` configurations for various views (e.g., `agent-team`, `session-memory`).

## Validation
- [ ] Verify async initialization stability with the single-entry loader.
- [ ] Ensure no terminal corruption/UI flickering occurs with multiple extensions.
- [ ] Confirm absolute `file://` URI resolution for ESM compliance.
