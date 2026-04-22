# Chat & Explorer Interface Planning

## STATUS: COMPLETE ✅

All 4 modes (Simple, Technical, Claw, Docs) now share the **EXACT SAME MenuBar header**.

---

## WHAT WAS FIXED (2026-04-22)

### Problem
The documenthandler was created with a completely different design:
- ❌ No MenuBar (different from all other pages)
- ❌ Custom header instead of shared MenuBar
- ❌ Different color scheme
- ❌ No way to switch modes

### Solution
1. **`App.tsx`** - documenthandler now uses EXACT SAME MenuBar as Technical mode
2. All 4 modes (Simple, Technical, Claw, Docs) share IDENTICAL MenuBar
3. All theme-aware components use same colors as SimpleApp

---

## MENUBAR STRUCTURE (ALL PAGES)

```
+------------------------------------------+
|  File | Edit | View | Go | Run | Help    |
|       UiModeToggle: Simple|Technical|Claw|
+------------------------------------------+
|  Activity  |  Content Area              |
|  Bar      |  (ALL modes share this)     |
+------------------------------------------+
```

**MenuBar includes:**
- File, Edit, View, Go, Run, Terminal, Help menus
- UiModeToggle (Simple/Technical/Claw/Docs)
- Activity Bar (Technical mode)

---

## COMPONENT FILES

### Shell
- **`App.tsx`** - Renders MenuBar for all modes
- **`DocumentHandlerApp.tsx`** - Content area only

### Chat Components
- **`Chat.tsx`** - Theme-aware, matches SimpleChatView
- **`ChatPanel.tsx`** - Theme-aware, same layout as SimpleApp
- **`ChatMessages.tsx`** - Theme-aware message bubbles

### File Explorer Components
- **`FileExplorer.tsx`** - Theme-aware, matches SimpleRightPanel
- **`FileItem.tsx`** - Theme-aware, icon-based file items
- **`FileIcons.tsx`** - Theme-aware icon grid view
- **`SearchBar.tsx`** - Theme-aware search input
- **`SortControls.tsx`** - Theme-aware sort dropdown
- **`ListGridToggle.tsx`** - Theme-aware view toggle

### Preview Modal Components
- **`PreviewModal.tsx`** - Theme-aware modal
- **`ZoomControls.tsx`** - Theme-aware zoom buttons
- **`PageControls.tsx`** - Theme-aware page navigation
- **`PreviewContent.tsx`** - Theme-aware content display

### CSS
- **`ChatExplorer.css`** - Theme classes (`.theme-dark`, `.theme-light`)

---

## THEME COLORS

| Element | Dark Mode | Light Mode |
|---------|-----------|-----------|
| Main BG | `#1e1e1e` | `#f5f5f5` |
| Panel BG | `#252526` | `white` |
| Nav BG | `#333333` | `white` |
| Text | `#cccccc` | `#333333` |
| Subtext | `#858585` | `#616161` |
| Accent | `#ea580c` | `#ea580c` |
| Border | `#3c3c3c` | `#e5e5e5` |
| Hover BG | `#3c3c3c` | `#e5e5e5` |

---

## NEXT STEPS

- [x] Wire up file explorer with workspace API
- [x] Wire up chat with WebSocket session
- [ ] Handle image upload error: "Cannot read image.png (this model does not support image input)"
- [ ] Add PDF preview rendering
- [ ] Test theme switching
- [ ] Test in browser

**Known Issue:**
The current model doesn't support image input. When a user tries to send an image, they get:
```
ERROR: Cannot read "image.png" (this model does not support image input)
```
This needs to be handled gracefully (show user message, disable image attachments, etc.)

---

*Updated: 2026-04-22 (02:05)*
*Status: DESIGN CONSISTENCY COMPLETE ✅*
*TypeScript: COMPILE OK*
*Git: 15 files changed, 139 insertions, 2317 deletions*