# Mobile View Specification - Way of Pi

## 🎯 Overview

This document specifies **mobile-first design** for all pages. Each page must support:
- ✅ **Responsive breakpoints**: Mobile (≤768px), Tablet (769-1024px), Desktop (1025+)
- ✅ **Mobile touch gestures**: Swipe, tap, long-press
- ✅ **Haptic feedback**: Vibration on key actions
- ✅ **Offline-first**: Works when ngrok tunnel disconnected
- ✅ **Simplified UI**: Thumb-friendly controls

---

## 📱 Responsive Breakpoints

| Breakpoint | Device Type | View Pattern |
|---|---|---|
| **≤768px** | Mobile phone | Single column, bottom nav |
| **769-1024px** | Tablet | Two column, side nav |
| **1025+px** | Desktop | Multi-column, full nav |

### Mobile (≤768px)

**CSS Framework**: Tailwind CSS + CSS media queries

**Layout**:
```css
/* Mobile-first base style */
body {
  font-size: 16px; /* Not too small */
  line-height: 1.5;
  padding: 16px;
}

@media (max-width: 768px) {
  nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px; /* Thumb-friendly height */
    display: flex;
    justify-content: space-around;
    align-items: center;
  }

  nav button {
    flex: 1;
    height: 48px; /* Full screen height */
    font-size: 14px;
    white-space: nowrap;
  }

  .mobile-nav-active {
    flex: 2;
    background: rgba(0,0,0,0.1);
  }
}
```

### Tablet (769-1024px)

**Layout**: Two-column with condensed nav

**CSS**:
```css
@media (min-width: 769px) and (max-width: 1024px) {
  nav {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    width: 80px; /* Condensed width */
  }

  nav button {
    height: 48px;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Show icon only */
  nav button span {
    display: none;
  }
}
```

### Desktop (1025+)

**Layout**: Full navigation with multi-column pages

**CSS**:
```css
@media (min-width: 1025px) {
  nav {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    width: 250px;
  }

  nav button span {
    display: inline;
  }

  main {
    margin-left: 250px;
  }
}
```

---

## 🎨 Mobile-Specific UI Components

### 1. Bottom Navigation (Mobile)

**Purpose**: Primary navigation on mobile devices

**Design**:
- Fixed at bottom of screen
- 56px height (thumb-friendly)
- 5 navigation items (Work, Docs, Profile, Settings, About)
- Active item highlighted with indicator
- Icons + text label

**Implementation**:
```tsx
// apps/wayofpi-ui/src/components/MobileNav.tsx
const MobileNav = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'work', label: 'Work', icon: IconGrid },
    { id: 'board', label: 'Board', icon: IconKanban },
    { id: 'docs', label: 'Docs', icon: IconDocs },
    { id: 'profile', label: 'Profile', icon: IconUser },
    { id: 'settings', label: 'Settings', icon: IconSettings },
  ];

  return (
    <nav className="mobile-nav">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={activeTab === item.id ? 'active' : ''}
          aria-label={item.label}
          touchAction="manipulation"
        >
          <IconGrid className={item.icon} size={24} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
```

### 2. Haptic Feedback

**Purpose**: Tactile response on thumb interactions

**API**: `navigator.vibrate()`

**Usage**:
```tsx
// apps/wayofpi-ui/src/hooks/useHaptic.ts
const useHaptic = () => {
  const vibrate = (pattern: number[]) => {
    if (navigator.vibrate) {
      navigator.vibrate({
        force: 'medium',
        pattern,
      });
    }
  };

  return {
    tap: () => vibrate([10]),
    light: () => vibrate([30]),
    heavy: () => vibrate([100]),
  };
};
```

**Patterns**:
- Quick tap: `[10]`
- Light: `[30]`
- Double-tap: `[30, 50, 30]`
- Error: `[100, 50, 100]`

### 3. Touch Gestures

**Swipe**: Navigate between tabs or pages

**Implementation**:
```tsx
// apps/wayofpi-ui/src/components/SwipeNav.tsx
const SwipeNav = ({ onSwipeLeft, onSwipeRight }) => {
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      let startX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const deltaX = start - deltaX;

      if (delta > 100) onSwipeLeft();
      if (delta < -100) onSwipeRight();
    };

    return {
      touchStart: true,
      touchEnd: false,
    };
  }, []);
};
```

