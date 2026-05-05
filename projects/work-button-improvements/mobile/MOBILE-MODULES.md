# Mobile Modules - Way of Pi

## 📱 Overview

Mobile-specific modules and tab configurations for the Way of Pi mobile view.

---

## 📂 Component Structure

```
src/components/mobile/
├── chrome/
│   └── MobileChrome.tsx
├── claw/
│   ├── ClawMobileTabBar.tsx
│   └── clawUiModules.ts
├── simple/
│   └── SimpleMobileTabBar.tsx
├── technical/
│   └── MobileTechnicalShell.tsx
└── useShellMobile.ts
```

---

## 🎯 Mobile Chrome

**File:** `chrome/MobileChrome.tsx`

**Purpose:** Shared top bar across all mobile layouts

**Features:**
- Title display
- Workspace hint
- Desktop escape button (safe-area)

---

## 🦜 Claw Mobile Tabs

**File:** `claw/ClawMobileTabBar.tsx`

**Tabs:**
- **Mission** (`📰 Radar`)
- **Chat** (`💬 MessageCircle`)
- **Team** (`👥 Users`)
- **Schedule** (`📅 CalendarDays`)
- **Channels** (`📡 Radio`)
- **Files** (`📁 Files`)
- **Modules** (Puzzle icon)
- **Settings** (`⚙️ Cog`)

**Properties:**
```tsx
interface ClawMobileTabBarProps {
  activeTab: ClawTabId;
  onTab: (id: ClawTabId) => void;
  onHelp?: (defaultSection?: ClawHelpSectionId | null) => void;
  appearanceDark: boolean;
}
```

**Styling:**
```tsx
// Bottom nav bar
className="flex shrink-0 items-stretch gap-0.5 overflow-x-auto border-t px-1 py-1.5"
// Safe-area aware
style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
```

---

## 📱 Simple Mobile Tabs

**File:** `simple/SimpleMobileTabBar.tsx`

**Tabs:**
- Chat
- Team
- Models
- Projects
- Help
- Settings

---

## 🛠️ Technical Shell

**File:** `technical/MobileTechnicalShell.tsx`

**Status:** Placeholder for Track 3

---

## 🎚️ Use Shell Mobile Hook

**File:** `useShellMobile.ts`

**Features:**
- `?shell=mobile` query support
- Path `/m` implies mobile
- localStorage `wayofpi.shell.mobile`
- URL sync

---

## 📏 Breakpoints

| Device | Width Range | Pattern |
|--------|------------|------|--
| Mobile | ≤768px | Single column |
| Tablet | 769-1024px | Two column |
| Desktop | ≥1025px | Multi-column |

---

**Last Updated:** 2024-01-XX
