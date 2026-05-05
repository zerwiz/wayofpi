# Claw Mobile Tab Bar - Way of Pi

## 📱 Overview

**File:** `src/components/mobile/claw/ClawMobileTabBar.tsx`

**Purpose:** Bottom navigation for Claw mode mobile view.

---

## 🎯 Tabs

| Tab | Icon | Action |
|-----|---------|---------|
| **Mission** | `📰 Radar` | Mission view |
| **Chat** | `💬 MessageCircle` | Chat view |
| **Team** | `👥 Users` | Team view |
| **Schedule** | `📅 CalendarDays` | Schedule view |
| **Channels** | `📡 Radio` | Channels view |
| **Files** | `📁 Files` | Files view |
| **Modules** | `🧩 Puzzle` | Modules view |
| **Settings** | `⚙️ Cog` | Settings view |

---

## 📝 Implementation

```tsx
function TabButton({
  active,
  dark,
  label,
  onClick,
  children,
  title,
}: {
  active: boolean;
  dark: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title ?? label}
      onClick={onClick}
      className={`flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold leading-none transition-colors ${
        active
          ? dark
            ? "bg-[#ea580c]/25 text-[#fb923c]"
            : "bg-[#ea580c]/15 text-[#c2410c]"
          : dark
            ? "text-[#858585] hover:bg-[#2a2a2a] hover:text-[#cccccc]"
            : "text-[#737373] hover:bg-[#f0f0f0] hover:text-[#333333]"
      }`}
    >
      {children}
      <span className="max-w-[4.5rem] truncate">{label}</span>
    </button>
  );
}
```

---

## 🎨 Styling

```tsx
// Bottom nav bar
className="flex shrink-0 items-stretch gap-0.5 overflow-x-auto border-t px-1 py-1.5"

// Tab button styles
className={`flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5`}

// Safe-area aware
style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
```

---

## 🎚️ Props

```tsx
interface ClawMobileTabBarProps {
  activeTab: ClawTabId;
  onTab: (id: ClawTabId) => void;
  onHelp?: (defaultSection?: ClawHelpSectionId | null) => void;
  appearanceDark: boolean;
}
```

---

## 📱 Touch Targets

- **Minimum height:** 44px (`min-h-11`)
- **Minimum width:** 44px (`min-w-11`)
- **Touch-friendly:** `manipulation` action

---

## 📚 Related

- [Mobile Index](./mobile-modules.md)
- [Mobile Chrome](./mobile-chrome.md)
- [Claw UI Modules](./src/claw/clawUiModules.ts)

---

**Last Updated:** 2024-01-XX
