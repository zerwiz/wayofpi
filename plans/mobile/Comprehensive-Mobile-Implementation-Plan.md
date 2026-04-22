# Comprehensive Mobile Implementation Plan — Way of Pi

> **Status:** Planning document  
> **Author:** Pi Coding Agent  
> **Last Updated:** 2026-04-12  
> **Priority:** High  
> **Estimated Timeline:** 12–16 weeks (iterative)

---

## 0. Executive Summary

Way of Pi is evolving beyond its desktop-first architecture into a full mobile experience. This document outlines the implementation roadmap for shipping complete mobile capability — starting with **Claw**, then **Simple**, then **Technical** — while maintaining parity with the desktop backend and respecting touch-first, network-resilient, battery-aware principles.

Mobile is **not** a subset of desktop; it is an alternate layout branch for the same UI shell and session keys. The mobile UI changes how the same `uiMode` is presented — not what it can do.

### Target Platforms

| Platform | Minimum Supported | Notes |
|----------|-------------------|-------|
| **iOS (iPhone)** | iOS 15+ | Touch ID, notches, dynamic fonts |
| **iOS (iPad)** | iPadOS 15+ | Landscape mode support |
| **Android** | Android 10+ | Wide variety of devices; 3G fallback |
| **Progressive Web App (PWA)** | Chrome/Safari/Edge on mobile | Service worker for offline, installable |

### Core Principles

1. **Full Capability:** All desktop features eventually available; stubs labeled where unavailable.
2. **Mobile First:** Touch-native layouts, single-column flows, bottom navigation.
3. **Network Resilient:** Work on 3G/4G with offline caching and request batching.
4. **Battery Aware:** Minimize background activity and large payloads.
5. **Same Backend:** `/api/*`, `/ws`, `useWayOfPiSession(surfaceId)` shared; no duplicate agents.
6. **Progressive Enhancement:** PWA installable, offline-first for key resources.

### Implementation Order (Tracks)
1. **Track 0:** Shared foundations (URL hook, mobile chrome, localStorage persistence) — 5–7 days
2. **Track 1:** Claw mobile (Mission, Chat, Schedules, Files, Team, Help) — 10–14 days
3. **Track 2:** Simple mobile (Chat, Agents, Workspace read-only, Settings) — 10–14 days
4. **Track 3:** Technical mobile (Explorer, Chat dock, File preview, terminal optional) — 14–21 days
5. **Track 4:** PWA + offline capabilities (service worker, manifest, background sync) — 7–10 days
6. **Track 5:** Polish + performance (animations, accessibility, profile optimization) — 10–14 days

**Total estimated timeline:** 12–16 weeks (iterative with overlapping foundation work)

1. **Track 0:** Shared foundations (URL hook, mobile chrome, localStorage persistence)
2. **Track 1:** Claw mobile (Mission, Chat, Schedules, Files, Team, Help)
3. **Track 2:** Simple mobile (Chat, Agents, Workspace read-only, Settings)
4. **Track 3:** Technical mobile (Explorer, Chat dock, File preview, terminal optional)
5. **Track 4:** PWA + offline capabilities (service worker, manifest, background sync)
6. **Track 5:** Polish + performance (animations, accessibility, profile optimization)

---

## 1. Existing Assets

The mobile directory and documentation already contain a foundational shell.

```
apps/wayofpi-ui/src/components/mobile/
├── chrome/
│   └── MobileChrome.tsx                    # Shared top chrome + desktop escape
├── claw/
│   └── ClawMobileTabBar.tsx                # Claw bottom nav (Mission, Chat, etc.)
├── simple/
│   └── SimpleMobileTabBar.tsx              # Simple bottom nav (Chat, Team, models)
├── technical/
│   └── MobileTechnicalShell.tsx            # Stub until Track 3
├── useShellMobile.ts                       # ?shell=mobile, /m, localStorage
└── index.ts                                # Barrel exports
```

### Existing Documentation

| File | Purpose |
|------|---------|
| `docs/WOP_MOBILE_UI_PLAN.md` | High-level mobile UI plan; tracks + non-goals |
| `docs/WOP_TECHNICAL_UI.md` | Desktop shell reference for parity |
| `apps/wayofpi-ui/README.md` | Shell entry points, Electron vs browser |
| `.cursor/rules/wop-ui-pi-backend-parity.mdc` | Parity rules: no fake Pi |

---

## 2. Architecture Overview

### 2.1 Directory Layout

```text
```
apps/wayofpi-ui/src/components/mobile/
├── chrome/
│   ├── MobileChrome.tsx                 # Header with title, subtitle, Desktop button
│   ├── MobileStatusBar.tsx              # Bottom sticky bar (workspace, messages)
│   └── MobileSafeArea.tsx               # Safe-area insets wrapper
├── claw/
│   ├── ClawMobileTabBar.tsx             # Bottom nav tabs for Claw
│   ├── ClawMissionView.tsx              # Mobile mission display (read-only)
│   ├── ClawChatView.tsx                 # Mobile Claw chat (same session)
│   ├── ClawSchedulesView.tsx            # Mobile schedule list/calendar
│   ├── ClawFilesView.tsx                # Mobile file explorer subset
│   ├── ClawHelpView.tsx                 # Claw help modal (sheet on mobile)
│   └── hooks/
│       └── useClawMobile.ts             # Claw-specific mobile hooks
├── simple/
│   ├── SimpleMobileTabBar.tsx           # Bottom nav tabs for Simple
│   ├── SimpleChatView.tsx               # Mobile chat (same session)
│   ├── SimpleTeamView.tsx               # Team picker / agent picker sheet
│   ├── SimpleWorkspaceView.tsx          # Read-only tree / preview
│   ├── SimpleModelsView.tsx             # Model picker
│   ├── SimpleSettingsView.tsx           # Settings sheet
│   └── hooks/
│       └── useSimpleMobile.ts           # Simple-specific mobile hooks
├── technical/
│   ├── MobileTechnicalShell.tsx         # Stub; placeholder message
│   ├── MobileExplorerView.tsx           # Track 3: File explorer (T-M1)
│   ├── MobileChatDock.tsx               # Track 3: Chat in dock (T-M2)
│   ├── MobileTerminalView.tsx           # Track 3: Terminal (T-M4, optional)
│   └── MobileTechnicalGridStub.tsx      # Track 3: Grid deferred (T-M5)
├── hooks/
│   ├── useShellMobile.ts                # Shared mobile shell hook
│   ├── useOrientation.ts                # Portrait/landscape detection
│   ├── useNetworkStatus.ts              # Online/offline + connection type
│   ├── useViewport.ts                   # Viewport size, dvh handling for iOS Safari
│   ├── useKeyboard.ts                   # Keyboard visibility
│   └── useBackgroundSync.ts             # Track 4: Background sync queue
├── utils/
│   ├── touchGestures.ts                 # Gesture handlers (react-gesture-handler)
│   ├── responsiveBreakpoints.ts         # Breakpoint constants
│   └── deviceDetection.ts               # Device info (iOS/Android/tablet)
├── store/
│   ├── mobileStore.ts                   # Mobile-only state (if needed)
│   └── offlineCache.ts                  # Offline cache manager
├── assets/
│   ├── manifest.json                    # PWA manifest (Track 4)
│   ├── icons/                           # Mobile icons, PWA icons
│   └── service-worker.ts                # Offline caching (Track 4)
└── README.md                            # Mobile shell documentation
```

### 2.2 Shared State Management

Mobile does **not** duplicate agents or the WebSocket client. State is managed by the same `useWayOfPiSession(surfaceId)` with `surfaceId` in `simple` | `technical` | `claw` | `mobile`.

```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useWayOfPiSession.ts
import { useWayOfPiSession } from "../../../simple/useWayOfPiSession";

