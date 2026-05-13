# UI/UX Workspace Plan — Role-Based Workspaces

> **Status**: Design document  
> **Date**: 2026-05-08  
> **Audience**: Developers, designers, product owners  
> **Prerequisite reading**: `docs/UI_UX_ROUTING_AND_HEADER.md` (auth + routing), `docs/ARCHITECTURE_TARGET.md` (system architecture)

---

## 1. Workspace Philosophy

Every user who logs into Way of Pi lands in a **workspace** — a focused environment tailored to their role. A workspace is not just a page; it's a **mental model**: the user should instantly understand "this is where I do my work, these are my tools, this is what matters right now."

### Design Principles

| Principle | Meaning |
|-----------|---------|
| **One workspace, one job** | Each workspace serves exactly one primary job function. A worker should never wonder "am I in the right place?" |
| **Role-native navigation** | Navigation items speak the user's language. Workers see "My Tasks", not "Ticket Queue". Admins see "Manage Users", not "CRUD Panel". |
| **Progressive disclosure** | Start with the essentials. Reveal advanced options only when the user's role or actions demand them. |
| **Consistent shell** | All workspaces share the same visual foundation (dark theme, spacing, components) so the platform feels cohesive even as the content changes. |
| **Zero dead ends** | Every page has a clear next action. No blank screens without guidance. |

### Workspace Types

```
┌─────────────────────────────────────────────────────────────┐
│                    WAY OF PI PLATFORM                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  PORTAL       │  │  IDE         │  │  DEV CONSOLE      │   │
│  │  Workspace    │  │  Workspace   │  │  Workspace         │   │
│  │               │  │              │  │                   │   │
│  │  Focused      │  │  Full        │  │  System-wide      │   │
│  │  task-driven  │  │  engineering │  │  control panel    │   │
│  │  UI           │  │  environment │  │  for super-admins │   │
│  │               │  │              │  │                   │   │
│  │  Roles:       │  │  Roles:      │  │  Roles:           │   │
│  │  - Worker     │  │  - Admin     │  │  - Super Admin    │   │
│  │  - Leader     │  │  - Leader    │  │                   │   │
│  │  - Client     │  │  - Worker*   │  │                   │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│                                                             │
│  * Worker/Leader can optionally access IDE if permitted     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Workspace Breakdown by Role

### 2.1 Worker Workspace (`/portal`)

**Primary job**: See tasks, log time, access files.
**Header type**: Portal Header (minimal)

```
┌──────────────────────────────────────────────────────────────┐
│ [logo] WORKER PORTAL              Signed in as Alex   [logout]│
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  📋 My Tasks    📐 My Files    ⏰ Time Entries    👤 Profile│  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─── CURRENT TAB ─────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  [My Tasks active]                                       │  │
│  │                                                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │ ⏳ TO DO │  │ 🚀 DOING │  │ ✅ DONE  │               │  │
│  │  │   (3)   │  │   (2)   │  │   (5)   │               │  │
│  │  │──────────│  │──────────│  │──────────│               │  │
│  │  │Task A    │  │Task C    │  │Task E    │               │  │
│  │  │Task B    │  │Task D    │  │Task F    │               │  │
│  │  │Task C    │  │          │  │Task G    │               │  │
│  │  └──────────┘  └──────────┘  └──────────┘               │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Key UX decisions:**
- **3-column kanban** for tasks is the primary view — it's intuitive, visual, and requires no training
- **Tabs** switch between jobs: tasks → files → time → profile
- **No AI chat** by default — workers are here for structured work, not conversation
- **Profile tab** shows certificates, licenses, and calendar — things that matter to the worker personally
- **Mobile-friendly** — the kanban columns stack vertically on small screens

**What a worker CAN do:**
- View tasks assigned to them in a kanban board
- Mark tasks as in-progress or complete
- View and download project files
- Log time entries against projects
- View their own certificates, licenses, and personal info
- Change their PIN

**What a worker CANNOT do:**
- See other workers' tasks
- Manage users or projects
- Access AI chat or IDE features
- View financial data
- Approve anything

---

### 2.2 Leader Workspace (`/portal`)

**Primary job**: Same as worker + approve time entries, manage team tasks.
**Header type**: Portal Header (minimal)

