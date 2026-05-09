apps/wayofwork-ui/src/components/mobile/
├── chrome/
│   ├── MobileChrome.tsx                    # Shared top chrome + desktop escape
│   ├── MobileStatusBar.tsx                 # Bottom sticky bar (workspace, messages)
│   └── MobileSafeArea.tsx                  # Safe-area insets wrapper
├── claw/
│   ├── ClawMobileTabBar.tsx                # Claw bottom nav (Mission, Chat, etc.)
│   ├── ClawMissionView.tsx                 # Mobile mission display (read-only)
│   ├── ClawChatView.tsx                    # Mobile Claw chat (same session)
│   ├── ClawSchedulesView.tsx               # Mobile schedule list/calendar
│   ├── ClawFilesView.tsx                   # Mobile file explorer subset
│   ├── ClawHelpView.tsx                    # Claw help modal (sheet on mobile)
│   └── hooks/
│       └── useClawMobile.ts                # Claw-specific mobile hooks
├── simple/
│   ├── SimpleMobileTabBar.tsx              # Simple bottom nav (Chat, Team, models)
│   ├── SimpleChatView.tsx                  # Mobile chat (same session)
│   ├── SimpleTeamView.tsx                  # Team picker / agent picker sheet
│   ├── SimpleWorkspaceView.tsx             # Read-only tree / preview
│   ├── SimpleModelsView.tsx                # Model picker
│   ├── SimpleSettingsView.tsx              # Settings sheet
│   └── hooks/
│       └── useSimpleMobile.ts              # Simple-specific mobile hooks
├── technical/
│   ├── MobileTechnicalShell.tsx            # Stub; placeholder message
│   ├── MobileExplorerView.tsx              # Track 3: File explorer (T-M1)
│   ├── MobileChatDock.tsx                  # Track 3: Chat in dock (T-M2)
│   ├── MobileTerminalView.tsx              # Track 3: Terminal (T-M4, optional)
│   └── MobileTechnicalGridStub.tsx         # Track 3: Grid deferred (T-M5)
├── hooks/
│   ├── useShellMobile.ts                   # Shared mobile shell hook
│   ├── useOrientation.ts                   # Portrait/landscape detection
│   ├── useNetworkStatus.ts                 # Online/offline + connection type
│   ├── useViewport.ts                      # Viewport size, dvh handling for iOS Safari
│   ├── useKeyboard.ts                      # Keyboard visibility
│   └── useBackgroundSync.ts                # Track 4: Background sync queue
├── utils/
│   ├── touchGestures.ts                    # Gesture handlers (react-gesture-handler)
│   ├── responsiveBreakpoints.ts            # Breakpoint constants
│   └── deviceDetection.ts                  # Device info (iOS/Android/tablet)
├── store/
│   ├── mobileStore.ts                      # Mobile-only state (if needed)
│   └── offlineCache.ts                     # Offline cache manager
├── assets/
│   ├── manifest.json                       # PWA manifest (Track 4)
│   ├── icons/                              # Mobile icons, PWA icons
│   └── service-worker.ts                   # Offline caching (Track 4)
└── README.md                               # Mobile shell documentation
```

### Existing Documentation

| File | Purpose |
|------|:--------|
| `docs/WOP_MOBILE_UI_PLAN.md` | High-level mobile UI plan; tracks + non-goals |
| `docs/WOP_TECHNICAL_UI.md` | Desktop shell reference for parity |
| `apps/wayofwork-ui/README.md` | Shell entry points, Electron vs browser |
| `.cursor/rules/wop-ui-pi-backend-parity.mdc` | Parity rules: no fake Pi |

---

## 2. Architecture Overview

### 2.1 Directory Layout

See section 1 for full structure.

### 2.2 Shared State Management

Mobile does **not** duplicate agents or the WebSocket client. State is managed by the same `useWayOfPiSession(surfaceId)` with `surfaceId` in `simple` | `technical` | `claw` | `mobile`.

```typescript
// apps/wayofwork-ui/src/components/mobile/hooks/useWayOfPiSession.ts
import { useWayOfPiSession } from "../../../simple/useWayOfPiSession";

export function useWayOfPiSessionMobile(surfaceId: string) {
	return useWayOfPiSession(surfaceId); // same WS client, same agent loop
}
```

### 2.3 Mobile-Specific State

```typescript
// apps/wayofwork-ui/src/components/mobile/store/mobileStore.ts
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