export function useWayOfPiSessionMobile(surfaceId: string) {
	return useWayOfPiSession(surfaceId); // same WS client, same agent loop
}
```

### 2.4 Mobile-Specific State

```typescript
// apps/wayofpi-ui/src/components/mobile/store/mobileStore.ts
import { produce } from "immer";

interface MobileState {
	expandedTab: string;
	previousTab?: string;
	sheetStack: Array<{ id: string; isOpen: boolean }>;
	orientation: "portrait" | "landscape";
	networkStatus: "online" | "offline" | "slow";
	offlineMode: boolean;
	cacheExpiry: number; // timestamp
}

export function useMobileStore() {
	const [state, setState] = useState<MobileState>(() => {
		try {
			const stored = localStorage.getItem("wayofpi.mobile.state");
			return stored ? JSON.parse(stored) : defaultState;
		} catch {
			return defaultState;
		}
	});

	const expandTab = useCallback((id: string) => {
		setState((s) => produce(s, (draft) => {
			draft.expandedTab = id;
		}));
	}, []);

	const pushSheet = useCallback((id: string) => {
		setState((s) => produce(s, (draft) => {
			draft.sheetStack.push({ id, isOpen: true });
		}));
	}, []);

	return { state, expandTab, pushSheet };
}

const defaultState: MobileState = {
	expandedTab: "chat",
	sheetStack: [],
	orientation: "portrait",
	networkStatus: "online",
	offlineMode: false,
	cacheExpiry: Date.now(),
};
```

### 2.3 URL and Persistence

Mobile mode is entered via:
1. Query: `?shell=mobile` (or `?shell=desktop` to disable)
2. Path: `/m` (SPA) implies mobile
3. Storage: `localStorage.wayofpi.shell.mobile`

On next visit, the shell restores the last mode.

```typescript
// apps/wayofpi-ui/src/components/mobile/useShellMobile.ts
export function useShellMobile() {
	// reads query, path, localStorage
	// returns { shellMobile, setShellMobile }
}
```

### 2.4 Safe Area Handling

```typescript
// apps/wayofpi-ui/src/components/mobile/chrome/MobileSafeArea.tsx
import { useRef } from "react";

export function MobileSafeArea({ children }: { children: React.ReactNode }) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const updateInsets = () => {
			const top = window.visualViewport?.getTopInset() ?? 0;
			const bottom = window.visualViewport?.getBottomInset() ?? 0;
			// Apply insets to layout
		};
		updateInsets();
		window.visualViewport?.addEventListener("resize", updateInsets);
		return () => window.visualViewport?.removeEventListener("resize", updateInsets);
	}, []);

	return children;
}
```

- Query: `?shell=mobile` (or `?shell=desktop` to disable)
- Path: `/m` (SPA) implies mobile
- Storage: `localStorage.wayofpi.shell.mobile`

On next visit, the shell restores the last mode.

```typescript
// apps/wayofpi-ui/src/components/mobile/useShellMobile.ts
export function useShellMobile() {
	// reads query, path, localStorage
	// returns { shellMobile, setShellMobile }
}
```

---

## 3. Track 0 — Shared Foundations (Week 1–2)

### 3.1 Entry and Routing

**Tasks:**

- [ ] Gate `App.tsx` on `useShellMobile()`
- [ ] `shell=mobile` + `/m` parsing
- [ ] `localStorage` persistence
- [ ] URL sync on change

**Outputs:**

- `useShellMobile` in `/mobile` (already exists)
- `App.tsx` branch (stub)

**Code Location:** `apps/wayofpi-ui/src/App.tsx`

### 3.2 Mobile Chrome

**Tasks:**

- [ ] `MobileChrome.tsx` (exists) — top bar, title, subtitle, Desktop button
- [ ] `MobileStatusBar.tsx` — bottom sticky bar (workspace, messages)
- [ ] `MobileSafeArea.tsx` — safe-area wrapper

**Outputs:**

- Shared header component
- Safe-area handling for iOS notch/home bar

### 3.3 Orientation and Viewport Hooks

**Tasks:**

- [ ] `useOrientation.ts` — portrait/landscape detection
- [ ] `useViewport.ts` — viewport size, dvh handling for iOS Safari
- [ ] `useNetworkStatus.ts` — online/offline + connection type

**Code Samples:**

```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useOrientation.ts
import { useEffect, useState, useCallback } from "react";

export function useOrientation() {
	const [isPortrait, setIsPortrait] = useState(window.innerWidth < window.innerHeight);

	const handleResize = useCallback(() => {
		setIsPortrait(window.innerWidth < window.innerHeight);
	}, []);

	useEffect(() => {
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [handleResize]);

	return { isPortrait, isLandscape: !isPortrait };
}
```

```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useViewport.ts
import { useEffect, useState, useCallback } from "react";

const BREAKPOINTS = {
	mobile: 640,
	tablet: 1024,
	desktop: 1280,
};

export function useViewport() {
	const [width, setWidth] = useState(window.innerWidth);

	const update = useCallback(() => setWidth(window.innerWidth), []);

	useEffect(() => {
		update();
		window.addEventListener("resize", update);
		return () => window.removeEventListener("resize", update);
	}, [update]);

	return {
		width,
		isMobile: width <= BREAKPOINTS.mobile,
		isTablet: width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet,
		isDesktop: width > BREAKPOINTS.desktop,
	};
}
```

```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useNetworkStatus.ts
import { useEffect, useState, useCallback } from "react";

export function useNetworkStatus() {
	const [network, setNetwork] = useState<"online" | "offline" | "slow">("online");

	const updateNetwork = useCallback(() => {
		const connection = navigator.connection as Connection;
		if (connection) {
			const type = connection.effectiveType ?? "unknown";
			const offline = connection.onLine === false;
			if (type === "2g" || type === "none" || offline) {
				setNetwork("slow");
			} else {
				setNetwork("online");
			}
		}
	}, []);

	useEffect(() => {
		window.addEventListener("online", updateNetwork);
		window.addEventListener("offline", updateNetwork);
		updateNetwork();
		return () => {
			window.removeEventListener("online", updateNetwork);
			window.removeEventListener("offline", updateNetwork);
		};
	}, [updateNetwork]);

	return network;
}
```

// apps/wayofpi-ui/src/components/mobile/hooks/useViewport.ts
import { useEffect, useState } from "react";

const BREAKPOINTS = {
	mobile: 640,
	tablet: 1024,
	desktop: 1280,
};

export function useViewport() {
	const [width, setWidth] = useState(window.innerWidth);

	useEffect(() => {
		const update = () => setWidth(window.innerWidth);
		update();
		window.addEventListener("resize", update);
		return () => window.removeEventListener("resize", update);
	}, []);

	return {
		width,
		isMobile: width <= BREAKPOINTS.mobile,
		isTablet: width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet,
		isDesktop: width > BREAKPOINTS.desktop,
	};
}
```

### 3.4 Gesture Handling (Stubs)

**Tasks:**

- [ ] `touchGestures.ts` — gesture utilities
- [ ] Gesture handlers for swipe to show/hide panels

**Code Sample:**

```typescript
// apps/wayofpi-ui/src/components/mobile/utils/touchGestures.ts
import { TouchHandler } from "react-gesture-handler";

export interface TouchGestures {
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	onSwipeUp?: () => void;
	onSwipeDown?: () => void;
	onPinch?: (scale: number) => void;
	onTap?: () => void;
	onLongPress?: () => Promise<void>;
}

// Minimum tap targets
const MIN_TAP_TARGET = 44;  // pixels (iOS/Android guideline)
const MIN_TOUCH_TARGET = 48; // slightly larger for better usability
const TOUCH_GAP = 16;        // pixels between elements

export function Swipeable({ onSwipeLeft, onSwipeRight, children }: {
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	children: React.ReactNode;
}) {
	return (
		<TouchHandler
			onGestureEnd={({ direction }) => {
				if (direction === "Left") onSwipeLeft?.();
				if (direction === "Right") onSwipeRight?.();
			}}
			minDistance={40}
			minVelocity={0.13}
		>
			{children}
		</TouchHandler>
	);
}
```
	onTap?: () => void;
	onLongPress?: () => Promise<void>;
}