The Leader workspace is a **superset** of the Worker workspace. Leaders see the same tabs but with additional controls:

```
┌──────────────────────────────────────────────────────────────┐
│ [logo] WORKER PORTAL              Signed in as Jamie   [logout]│
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  📋 My Tasks    📐 My Files    ⏰ Time Entries    📊 Team   👤│
│                                                               │
│  ┌─── ⏰ Time Entries active ─────────────────────────────┐  │
│  │                                                         │  │
│  │  [My Time] [Team Time] ← leader-only tab               │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ Pending (4)  │  Approved (12)  │ This Month: 142h │  │  │
│  │  ├──────────────────────────────────────────────────┤  │  │
│  │  │ ☐ Jones, M   2h  Project Alpha  [Approve][Reject]│  │  │
│  │  │ ☐ Smith, K   4h  Project Beta   [Approve][Reject]│  │  │
│  │  │ ☐ ...                                            │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Leader-only additions:**
- **Team tab** — team dashboard with stats (total hours, avg per worker, completion %)
- **Team Time view** — see all team members' time entries, approve/reject
- **Create tasks** for team members
- **Team browser** — view worker directory
- **Report export** — time reports as CSV

**Bridge to IDE**: Leaders can optionally access the IDE workspace (`/`) via a toggle in Navigation. This is controlled by a permission flag.

---

### 2.3 Client Workspace (`/client`)

**Primary job**: Track project progress, view deliverables, give feedback.
**Header type**: Portal Header (minimal, client-branded)

```
┌──────────────────────────────────────────────────────────────┐
│ [logo] CLIENT PORTAL          ACME Corp           [logout]    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─── Project Selector ────────────────────────────────────┐  │
│  │  [Foundation Work ▼]                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─── Progress Overview ──────────────────────────────────┐   │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐               │   │
│  │  │ 75%  │  │$45k  │  │ 340h │  │ 12/15│               │   │
│  │  │Complete│  │Budget│  │Hours │  │Tasks │               │   │
│  │  └──────┘  └──────┘  └──────┘  └──────┘               │   │
│  └──────────────────────────────────────────────────────────┘  │
│                                                               │
│  📋 Projects    📐 Drawings    💬 Feedback                    │
│                                                               │
│  ┌─── 📋 Projects ─────────────────────────────────────────┐  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ Foundation Work      ● Active   Budget: $45k/$50k│   │  │
│  │  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                    │   │  │
│  │  │ 24 tasks · 340 hours · Due Jun 2026              │   │  │
│  │  ├──────────────────────────────────────────────────┤   │  │
│  │  │ Structural Framing    ● Active   Budget: $30k/$35k│  │  │
│  │  │ ━━━━━━━━━━━━━╺━━━━━━━━━━━━━━━━━━━                 │   │  │
│  │  │ 18 tasks · 210 hours · Due Aug 2026              │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Key UX decisions:**
- **Project selector** at the top — client may have multiple projects, needs to switch between them
- **Progress cards** give an instant health check — completion %, budget, hours, tasks
- **Tabs** organize deliverables: projects list, drawings/files, feedback form
- **No kanban** — clients don't need to see task status columns, they need progress summaries
- **No time tracking** — clients don't log time
- **Feedback form** with star rating + category + comment — structured enough to be useful, simple enough to fill out in 30 seconds

**What a client CAN do:**
- View project progress at a glance
- Switch between their projects
- View drawings and documents
- Submit feedback with rating, category, and comment

**What a client CANNOT do:**
- See other clients' projects
- Manage users, tasks, or time entries
- Access AI chat or IDE features
- See financial details beyond their project budget
- Approve or reject anything

---

### 2.4 Admin Workspace (`/admin` → `/`)

**Primary job**: Manage the platform — users, projects, system config.
**Header type**: Global Header (full MenuBar with Navigation)

Admins have **two workspaces**:

#### Admin Console (`/admin`)