### 2.4 URL and Persistence

Mobile mode is entered via:
1. Query: `?shell=mobile` (or `?shell=desktop` to disable)
2. Path: `/m` (SPA) implies mobile
3. Storage: `localStorage.wayofpi.shell.mobile`

On next visit, the shell restores the last mode.

```typescript
// apps/wayofwork-ui/src/components/mobile/useShellMobile.ts
export function useShellMobile() {
	// reads query, path, localStorage
	// returns { shellMobile, setShellMobile }
}
```

### 2.5 Safe Area Handling

```typescript
// apps/wayofwork-ui/src/components/mobile/chrome/MobileSafeArea.tsx
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

---

## 3. Track 0 — Shared Foundations (Week 1–2)

This track establishes shared foundations needed by all mobile UIs.

### 3.1 Entry and Routing

Mobile entry via URL query params and path conventions.

### 3.2 Mobile Chrome

Shared header components with mode selection and desktop escape.

### 3.3 Orientation and Viewport Hooks

```typescript
// apps/wayofwork-ui/src/components/mobile/hooks/useOrientation.ts
import { useEffect, useState } from 'react';

export function useOrientation() {
  const [isPortrait, setIsPortrait] = useState(window.innerWidth < window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerWidth < window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isPortrait, isLandscape: !isPortrait };
}
```

### 3.4 Network Status Detection

```typescript
// apps/wayofwork-ui/src/components/mobile/hooks/useNetworkStatus.ts
export function useNetworkStatus() {
  const [network, setNetwork] = useState('online');
  
  useEffect(() => {
    window.addEventListener('online', () => setNetwork('online'));
    window.addEventListener('offline', () => setNetwork('offline'));
    
    const connection = navigator.connection as Connection;
    connection.addEventListener('change', () => {
      setNetwork(connection.effectiveType ?? 'unknown');
    });
  }, []);
  
  return network;
}
```

### 3.5 Offline Cache Configuration

```typescript
// apps/wayofwork-ui/src/components/mobile/utils/offlineSupport.ts
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

### 3.6 Accessibility

```typescript
const ACCESSIBILITY_GUIDELINES = {
  minTapTarget: 44, // px
  minContrastRatio: 4.5, // WCAG AA
  animationDurationMs: 300, // default, reduced for motion-disabled
  fontSizeScale: 1.0, // user-scalable
};

function isReducedMotionSupported() {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  return media.matches;
}
```

### 3.7 Performance Targets

```typescript
const PERFORMANCE_TARGETS = {
  initialLoadMs: 3000, // 3s on 3G
  chatResponseMs: 500, // under 500ms
  fileListRenderTimeMs: 1000, // 1s for 500+ items
  memoryLimitBytes: 200 * 1024 * 1024, // 200MB
  batteryDrainPercent: 15, // per hour of active use
};
```

### 3.8 Acceptance Criteria for Track 0

- [ ] URL query params detect mobile mode
- [ ] Mobile chrome renders correctly
- [ ] Orientation detection works
- [ ] Network status updates
- [ ] Offline config applied
- [ ] Accessibility guidelines implemented
- [ ] Performance targets met

---

## 4. Track 1 — Claw Mobile (Week 3–4)

Claw is the first mobile UI to ship with full mobile features.

### 4.1 Claw Mobile Header

```typescript
interface MobileHeaderProps {
  mode: "simple" | "technical" | "claw";
  onModeChange: (mode: "simple" | "technical" | "claw") => void;
  showDokument: boolean;
  workspacePath: string;
  onWorkspaceSelect: (path: string) => void;
}
```

**Layout:**
```
+------------------------------------------+
| [Logo] WAY OF PI     [Simple] Dokument [Technical] [Claw] |
+------------------------------------------+
```

**Responsive:**
- Small screens: Show only active mode
- Medium screens: Show all modes with dots
- Large screens: Show all mode buttons

### 4.2 Claw Mobile Sidebar (Collapsible)

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

**Touch Targets:**
- Minimum 44x44px tap targets
- Bordered active panels
- Smooth slide animations

### 4.3 Claw Mobile Chat Panel (Full-Screen)

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

**Mobile Features:**
- Full-screen chat mode
- Swipe to hide
- Long-press for actions
- Voice input support