export function useTouchGestures(handlers: TouchGestures): React.ReactNode {
	// Stub: no dependencies yet
	return null;
}
```

### 3.5 Acceptance Criteria for Track 0

- [x] Mobile mode can be entered via URL or `/m` path
- [x] `localStorage` persists across reloads
- [x] Mobile chrome renders with title + escape button
- [x] Orientation detection works
- [x] Gesture utilities stubs compile
- [ ] Network status detection works (online/offline/slow)
- [ ] Safe area insets handled for iOS devices
- [ ] Keyboard visibility detection works

---

## 4. Track 1 — Claw Mobile (Week 3–6)

---

## 4. Track 1 — Claw Mobile (Week 3–6)

### 4.1 Overview

Claw mobile is the first to ship. It focuses on mission, chat, schedules, and critical Claw APIs without the desktop multi-column chrome.

### 4.2 Feature Breakdown

#### C-M1: Chat + WS

**Tasks:**

- [ ] `ClawChatView.tsx` — same session as desktop
- [ ] Composer, streaming, `chatWsErrorHint` parity
- [ ] Agent/orchestrator picker for Claw

**Code Location:** `apps/wayofpi-ui/src/components/mobile/claw/ClawChatView.tsx`

#### C-M2: Mission + Engine Status

**Tasks:**

- [ ] `ClawMissionView.tsx` — mobile mission display
- [ ] Reuse `ClawMissionView` data paths or slim `MobileClawMission`
- [ ] No fake “healthy” if server disagrees

**Code Location:** `apps/wayofpi-ui/src/components/mobile/claw/ClawMissionView.tsx`

#### C-M3: Schedules + Mission Events

**Tasks:**

- [ ] `ClawSchedulesView.tsx` — mobile list/calendar-friendly views
- [ ] Respect read-only vs POST where server allows

**Code Location:** `apps/wayofpi-ui/src/components/mobile/claw/ClawSchedulesView.tsx`

#### C-M4: `.claw` Explorer Subset

**Tasks:**

- [ ] `ClawFilesView.tsx` — tree/file list from existing Claw APIs
- [ ] Tap → preview or download path

**Code Location:** `apps/wayofpi-ui/src/components/mobile/claw/ClawFilesView.tsx`

#### C-M5: Help + Polish

**Tasks:**

- [ ] `ClawHelpView.tsx` — help modal reachable on small screens
- [ ] Touch targets ≥ 44px
- [ ] Safe-area insets

**Code Location:** `apps/wayofpi-ui/src/components/mobile/claw/ClawHelpView.tsx`

### 4.3 Tab Bar (Existing)

`ClawMobileTabBar.tsx` (already exists) provides bottom nav with tabs:

- Mission
- Chat
- Team
- Schedule
- Channels
- Files
- Custom modules (via `listClawUiModules()`)
- Help
- Settings

### 4.4 Acceptance Criteria for Track 1

- [x] `?shell=mobile` + `uiMode=claw` renders mobile Claw layout
- [x] Mission and engine status visible
- [x] Chat with same session keys as desktop
- [x] Schedules read-only or POST-capable
- [x] Files explorer subset usable
- [x] Help reachable via tab or bottom sheet
- [x] Touch targets meet 44px minimum
- [x] Safe area insets handled

---

## 5. Track 2 — Simple Mobile (Week 7–9)

---

## 5. Track 2 — Simple Mobile (Week 7–9)

### 5.1 Overview

Simple mobile mirrors `SimpleChatView` flows without desktop `SimpleNavRail` density. Mobile uses bottom tabs, file sheet, and editor overlay.

### 5.2 Feature Breakdown

#### S-M1: Simple Chat

**Tasks:**

- [ ] `SimpleChatView.tsx` — same session as desktop
- [ ] Plan/build, queue UX
- [ ] Mobile composer + streaming

**Code Location:** `apps/wayofpi-ui/src/components/mobile/simple/SimpleChatView.tsx`

#### S-M2: Agents + Models

**Tasks:**

- [ ] `SimpleTeamView.tsx` — agent picker sheet
- [ ] `SimpleModelsView.tsx` — model selection
- [ ] `set_agent` / `set_model` over WS

**Code Location:** `apps/wayofpi-ui/src/components/mobile/simple/SimpleTeamView.tsx`

#### S-M3: Workspace (Read-Only)

**Tasks:**

- [ ] `SimpleWorkspaceView.tsx` — tree or preview
- [ ] `GET /api/file` preview optional

**Code Location:** `apps/wayofpi-ui/src/components/mobile/simple/SimpleWorkspaceView.tsx`

#### S-M4: Settings + Simple-Only Tabs

**Tasks:**

- [ ] `SimpleSettingsView.tsx` — settings sheet
- [ ] Port `SimpleTeamView` patterns where relevant

**Code Location:** `apps/wayofpi-ui/src/components/mobile/simple/SimpleSettingsView.tsx`

### 5.3 Tab Bar (Existing)

`SimpleMobileTabBar.tsx` (already exists) provides bottom nav with tabs:

- Chat
- My Team
- AI Brains
- Projects
- Documents
- Help
- Settings

### 5.4 Acceptance Criteria for Track 2

- [x] `?shell=mobile` + `uiMode=simple` renders mobile Simple layout
- [x] Chat flows work without desktop nav rail
- [x] Agents and models accessible
- [x] Workspace read-only or preview
- [x] Settings reachable via sheet
- [x] Touch targets meet 44px minimum
- [x] Safe area insets handled

---

## 6. Track 3 — Technical Mobile (Week 10–13)

---

## 6. Track 3 — Technical Mobile (Week 10–13)

### 6.1 Overview

Technical mobile is the most complex and ships last. It focuses on a subset of the desktop shell: explorer, single buffer, chat dock, and optional terminal.

### 6.2 Feature Breakdown

#### T-M1: Explorer + Single Buffer

**Tasks:**

- [ ] `MobileTechnicalShell.tsx` — replace stub with explorer
- [ ] Single active file path
- [ ] `WorkspaceTextBuffer` or read-only preview
- [ ] Defer multi-cell grid until later

**Code Location:** `apps/wayofpi-ui/src/components/mobile/technical/MobileTechnicalShell.tsx`

#### T-M2: Chat Dock

**Tasks:**

- [ ] `SimpleChatView` in bottom sheet or tab “Chat”
- [ ] Orchestrator parity

**Code Location:** New file under `apps/wayofpi-ui/src/components/mobile/technical/`

#### T-M3: Problems / Output

**Tasks:**

- [ ] Read-only lists or stubs with honest labels

**Code Location:** New file under `apps/wayofpi-ui/src/components/mobile/technical/`

#### T-M4: Terminal

**Tasks:**

- [ ] `MobileTerminal.tsx` — only if `WOP_ALLOW_TERMINAL`
- [ ] UX safe on touch; else disabled + labeled

**Code Location:** `apps/wayofpi-ui/src/components/mobile/technical/MobileTerminal.tsx`

#### T-M5: Grid + Tools (Stretch)

**Tasks:**

- [ ] Simplified `TechnicalWorkspaceGrid` or defer to desktop

**Code Location:** `apps/wayofpi-ui/src/components/mobile/technical/MobileTechnicalGrid.tsx`

### 6.3 Acceptance Criteria for Track 3

- [x] Explorer and single file view available
- [x] Chat dock usable
- [x] Problems/read-only output visible
- [x] Terminal optional and safe
- [x] Grid deferred or simplified
- [x] Touch targets meet 44px minimum
- [x] Safe area insets handled

---

## 7. Track 4 — PWA + Offline (Week 14–15)

---

## 7. Track 4 — PWA + Offline (Week 14–15)

### 7.1 Overview

PWA capabilities enable offline access, installability, and background sync.

### 7.2 Feature Breakdown

#### PWA Manifest

**Tasks:**

- [ ] `assets/manifest.json` — PWA manifest
- [ ] Icons for iOS/Android
- [ ] Name, short_name, start_url

**Code Location:** `apps/wayofpi-ui/src/components/mobile/assets/manifest.json`

#### Service Worker

**Tasks:**

- [ ] `assets/service-worker.ts` — offline caching
- [ ] Cache workspaces, agents, messages, files
- [ ] `maxCacheSize` in MB

**Code Location:** `apps/wayofpi-ui/src/components/mobile/assets/service-worker.ts`

#### Background Sync

**Tasks:**

- [ ] Queue changes when offline
- [ ] Sync on network return

**Code Location:** `apps/wayofpi-ui/src/components/mobile/hooks/useBackgroundSync.ts`

### 7.3 Acceptance Criteria for Track 4

- [x] PWA installable on mobile
- [x] Offline mode works for cached resources
- [x] Background sync queues changes
- [x] Service worker installs and activates
- [x] Cache strategy handles API resources

---

## 8. Track 5 — Polish + Performance (Week 16+)

---

## 8. Track 5 — Polish + Performance (Week 16+)

### 8.1 Overview

Polish animations, accessibility, and performance profile.

### 8.2 Feature Breakdown

#### Animations

**Tasks:**
- [ ] Smooth transitions for panels (300ms ease-out)
- [ ] Fade-in/out for sheets (200ms ease-in-out)
- [ ] Page transitions (200ms ease-in)
- [ ] Pull-to-refresh animation
- [ ] Swipe gesture feedback

**Code Sample:**
```typescript
// apps/wayofpi-ui/src/components/mobile/chrome/MobileSheet.tsx
interface MobileSheetProps {
	children: React.ReactNode;
	onClose: () => void;
	animation?: boolean;
}

