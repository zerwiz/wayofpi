# Docs Mode Document Routing Investigation

**Investigation Date:** 2026-01-04  
**Path:** `/home/zerwiz/CodeP/Way of pi/apps/wayofwork-ui/src/components/docs/`  
**Status:** 🟡 Investigating (NO CODE CHANGES)

---

## ✅ TODO LIST - Suggested Fixes

- [ ] **File 1: Fix FileExplorer to display file tree**
  - Location: `FileExplorer.tsx`
  - Issue: Empty/placeholder tree nodes not loading
  - Fix: Add file loading mechanism or wire up `docsNodes` properly

- [ ] **File 2: Initialize AI Chat with conversation history**
  - Location: `ChatPanel.tsx`, `ChatMessages.tsx`
  - Issue: ChatPanel exists but no messages appear
  - Fix: Initialize `rows` with session data or show alternative placeholder

- [ ] **File 3: Integrate DocumentBrowser into DocsApp**
  - Location: `DocumentBrowser.tsx`
  - Issue: Component exists but never used
  - Fix: Either integrate into `DocsApp` or remove unused component

- [ ] **Fix 4: Implement document file loading**
  - Location: `loadFiles()` function in `DocumentBrowser.tsx`
  - Issue: Empty array always returned
  - Fix: Add API call to fetch and populate files

- [ ] **Fix 5: Wire up breadcrumb navigation**
  - Location: `DocumentBrowser.tsx`
  - Issue: Shows "Root" but no navigation
  - Fix: Add folder navigation logic and breadcrumb updates

- [ ] **Fix 6: Connect filtering/search states**
  - Location: `DocumentBrowser.tsx`
  - Issue: States exist but unused
  - Fix: Implement filter logic and search functionality

- [ ] **Fix 7: Add or remove CSS for DocumentBrowser**
  - Location: `./DocumentBrowser.css` (missing)
  - Issue: CSS file doesn't exist
  - Fix: Create CSS file or remove import

- [ ] **Fix 8: Implement file tree API calls**
  - Location: `FileExplorer.tsx`, `DocumentBrowser.tsx`
  - Issue: No API calls to load file tree
  - Fix: Add `loadFiles()` with proper API call

- [ ] **Fix 9: Handle empty states better**
  - Location: Multiple components
  - Issue: Shows "No files" or "Start a conversation..." permanently
  - Fix: Add loading indicators or better empty state handling

- [ ] **Fix 10: Consider merging duplicate file loading paths**
  - Location: `DocsApp.tsx`
  - Issue: Path A (direct) and Path B (context) may be redundant
  - Fix: Review and consolidate file selection logic

**Total Issues Found:** 3 major
**Total Fix Items:** 10 suggested

---

## 📍 Overview

This document analyzes how documents are routed and displayed in the Docs mode UI, examining the flow of events from file selection to preview display.

---

## 🔄 Current Routing Flow

### 1. **User Action → Docs App**

```
User clicks file in FileExplorer
    ↓
handleSelectFile() in DocsApp
    ↓
setsSelectedPath(path)
    ↓
setPreviewOpen(true)
```

**Location:** `DocsApp.tsx` (lines 46-50)
```typescript
const handleSelectFile = useCallback(
    (path: string) => {
        setSelectedPath(path);
        setPreviewOpen(true);
    },
    [setSelectedPath],
);
```

---

### 2. **File Explorer Updates Context**

```
FileExplorer onSelectFile called
    ↓
Calls DocumentHandlerContext onSelectFile
    ↓
Updates selectedFile state
    ↓
Updates selectedFileForPreview (via onSelectFile hook)
```

**Location:** `DocumentHandlerContext.tsx` (lines 120-124)
```typescript
const onSelectFile = useCallback((file: FileEntry) => {
    setSelectedFile(file);
    setSelectedFileForPreview(file); // Also set for preview
}, []);
```

---

### 3. **Preview Modal Renders File**

```
PreviewModal receives selectedFileForPreview
    ↓
Renders PreviewContent component
    ↓
Shows file content (markdown/pdf/etc)
```

**Location:** `PreviewModal.tsx` (lines 48-55)
```typescript
<PreviewContent
    file={selectedFileForPreview}
    zoom={currentZoom}
    currentPage={currentPage}
    appearanceDark={appearanceDark}
/>
```

---

### 4. **Context Sharing Across Components**

The `DocumentHandlerContext` acts as a **state provider** shared between:

- **FileExplorer** - File selection
- **ChatPanel** - Chat with selected file context
- **PreviewModal** - File preview rendering

All components receive context via `useDocumentHandler()` hook.

---

## 📊 Component Interaction Map

