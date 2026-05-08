# TypeScript Build Errors - Phase 1 Fix Plan

Total errors: ~917

## Phase 1: Critical Build Errors (Priority: HIGH)

### 1. AgentMeta interface errors

- Property `description` missing on AgentMeta
- Property `relativePath` missing on AgentMeta
- Property `tools` missing on AgentMeta

### 2. ServerConfig interface errors

- Property `provider` missing
- Property `ollamaHost` missing
- Property `openrouterModel` missing
- Property `ollamaModel` missing
- Property `piDrivesChat` missing
- Property `chatEngine` missing
- Property `configRuntimePost` missing
- Property `piBinaryResolved` missing
- Property `terminalEnabled` missing
- Property `customShell` missing
- Property `orchestratorTools` missing
- Property `orchestratorBash` missing

### 3. Hook export errors

- `SimpleChatView` imports missing from hooks
- `SimpleMarkdownPaneMode` missing from useSimplePreferences
- `ChatSessionMode` missing from useWayOfPiSession
- `AgentTeamMap` missing from useAgents
- `ChatPulseMeters` missing from useWayOfPiSession
- `ChatRow` missing from useWayOfPiSession
- `ChatTab` missing from useWayOfPiSession
- `LogRow` missing from useWayOfPiSession
- `SimpleColorMode` missing from useSimplePreferences

### 4. Parameter type errors

- Function parameters don't match callback types
- Type mismatches in event handlers

### 5. Component property errors

- `uiMode` vs `UiMode` type mismatch
- Missing properties on Element (selectionStart, etc.)

### 6. Missing React imports

- Scrollbar vs ScrollArea

### 7. Tabs component errors

- Missing onValueChange prop
- Missing value prop

### 8. CodeArea errors

- Element properties don't exist (value, selectionStart)
- Scrollbar vs ScrollArea

### 9. ScrollArea errors

- Missing orientation prop

### 10. TaskList errors

- Missing ClockIcon

### 11. useClawTelegramStatus errors

- Missing clawTelegramStatusGet

### 12. useWayOfPiSession errors

- event.key is possibly null

### 13. useWorkspaceTree errors

- Missing setRoot declaration

## Phase 2: Systematic Fix Approach

1. Fix agent interface to match actual agent data structure
2. Fix server config interface
3. Restore missing hook exports
4. Fix parameter type mismatches
5. Fix component prop types
6. Add missing React components

## Fix Files Order:

1. src/interfaces/agent.ts - Add description, relativePath, tools to AgentMeta
2. src/interfaces/server.ts - Add all missing server config properties
3. src/hooks/useAgents.ts - Restore AgentTeamMap and fix add/remove/update
4. src/hooks/useSimplePreferences.ts - Restore SimpleMarkdownPaneMode
5. src/hooks/useWayOfPiSession.ts - Restore ChatSessionMode, ChatPulseMeters, etc.
6. Then restore Simple hooks