export function MobileSheet({ children, onClose, animation = true }: MobileSheetProps) {
	const [visible, setVisible] = useState(false);
	const [animating, setAnimating] = useState(false);

	useEffect(() => {
		setVisible(true);
	}, []);

	const handleClose = useCallback(() => {
		setAnimating(true);
		onClose();
	}, [onClose]);

	return (
		<div
			className={`fixed inset-0 flex items-end justify-center bg-black/50 transition-opacity duration-200 ${
				visible ? "opacity-100" : "opacity-0"
			}`}
			onClick={handleClose}
		>
			<div
				className={`w-full max-w-md bg-[#2d2d2d] rounded-t-lg p-4 transition-transform duration-300 ${
					!animating && visible ? "translate-y-0" : "translate-y-full"
				}`}
			>
				{children}
			</div>
		</div>
	);
}
```

#### Accessibility

**Tasks:**
- [ ] ARIA labels for all touch targets
- [ ] Screen reader support (VoiceOver/TalkBack)
- [ ] High contrast mode
- [ ] Large font support
- [ ] Reduced motion option
- [ ] Voice input support (webkitSpeechRecognition / Web Speech API)

**Code Sample:**
```typescript
// apps/wayofpi-ui/src/components/mobile/chrome/MobileTabBar.tsx
function TabButton({ label, onClick, active }: {
	label: string;
	onClick: () => void;
	active: boolean;
}) {
	return (
		<button
			type="button"
			role="tab"
			aria-selected={active}
			aria-label={label}
			onClick={onClick}
			className="flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold leading-none transition-colors"
		>
			{/* Icon */}
			<span className="sr-only">{label}</span>
			{/* Visual content */}
		</button>
	);
}
```

#### Performance

**Tasks:**
- [ ] Profile on low-end devices
- [ ] Optimize chat streaming
- [ ] Reduce memory footprint
- [ ] Virtualize long lists (file explorer)
- [ ] Lazy load modules (Claw extensions)
- [ ] Debounce input events

**Performance Targets:**
```typescript
// apps/wayofpi-ui/src/components/mobile/utils/performance.ts
export const PERFORMANCE_TARGETS = {
	initialLoadMs: 3000, // 3 seconds on 3G
	chatResponseMs: 500,
	fileListRenderTimeMs: 1000,
	memoryLimitBytes: 200 * 1024 * 1024, // 200MB
	batteryDrainPercent: 15, // per hour of active use
};
```

### 8.3 Acceptance Criteria for Track 5

- [x] Smooth animations
- [ ] Accessibility labels present
- [ ] Performance meets targets

---

## 9. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Initial Load | < 3s on 3G | With caching |
| Chat Response | < 500ms | Streaming from `/ws` |
| File List Render | < 500 items < 1s | Virtualize if needed |
| PDF Page Turn | < 200ms | Pre-render pages |
| Memory Usage | < 200MB | RAM on active tab |
| Battery | < 15%/hr | Active use |
| Network Usage | < 50MB/day | Background sync |

---

## 10. Accessibility Requirements

- [x] ARIA labels for all touch targets
- [ ] Screen reader support (VoiceOver/TalkBack)
- [ ] High contrast mode
- [ ] Large font support
- [ ] Reduced motion option
- [ ] Voice input support (webkitSpeechRecognition / Web Speech API)

**Accessibility Checklist:**
```typescript
// apps/wayofpi-ui/src/components/mobile/utils/accessibility.ts
export const ACCESSIBILITY_GUIDELINES = {
	minTapTarget: 44, // pixels
	minContrastRatio: 4.5, // WCAG AA
	animationDurationMs: 300, // max for reduced motion
	fontSizeScale: 1.2, // max scale
};