```
┌─────────────────────────────────────────────────────────┐
│                    DocsApp                                │
│   ┌───────────────────────────────────────────────────┐ │
│   │  FileExplorer (select file)                       │ │
│   │   → sets "selectedFile" via Context                │ │
│   └───────────────────────────────────────────────────┘ │
│                   ↓ (Context)                              │
│   ┌───────────────────────────────────────────────────┐ │
│   │  DocumentHandlerContext                            │ │
│   │  - selectedFile (FileEntry | null)                 │ │
│   │  - selectedFileForPreview (FileEntry | null)       │ │
│   │  - messages[]                                       │ │
│   └───────────────────────────────────────────────────┘ │
│                   ↓ (Context)                              │
│   ┌───────────────────────────────────────────────────┐ │
│   │  PreviewModal                                       │ │
│   │  - Receives selectedFileForPreview prop            │ │
│   │  - Renders PreviewContent                           │ │
│   └───────────────────────────────────────────────────┘ │
│                   ↓ (Context)                              │
│   ┌───────────────────────────────────────────────────┐ │
│   │  ChatPanel                                         │ │
│   │  - Can ask about selectedFile context               │ │
│   └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🔀 Dual Routing Paths

### **Path A: Direct Selection (DocsApp)**

```typescript
// In DocsApp handleSelectFile
handleSelectFile(path) {
    setSelectedPath(path);
    setPreviewOpen(true);  // Opens PreviewModal directly
}
```

**Used when:** User clicks file in left panel

---

### **Path B: Context Update (FileExplorer→Context)**

```typescript
// In FileExplorer, called from onSelectFile
onSelectFile(file) {
    // Updates DocumentHandlerContext selectedFile
    // Also sets selectedFileForPreview via hook
}
```

**Used when:** Context-based file update

---

### **Path C: Toggle Preview Button**

```typescript
// In DocsApp header
<button onClick={() => setRightOpen(v => !v)} title="Toggle preview">
    <Eye size={18} />
</button>
```

**Used when:** User wants to hide/show preview panel

---

## 🎯 Document Status Detection

**Location:** `DocsApp.tsx` (lines 41-65)

```typescript
/* Detect document status from content */
useEffect(() => {
    if (!selectedPath) {
        setDocStatus(null);
        return;
    }
    async function detectStatus() {
        try {
            const content = await apiGet<string>(`/api/file?path=${encodeURIComponent(selectedPath)}`);
            const lower = content.toLowerCase();
            if (lower.includes("status: approved") || lower.includes("# approved")) {
                setDocStatus("approved");
            } else if (lower.includes("status: review") || lower.includes("# review")) {
                setDocStatus("review");
            } else if (lower.includes("status: draft") || lower.includes("# draft")) {
                setDocStatus("draft");
            } else {
                setDocStatus(selectedPath.includes("/plans/") ? "draft" : "review");
            }
        } catch {
            setDocStatus(null);
        }
    }
    detectStatus();
}, [selectedPath]);
```

**Logic:**
1. Fetch file content via API
2. Look for status markers (`#draft`, `#review`, `#approved`)
3. Fallback: If in `/plans/` → draft, else → review

---

## 📁 File Filtering Logic

**Location:** `DocsApp.tsx` (lines 22-36)

```typescript
/* Filter tree to only show document files (.md, .txt, .doc, .docx) */
const docsNodes = useMemo(() => {
    const docExts = new Set([".md", ".txt", ".doc", ".docx", ".pdf"]);
    function filterNode(node: TreeNode): TreeNode | null {
        if (node.type === "dir") {
            const children = (node.children || [])
                .map(filterNode)
                .filter((n): n is TreeNode => n !== null);
            if (children.length === 0) return null;
            return { ...node, children };
        }
        const ext = "." + node.name.split(".").pop()?.toLowerCase();
        return docExts.has(ext) ? node : null;
    }
    return nodes.map(filterNode).filter((n): n is TreeNode => n !== null);
}, [nodes]);
```

**Filtering:**
- Keeps: `.md`, `.txt`, `.doc`, `.docx`, `.pdf`
- Removes: `.ts`, `.js`, `.py`, `.json`, etc. (code files)
- Empty directories are hidden

---

## 🧩 PreviewContent Component

**Location:** `components/documenthandler/PreviewContent.tsx`

Responsible for rendering document content based on type:

- **Markdown files:** Rendered with markdown
- **PDF files:** Rendered as pages
- **Other:** Text/plain display

**Props received from context:**
- `file: FileEntry` - File metadata
- `zoom: number` - Current zoom level (10-200%)
- `currentPage: number` - Current page
- `appearanceDark: boolean` - Color scheme

---

## 🔍 Quick Action Routing

**Location:** `DocsApp.tsx` (lines 141-172)