### 4.4 Claw Mobile File Explorer (Stacked)

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

**Mobile Layout:**
- Single column (portrait)
- Stacked panels (landscape)
- Bottom navigation for actions
- Pull-to-refresh

### 4.5 Claw Mobile Preview Modal (Full-Screen)

```typescript
interface MobilePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  file: FileEntry | null;
  zoom: number;
  setZoom: (level: number) => void;
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  onPrint: () => Promise<void>;
  onFullscreen: () => void;
}
```

**Mobile Preview Features:**
- Full-screen PDF viewer
- Swipe page navigation
- Pinch-to-zoom
- Tap edge to scroll
- Portrait/Landscape detection

### 4.6 Claw Mobile Terminal (Compact)

```typescript
interface MobileTerminalProps {
  visible: boolean;
  onToggle: () => void;
  output: TerminalOutput[];
  input: string;
  setInput: (text: string) => void;
  onSend: (input: string) => Promise<void>;
  onClear: () => void;
  showLineNumbers: boolean;
  fontSize: number;
  fontFamily: string;
}
```

**Mobile Terminal Features:**
- Collapsible output
- Send via swipe
- Copy to clipboard
- Command history

### 4.7 Claw Mobile Activity Log (Bottom Sheet)

```typescript
interface MobileActivityLogProps {
  visible: boolean;
  onToggle: () => void;
  log: ActivityLogEntry[];
  onDismiss: () => void;
  levels: 'info' | 'warn' | 'error' | 'success' | 'debug';
}
```

**Mobile Activity Log Features:**
- Bottom sheet
- Swipe to dismiss
- Tap to expand
- Color-coded levels

### 4.8 Claw Mobile Status Bar (Bottom)

```typescript
interface MobileStatusBarProps {
  showMessage: boolean;
  message: string;
  onDismiss: () => void;
  showWorkspacePath: boolean;
  workspacePath: string;
}
```

**Mobile Status Bar Features:**
- Bottom sticky bar
- Swipe to dismiss
- Workspace path display

---

## 5. Mobile-Specific Features

### 5.1 Touch Gestures

```typescript
// apps/wayofwork-ui/src/components/mobile/utils/touchGestures.ts
import { GestureHandler as G } from 'react-gesture-handler';

export interface TouchGestures {
  onSwipeLeft: (action: () => void) => void;
  onSwipeRight: (action: () => void) => void;
  onSwipeUp: (action: () => void) => void;
  onSwipeDown: (action: () => void) => void;
  onPinch: (action: (scale: number) => void) => void;
  onTap: (action: () => void) => void;
  onLongPress: (action: () => Promise<void>) => void;
  onDoubleTap: (action: () => void) => void;
}
```

**Gesture Mapping:**
- Swipe left: Hide chat
- Swipe right: Show chat
- Swipe up: Hide file explorer
- Swipe down: Show file explorer
- Pinch: Zoom PDF preview
- Tap: Select file/open chat
- Long press: Show context menu
- Double tap: Quick action

### 5.2 Touch-Optimized Interactions

```typescript
// Minimum tap targets
const MIN_TAP_TARGET = 44;  // pixels (iOS/Android guideline)
const MIN_TOUCH_TARGET = 48; // slightly larger for better usability

// Touch-friendly spacing
const TOUCH_GAP = 16;        // pixels between elements
```

### 5.3 Mobile Keyboard Handling

```typescript
// apps/wayofwork-ui/src/components/mobile/hooks/useMobileKeyboard.ts
export function useMobileKeyboard() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = (event: KeyboardEvent) => {
      setIsKeyboardVisible(event.target instanceof HTMLElement && event.target.getAttribute('id') === 'chat-input');
    };
    
    document.addEventListener('keydown', handleVisibilityChange);
    return () => document.removeEventListener('keydown', handleVisibilityChange);
  }, []);

  return { isKeyboardVisible, setIsKeyboardVisible };
}
```

### 5.4 Voice Input

```typescript
// apps/wayofwork-ui/src/components/mobile/hooks/useVoiceInput.ts
export function useVoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceMessage(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Voice recognition error', event.error);
      };
      
      return () => {
        // Cleanup
      };
    }
  }, []);

  return { isRecording, voiceMessage, startRecording, stopRecording };
}
```

### 5.5 Mobile Navigation

