# Mobile Shell - Way of Pi

## 📱 Overview

The **mobile shell** enables mobile mode for the application.

**File:** `src/components/mobile/useShellMobile.ts`

---

## 🎯 Entry Points

### Query Parameter

- **`?shell=mobile`** - Enables mobile view
- **`?shell=desktop`** - Disables mobile view

### Path

- **`/m`** - SPA route, mobile view implied

---

## 📝 Implementation

```tsx
export function useShellMobile() {
  const [isMobile, setIsMobile] = useState(
    window.location.search.includes('shell=mobile') ||
    window.location.pathname === '/m' ||
    localStorage.getItem('wayofpi.shell.mobile') === 'true'
  );

  useEffect(() => {
    const handleStateChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      setIsMobile(urlParams.get('shell') === 'mobile');
      localStorage.removeItem('wayofpi.shell.mobile');
    };

    window.addEventListener('popstate', handleStateChange);

    return () => window.removeEventListener('popstate', handleStateChange);
  }, []);

  return isMobile;
}
```

---

## 🔄 Sync Logic

```tsx
// URL changes → localStorage
window.location.search.includes('shell=mobile') 
  ? localStorage.setItem('wayofpi.shell.mobile', 'true');
  : localStorage.removeItem('wayofpi.shell.mobile');

// Path `/m` → mobile
window.location.pathname === '/m' 
  ? localStorage.setItem('wayofpi.shell.mobile', 'true');

// Toggle mobile
localStorage.setItem('wayofpi.shell.mobile', 'true');
window.location.href = window.location.origin + window.location.pathname + '/m';
```

---

## 📂 Barrel Export

**File:** `src/components/mobile/index.ts`

```tsx
export { MobileChrome } from "./chrome/MobileChrome";
export { ClawMobileTabBar } from "./claw/ClawMobileTabBar";
export { SimpleMobileTabBar } from "./simple/SimpleMobileTabBar";
export { MobileTechnicalShell } from "./technical/MobileTechnicalShell";
export { useShellMobile } from "./useShellMobile";
```

---

## 🎨 App Integration

```tsx
// Claw mode
if (useShellMobile()) {
  return (
    <ClawApp layoutVariant="mobile">
      <MobileChrome />
      <ClawMobileTabBar />
    </ClawApp>
  );
}

// Simple mode
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

## 📚 Related

- [Mobile Index](./mobile-modules.md)
- [Mobile Chrome](./mobile-chrome.md)
- [Claw Tab Bar](./claw-mobile-tab-bar.md)
- [Simple Tab Bar](./simple-mobile-tab-bar.md)

---

**Last Updated:** 2024-01-XX