```
┌──────────────────────────────────────────────────────────────┐
│ [logo] ADMIN CONSOLE              Manage team, clients, projects│
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─── Stats ─────────────────────────────────────────────┐   │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐   │   │
│  │  │ 24   │  │ 12   │  │ 8    │  │ 156  │  │ 340  │   │   │
│  │  │Workrs│  │Clients│  │Proj  │  │Tasks │  │Time  │   │   │
│  │  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘   │   │
│  └──────────────────────────────────────────────────────────┘  │
│                                                               │
│  👥 Workers    🏢 Clients    📋 Projects    ⚙️ Settings       │
│                                                               │
│  ┌─── 👥 Workers ──────────────────────────────────────────┐  │
│  │  [+ Add Worker]                                          │  │
│  │                                                          │  │
│  │  Name         Role      Status     Last Active   Actions │  │
│  │  ──────────────────────────────────────────────────────  │  │
│  │  Alex Smith   Worker    ● Active   2h ago    [Edit][...] │  │
│  │  Jamie Jones  Leader    ● Active   1d ago    [Edit][...] │  │
│  │  ...                                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

#### IDE Workspace (`/`)

```
┌──────────────────────────────────────────────────────────────┐
│ WAY OF PI  [Simple|Technical|Claw|Docs|Work]  File Edit ... │
│            Portal  Admin  Profile                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Full IDE environment with chat, editor, terminal, etc.]    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Admin navigation pattern:**
- Starts at Admin Console (`/admin`) after login
- **Navigation in MenuBar** provides the bridge:
  - "Portal" → `/portal` (switches to Portal Header, approve time entries)
  - "Admin" → `/admin` (Admin Console)
  - "IDE" → `/` (full IDE workspace)
- Admin Console tabs: Workers, Clients, Projects, Settings
- **Future**: Financial tab added when financial system is implemented

**Key UX decisions:**
- Admin Console is **not** an IDE — it's a structured management panel with tables and forms
- The IDE workspace is a **separate mode** for when the admin needs to code, chat with AI, or do engineering work
- The Navigation component in the MenuBar surfaces the bridge links clearly
- Each admin action (add worker, create project) has a clear "+" button at the top of the relevant tab

---

### 2.5 Super Admin Workspace (`/super-admin` → `/`)

**Primary job**: System-wide management — multi-tenant, server health, all data.
**Header type**: Global Header (full MenuBar)

```
┌──────────────────────────────────────────────────────────────┐
│ [logo] DEVELOPER VIEW              System-wide management     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─── System Stats ───────────────────────────────────────┐  │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐    │  │
│  │  │ 3    │  │ 36   │  │ 12   │  │ 8    │  │ 156  │    │  │
│  │  │Tents │  │Users │  │Clints│  │Projs │  │Tasks │    │  │
│  │  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                               │
│  🏢 Tenants    👥 Users    📊 Stats    🖥️ Health              │
│                                                               │
│  ┌─── 🏢 Tenants ──────────────────────────────────────────┐  │
│  │  [+ Create Tenant]                                      │  │
│  │                                                         │  │
│  │  Tenant     Slug      Tier      Users   Status   Created│  │
│  │  ─────────────────────────────────────────────────────  │  │
│  │  ACME Corp  acme      Enterprise 12      ● Active  ... │  │
│  │  Beta Ltd   beta      Pro       8       ● Active  ...  │  │
│  │  ...                                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Super Admin additions vs Admin:**
- **Tenants tab** — create/manage tenants with subscription tiers
- **Health tab** — server diagnostics, memory, uptime, version info
- **All-data access** — sees users across all tenants
- **Stats tab** — aggregate business metrics
- **IDE workspace** — same as Admin, full access to `/`

---

## 3. Navigation Architecture

### 3.1 Workspace Transitions

How users move between workspaces:

```
                    ┌──────────────────┐
                    │   /login         │
                    │   (LoginPage)    │
                    └────────┬─────────┘
                             │
                  ┌──────────┴──────────┐
                  │  Role-based redirect │
                  └──────────┬──────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ /client       │   │ /portal       │   │ /admin        │
│ Client Worksp │   │ Worker/Leader │   │ /super-admin  │
│               │   │ Workspace     │   │ Dev Console   │
│ [no bridge]   │   │ [no bridge]   │   │               │
└───────────────┘   └───────────────┘   └───────┬───────┘
                                                │
                                          ┌─────┴─────┐
                                          │  /  (IDE)  │
                                          │  Workspace │
                                          └───────────┘