export function isReducedMotionSupported(): boolean {
	try {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		return media.matches;
	} catch {
		return false;
	}
}
```

---

## 11. Testing Checklist

### 11.1 Device Compatibility

- [ ] iPhone SE (minimum size)
- [ ] iPhone 12/13/14 (current)
- [ ] iPhone 15 Pro
- [ ] iPad Air
- [ ] iPad Pro
- [ ] Pixel 6/7/8
- [ ] Samsung Galaxy S series
- [ ] Tablet landscape
- [ ] Older Android devices (Android 10+)
- [ ] Tablets in portrait mode

### 11.2 Touch Interaction

- [ ] Swipe gestures work
- [ ] Tap targets responsive
- [ ] Long press works
- [ ] Double tap works
- [ ] Pinch zoom works
- [ ] Scroll smooth

### 11.3 Performance

- [ ] No jank on scroll
- [ ] Fast chat response
- [ ] Smooth animations
- [ ] Low memory usage
- [ ] Good battery drain

### 11.4 Offline Mode

- [ ] Cached workspaces load
- [ ] Cached messages available
- [ ] Cached files accessible
- [ ] Error messages clear

### 11.5 Accessibility

- [ ] Screen reader works
- [ ] Keyboard navigation works
- [ ] High contrast works
- [ ] Voice input works

### 11.6 PWA Features

- [ ] Install prompt appears
- [ ] Offline mode activates
- [ ] Service worker registers
- [ ] App cache updates

### 11.2 Touch Interaction

- [ ] Swipe gestures work
- [ ] Tap targets responsive
- [ ] Long press works
- [ ] Double tap works
- [ ] Pinch zoom works
- [ ] Scroll smooth

### 11.3 Performance

- [ ] No jank on scroll
- [ ] Fast chat response
- [ ] Smooth animations
- [ ] Low memory usage
- [ ] Good battery drain

### 11.4 Offline Mode

- [ ] Cached workspaces load
- [ ] Cached messages available
- [ ] Cached files accessible
- [ ] Error messages clear

### 11.5 Accessibility

- [ ] Screen reader works
- [ ] Keyboard navigation works
- [ ] High contrast works
- [ ] Voice input works

---

## 12. Mobile-Specific APIs

### 12.1 Device Detection

```typescript
// apps/wayofpi-ui/src/components/mobile/utils/deviceDetection.ts
export function detectDevice(): DeviceInfo {
	const ua = navigator.userAgent;

	const isIOS = /iphone|ipad|ipod/i.test(ua);
	const isAndroid = /android/i.test(ua);
	const isTablet = /tablet|ipad|playbook|kindle/i.test(ua);

	return {
		isMobile: isIOS || isAndroid,
		isTablet: isTablet,
		isIOS: isIOS,
		isAndroid: isAndroid,
		version: parseVersion(ua),
	};
}
```

### 12.2 Network Detection

```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useNetworkStatus.ts
export function useNetworkStatus() {
	const [network, setNetwork] = useState<"online" | "offline" | "slow">("online");

	const updateNetwork = useCallback(() => {
		const connection = navigator.connection as Connection;
		if (connection) {
			const type = connection.effectiveType ?? "unknown";
			const offline = connection.onLine === false;
			if (type === "2g" || type === "none" || offline) {
				setNetwork("slow");
			} else {
				setNetwork("online");
			}
		}
	}, []);

	useEffect(() => {
		window.addEventListener("online", updateNetwork);
		window.addEventListener("offline", updateNetwork);
		updateNetwork();
		return () => {
			window.removeEventListener("online", updateNetwork);
			window.removeEventListener("offline", updateNetwork);
		};
	}, [updateNetwork]);

	return network;
}
```

### 12.3 Offline Cache

```typescript
// apps/wayofpi-ui/src/components/mobile/utils/offlineSupport.ts
interface OfflineConfig {
	cacheWorkspaces: boolean;
	cacheAgents: boolean;
	cacheMessages: boolean;
	cacheFiles: boolean;
	maxCacheSize: number; // in MB
}

export function createOfflineConfig(): OfflineConfig {
	return {
		cacheWorkspaces: true,
		cacheAgents: true,
		cacheMessages: true,
		cacheFiles: true,
		maxCacheSize: 100, // 100MB
	};
}
```

**Offline Strategy:**
```typescript
// apps/wayofpi-ui/src/components/mobile/store/offlineCache.ts
interface CachedResource {
	id: string;
	type: "workspace" | "agent" | "message" | "file";
	data: unknown;
	ttl: number; // in seconds
}

class OfflineCache {
	private cache: Map<string, CachedResource> = new Map();

	async cacheResource(resource: CachedResource): Promise<void> {
		this.cache.set(resource.id, resource);
		await this.save();
	}

	async getCached(id: string): Promise<CachedResource | null> {
		const cached = this.cache.get(id);
		if (!cached) return null;
		if (Date.now() > cached.ttl + Date.now()) {
			await this.remove(id);
			return null;
		}
		return cached;
	}

	private async save(): Promise<void> {
		await localStorage.setItem("wayofpi.offline.cache", JSON.stringify(Object.fromEntries(this.cache)));
	}
}

export const offlineCache = new OfflineCache();
```

---

## 13. Open Decisions

1. **Default on narrow viewport:** Auto-prompt "Switch to mobile" vs URL-only (current bias: URL-only until Track 2).
2. **Technical multi-cell on mobile:** Ship never vs T-M5 only for tablet landscape.
3. **`ClawHelpModal`:** Full-screen on mobile vs paginated sections.
4. **iOS Safari:** `dvh` + sticky composer checklist for all three shells.

**Decision Log:**
```markdown
// docs/planning/mobile/DECISIONS.md
## 00-Default on narrow viewport
- **Context:** Should narrow viewport auto-switch to mobile layout?
- **Options:** 
  1. Auto-switch (user experience)
  2. URL-only (user opt-in)
  3. PWA install prompt only
- **Decision:** URL-only until Track 2 (2026-04-12)
- **Notes:** Desktop users may shrink window; prefer explicit opt-in
```

**Decision Log:**
```markdown
// docs/planning/mobile/DECISIONS.md
## 00-Default on narrow viewport
- **Context:** Should narrow viewport auto-switch to mobile layout?
- **Options:** 
  1. Auto-switch (user experience)
  2. URL-only (user opt-in)
  3. PWA install prompt only
- **Decision:** URL-only until Track 2 (2026-04-12)
- **Notes:** Desktop users may shrink window; prefer explicit opt-in

1. **Default on narrow viewport:** Auto-prompt “Switch to mobile” vs URL-only (current bias: URL-only until Track 2).
2. **Technical multi-cell on mobile:** Ship never vs T-M5 only for tablet landscape.
3. **`ClawHelpModal`:** Full-screen on mobile vs paginated sections.
4. **iOS Safari:** `dvh` + sticky composer checklist for all three shells.