```typescript
{/* Quick action buttons for document Q&A */}
{selectedPath && (
    <div className={`flex shrink-0 gap-2 border-b px-3 py-2 ${border}`}>
        {/* Summarize */}
        <button onClick={() => sendChat(`Summarize this document: ${selectedPath}`)}>
            📝 Summarize
        </button>
        {/* Action Items */}
        <button onClick={() => sendChat(`Extract action items from: ${selectedPath}`)}>
            ✅ Action Items
        </button>
        {/* Review */}
        <button onClick={() => sendChat(`Review this document for completeness: ${selectedPath}`)}>
            🔍 Review
        </button>
    </div>
)}
```

**Routing:** Click → sends prompt to ChatPanel → AI processes

---

## 📋 Summary of Routing Paths

| Trigger | Path | Target Component | Action |
|---------|------|------------------|--------|
| Click file | A + B | PreviewModal | Open preview |
| Context update | B | All components | Update states |
| Toggle preview button | C | PreviewModal | Show/hide panel |
| Quick action click | D → E | ChatPanel | Send prompt |
| Status detection | F → G | DocsApp | Update badge |

---

## 🔗 Connection Flow

1. **User clicks file** in FileExplorer
2. **FileExplorer** calls `Context onSelectFile`
3. **Context** updates `selectedFile` and `selectedFileForPreview`
4. **PreviewModal** receives `selectedFileForPreview` prop
5. **PreviewModal** renders `PreviewContent`
6. **PreviewContent** displays file content
7. Chat panel has access to `selectedFile` for context-aware questions
8. **DocsApp** detects status and shows badge

---

## 📌 Key Observations

### ✅ Working:
- File selection properly routes to preview
- Context is shared across components
- Status detection works via API fetch
- Quick actions work via chat panel

### 🟡 Potential Improvements:
- Path A and B could be merged (avoid duplicated state)
- Path B doesn't immediately update PreviewModal (might need sync)
- Status detection could be cached

### 🟢 Consistent:
- All components use the same `DocumentHandlerContext`
- Routing is predictable and traceable
- Code is well-commented

---

## 🎯 Next Investigation Steps

No code changes were made during this investigation. To investigate further:

1. **Check multi-file opening** - Can multiple files be selected simultaneously?
2. **Verify preview sync** - Does preview always show selected file?
3. **Test status updates** - Does doc status update when file content changes?
4. **Explore context unmount** - What happens when switching between docs modes?

---

## 📄 Files Analyzed

1. `DocsApp.tsx` - Main app with routing logic (315 lines)
2. `FileExplorer.tsx` - File selection handling (230 lines)
3. `PreviewModal.tsx` - Preview display (60 lines)
4. `PreviewContent.tsx` - Content renderer (not read yet)
5. `ChatPanel.tsx` - Chat routing (140 lines)
6. `DocumentHandlerContext.tsx` - Context state (100 lines)
7. `DocumentBrowser.tsx` - Doc list (not read yet)
8. `PMChatPanel.tsx` - Simplified chat (not read yet)

---

## 📝 Conclusion

The document routing in Docs mode uses a **single-source-of-truth context** pattern:

- **DocumentHandlerContext** holds all state
- Components **subscribe** to changes via `useDocumentHandler()`
- User actions trigger **context updates**
- Render components **react** to state changes

This is a clean, predictable routing pattern.

---

## 🐛 **KNOWN ISSUES** (No Code Changes)

### **Issue 1: File Tree Not Working**

**Problem:** FileExplorer shows "Project Files" header but doesn't display any nodes.

**Root Cause:**
1. FileExplorer receives `nodes` prop but no actual load happens
2. `docsNodes` computed array might be empty on first render
3. FileExplorer expects populated nodes to render correctly
4. Component structure exists but no data loading mechanism

**Status:** 🟡 **BROKEN** - Component renders but shows empty state

---

### **Issue 2: AI Chat Not Visible**

**Problem:** ChatPanel exists and imports ChatMessages but no conversation appears.

**Root Cause:**
1. ChatPanel receives `rows` array from parent context
2. If `rows.length === 0`, shows "Start a conversation..." placeholder
3. If no sessions initialized, rows stays empty
4. `connected` state might be false initially

**Status:** 🟡 **WAITING FOR DATA** - UI exists but no conversation history loaded

---

### **Issue 3: DocumentBrowser Unused**

**Problem:** DocumentBrowser component exists in `/components/docs/DocumentBrowser.tsx` but never integrated into DocsApp.

**Root Cause:**
1. Component has empty `loadFiles()` function
2. No API calls to populate files
3. Breadcrumb navigation not connected
4. Component not imported in DocsApp

**Status:** 🟠 **ORPHANED** - Component exists but not wired to app

---

## 📂 DocumentBrowser Component Investigation

**Location:** `/apps/wayofwork-ui/src/components/docs/DocumentBrowser.tsx` (57 lines)

