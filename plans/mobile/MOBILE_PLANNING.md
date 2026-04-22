# Way of Pi Mobile Version Planning

## Overview

Build a fully functional mobile version of Way of Pi that maintains the same capabilities as the desktop application but optimized for touch interactions, smaller screens, and mobile network conditions.

### Target Platforms
- iOS (iPhone/iPad)
- Android (Phone/Tablet)
- Responsive web (Progressive Web App)

### Core Principles
1. **Full Capability**: All features available in desktop version
2. **Mobile First**: Touch-optimized, single-column layouts
3. **Performance**: Optimized for mobile networks and battery life
4. **Offline Support**: Cache workspaces for offline access
5. **Consistency**: Same UI patterns as desktop version

---

## Architecture

### Directory Structure

```
apps/wayofpi-ui/src/components/mobile/
├── MobileChatExplorer.tsx      # Main mobile container
├── MobileHeader.tsx            # Mobile header with mode buttons
├── MobileSidebar.tsx           # Collapsible sidebar
├── MobileChatPanel.tsx         # Touch-optimized chat
├── MobileFileExplorer.tsx      # Stacked file browser
├── MobilePreviewModal.tsx      # Full-screen preview
├── MobileTerminal.tsx          # Mobile terminal
├── MobileActivityLog.tsx       # Activity log panel
├── MobileStatusBar.tsx         # Mobile status bar
└── styles/
    ├── MobileChatExplorer.css
    ├── MobileHeader.css
    ├── MobileSidebar.css
    ├── MobileChatPanel.css
    ├── MobileFileExplorer.css
    ├── MobilePreviewModal.css
    ├── MobileTerminal.css
    ├── MobileActivityLog.css
    └── MobileStatusBar.css
```

### Mobile-Specific Components

```
apps/wayofpi-ui/src/components/mobile/hooks/
├── useMobileViewport.ts        # Mobile viewport detection
├── useMobileKeyboard.ts        # Mobile keyboard handling
├── useMobileNavigation.ts      # Touch navigation
└── useMobileState.ts           # Mobile state management

apps/wayofpi-ui/src/components/mobile/utils/
├── touchGestures.ts           # Touch gesture handling
├── responsiveBreakpoints.ts   # Mobile breakpoints
└── mobileLayout.ts            # Mobile layout calculations
```

---

## Features

### Mobile-Optimized UI

#### 1. Mobile Header
```typescript
interface MobileHeaderProps {
  mode: "simple" | "technical" | "claw";
  onModeChange: (mode: "simple" | "technical" | "claw") => void;
  showDokument: boolean;  // Button between Simple and Technical
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

#### 2. Mobile Sidebar (Collapsible)
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

#### 3. Mobile Chat Panel (Full-Screen)
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

#### 4. Mobile File Explorer (Stacked)
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

#### 5. Mobile Preview Modal (Full-Screen)
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

#### 6. Mobile Terminal (Compact)
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

#### 7. Mobile Activity Log (Bottom Sheet)
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

#### 8. Mobile Status Bar (Bottom)
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

## Mobile-Specific Features

### 1. Touch Gestures

```typescript
// apps/wayofpi-ui/src/components/mobile/utils/touchGestures.ts
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

### 2. Orientation Detection

```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useOrientation.ts
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

**Responsive Behavior:**
- Portrait: Stack vertically (chat top, files bottom)
- Landscape: Side-by-side (30% chat, 70% files)
- Rotate: Smooth transition

### 3. Touch-Optimized Interactions

```typescript
// Minimum tap targets
const MIN_TAP_TARGET = 44;  // pixels (iOS/Android guideline)
const MIN_TOUCH_TARGET = 48; // slightly larger for better usability

// Touch-friendly spacing
const TOUCH_GAP = 16;        // pixels between elements
```

### 4. Mobile Keyboard Handling

```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useMobileKeyboard.ts
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

### 5. Offline Support

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

### 6. Voice Input

```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useVoiceInput.ts
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

### 7. Mobile Navigation

```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useMobileNavigation.ts
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

---

## Implementation Phases

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

## Mobile Requirements

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

## Mobile-Specific APIs

### 1. Device Detection

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

### 2. Network Detection

```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useNetworkStatus.ts
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

### 3. Storage Management

```typescript
// apps/wayofpi-ui/src/components/mobile/hooks/useLocalStorage.ts
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

---

## Mobile Testing Checklist

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

## Notes

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

*Created: 2025-03-11*
*Status: Ready for Phase 1 implementation*
*Author: Pi Coding Agent*
*Estimated Completion: 8 weeks*
*Priority: High*