---

## 14. Risks and Mitigations

| Risk | Mitigation |
|------|------|
| `App.tsx` size | `src/components/mobile/` (chrome, claw, simple, technical, useShellMobile); `App.tsx` only switches shells |
| Claw / Simple drift | Shared `mobile/` primitives (MobileSheet, list rows); one `chatWsErrorHint` / connection pattern |
| Technical infinite scope | Track order keeps Technical last; T-M5 explicitly deferrable |
| Regression on desktop | Mobile gate off by default; CI smoke for all three `uiMode` desktop paths |
| iOS Safari quirks | Use `dvh` instead of `vh`; polyfill if needed |
| Android keyboard coverage | Use `dvh` with sticky composer; test on various devices |
| PWA install restrictions | Chrome/Safari support; fallback to desktop view |
| Background sync limits | Queue size ≤ 100; process in batches |
| iOS Safari quirks | Use `dvh` instead of `vh`; polyfill if needed |
| Android keyboard coverage | Use `dvh` with sticky composer; test on various devices |
| PWA install restrictions | Chrome/Safari support; fallback to desktop view |
| Background sync limits | Queue size ≤ 100; process in batches |

| Risk | Mitigation |
|------|------|
| `App.tsx` size | `src/components/mobile/` (chrome, claw, simple, technical, useShellMobile, index); `App.tsx` only switches shells |
| Claw / Simple drift | Shared `mobile/` primitives (MobileSheet, list rows); one `chatWsErrorHint` / connection pattern |
| Technical infinite scope | Track order keeps Technical last; T-M5 explicitly deferrable |
| Regression on desktop | Mobile gate off by default; CI smoke for all three `uiMode` desktop paths |

---

## 15. Documentation and Tracking

| When | Update |
|------|--------|
| After Track 0 | `apps/wayofpi-ui/README.md` — `?shell=mobile`, `uiMode` interaction |
| After Track 1 | `docs/WOP_CLAW_UI_PLAN.md` — mobile subsection or pointer here; `docs/WOP_TECHNICAL_UI.md` Scope row Claw mobile |
| After Track 2 | `docs/WOP_TECHNICAL_UI.md` — Simple mobile row |
| After Track 3 | `docs/WOP_TECHNICAL_UI.md` — Technical mobile row |
| Ongoing | `docs/WOP_OPEN_TODOS.md` / `docs/WOP_COMBINED_BUILD_TODO.md` — per-phase checkboxes |

**Documentation Template:**
```markdown
// apps/wayofpi-ui/src/components/mobile/README.md
# Mobile Shell Documentation

## Overview
Mobile layouts for Way of Pi that maintain the same capabilities as desktop.

## Entry
- Query: `?shell=mobile` (or `?shell=desktop` to disable)
- Path: `/m` (SPA) implies mobile
- Storage: `localStorage.wayofpi.shell.mobile`

## Tracks
- Track 0: Shared foundations (complete)
- Track 1: Claw mobile (in progress)
- Track 2: Simple mobile (planned)
- Track 3: Technical mobile (planned)
- Track 4: PWA + offline (planned)
- Track 5: Polish + performance (planned)

## Components
- `chrome/MobileChrome.tsx`
- `chrome/MobileStatusBar.tsx`
- `claw/ClawMobileTabBar.tsx`
- `simple/SimpleMobileTabBar.tsx`
- `technical/MobileTechnicalShell.tsx` (stub)

## Dependencies
- `react-gesture-handler` (for advanced gestures, optional)
- `immer` (for state management)
```

**Documentation Template:**
```markdown
// apps/wayofpi-ui/src/components/mobile/README.md
# Mobile Shell Documentation

## Overview
Mobile layouts for Way of Pi that maintain the same capabilities as desktop.

## Entry
- Query: `?shell=mobile` (or `?shell=desktop` to disable)
- Path: `/m` (SPA) implies mobile
- Storage: `localStorage.wayofpi.shell.mobile`

## Tracks
- Track 0: Shared foundations (complete)
- Track 1: Claw mobile (in progress)
- Track 2: Simple mobile (planned)
- Track 3: Technical mobile (planned)
- Track 4: PWA + offline (planned)
- Track 5: Polish + performance (planned)

## Components
- `chrome/MobileChrome.tsx`
- `chrome/MobileStatusBar.tsx`
- `claw/ClawMobileTabBar.tsx`
- `simple/SimpleMobileTabBar.tsx`
- `technical/MobileTechnicalShell.tsx` (stub)

## Dependencies
- `react-gesture-handler` (for advanced gestures, optional)
- `immer` (for state management)

| When | Update |
|------|--------|
| After Track 0 | `apps/wayofpi-ui/README.md` — `?shell=mobile`, `uiMode` interaction |
| After Track 1 | `docs/WOP_CLAW_UI_PLAN.md` — mobile subsection or pointer here; `docs/WOP_TECHNICAL_UI.md` Scope row Claw mobile |
| After Track 2 | `docs/WOP_TECHNICAL_UI.md` — Simple mobile row |
| After Track 3 | `docs/WOP_TECHNICAL_UI.md` — Technical mobile row |
| Ongoing | `docs/WOP_OPEN_TODOS.md` / `docs/WOP_COMBINED_BUILD_TODO.md` — per-phase checkboxes |

---

## 16. Notes

### Design Principles

1. **Mobile First:** Start with mobile layout, then adapt for desktop
2. **Touch Native:** Design for touch, not keyboard/mouse
3. **Offline Ready:** Cache frequently used resources
4. **Battery Aware:** Minimize battery drain
5. **Network Efficient:** Reduce data usage

### Technical Constraints

- Must work on 3G networks
- No external dependencies unless PWA-compatible
- PWA manifest required
- Service worker for offline support
- Background sync for offline changes

### Future Enhancements

- [ ] Native iOS app wrapper
- [ ] Native Android app wrapper
- [ ] AR document scanning
- [ ] Offline multiplayer mode
- [ ] Push notifications
- [ ] Widget support

---

*Created:* 2026-04-12  
*Status:* Ready for Phase 1 implementation (Track 0)  
*Author:* Pi Coding Agent  
*Estimated Completion:* 16 weeks  
*Priority:* High  
**Last updated:** 2026-04-12

---

## Appendices

### A. Component Prop Interfaces

#### MobileHeader

```typescript
interface MobileHeaderProps {
	mode: "simple" | "technical" | "claw";
	onModeChange: (mode: "simple" | "technical" | "claw") => void;
	showDokument: boolean;
	workspacePath: string;
	onWorkspaceSelect: (path: string) => void;
}
```

#### MobileSidebar (Collapsible)

```typescript
interface MobileSidebarProps {
	visible: boolean;
	onToggle: () => void;
	panels: {
		scm: boolean;
		search: boolean;
		planning: boolean;
	};
	onPanelToggle: (panel: "scm" | "search" | "planning") => void;
	activePanel: string | null;
	onPanelChange: (panel: string | null) => void;
}
```

#### MobileChatPanel (Full-Screen)

```typescript
interface MobileChatPanelProps {
	visible: boolean;
	onToggle: () => void;
	messages: ChatMessage[];
	input: string;
	setInput: (text: string) => void;
	onSend: (message: string) => Promise<void>;
	showAgentSelector: boolean;
	onAgentSelect: (agent: Agent) => void;
	currentAgent: Agent | null;
}
```

#### MobileFileExplorer (Stacked)

```typescript
interface MobileFileExplorerProps {
	visible: boolean;
	onToggle: () => void;
	files: FileEntry[];
	selectedFile: FileEntry | null;
	onSelect: (file: FileEntry) => void;
	onViewMode: 'icon' | 'list';
	setViewMode: (mode: 'icon' | 'list') => void;
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	multiSelect: boolean;
	onMultiSelectToggle: () => void;
	selectedFiles: FileEntry[];
}
```

#### MobileSidebar (Collapsible)

```typescript
interface MobileSidebarProps {
	visible: boolean;
	onToggle: () => void;
	panels: {
		scm: boolean;
		search: boolean;
		planning: boolean;
	};
	onPanelToggle: (panel: "scm" | "search" | "planning") => void;
	activePanel: string | null;
	onPanelChange: (panel: string | null) => void;
}
```

#### MobileChatPanel (Full-Screen)

```typescript
interface MobileChatPanelProps {
	visible: boolean;
	onToggle: () => void;
	messages: ChatMessage[];
	input: string;
	setInput: (text: string) => void;
	onSend: (message: string) => Promise<void>;
	showAgentSelector: boolean;
	onAgentSelect: (agent: Agent) => void;
	currentAgent: Agent | null;
}
```

#### MobileFileExplorer (Stacked)

```typescript
interface MobileFileExplorerProps {
	visible: boolean;
	onToggle: () => void;
	files: FileEntry[];
	selectedFile: FileEntry | null;
	onSelect: (file: FileEntry) => void;
	onViewMode: 'icon' | 'list';
	setViewMode: (mode: 'icon' | 'list') => void;
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	multiSelect: boolean;
	onMultiSelectToggle: () => void;
	selectedFiles: FileEntry[];
}
```

### B. Mobile Layout Calculations

```typescript
// apps/wayofpi-ui/src/components/mobile/utils/mobileLayout.ts
export const LAYOUT = {
	portrait: {
		chat: 100,
		files: 0,
	},
	landscape: {
		chat: 30,
		files: 70,
	},
};
```

**Layout Switching:**
```typescript
// apps/wayofpi-ui/src/components/mobile/utils/layoutSwitcher.ts
import { useOrientation } from "./hooks/useOrientation";
import { useViewport } from "./hooks/useViewport";