```typescript
// apps/wayofwork-ui/src/components/mobile/hooks/useMobileNavigation.ts
interface MobileNavigation {
  activeView: 'chat' | 'files' | 'preview';
  setActiveView: (view: 'chat' | 'files' | 'preview') => void;
  showBottomNav: boolean;
  setShowBottomNav: (show: boolean) => void;
  canGoBack: boolean;
  goBack: () => void;
}

export function useMobileNavigation(): MobileNavigation {
  const [activeView, setActiveView] = useState<'chat' | 'files' | 'preview'>('chat');
  
  // Implementation...
}
```

### 5.6 Offline Support

```typescript
// apps/wayofwork-ui/src/components/mobile/hooks/useBackgroundSync.ts
interface OfflineConfig {
  cacheWorkspaces: boolean;
  cacheAgents: boolean;
  cacheMessages: boolean;
  cacheFiles: boolean;
  maxCacheSize: number; // in MB
}

interface BackgroundSync {
  queue: string[];
  queueId: string;
  addToQueue: (item: string) => void;
  processQueue: () => Promise<void>;
}

export function useBackgroundSync(): BackgroundSync {
  // Implementation...
}
```

### 5.7 Storage Management

```typescript
// apps/wayofwork-ui/src/components/mobile/hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn('LocalStorage error', error);
      return initialValue;
    }
  });
  
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn('LocalStorage set error', error);
    }
  };
  
  return [storedValue, setValue];
}
```

### 5.8 Device Detection

```typescript
// apps/wayofwork-ui/src/components/mobile/utils/deviceDetection.ts
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

### 5.9 Breakpoints

```typescript
// apps/wayofwork-ui/src/components/mobile/utils/responsiveBreakpoints.ts
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};

