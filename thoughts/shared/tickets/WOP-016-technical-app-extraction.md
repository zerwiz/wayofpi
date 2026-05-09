# [WOP-016] Extract Technical Mode to Standalone App

## Problem
Technical mode (~1050 lines of JSX + handlers in App.tsx) is deeply entangled with shared state. It needs to become its own app so it can be developed independently, with a dedicated server (port 3334) and boot UI.

## Goal
Move Technical mode from inline App.tsx into a standalone app at `apps/wayofpi/technicalIDE/` ("Way of Pi"), freeing main `wayofpi-ui` to become "Way of Work" centered on ÄTA tickets.

## Approach
1. **Scaffold**: Create app directory with own `index.html`, `vite.config.ts` (port 5174), `package.json`, `tsconfig`, `postcss`, `tailwind`, `src/main.tsx` (boot screen entry)
2. **Server**: Bun.serve on port 3334, proxies HTTP+WS to main server on port 3333
3. **Boot UI**: `BootScreen.tsx` — animated terminal-style startup log, transitions to `<App>` after 1.8s
4. **TechnicalApp.tsx**: Re-create all Technical-mode state, handlers, menu definitions, keyboard handler, and render JSX inside standalone component (~1475 lines written)
5. **Shared Components**: `@wop` path alias → `../wayofpi-ui/src` for reuse
6. **Wire**: Replace inline Technical return block in App.tsx with import from `@technicalIDE`

## Done
- `apps/wayofpi/technicalIDE/` scaffold complete (index.html, package.json, vite.config.ts, tsconfigs, postcss, tailwind)
- `src/main.tsx` — entry with BootScreen → App/TechnicalApp
- `src/boot/BootScreen.tsx` — animated startup log
- `src/App.tsx` — ErrorBoundary wrapper
- `src/TechnicalApp.tsx` — ~1475 lines: imports, helpers, all state hooks, file/folder/explorer handlers, settings menu, nav history, save/refresh, workspace ops, static analysis, menu definitions (fileMenu, editMenu, selectionMenu, terminalMenu, runMenu, goMenu, helpMenu), debug/terminal handlers, zen/editor layout presets, keyboard handler
- `src/layout/SidebarContent.tsx` — sidebar panels
- `src/layout/WorkspaceEditor.tsx` — multi-cell or single-cell editor
- `apps/wayofpi/server/index.ts` — Bun.serve on port 3334, WebSocket+HTP proxy to port 3333
- Path aliases: `@technicalIDE` in wayofpi-ui, `@wop` in technicalIDE

## Remaining Work
- [ ] TechnicalApp.tsx — workspaceDockActionsMain, dock entry handlers, git review actions, onExplorerSelectFile, tab sync effects, technicalZedStrip, commandItems
- [ ] TechnicalApp.tsx — return/render JSX block (~500 lines)
- [ ] Wire TechnicalApp into App.tsx — replace inline Technical return block
- [ ] Verify build passes in both apps

## Files
- `apps/wayofpi/technicalIDE/` — the Way of Pi app
- `apps/wayofpi/server/index.ts` — port 3334 server
- `apps/wayofpi-ui/src/App.tsx` — replace inline Technical return (pending)

## Status
🟡 In Progress — ~75% of TechnicalApp.tsx written. Render block (~500 lines) and remaining handlers remaining.