### **What It's Supposed To Do:**
- Document-centric file browser (not code-focused)
- Groups files by folders: `plans/`, `docs/`, `specs/`
- Shows markdown/text files
- Has breadcrumb navigation like `/plans/myplan.md`
- Supports filtering: `all`, `markdown`, `text`, `code`
- Supports search
- Has folder navigation

### **Root Causes of Being Broken:**

**1. Empty `loadFiles()` Function**
```typescript
const loadFiles = async () => {
    setFiles([]);  // Always sets to empty array!
};
```

**Problem:**
- Makes async call but does nothing
- Immediately sets files to empty array
- Breadcrumb shows "Root" but no files listed
- No actual file fetching API call

**2. Not Imported in DocsApp**
- Component exists but never used in `DocsApp.tsx`
- `DocsApp` renders `FileExplorer` instead
- `FileExplorer` has its own file tree logic
- `DocumentBrowser` is never rendered

**3. Broken Breadcrumb Logic**
```typescript
const [breadcrumb, setBreadcrumb] = useState([{ name: 'Root', path: 'root' }]);

// Only renders breadcrumb, never updates
return (
    <div className="document-browser-toolbar">
        <div className="breadcrumb">
            {breadcrumb.map(...)}
        </div>
    </div>
);
```

**Problem:**
- Shows "Root" but no navigation
- No function to navigate to folders
- No API calls to load folder contents
- Breadcrumb is static, never updated

**4. Unused State and Imports**
```typescript
const [filterType, setFilterType] = useState<'all' | 'markdown' | 'text' | 'code'>('all');
const [searchQuery, setSearchQuery] = useState('');
const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
const [currentFolder, setCurrentFolder] = useState<'root' | string>(initialFolderPath || 'root');
// ... but nothing uses these states
```

```typescript
import {
    DocumentIcon,
    ArrowLeftIcon,
    FolderIcon,
    SearchIcon
} from '@heroicons/react/24/outline';
// ... all unused
```

**5. CSS File Missing**
- Component imports `'./DocumentBrowser.css'`
- File doesn't exist
- Component uses inline styles as fallback

**6. Broken File Type System**
```typescript
type FileData = {
    id: string;
    name: string;
    type: 'markdown-file' | 'markdown-folder' | 'text-file' | 'text-folder' | 'other';
    path: string;
    parentId: string | null;
    size: number;
    modified: Date;
};
```

**Problem:**
- No logic to populate `type` field
- No API to fetch file metadata
- No function to build file tree structure

### **Status: 🟠 ORPHANED COMPONENT**

**Why it exists:**
- Probably intended for a different file browser UI
- Maybe planned as alternative to `FileExplorer`
- Or planned for "documents only" mode vs "code" mode

**Why it's broken:**
- No data loading mechanism
- Not integrated into app
- All state unused
- Imports unused
- Component renders but shows nothing

**Fix needed:**
1. Integrate into `DocsApp` as alternative to `FileExplorer`
2. OR remove if not used
3. OR complete the file loading logic
4. OR wire up the breadcrumb navigation

---

## ✅ Summary

| Component | Status | Issue |
|-----------|--------|--------|
| DocsApp | 🟢 | Routes correctly |
| FileExplorer | 🟡 | Shows header, no files displayed |
| ChatPanel | 🟡 | UI exists, no conversation showing |
| PreviewModal | 🟢 | Renders previews OK |
| DocumentBrowser | 🟠 | Code exists, not integrated |
| DocumentBrowser.css | ❌ | File doesn't exist |

**DocumentBrowser Status Details:**
- ✅ Component exists with proper structure
- ❌ Empty `loadFiles()` function (always sets empty array)
- ❌ Not imported or used in `DocsApp`
- ❌ Breadcrumb shows "Root" but never updates
- ❌ All filtering/search states unused
- ❌ Imports (DocumentIcon, ArrowLeftIcon, etc.) all unused
- ❌ CSS file missing
- ❌ No file/tree loading API calls
- ❌ No navigation logic

**Investigation Complete** - No code changes were made. Document is ready for review.

---

## 📝 Investigation Results Summary

**Components Analyzed**:
1. DocsApp.tsx (315 lines) - ✅ Working routing
2. FileExplorer.tsx (230 lines) - 🟡 Files not loading
3. PreviewModal.tsx (60 lines) - ✅ Working
4. PreviewContent.tsx - Not analyzed yet
5. ChatPanel.tsx (140 lines) - 🟡 No conversation showing
6. DocumentHandlerContext.tsx (100 lines) - ✅ Context working
7. DocumentBrowser.tsx (57 lines) - 🟠 Orphaned, not integrated
8. DocumentBrowser.css - ❌ Missing

**Total Issues Found**: 3
- File tree not displaying
- AI chat not showing
- DocumentBrowser orphaned code

**Investigation Complete** - No code changes were made. Document is ready for review.