export function useResponsive() {
  const [width, setWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  
  return {
    isMobile: width < BREAKPOINTS.mobile,
    isTablet: width < BREAKPOINTS.tablet,
    isDesktop: width >= BREAKPOINTS.desktop,
  };
}
```

---

## 6. Implementation Phases

### Phase 1: Mobile Core (Week 1-2)

**Tasks:**
1. Create mobile directory structure
2. Implement MobileHeader component
3. Implement MobileSidebar component
4. Implement MobileChatPanel component
5. Implement MobileFileExplorer component
6. Add touch gesture support
7. Implement orientation detection
8. Add responsive breakpoints
9. Test on various devices

### Phase 2: Mobile Features (Week 3-4)

**Tasks:**
1. Implement MobilePreviewModal
2. Implement MobileTerminal
3. Implement MobileActivityLog
4. Implement MobileStatusBar
5. Add voice input support
6. Implement offline caching
7. Add bottom navigation
8. Optimize for portrait/landscape

### Phase 3: Integration (Week 5-6)

**Tasks:**
1. Integrate mobile components into App.tsx
2. Add PWA manifest
3. Test on iOS devices
4. Test on Android devices
5. Optimize performance
6. Add error handling

### Phase 4: Polish (Week 7-8)

**Tasks:**
1. Add animations and transitions
2. Optimize touch targets
3. Add accessibility labels
4. Test on various screen sizes
5. Add loading states
6. Performance profiling

---

## 7. Mobile Requirements

### Performance Targets

- **Initial Load:** < 3 seconds on 3G
- **Chat Response:** < 500ms
- **File List Render:** < 500 items in < 1 second
- **PDF Page Turn:** < 200ms
- **Memory Usage:** < 200MB RAM
- **Battery:** < 15% per hour of active use

### Accessibility Requirements

- [ ] ARIA labels for all touch targets
- [ ] Screen reader support
- [ ] High contrast mode
- [ ] Large font support
- [ ] Reduced motion option
- [ ] VoiceOver/TalkBack compatibility

### Touch Targets

- Minimum 44x44px tap targets
- 48x48px for critical actions
- Spacing: 8px between elements
- Clear visual feedback on press

---

## 8. Mobile Testing Checklist

### Device Compatibility

- [ ] iPhone SE (minimum size)
- [ ] iPhone 12/13/14 (current)
- [ ] iPhone 15 Pro
- [ ] iPad Air
- [ ] iPad Pro
- [ ] Pixel 6/7/8
- [ ] Samsung Galaxy S series
- [ ] Tablet landscape

### Touch Interaction

- [ ] Swipe gestures work
- [ ] Tap targets responsive
- [ ] Long press works
- [ ] Double tap works
- [ ] Pinch zoom works
- [ ] Scroll smooth

### Performance

- [ ] No jank on scroll
- [ ] Fast chat response
- [ ] Smooth animations
- [ ] Low memory usage
- [ ] Good battery drain

### Offline Mode

- [ ] Cached workspaces load
- [ ] Cached messages available
- [ ] Cached files accessible
- [ ] Error messages clear

### Accessibility

- [ ] Screen reader works
- [ ] Keyboard navigation works
- [ ] High contrast works
- [ ] Voice input works

---

## 9. Open Decisions

### 00-Default on narrow viewport

- Should we default to chat-only or stacked layout on narrow viewports?
- Recommendation: Default to chat-only, show files in collapsible panel

### 00-Default on narrow viewport

- Should we enable bottom navigation always or context-sensitive?
- Recommendation: Context-sensitive (chat/files toggle)

---

### 14. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance degradation on older devices | Medium | Code splitting, lazy loading, optimized images |
| Battery drain concerns | Medium | Throttled polling, efficient rendering |
| Complex gestures misfire | Low | Clear feedback, fallback interactions |
| Offline data sync conflicts | Medium | Optimistic UI, conflict resolution prompts |
| PWA install friction | Low | Clear install prompts, fallback messaging |

---

## 11. Documentation and Tracking

### Mobile Shell Documentation

#### Overview

Mobile components follow the same patterns as desktop but adapted for touch.

#### Entry

Access mobile via `?shell=mobile` query param or `/m` path.

#### Tracks

Follow Track 0 → Track 5 implementation order.

#### Components

Each mode has its own subdirectory with mobile-specific components.

#### Dependencies

- `react-gesture-handler` for touch gestures
- `service-worker` for PWA offline
- Standard React/Vite ecosystem

---

## 12. Notes

### Design Principles

1. **Mobile First**: Start with mobile layout, then adapt for desktop
2. **Touch Native**: Design for touch, not keyboard/mouse
3. **Offline Ready**: Cache frequently used resources
4. **Battery Aware**: Minimize battery drain
5. **Network Efficient**: Reduce data usage

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

## 14. Document Handler Integration

### 14.1 Overview

The document handler component provides a unified interface for document browsing, chat, and file preview within Way of Pi. This section documents how the document handler integrates with the mobile UI.

### 14.2 Component Structure

```
apps/wayofwork-ui/src/components/documenthandler/
├── index.ts
├── DocsApp.tsx                    # Main document handler container
├── Chat.tsx
├── ChatExplorer.tsx
├── ChatMessages.tsx
├── ChatPanel.tsx
├── FileExplorer.tsx
├── FileIcons.tsx
├── FileItem.tsx
├── ListGridToggle.tsx
├── PageControls.tsx
├── PreviewContent.tsx
├── PreviewFooter.tsx
├── PreviewHeader.tsx
├── PreviewModal.tsx
├── SearchBar.tsx
├── SortControls.tsx
├── ZoomControls.tsx
├── context/
│   └── DocumentHandlerContext.tsx
├── hooks/
└── styles/
```

### 14.3 Key Components

#### DocsApp - Main Container

```typescript
interface DocsAppProps {
  connected: boolean;
  config: any;
  refreshWorkspace: () => Promise<void>;
  modelLabel: string;
  workspaceOperational: boolean;
  onOpenAgentSetup: () => void;
}
```

**Features:**
- Toggleable document handler panel
- File explorer sidebar
- Chat panel integration
- Preview modal for file viewing

#### FileExplorer - File Browser

```typescript
interface FileExplorerProps {
  visible: boolean;
  onToggle: () => void;
  appearanceDark?: boolean;
  nodes: TreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  loading: boolean;
  error: string | null;
}
```

**Features:**
- Tree-based file navigation
- Git status badges
- Collapsible directories
- File type icons (code, JSON, generic)

#### ChatPanel - Messaging Interface

```typescript
interface ChatPanelProps {
  visible: boolean;
  onToggle: () => void;
  appearanceDark?: boolean;
  rows: ChatRow[];
  streaming: boolean;
  connected?: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}
```

**Features:**
- Streaming chat messages
- Tool use rendering (code blocks)
- Send/stop controls
- Connection status indicator

#### PreviewModal - File Preview

```typescript
interface PreviewModalProps {
  visible: boolean;
  onClose: () => void;
  appearanceDark?: boolean;
}
```

**Features:**
- Full-screen PDF viewer
- Zoom controls
- Page navigation
- Print functionality
- Fullscreen toggle

### 14.4 Mobile Integration

On mobile devices, the document handler can be presented in different modes:

**Mode 1: Tabbed Navigation**
- File explorer as collapsed sidebar
- Chat panel as primary view
- Preview modal overlays content

**Mode 2: Stacked Layout (Landscape)**
- Chat in top section (30%)
- File explorer in bottom section (70%)
- Preview modal full-screen

**Mode 3: Swipe Navigation**
- Swipe left/right to toggle chat/files
- Swipe up/down to show/hide panels
- Tap center to open preview

### 14.5 Mobile-Specific Behaviors

#### Touch Gestures
- **Swipe left/right**: Toggle chat visibility
- **Swipe up/down**: Toggle file explorer visibility
- **Pinch**: Zoom PDF preview
- **Tap**: Open file preview
- **Long press**: Show context menu

#### Keyboard Handling
On mobile, the chat composer adapts to:
- Visible keyboard reduces viewport (dvh handling)
- Enter sends message
- Shift+Enter for new line
- Blur hides composer

#### Safe Area Handling
```typescript
// iOS notch/home bar awareness
window.visualViewport?.getTopInset();
window.visualViewport?.getBottomInset();
```

### 14.6 Performance Considerations

- Virtualize file lists for large directories
- Lazy-load preview content
- Debounce search queries
- Cache preview thumbnails
- Optimized for 3G networks

### 14.7 Accessibility

- ARIA labels for all interactive elements
- Screen reader announcements for focus changes
- High contrast mode support
- Voice input integration (webkitSpeechRecognition)
- Keyboard navigation parity with desktop

---

## 15. Open Decisions

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

#### MobileSidebar

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

#### MobileChatPanel

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

#### MobileFileExplorer

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
const LAYOUT = {
  portrait: {
    chat: { height: '60%', width: '100%' },
    files: { height: '40%', width: '100%' },
  },
  landscape: {
    chat: { height: '100%', width: '30%' },
    files: { height: '100%', width: '70%' },
  },
};
```

### C. Responsive Breakpoints

```typescript
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};
```

### D. Touch Targets

```typescript
const MIN_TAP_TARGET = 44;
const MIN_TOUCH_TARGET = 48;
const TOUCH_GAP = 16;
const TOUCH_PADDING = 8;
```

### E. Mobile Keyboard Handling

```typescript
function useMobileKeyboard() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  useEffect(() => {
    const handleVisibilityChange = (event: KeyboardEvent) => {
      setIsKeyboardVisible(
        event.target instanceof HTMLElement && 
        event.target.getAttribute('id') === 'chat-input'
      );
    };
    
    document.addEventListener('keydown', handleVisibilityChange);
    return () => document.removeEventListener('keydown', handleVisibilityChange);
  }, []);
  
  return { isKeyboardVisible, setIsKeyboardVisible };
}
```

### F. Voice Input

```typescript
interface VoiceInput {
  isRecording: boolean;
  voiceMessage: string | null;
  startRecording: () => void;
  stopRecording: () => void;
}
```

### G. Mobile Navigation

```typescript
interface MobileNavigation {
  activeView: 'chat' | 'files' | 'preview';
  setActiveView: (view: 'chat' | 'files' | 'preview') => void;
  showBottomNav: boolean;
  setShowBottomNav: (show: boolean) => void;
  canGoBack: boolean;
  goBack: () => void;
}
```

### H. Offline Support

```typescript
interface OfflineConfig {
  cacheWorkspaces: boolean;
  cacheAgents: boolean;
  cacheMessages: boolean;
  cacheFiles: boolean;
  maxCacheSize: number; // in MB
}

interface BackgroundSync {
  queue: string[];
  queueId: string;
  addToQueue: (item: string) => void;
  processQueue: () => Promise<void>;
}
```

### I. Storage Management

```typescript
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Implementation as shown earlier
}
```

---

*Created: 2025-03-11*  
*Updated: 2026-04-12*  
*Status: Ready for Phase 1 implementation*  
*Author: Pi Coding Agent*  
*Estimated Completion: 8 weeks*  
*Priority: High*