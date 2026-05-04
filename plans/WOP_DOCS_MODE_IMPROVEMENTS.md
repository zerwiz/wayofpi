# Docs Mode Improvements - Project Manager Focus

## Current Problem
The Docs UI mode is currently a copy of Technical mode (IDE-style 3-panel layout). It should be reoriented for **project managers** who need document-centric workflows, not coding features.

## Target User: Project Manager
- Reads/writes project documentation (markdown, plans, specs)
- Reviews AI-generated content and plans
- Manages project structure (docs/, plans/, specs/)
- Needs overview, not deep technical tools
- Wants simplified chat focused on document Q&A

## Proposed Changes

### 1. Replace "Docs" with Better Name
"Docs" is too generic and sounds like a coder's file browser.

**Options:**
- **"Plans"** - focused on project planning documents
- **"Docs & Plans"** - broader but clear
- **"Project"** - ties to project management
- **"Knowledge"** - for documentation/knowledge base feel

**Recommendation:** `"plans"` mode (clean, specific, matches `plans/` directory)

### 2. Redesign the 3-Panel Layout

#### Current (Technical Copy):
```
[File Tree] | [Chat Panel] | [Preview]
```
- File tree shows ALL files (code + docs)
- Chat is full-featured (code mode, tools, agents)
- Preview is code-editor style

#### Proposed (Project Manager):
```
[Document List] | [Document Viewer] | [AI Assistant]
```

**Left Panel - Document List:**
- Only show documentation files (`.md`, `.txt`, `.doc`)
- Filter out code files (`.ts`, `.js`, `.py`, etc.)
- Group by folder: `plans/`, `docs/`, `specs/`, `projects/`
- Show document status: ✅ complete, 📝 draft, 🔄 in-progress
- Quick filters: "Plans", "Docs", "Specs", "All"
- Hide technical files (keep them in Technical mode)

**Center Panel - Document Viewer:**
- Clean reading view (not code editor)
- Markdown rendering (not raw text)
- Table of contents sidebar
- Document metadata (author, last modified, status)
- Edit button → opens Simple mode editor
- Comments/highlights (future)

**Right Panel - AI Assistant:**
- Simplified chat (no code tools/agents)
- Pre-set prompts: "Summarize this doc", "Find action items", "Review plan"
- "Ask about selection" context button
- Document-specific chat history
- Quick actions: "Generate summary", "Create action items", "Review gaps"

### 3. Remove Technical Features
- ❌ Code syntax highlighting
- ❌ Git status indicators
- ❌ Terminal/console
- ❌ Build/plan tools (keep those in Technical/Claw)
- ❌ Agent picker (too technical)
- ❌ Thinking mode toggle
- ❌ Code-specific slash commands

### 4. Add Project Manager Features

**Document Management:**
- ✅ Document status badges (Draft, Review, Approved)
- ✅ Document templates (PRD, Technical Spec, Meeting Notes)
- ✅ Quick create from template
- ✅ Document comparison (future)

**AI-Powered:**
- ✅ "Summarize this plan" button
- ✅ "Extract action items" from meeting notes
- ✅ "Review for completeness" on specs
- ✅ "Generate project timeline" from plans

**Views:**
- ✅ "My Documents" (recently edited)
- ✅ "Needs Review" (status = draft)
- ✅ "All Documents" (folder structure)
- ✅ "Search" (full-text across all docs)

### 5. Visual Design Changes

**Simpler Chrome:**
- Cleaner typography (more whitespace)
- Less monospace, more sans-serif
- Warmer colors (not dark IDE orange)
- Document icons (not file-code icons)

**Header:**
```
[DOCS & PLANS] [My Docs | Needs Review | All] [Search] [New Document]
```

**Remove from Header:**
- Mode toggle (already in main header)
- Technical status indicators
- Connection dots (simplify)

### 6. Chat Panel Simplification

**Current Chat Features (keep):**
- Send message
- Streaming response
- Stop button
- Chat history

