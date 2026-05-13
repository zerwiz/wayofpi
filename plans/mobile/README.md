# Mobile Implementation Plan — Way of Pi

> Build full mobile capability for Way of Pi across iOS, Android, and PWA.

## Quick Start

1. **Read:** [`Comprehensive-Mobile-Implementation-Plan.md`](Comprehensive-Mobile-Implementation-Plan.md) — full plan
2. **Entry:** `?shell=mobile` or `/m` path
3. **Tracks:**
   - **Track 0** — Shared foundations (URL hook, mobile chrome, localStorage)
   - **Track 1** — Claw mobile (Mission, Chat, Schedules, Files, Team)
   - **Track 2** — Simple mobile (Chat, Agents, Workspace, Settings)
   - **Track 3** — Technical mobile (Explorer, Chat dock, Terminal optional)
   - **Track 4** — PWA + offline (manifest, service worker, background sync)
   - **Track 5** — Polish + performance (animations, accessibility, profile)

## Current State

```
apps/wayofwork-ui/src/components/mobile/
├── chrome/
│   └── MobileChrome.tsx               # Shared header + Desktop escape
├── claw/
│   └── ClawMobileTabBar.tsx           # Bottom nav for Claw
├── simple/
│   └── SimpleMobileTabBar.tsx         # Bottom nav for Simple
├── technical/
│   └── MobileTechnicalShell.tsx       # Stub until Track 3
├── useShellMobile.ts                  # ?shell=mobile, /m, localStorage
└── index.ts                           # Barrel exports
```

## Existing Documentation

| File | Purpose |
|------|---------|
| [`docs/WOP_MOBILE_UI_PLAN.md`](../../../docs/WOP_MOBILE_UI_PLAN.md) | High-level UI plan; tracks + non-goals |
| [`docs/WOP_TECHNICAL_UI.md`](../../../docs/WOP_TECHNICAL_UI.md) | Desktop shell reference |
| [`apps/wayofwork-ui/README.md`](../../../apps/wayofwork-ui/README.md) | Shell entry points |
| [`apps/wayofwork-ui/src/components/mobile/README.md`](README.md) | This document |

## Mobile Principles

1. **Full Capability:** Same features as desktop, touch-first layout
2. **Mobile First:** Touch-native, single-column, bottom nav
3. **Network Resilient:** 3G/4G with offline caching
4. **Battery Aware:** Minimize background activity
5. **Same Backend:** `/api/*`, `/ws`, `useWayOfPiSession(surfaceId)` shared

## Platform Targets

- **iOS (iPhone):** iOS 15+ (Touch ID, notches, dynamic fonts)
- **iOS (iPad):** iPadOS 15+ (landscape mode)
- **Android:** Android 10+ (wide device support, 3G fallback)
- **PWA:** Chrome/Safari/Edge (installable, service worker)

## Performance Targets

| Metric | Target |
|--------|--------|
| Initial Load | < 3s on 3G |
| Chat Response | < 500ms |
| File List Render | < 500 items < 1s |
| PDF Page Turn | < 200ms |
| Memory Usage | < 200MB |
| Battery | < 15%/hr active use |

## Touch Targets

- Minimum: **44x44px** (iOS/Android guideline)
- Critical: **48x48px**
- Spacing: **8px** between elements

## Testing Checklist

- [x] Mobile mode entered via URL or `/m` path
- [x] localStorage persists mode
- [ ] Claw mobile complete
- [ ] Simple mobile complete
- [ ] Technical mobile complete
- [ ] PWA installable
- [ ] Offline mode works
- [ ] Accessibility labels present
- [ ] Performance meets targets

## Risks

| Risk | Mitigation |
|------|------------|
| `App.tsx` size | Mobile directory isolates components; `App.tsx` switches shells |
| Claw/Simple drift | Shared primitives (`MobileSheet`, list rows); one WS pattern |
| Technical infinite scope | Track order; T-M5 deferrable |
| Regression on desktop | Mobile gate off by default; CI smoke tests |

## Next Steps

1. **Track 0:** Complete shared foundations (URL hook, chrome, hooks)
2. **Track 1:** Build Claw mobile views (chat, mission, schedules, files)
3. **Track 2:** Build Simple mobile views (chat, agents, workspace, settings)
4. **Track 3:** Build Technical mobile (explorer, chat dock, terminal)
5. **Track 4:** Add PWA capabilities (manifest, service worker)
6. **Track 5:** Polish and performance optimization

## Notes

- Mobile is **not** a subset; it's an alternate layout branch
- Same backend, same session keys, same agents
- Desktop shells remain unchanged; mobile is opt-in
- PWA installability planned for Track 4

---

*Created:* 2026-04-12  
*Status:* Planning (Track 0 in progress)  
*Author:* Pi Coding Agent  
*Related:* [`Comprehensive-Mobile-Implementation-Plan.md`](Comprehensive-Mobile-Implementation-Plan.md)