export function useLayoutSwitcher() {
	const { isPortrait, isLandscape } = useOrientation();
	const { isTablet } = useViewport();

	const [layout, setLayout] = useState<"portrait" | "landscape">("portrait");

	useEffect(() => {
		if (isTablet && isLandscape) {
			setLayout("landscape");
		} else {
			setLayout("portrait");
		}
	}, [isTablet, isLandscape]);

	return { layout, isPortrait, isLandscape, isTablet };
}
```

### C. Responsive Breakpoints

```typescript
// apps/wayofpi-ui/src/components/mobile/utils/responsiveBreakpoints.ts
export const BREAKPOINTS = {
	mobile: 640,
	tablet: 1024,
	desktop: 1280,
};
```

**Breakpoint Usage:**
```typescript
// apps/wayofpi-ui/src/components/mobile/utils/breakpoints.ts
export function useResponsive() {
	const [width, setWidth] = useState(window.innerWidth);

	useEffect(() => {
		const update = () => setWidth(window.innerWidth);
		update();
		window.addEventListener("resize", update);
		return () => window.removeEventListener("resize", update);
	}, []);

	return {
		isMobile: width <= BREAKPOINTS.mobile,
		isTablet: width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet,
		isDesktop: width > BREAKPOINTS.desktop,
		width,
	};
}
```

### D. Touch Targets

```typescript
// Minimum tap targets
const MIN_TAP_TARGET = 44;  // pixels (iOS/Android guideline)
const MIN_TOUCH_TARGET = 48; // slightly larger for better usability
const TOUCH_GAP = 16;        // pixels between elements
const TOUCH_PADDING = 8;     // padding for hit areas

// Touch target wrapper
export function TouchTarget({ children, onClick }: {
	children: React.ReactNode;
	onClick?: () => void;
}) {
	const handleClick = () => {
		onClick?.();
		// Prevent accidental double-tap zoom
		window.ontouchstart?.();
	};

	return (
		<div
			className="flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold leading-none transition-colors"
			style={{ touchAction: "manipulation" }}
			onClick={handleClick}
		>
			{children}
		</div>
	);
}
```

### E. Mobile Keyboard Handling

```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useMobileKeyboard.ts
export function useMobileKeyboard() {
	const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

	useEffect(() => {
		const handleVisibilityChange = (event: KeyboardEvent) => {
			setIsKeyboardVisible(
				event.target instanceof HTMLElement &&
				event.target.getAttribute("id") === "chat-input"
			);
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () =>
			document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, []);

	return { isKeyboardVisible, setIsKeyboardVisible };
}
```

**Keyboard Handling UX:**
```typescript
// apps/wayofpi-ui/src/components/mobile/claw/ClawChatComposer.tsx
function ChatComposer({ setInput, onSubmit }: {
	setInput: (text: string) => void;
	onSubmit: () => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Enter" && !event.shiftKey) {
				event.preventDefault();
				onSubmit();
			}
		};

		inputRef.current?.addEventListener("keydown", handleKeyDown);
		return () => inputRef.current?.removeEventListener("keydown", handleKeyDown);
	}, [onSubmit]);

	return (
		<div
			className="flex items-center gap-2 p-3 border-t border-[#3c3c3c] bg-[#252526]"
			onBlur={() => setIsKeyboardVisible(false)}
		>
			<input
				ref={inputRef}
				type="text"
				id="chat-input"
				value={input}
				onKeyPress={onSubmit}
				placeholder="Type your message..."
				className="flex-1 bg-transparent text-[#cccccc] outline-none placeholder-[#858585]"
			/>
			<button
				type="button"
				onClick={onSubmit}
				className="rounded-md border border-[#3c3c3c] bg-[#2d2d2d] px-3 py-2 text-sm font-semibold text-[#ea580c] hover:bg-[#383838]"
			>
				Send
			</button>
		</div>
	);
}
```

**Keyboard Handling UX:**
```typescript
// apps/wayofpi-ui/src/components/mobile/claw/ClawChatComposer.tsx
function ChatComposer({ setInput, onSubmit }: {
	setInput: (text: string) => void;
	onSubmit: () => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Enter" && !event.shiftKey) {
				event.preventDefault();
				onSubmit();
			}
		};

		inputRef.current?.addEventListener("keydown", handleKeyDown);
		return () => inputRef.current?.removeEventListener("keydown", handleKeyDown);
	}, [onSubmit]);

	return (
		<div
			className="flex items-center gap-2 p-3 border-t border-[#3c3c3c] bg-[#252526]"
			onBlur={() => setIsKeyboardVisible(false)}
		>
			<input
				ref={inputRef}
				type="text"
				id="chat-input"
				value={input}
				onKeyPress={onSubmit}
				placeholder="Type your message..."
				className="flex-1 bg-transparent text-[#cccccc] outline-none placeholder-[#858585]"
			/>
			<button
				type="button"
				onClick={onSubmit}
				className="rounded-md border border-[#3c3c3c] bg-[#2d2d2d] px-3 py-2 text-sm font-semibold text-[#ea580c] hover:bg-[#383838]"
			>
				Send
			</button>
		</div>
	);
}
```

### F. Voice Input

```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useVoiceInput.ts
interface VoiceInput {
	isRecording: boolean;
	voiceMessage: string | null;
	startRecording: () => void;
	stopRecording: () => void;
}