**Remove:**
- Mode toggle (Simple/Technical/Build/Plan)
- Agent picker
- Thinking toggle
- Tool call display (too technical)
- Queue manager

**Add:**
- "Context: Currently viewing [doc name]"
- Quick prompt buttons above input:
  - "Summarize this document"
  - "Find action items"
  - "Review for gaps"
  - "Suggest improvements"

### 7. File Tree → Document Browser

**Current:** Shows ALL files with code icons
**Proposed:** Shows only documentation with doc icons

```typescript
// Filter for project manager relevant files
const DOCUMENT_EXTENSIONS = new Set([
  'md', 'txt', 'doc', 'docx', 'pdf', 
  'yaml', 'yml' // for project configs
]);

// Group by purpose
const DOCUMENT_GROUPS = {
  'Plans': { icon: '📋', path: 'plans/', color: 'blue' },
  'Docs': { icon: '📚', path: 'docs/', color: 'green' },
  'Specs': { icon: '📐', path: 'specs/', color: 'purple' },
  'Projects': { icon: '📁', path: 'projects/', color: 'orange' },
};
```

### 8. Preview Panel → Document Viewer

**Current:** Code editor with line numbers
**Proposed:** Rendered markdown with reading experience

- Use `react-markdown` or similar for MD rendering
- Clean typography (Inter/font-sans)
- Max-width container (60-80 chars for readability)
- Table of contents from headings
- No line numbers (not code!)

## Implementation Priority

### Phase 1 (Minimal Change):
1. Rename "Docs" to "Plans" in UiModeToggle
2. Filter file tree to show only `.md`, `.txt`, `.doc` files
3. Remove code-specific features from chat (agent picker, thinking toggle)
4. Add "Summarize" / "Extract action items" quick buttons

### Phase 2 (Layout Redesign):
1. Replace file tree with document browser (grouped by folder)
2. Replace preview with markdown renderer
3. Simplify chat to PM-focused prompts
4. Add document status badges

### Phase 3 (Full PM Workflow):
1. Document templates
2. Document status workflow (Draft → Review → Approved)
3. AI-powered document analysis
4. Document comparison view

## Files to Modify

1. **`useUiMode.ts`** - Rename "docs" to "plans" (or keep "docs" but change UI)
2. **`UiModeToggle.tsx`** - Update label/icon
3. **`components/docs/DocsApp.tsx`** - Complete redesign
4. **`components/docs/DocumentBrowser.tsx`** - New component (replaces FileExplorer)
5. **`components/docs/DocumentViewer.tsx`** - New component (replaces PreviewModal)
6. **`components/docs/PMChatPanel.tsx`** - Simplified chat for PMs
7. **`server/paths.ts`** - Add `isDocumentFile()` helper

## Example: Improved DocsApp.tsx Structure

```tsx
export function DocsApp({ uiMode, setUiMode, nodes, ... }) {
  return (
    <div className="plans-mode flex h-full">
      {/* Left: Document Browser */}
      <DocumentBrowser
        nodes={nodes}
        onSelectDocument={setSelectedDoc}
        filter={DOCUMENT_EXTENSIONS}
        groups={DOCUMENT_GROUPS}
      />

      {/* Center: Document Viewer */}
      <DocumentViewer
        documentPath={selectedPath}
        onEdit={() => setUiMode("simple")}
        markdown={true}
      />

      {/* Right: PM Chat */}
      <PMChatPanel
        documentContext={selectedPath}
        quickPrompts={[
          "Summarize this document",
          "Extract action items",
          "Review for completeness"
        ]}
      />
    </div>
  );
}
```

## Conclusion
The current "Docs" mode is a misplaced Technical mode. It should be redesigned for project managers who need:
- Clean document browsing (not code file trees)
- Readable document viewing (not code editors)
- Simplified AI chat (not technical tools)
- Document workflow features (status, templates, AI analysis)

**Recommended next step:** Implement Phase 1 changes to quickly improve the PM experience without a full rewrite.
