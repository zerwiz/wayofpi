# Mobile Views - Way of Pi

## 📱 Overview

All pages support **mobile-first design** with responsive breakpoints and touch-optimized interactions.

---

## 🏗️ Component Structure

The mobile view uses a **mobile shell** (`?shell=mobile`) that wraps the main app with:
- **Mobile Chrome**: Shared top bar (title, workspace hint, Desktop escape)
- **Tab Bars**: Claw/Simple mobile navigation
- **Technical Shell**: Placeholder for Track 3

---

## 📂 Mobile Components

Located at: **`/apps/wayofpi-ui/src/components/mobile/`**

### Shell & Chrome

| File | Description |
|------|-------------|
| **`chrome/MobileChrome.tsx`** | Shared top bar: title, workspace hint, Desktop escape button |
| **`useShellMobile.ts`** | Hook: `?shell=mobile`, `/m` path, localStorage `wayofpi.shell.mobile`, URL sync |
| **`index.ts`** | Barrel: exports from `/components/mobile` or import route `./components/mobile` |

### Tab Bars

| File | Description |
|------|-------------|
| **`claw/ClawMobileTabBar.tsx`** | Claw bottom nav: Mission, Chat, Team, Schedule, Channels, Files, Modules, Settings |
| **`simple/SimpleMobileTabBar.tsx`** | Simple bottom nav: Chat, Team, models, projects, help, settings |
| **`technical/MobileTechnicalShell.tsx`** | Technical placeholder (Track 3) |

---

## 🎯 Entry Points

### Query Parameter

- **`?shell=mobile`** - Enables mobile view
- **`?shell=desktop`** - Clears mobile toggle

### Path

- **`/m`** - SPA route, implies mobile view

### Toggle

```tsx
// Toggle mobile shell via localStorage
localStorage.setItem('wayofpi.shell.mobile', 'true');
window.location.href = window.location.origin + window.location.pathname + '/m';
```

---

## 🎨 Layout Variants

### Claw Mode

```tsx
const { layoutVariant: layout } = useClawConfig();

if (useShellMobile()) {
  return (
    <ClawApp layoutVariant="mobile">
      <MobileChrome />
      <ClawMobileTabBar />
    </ClawApp>
  );
}
```

### Simple Mode

```tsx
if (useShellMobile()) {
  return (
    <SimpleApp layoutVariant="mobile">
      <MobileChrome />
      <SimpleMobileTabBar />
    </SimpleApp>
  );
}
```

---

## 📐 Responsive Breakpoints

| Device | Width | Pattern |
|--------|-------|---------|
| **Mobile** | ≤768px | Single column + bottom nav |
| **Tablet** | 769-1024px | Two column + side nav |
| **Desktop** | ≥1025px | Multi-column + full nav |

---

## 📱 Mobile Features

### Haptic Feedback

```tsx
const useHaptic = () => ({
  tap: () => navigator.vibrate?.([10]),
  light: () => navigator.vibrate?.([30]),
  heavy: () => navigator.vibrate?.([100]),
});
```

### Touch Gestures

```tsx
// Swipe navigation
const handleSwipe = (delta: number) => {
  if (delta > 100) navigate('left');
  if (delta < -100) navigate('right');
};
```

### Thumb-Friendly Controls

```tsx
// Minimum 48px height, bottom of screen
<div className="min-h-12 w-32 flex items-center justify-center">
  <button>Primary Action</button>
</div>
```

---

## 🔧 CSS Implementation

```tsx
// Responsive navigation
const ResponsiveNav = ({ width }) => {
  if (width <= 768) return <MobileNav />;
  if (width <= 1024) return <TabletNav />;
  return <DesktopNav />;
};
```

---

## 📚 Related Docs

- [Mobile Chrome](./mobile-chrome.md)
- [Claw Tab Bar](./claw-mobile-tab-bar.md)
- [Simple Tab Bar](./simple-mobile-tab-bar.md)
- [Mobile Shell](./mobile-shell.md)

---

**Last Updated:** 2026-05-01  
**Owner:** Way of Pi Mobile Team