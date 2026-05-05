# Mobile UX - Way of Pi

## 📱 Overview

Mobile-first design patterns for thumb-friendly interactions.

---

## 📐 Breakpoint Strategy

| Device | Width | Layout |
|--------|-------|---------|
| **Mobile** | ≤768px | Single column |
| **Tablet** | 769-1024px | Two column |
| **Desktop** | ≥1025px | Multi-column |

---

## 🎨 Touch Targets

```tsx
// Minimum touch target
<button className="min-h-11 min-w-11 flex items-center justify-center">
  Primary Action
</button>
```

**Requirements:**
- Minimum 44x44px
- Thumb-optimized
- Safe-area aware

---

## 📚 Components

### Mobile Chrome (Top Bar)

- Title display
- Workspace hint
- Desktop escape button

### Tab Bars (Bottom Nav)

**Claw:**
- Mission, Chat, Team, Schedule, Channels, Files, Modules, Settings

**Simple:**
- Chat, Team, Models, Projects, Help, Settings

### Mobile Shell

- Query: `?shell=mobile`
- Path: `/m`
- localStorage: `wayofpi.shell.mobile`

---

## 📚 Files

- [`MOBILE-MODULES.md`](./mobile-modules.md) - Component structure
- [`MOBILE-CHROME.md`](./mobile-chrome.md) - Top bar
- [`CLAW-MOBILE-TAB-BAR.md`](./claw-mobile-tab-bar.md) - Claw nav
- [`SIMPLE-MOBILE-TAB-BAR.md`](./simple-mobile-tab-bar.md) - Simple nav
- [`MOBILE-SHELL.md`](./mobile-shell.md) - Shell hook
- [`MOBILE-TECHNICAL-SHELL.md`](./mobile-technical-shell.md) - Track 3 stub

---

**Last Updated:** 2024-01-XX