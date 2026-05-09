# [WOP-011] Agentic OS Shell Architecture & Strategic Realignment

## Background & Motivation
The current architecture attempts to merge an AI Coding IDE, a Kanban system, and a Financial/ÄTA ticketing system into a single monolithic React tree (`App.tsx`). This causes severe scope creep, infinite re-render loops, and architectural friction. 

To resolve this, we are pivoting the project's identity: "Way of Pi" is not just an IDE; it is an **Agentic Operating System**. It acts as a Web OS shell that hosts isolated business subsystems, unified by a persistent Global AI Sidebar that interacts with these subsystems via Agent Tools.

## Scope & Impact
This plan outlines the structural refactoring required to enforce strict subsystem isolation and updates the master roadmap to accelerate critical stability milestones (SDK migration).

### Proposed Solution: The "Web OS" Pattern
1.  **Global Shell (`src/shell/`)**: 
    *   Manages AuthGate, Global State (Zustand/Context), and the **Role-Aware MenuBar**.
    *   Hosts the **`GlobalAISidebar`**: The AI chat interface becomes a persistent drawer, detached from specific subsystem modes.
2.  **Isolated Subsystems (`src/apps/`)**:
    *   `/ide`, `/kanban`, `/ata`
3.  **Role-Adapted Headers**: 
    *   Every view follows the **Global Header Pattern** (MenuBar) but adapts its menus and navigation to the user's role and the active app.
    *   Workers and Clients see functional headers with relevant actions, not just branding.

### UX Refirements
*   **Deep Linking**: Users are returned to their requested URL after login.
*   **Admin Bridge**: Instantaneous UI context switching between "Business" and "IDE" perspectives.
*   **Nav Centering**: The Navigation component is centered in the MenuBar to maintain visual balance across all roles.

## Roadmap Re-alignment (To be applied to WOP-ALL-TODO.md)

### 1. Accelerate SDK Migration
*   **Action**: Move "SDK Migration (WOP-004)" up the priority list immediately after Phase 3 (App Refactor). The brittle `pi --mode json` subprocess layer must be replaced by `@mariozechner/pi-coding-agent` SDK before integrating complex subsystems.

### 2. Update Phase 2 & 3
*   Phase 2 expands to **"Agentic OS Shell & Unified Routing"**. We will implement `react-router-dom` to enforce strict isolation between `/ide`, `/kanban`, and `/ata`.
*   Phase 3 (App.tsx Refactor) will extract the `GlobalAISidebar` as a standalone component living at the Shell level.

### 3. Replace Phase 7
*   **Action**: Replace the generic "Financial System" with **"WOP-012: ÄTA Construction ERP Subsystem"**. This ensures the financial features are built as an isolated app within the OS, specifically tailored to the Swedish construction use case.

## Verification
- [ ] `App.tsx` acts only as a router and layout shell.
- [ ] Navigating between `/ide` and `/kanban` completely unmounts the previous subsystem.
- [ ] The Global AI Sidebar remains mounted and retains chat history across route changes.

## Next Steps
Once this plan is approved, I will update `WOP-ALL-TODO.md` and `CHANGELOG.md` to reflect these strategic shifts.