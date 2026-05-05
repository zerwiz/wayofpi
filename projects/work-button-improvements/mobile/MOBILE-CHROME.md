# Mobile Chrome - Way of Pi

## 📱 Overview

The **Mobile Chrome** provides a shared top bar for all mobile views.

**File:** `src/components/mobile/chrome/MobileChrome.tsx`

---

## 🎯 Features

- **Title display:** Shows current workspace/context
- **Workspace hint:** Indicates current mode/state
- **Desktop escape:** Button to return to desktop view

---

## 📐 Safe-Area Aware

```tsx
className={`fixed top-0 left-0 right-0 z-50 ${barColor} text-16px`}
style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-top))" }}
```

**Mobile Safe-Area:**
- iOS notch
- Android status bar
- Browser UI

---

## 🎨 Styling

**Dark Mode:**
```tsx
barColor="bg-[#1a1a1a] border-[#3c3c3c] text-[#858585]"
```

**Light Mode:**
```tsx
barColor="bg-white border-[#e5e5e5] text-[#737373]"
```

---

## 🔧 Props

```tsx
interface MobileChromeProps {
  title: string;
  onDesktopMode: () => void;
}
```

---

## 📚 Related

- [Mobile Index](./mobile-modules.md)
- [Mobile Chrome Implementation](./components/mobile/chrome/MobileChrome.tsx)

---

**Last Updated:** 2024-01-XX