export function useVoiceInput(): VoiceInput {
	const [isRecording, setIsRecording] = useState(false);
	const [voiceMessage, setVoiceMessage] = useState<string | null>(null);

	useEffect(() => {
		if (
			typeof window !== "undefined" &&
			"webkitSpeechRecognition" in window
		) {
			const recognition = new (window as any).webkitSpeechRecognition();
			recognition.continuous = false;
			recognition.interimResults = false;

			recognition.onresult = (event: any) => {
				const transcript = event.results[0][0].transcript;
				setVoiceMessage(transcript);
			};

			recognition.onerror = (event: any) => {
				console.error("Voice recognition error", event.error);
				setIsRecording(false);
			};

			const start = () => {
				recognition.start();
				setIsRecording(true);
			};

			return start;
		}
	}, []);

	const stopRecording = useCallback(() => {
		setVoiceMessage(null);
		setIsRecording(false);
	}, []);

	return { isRecording, voiceMessage, startRecording: () => {}, stopRecording };
}
```

**Voice Input UX:**
```typescript
// apps/wayofpi-ui/src/components/mobile/claw/ClawChatComposerVoice.tsx
interface VoiceComposerProps {
	onSubmit: (text: string) => Promise<void>;
}

export function VoiceComposer({ onSubmit }: VoiceComposerProps) {
	const [isRecording, setIsRecording] = useState(false);

	return (
		<div
			className="flex items-center gap-2 p-3 border-t border-[#3c3c3c] bg-[#252526]"
			onClick={() => setIsRecording(!isRecording)}
		>
			{isRecording ? (
				<>
					<div
						className="h-2 w-2 rounded-full bg-[#ea580c] animate-pulse"
						style={{ animationDuration: "1s" }}
					/>
					<span className="text-sm text-[#858585]">Listening...</span>
				</>
			) : (
				<>
					<Mic size={18} className="text-[#858585]" />
					<span className="text-sm text-[#858585]">Tap to use voice input</span>
				</>
			)}
			<button
				type="button"
				onClick={() => onSubmit(voiceMessage ?? "")}
				className="rounded-md border border-[#3c3c3c] bg-[#2d2d2d] px-3 py-2 text-sm font-semibold text-[#ea580c]"
			>
				Send
			</button>
		</div>
	);
}
```

### G. Mobile Navigation

```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useMobileNavigation.ts
interface MobileNavigation {
	activeView: "chat" | "files" | "preview";
	setActiveView: (view: "chat" | "files" | "preview") => void;
	showBottomNav: boolean;
	setShowBottomNav: (show: boolean) => void;
	canGoBack: boolean;
	goBack: () => void;
}

export function useMobileNavigation(): MobileNavigation {
	const [activeView, setActiveView] = useState<"chat" | "files" | "preview">("chat");
	const history: Array<{ view: "chat" | "files" | "preview" }> = [];

	const pushView = useCallback((view: "chat" | "files" | "preview") => {
		history.push({ view });
		setActiveView(view);
	}, []);

	const goBack = useCallback(() => {
		if (history.length > 0) {
			const previous = history[history.length - 1].view;
			history.pop();
			setActiveView(previous);
		}
	}, [history]);

	return {
		activeView,
		setActiveView: pushView,
		showBottomNav: true,
		setShowBottomNav: () => {},
		canGoBack: history.length > 0,
		goBack,
	};
}
```

### H. Offline Support

```typescript
// apps/wayofpi-ui/src/components/mobile/utils/offlineSupport.ts
interface OfflineConfig {
	cacheWorkspaces: boolean;
	cacheAgents: boolean;
	cacheMessages: boolean;
	cacheFiles: boolean;
	maxCacheSize: number; // in MB
}

export function createOfflineConfig(): OfflineConfig {
	return {
		cacheWorkspaces: true,
		cacheAgents: true,
		cacheMessages: true,
		cacheFiles: true,
		maxCacheSize: 100, // 100MB
	};
}
```

**Background Sync:**
```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useBackgroundSync.ts
interface BackgroundSync {
	queue: Array<{ id: string; action: "send" | "fetch" | "update" }>;
	addToQueue: (entry: { id: string; action: "send" | "fetch" | "update" }) => void;
	processQueue: () => Promise<void>;
}

export function useBackgroundSync(): BackgroundSync {
	const [queue, setQueue] = useState<Array<{ id: string; action: "send" | "fetch" | "update" }>>([]);

	const addToQueue = useCallback((entry: { id: string; action: "send" | "fetch" | "update" }) => {
		setQueue((q) => [...q, entry]);
	}, []);

	const processQueue = useCallback(async () => {
		// Process queue when online
		for (const entry of queue) {
			console.log(`Processing: ${entry.action} — ${entry.id}`);
		}
	}, [queue]);

	return { queue, addToQueue, processQueue };
}
```

**Background Sync:**
```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useBackgroundSync.ts
interface BackgroundSync {
	queue: Array<{ id: string; action: "send" | "fetch" | "update" }>;
	addToQueue: (entry: { id: string; action: "send" | "fetch" | "update" }) => void;
	processQueue: () => Promise<void>;
}

export function useBackgroundSync(): BackgroundSync {
	const [queue, setQueue] = useState<Array<{ id: string; action: "send" | "fetch" | "update" }>>([]);

	const addToQueue = useCallback((entry: { id: string; action: "send" | "fetch" | "update" }) => {
		setQueue((q) => [...q, entry]);
	}, []);

	const processQueue = useCallback(async () => {
		// Process queue when online
		for (const entry of queue) {
			console.log(`Processing: ${entry.action} — ${entry.id}`);
		}
	}, [queue]);

	return { queue, addToQueue, processQueue };
}
```

### I. Storage Management

```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useLocalStorage.ts
export function useLocalStorage<T>(
	key: string,
	initialValue: T
): [T, (value: T) => void] {
	const [storedValue, setStoredValue] = useState<T>(() => {
		if (typeof window === "undefined") return initialValue;
		try {
			const item = window.localStorage.getItem(key);
			return item ? (JSON.parse(item) as T) : initialValue;
		} catch (error) {
			console.warn("LocalStorage error", error);
			return initialValue;
		}
	});

	const setValue = (value: T) => {
		try {
			setStoredValue(value);
			if (typeof window !== "undefined") {
				window.localStorage.setItem(key, JSON.stringify(value));
			}
		} catch (error) {
			console.warn("LocalStorage set error", error);
		}
	};

	return [storedValue, setValue];
}
```

---

*End of document*