### 4. Thumb-Friendly Controls

**Design Principles**:
- Buttons minimum 48px height
- Touch-friendly targets (no hover-only actions)
- Primary actions: Bottom of screen
- Secondary actions: Top of screen

**CSS**:
```css
.btn-primary {
  min-height: 48px; /* Thumb-friendly height */
  min-width: 120px;
  font-size: 16px;
  padding: 12px 24px;
}

/* Primary actions */
.btn-primary {
  margin-bottom: 16px;
  margin-top: 8px;
}

/* Secondary actions */
.btn-secondary {
  margin-top: 8px;
  margin-bottom: 8px;
}
```

---

## 📐 CSS Strategy

### Mobile-First Approach

**CSS Flow**:
1. Base styles (mobile)
2. Tablet styles (769-1024px)
3. Desktop styles (1025+)

**Tailwind Config**:
```js
// apps/wayofpi-ui/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      screens: {
        'mobile': '≤768px',
        'tablet': '≥769px',
        'desktop': '≥1025px',
      },
    },
  },
};
```

### Viewport Meta Tag

**Required**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
```

**Purpose**: Prevents scaling, ensures 1:1 viewport

---

## 🧪 Mobile Testing Checklist

### Touch Interactions

- [ ] Swipe gesture works smoothly
- [ ] Long-press triggers context menu
- [ ] Tap target ≥48px height
- [ ] No accidental touches on adjacent controls

### Orientation Handling

- [ ] Portrait mode works correctly
- [ ] Landscape mode works correctly
- [ ] Rotation animation smooth
- [ ] Content reflows properly

### Performance

- [ ] Touch response < 100ms
- [ ] No layout shift on scroll
- [ ] Smooth animations (60fps)
- [ ] No memory leaks on tab switch

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader supports
- [ ] Focus indicators visible
- [ ] High contrast mode supported

---

## 📱 Mobile-Specific UX Patterns

### 1. Single-Column Layout (Mobile)

**Mobile**:
```
Header
Content (single column)
Navigation (bottom bar)
```

**Tablet**:
```
Header
Content (two columns)
Navigation (side bar)
```

**Desktop**:
```
Sidebar Navigation
Header
Content (multi-column)
Footer
```

### 2. Mobile-Specific Features

**Offline Mode**:
```tsx
// apps/wayofpi-ui/src/components/OfflineMode.tsx
const OfflineMode = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="offline-overlay">
        <IconWifiOff className="pulse-icon" />
        <p>Offline mode active</p>
        <p>Some features may be limited</p>
      </div>
    );
  }
};
```

**Simplified UI**:
- Hide non-essential menus
- Consolidate related actions
- Show progressive disclosure
- Use skeleton loaders
- Minimize modal dialogs

### 3. Mobile-Specific Features

**Progressive Enhancement**:
- Progressive loading
- Progressive disclosure
- Lazy-loaded images
- Skeleton screen loaders
- Reduced data on slow connections

**Service Worker**:
```js
// apps/wayofpi-ui/public/sw.js
self.addEventListener('fetch', (event) => {
  // Cache static assets
  if (event.request.url.startsWith('https://your-domain.com/')) {
    event.respondWith(
      caches.open('static').then(cahe => {
        return cache.match(event.request).then(response => {
          if (response) return response;
          return fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      }),
    );
  }
});
```

---

## 📚 Related Documentation

- [Responsive Strategy](./responsive-strategy.md)
- [Touch Gestures](./touch-gestures.md)
- [Offline Features](./offline-mode.md)
- [Mobile Accessibility](./mobile-a11y.md)

---

## 🚦 Status

- ✅ **Mobile-first**: Base styles
- ✅ **Responsive**: Breakpoints defined
- ✅ **Haptic feedback**: API available
- ✅ **Touch gestures**: Swipe support
- ✅ **Offline mode**: Service worker
- ✅ **Thumb-friendly**: Controls sized

---

**Created:** 2024-01-XX  
**Last Updated:** 2024-01-XX  
**Owner:** Way of Pi Mobile Team
