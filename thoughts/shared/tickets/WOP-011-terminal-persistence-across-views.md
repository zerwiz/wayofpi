# [WOP-011] Terminal Session Persistence Across View Switches

## Problem

Switching between UI modes (technical ↔ simple ↔ claw) destroys the terminal session entirely — xterm instance, WebSocket connection, and server-side PTY/shell process are all terminated and must be recreated from scratch. Any running shell process, terminal history, or cwd state is lost.

Current behavior:
- `EmbeddedTerminal` is rendered inside `ToolPanelBody` → `WorkspacePane` → `TechnicalWorkspaceGrid`, which sits inside the `uiMode === "technical"` early return in `App.tsx`
- When `setUiMode("simple")` is called, the entire technical workspace component tree unmounts, triggering `EmbeddedTerminal`'s useEffect cleanup: WebSocket closes → server kills the PTY → xterm disposed
- When switching back to technical mode, a new shell spawns with no history or state

## Context

### Files Involved

| File | Role |
|------|------|
| `src/components/EmbeddedTerminal.tsx` | Creates xterm + WebSocket, destroys on unmount (useEffect cleanup) |
| `src/components/ToolPanelBody.tsx:118-119` | Renders `<EmbeddedTerminal />` for `tab === "terminal"` |
| `src/components/WorkspacePane.tsx` | Hosts ToolPanelBody in the technical workspace |
| `src/components/TechnicalWorkspaceGrid.tsx` | Multi-cell grid containing WorkspacePanes |
| `src/App.tsx:3851-4417` | Early returns per uiMode — technical tree unmounts on mode switch |
| `src/utils/terminalInputBridge.ts` | Module-level singleton for menu → terminal input (also nulled on unmount) |
| `server/terminal-ws.ts` | Server-side PTY management, per-WebSocket session |

### Analogy

The chat WebSocket session (`useWayOfPiSession`) is called at `App.tsx:317` and survives mode switches because it's above all early returns. The terminal has no equivalent — it's buried inside the technical workspace component tree.

## Success Criteria

- [ ] Switching from technical to simple mode and back preserves the terminal session (same shell process, same cwd, same scrollback)
- [ ] `sendTerminalInput()` from menus/keyboard shortcuts continues to work after switching views
- [ ] Terminal reconnects gracefully if the WebSocket drops (same behavior as now)
- [ ] Build passes with 0 errors
- [ ] No regressions in non-terminal views (simple, claw, docs, work)

## Proposed Solution

Lift terminal lifecycle into a `TerminalConnectionContext` provider mounted in `App.tsx` above all early returns. The provider manages a single WebSocket + xterm instance for the app's lifetime. `EmbeddedTerminal` is rewritten to consume the context:

1. **Create `src/context/TerminalConnectionContext.tsx`**:
   - Holds module-level refs for WebSocket, xterm `Terminal`, and `FitAddon`
   - `useEffect` with no deps (or stable deps) — connection lives for app lifetime
   - Provides `attach(container: HTMLDivElement)` and `detach()` functions
   - On attach: opens xterm in the container, fits it
   - On detach: removes xterm from DOM but does NOT close WebSocket or dispose terminal

2. **Rewrite `EmbeddedTerminal.tsx`**:
   - Consumes `TerminalConnectionContext`
   - On mount: calls `attach(containerRef.current)`
   - On unmount: calls `detach()` — no WebSocket close, no term.dispose()

3. **Update `App.tsx`**:
   - Wrap the entire return tree in `<TerminalConnectionProvider>`
   - Place it above the `useUiMode()` call (or at least above all early returns)

## WOP Number

WOP-011 (next available after WOP-010)