```

**Bridge rules**:
- **Clients** stay in `/client` — no bridge to other workspaces
- **Workers** stay in `/portal` — optional IDE access if permitted
- **Leaders** stay in `/portal` — optional IDE access
- **Admins** land in `/admin` — can bridge to `/portal` or `/` via Navigation
- **Super Admins** land in `/super-admin` — can bridge to `/admin`, `/portal`, or `/` via Navigation

### 3.2 Navigation Component States

The `Navigation.tsx` component renders differently based on the active workspace:

| Workspace | Navigation content | Style |
|-----------|-------------------|-------|
| `/portal` (Worker) | None (tabs in page body) | Page-level tabs |
| `/portal` (Leader) | None (tabs in page body) | Page-level tabs |
| `/client` | None (tabs in page body) | Page-level tabs |
| `/admin` | Portal · IDE · Profile | Embedded in page header |
| `/super-admin` | Admin · Portal · IDE · Profile | Embedded in page header |
| `/` (IDE) | Simple · Technical · Claw · Docs · Work · Portal · Admin · Profile | In MenuBar center |

---

## 4. Header Architecture

### 4.1 Header Types

Three header types, visually distinct:

#### Portal Header (Workers, Leaders, Clients)

```
┌──────────────────────────────────────────────────────────────┐
│ 🅆  Portal Name          Signed in as User     [logout]      │
└──────────────────────────────────────────────────────────────┘
```

- Height: `h-10`
- Background: `bg-[#2d2d2d]`
- Logo on left, user info + logout on right
- No menus, no mode toggles
- Client variant: shows company name instead of "Worker Portal"

#### Admin Console Header (Admin, Super Admin)

```
┌──────────────────────────────────────────────────────────────┐
│ 🅆  Admin Console    Portal · IDE · Profile    [logout]      │
└──────────────────────────────────────────────────────────────┘
```

- Height: `h-10`
- Background: `bg-[#2d2d2d]` with orange left accent
- Logo + title on left, bridge navigation in center, logout on right
- No IDE menus — this is a management panel

#### Global Header (IDE Workspace)

```
┌──────────────────────────────────────────────────────────────┐
│ 🅆  [mode toggle]  File Edit View Go ...    🔍  Model  ●   │
│     Simple · Technical · Claw · Docs · Work                 │
│     Portal · Admin · DevView · Profile                      │
└──────────────────────────────────────────────────────────────┘
```

- Height: `h-8` (compact — IDE standard)
- Full MenuBar with menus, mode selector, navigation, search, model selector
- Navigation row below menus with mode tabs + workspace bridge links

---

## 5. Visual Design System

### 5.1 Color Tokens

Already consistent across the codebase. Formalised here:

| Token | Value | Usage |
|-------|-------|-------|
| `bg-primary` | `#1e1e1e` | Page background |
| `bg-surface` | `#252526` | Card, panel, table row |
| `bg-hover` | `#2d2d2d` | Hover state, header |
| `bg-border` | `#3c3c3c` | Borders, dividers |
| `text-primary` | `#cccccc` | Body text |
| `text-muted` | `#858585` / `#999` | Secondary text |
| `accent` | `#ea580c` | Primary actions, active state, badges |
| `accent-hover` | `#c2410c` | Hover on accent elements |
| `blue` | `#3b82f6` | Stats cards, info badges |
| `green` | `#22c55e` | Success, active status, on-track budget |
| `yellow` | `#eab308` | Warning, at-risk budget |
| `red` | `#ef4444` | Error, over-budget, blocked |
| `purple` | `#a855f7` | Enterprise tier, special badges |

### 5.2 Typography

| Element | Size | Weight | Family |
|---------|------|--------|--------|
| Page title | 20px | 700 | Inter/sans |
| Section header | 14px | 600 | Inter/sans |
| Body text | 13px | 400 | Inter/sans |
| Table cell | 12px | 400 | Inter/sans |
| Badge / label | 11px | 500 | Inter/sans |
| Code / numbers | 12px | 400 | JetBrains Mono/mono |
| Stat card number | 24px | 700 | Inter/sans |

### 5.3 Spacing & Layout

| Measure | Value |
|---------|-------|
| Page padding | 24px |
| Card padding | 16px |
| Tab bar height | 36px |
| Card gap (grid) | 12px |
| Table row height | 40px |
| Button height | 32px (default), 28px (small) |

### 5.4 Component Patterns

**Stat Cards**: 1px left border with role color, icon + number + label, fixed width or flex grid
**Tables**: Full-width, sticky header, alternating row hover, action column on right
**Tabs**: Horizontal bar with orange underline on active, click switches content below
**Kanban Board**: 3-column (Todo/Doing/Done), cards with title + meta, drag support (future)
**Buttons**: Orange filled for primary actions, outline for secondary, icon buttons for inline actions
**Badges**: Rounded pills with role-appropriate colors, 11px text

---

## 6. Landing Experience (Post-Login)

Each role has a specific landing experience designed to orient them immediately:

### Worker lands on:
1. **"📋 My Tasks" tab** is active by default
2. The kanban board shows today's task state
3. First-time guidance: "Welcome back! You have 4 tasks to work on today."
4. Empty state: "No tasks assigned yet. Check back later or contact your leader."

### Client lands on:
1. **Project selector** pre-filled with their most recent project
2. **Progress overview** cards visible immediately
3. First-time guidance: "Welcome! Select a project to see its progress."
4. Empty state: "No projects yet. Your project manager will add you soon."

### Admin lands on:
1. **Stats cards** at top show system health at a glance
2. **Workers tab** active by default (most common admin action)
3. First-time guidance: "Manage your team, clients, and projects from here."
4. Empty state: "Add your first worker to get started."

### Super Admin lands on:
1. **System stats** at top show multi-tenant health
2. **Tenants tab** active by default
3. First-time guidance: "Manage tenants and system-wide settings."
4. Empty state: "Create your first tenant to begin."

---

## 7. Implementation Phasing

### Phase 1: Workspace Shell (parallel with WOP-007 Phase 2)

- Wire `LoginPage.tsx` into `App.tsx` as the auth gate
- Standardise header components (PortalHeader, AdminHeader, GlobalHeader)
- Ensure role-based redirect works on login
- Remove inline login forms from ClientDashboard and WorkerPortal

### Phase 2: Navigation Refinement (parallel with WOP-007 Phase 2-3)

- Clean up `Navigation.tsx` — only render links relevant to the active workspace
- Add workspace bridge links (Portal ↔ Admin ↔ IDE) for high-privilege roles
- Ensure Navigation is embedded in MenuBar for IDE mode, in page header for admin modes

### Phase 3: Empty States & Guidance (after WOP-007 Phase 0)

- Add empty-state components for every tab in every workspace
- Add first-time guidance banners (dismissible)
- Ensure no blank screens

### Phase 4: Workspace Tuning (ongoing)

- Gather feedback on workspace clarity
- Adjust tab ordering, default views, and navigation labels
- Add workspace-specific onboarding tooltips

---

## 8. Relation to Existing Code

| Current file | Role in this plan |
|---|---|
| `src/App.tsx` | Must implement auth gate and layout switching |
| `src/pages/LoginPage.tsx` | Single login entry point (exists, needs wiring) |
| `src/pages/WorkerPortal.tsx` | Worker/Leader workspace (needs inline login removed) |
| `src/pages/ClientDashboard.tsx` | Client workspace (needs inline login removed) |
| `src/pages/AdminDashboard.tsx` | Admin Console (needs standardised header) |
| `src/pages/SuperAdminDashboard.tsx` | Dev Console (needs standardised header) |
| `src/components/Navigation.tsx` | Navigation component (needs role-based filtering) |
| `src/components/MenuBar.tsx` | IDE Global Header (already contains Navigation) |
| `src/components/UiModeToggle.tsx` | Mode switch component |
| `docs/UI_UX_ROUTING_AND_HEADER.md` | Auth + routing reference (this doc builds on it) |

---

## 9. Open Questions

1. **Worker → IDE bridge**: Should workers be able to access the IDE workspace? If so, what restrictions apply?
2. **Client → more tabs**: Should clients get a "Documents" tab alongside "Drawings"?
3. **Leader → Financial visibility**: Should leaders see project budgets in the financial system?
4. **Mobile nav**: Portal pages are mobile-friendly. Should the IDE workspace also have a mobile layout?
5. **Notifications**: Future addition — badge counts on tabs for pending approvals, new files, etc.

---

*Design document — 2026-05-08*
