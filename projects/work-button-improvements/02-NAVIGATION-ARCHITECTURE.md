# Way of Pi: Navigation & UI Architecture

This document defines the unified navigation structure and role-based access control (RBAC) logic for the Way of Pi production environment. It addresses the "9-button mess" by enforcing a Mandatory Login policy and providing Admins with granular, group-based control over workspace visibility.

---

## 1) Universal Authorization Gate

The platform operates on a **total-lockdown model**. No navigation elements or project data are rendered until a user provides valid credentials (JWT/PIN).

### Functional Categories

**Perspectives:** Simple, Technical, Claw  
*Toggle the depth of project visualization.*

**Destinations:** 
- **Docs** (Blueprint/Office evaluation)
- **Workboard** (The Kanban/Time Engine)

**Identity:** Portal (Login), Admin, Super Admin, Profile

---

## 2) Role-Based Visibility Matrix

The UI dynamically adapts to the user's role. Super Admin and Admin are distinct roles with different scopes of authority.

| UI Element         | Authorized Client | Authorized Worker | Work Leader | Tenant Admin | Super Admin |
|--------------------|:------------------:|:------------------:|:------------|:-------------:|:------------:|
| **Simple**         | ✅                 | ✅                 | ✅          | ✅           | ✅           |
| **Docs**           | ✅ (Assigned)      | ✅ (Assigned)      | ✅ (Evaluate) | ✅          | ✅           |
| **Workboard**      | ✅ (View-Only*)    | ✅ (Tasks)         | ✅ (Approve) | ✅           | ✅           |
| **Technical**      | ❌                 | ✅ (Gated)         | ✅          | ✅           | ✅           |
| **Claw**           | ❌                 | ❌                 | ✅          | ✅           | ✅           |
| **Admin (Tenant)** | ❌                 | ❌                 | ❌          | ✅           | ✅           |
| **Super Admin**    | ❌                 | ❌                 | ❌          | ❌           | ✅           |
| **Profile**        | ✅                 | ✅                 | ✅          | ✅           | ✅           |

\*Note: Clients see a restricted "View-Only" version of the Workboard to monitor time management and progress.

---

## 3) Workspace Control & Scalable Permissions

Admins and Work Leaders manage access using a hierarchical "Group and Workspace" model. This allows for rapid onboarding and secure file distribution across large teams.

### 3.1 Groups & Workspaces

**Groups:** Admins can create functional groups (e.g., "Plumbing Team," "Stakeholders"). Permissions assigned to a Group are inherited by all member Workers/Clients.

**Workspaces:** A physical or logical area (e.g., "Site 42"). A Workspace acts as a container for specific folders, documents, and boards.

**Inheritance:** When a document or task is added to a "Workplace," every user or Group assigned to that Workplace automatically gains the appropriate permissions to see it.

### 3.2 Client Kanban Access (New)

**Progress Transparency:** Admins can grant "Workboard View" access to specific Clients.

**Data Masking:** When a Client accesses the Workboard, sensitive internal worker data (e.g., hourly rates or internal comments) is masked, showing only task status and time spent on milestones.

### 3.3 Workspace Scoping

**Authorized Client Context:** Clients assigned to "Workspace A" see only the documents and progress reports for that specific site.

**Worker Task Isolation:** Workers see tasks filtered by their Group (e.g., "Current Plumbing Tasks") or their assigned Workplace.

---

## 4) Destination Deep-Dive: Workboard Mode (The Kanban Engine)

The Workboard button in the main navigation leads authorized personnel and permitted clients to their active productivity hub.

### 4.1 Workboard Implementation

Based on the WORKBOARD_REUSE_PLAN.md, the interface includes:

**Workboard Button:** A primary, high-visibility action button within the Work interface that triggers the full Kanban view.

**WorkBoard.tsx:** The main container for the Kanban interface.

**BoardSelector.tsx:** Used by Workers, Leaders, and Clients to switch between assigned Workspaces/Projects within the Workboard hub.

**Kanban Service:** Manages the persistent state of task cards in the SQLite/PostgreSQL backend.

### 4.2 Integration Fixes

**Import Correction:** WorkBoard.tsx must explicitly import BoardSelector from `./BoardSelector`.

**Naming Standardization:** Ensure all references use PascalCase `BoardSelector` to match the component export, regardless of the filename (`boardSelector.tsx`).

---

## 5) Role Distinctions: Admin vs. Super Admin

### 5.1 Tenant Admin (Organization Level)

**Scope:** Single Tenant only.

**Responsibilities:**
- Creating Groups and Workspaces
- Managing the BoardSelector availability for users (including Clients)
- Document visibility

**Access:** Cannot see data or users from other Tenants.

### 4.2 Super Admin (System Level - Reserved for Developers)

**Scope:** Global / Multi-Tenant.

**Responsibilities:**
- Create/Delete Tenants
- Global licenses
- System health

**Access:** Unrestricted cross-tenant visibility for maintenance.

**Important:** Super Admin role is **reserved exclusively for developers/system administrators**. This role bypasses all business-level security and should never be assigned to end users, workers, or tenants.

---

## 7) Missing Pages Investigation

### Hermes Page Issue (CRITICAL)

**Status:** 🔴 **Not Visible** - Needs Immediate Fix

**Problem:** The Hermes page at `apps/wayofpi-ui/src/pages/hermes/HermesPage.tsx` exists but is not accessible in the UI.

**Root Cause:**
1. ❌ Not exported from `apps/wayofpi-ui/src/pages/index.ts`
2. ❌ No routing condition in `apps/wayofpi-ui/src/App.tsx`

**Required Fixes:**
1. **Export HermesPage** in `apps/wayofpi-ui/src/pages/index.ts`:
   ```typescript
   export { HermesTerminalPage as HermesPage } from "./hermes/HermesPage";
   ```

2. **Add routing condition** in `apps/wayofpi-ui/src/App.tsx` (after `isProfile`):
   ```typescript
   const isHermes = window.location.pathname === "/hermes" || window.location.pathname.startsWith("/hermes/");
   
   if (isHermes) {
       return <HermesPage hermesPath={hermesPath || DEFAULT_HERMES_PATH} />;
   }
   ```

**Documentation:** See `plans/productionready/investigation/HERMES_PAGE_NOT_VISIBLE.md`

**Impact:**
- Hermes feature is unusable without these fixes
- Clients cannot access Hermes for demos
- Feature is effectively hidden despite being built

---

## 6) Technical Implementation Guidelines

### RBAC & Visibility Logic

```typescript
const navItems = [
  { label: 'Simple', visible: !!user },
  { label: 'Technical', visible: user.hasPermission('technical') || user.role === 'super_admin' },
  { label: 'Claw', visible: ['leader', 'admin', 'super_admin'].includes(user.role) },
  { label: 'Docs', visible: !!user && (user.groups.length > 0 || user.workspaces.length > 0) },
  { 
    label: 'Workboard', 
    visible: !!user && (user.role !== 'client' || user.hasPermission('view_kanban')) 
  }, 
  { label: 'Admin', visible: user.role === 'admin' || user.role === 'super_admin' },
  { label: 'Profile', visible: !!user },
];
```

### Security Enforcement

**Server-Side Path Validation:** The backend checks the `workspace_permissions` and `group_memberships` tables in SQLite.

**Query logic:** `(user_id OR group_id) + workspace_id + file_path = access_granted`

**Super Admin Enforcement:** All Super Admin actions must be logged and subject to audit review. Super Admin access is treated as a last-resort maintenance capability, not a production user role.

---

## 8) Action Items

### Immediate Actions Required

1. **Fix Hermes Page Visibility**
   - Export HermesPage from `apps/wayofpi-ui/src/pages/index.ts`
   - Add routing condition in `apps/wayofpi-ui/src/App.tsx`
   - Test `/hermes` route works correctly
   - See `plans/productionready/investigation/HERMES_PAGE_NOT_VISIBLE.md`

2. **Deploy for Client Demos**
   - Host application on developer's computer ASAP
   - Configure demo credentials
   - Set up ngrok tunnel for external access
   - See `plans/productionready/hosting/URGENT_DEPLOY_CLIENT_DEMO.md`

3. **Review Production Hosting Plans**
   - Evaluate Docker deployment options
   - Review VMS deployment (DigitalOcean, etc.)
   - See `plans/productionready/` directory

---

## 7) Summary of Improvements

- **Client Transparency:** Authorized Clients can now monitor project time management via the Workboard if permitted.
- **Standardized Terminology:** The primary worker destination is consistently labeled as Workboard.
- **Zero-Trust Enforcement:** No resource is shared unless explicitly placed in an assigned Workplace or Group.
- **Scalability:** Groups and Workspaces allow Admins to manage 100+ workers without manual individual assignments.
- **Granular Control:** Admins explicitly define the "boundaries" of what a team can see.
</think>

```markdown
# Way of Pi: Navigation & UI Architecture

This document defines the unified navigation structure and role-based access control (RBAC) logic for the Way of Pi production environment. It addresses the "9-button mess" by enforcing a Mandatory Login policy and providing Admins with granular, group-based control over workspace visibility.

---

## 1) Universal Authorization Gate

The platform operates on a **total-lockdown model**. No navigation elements or project data are rendered until a user provides valid credentials (JWT/PIN).

### Functional Categories

**Perspectives:** Simple, Technical, Claw  
*Toggle the depth of project visualization.*

**Destinations:** 
- **Docs** (Blueprint/Office evaluation)
- **Workboard** (The Kanban/Time Engine)

**Identity:** Portal (Login), Admin, Super Admin, Profile

---

## 2) Role-Based Visibility Matrix

The UI dynamically adapts to the user's role. Super Admin and Admin are distinct roles with different scopes of authority.

| UI Element         | Authorized Client | Authorized Worker | Work Leader | Tenant Admin | Super Admin |
|--------------------|:------------------:|:------------------:|:------------|:-------------:|:------------:|
| **Simple**         | ✅                 | ✅                 | ✅          | ✅           | ✅           |
| **Docs**           | ✅ (Assigned)      | ✅ (Assigned)      | ✅ (Evaluate) | ✅          | ✅           |
| **Workboard**      | ✅ (View-Only*)    | ✅ (Tasks)         | ✅ (Approve) | ✅           | ✅           |
| **Technical**      | ❌                 | ✅ (Gated)         | ✅          | ✅           | ✅           |
| **Claw**           | ❌                 | ❌                 | ✅          | ✅           | ✅           |
| **Admin (Tenant)** | ❌                 | ❌                 | ❌          | ✅           | ✅           |
| **Super Admin**    | ❌                 | ❌                 | ❌          | ❌           | ✅           |
| **Profile**        | ✅                 | ✅                 | ✅          | ✅           | ✅           |

*Note: Clients see a restricted "View-Only" version of the Workboard to monitor time management and progress.

---

## 3) Workspace Control & Scalable Permissions

Admins and Work Leaders manage access using a hierarchical "Group and Workspace" model. This allows for rapid onboarding and secure file distribution across large teams.

### 3.1 Groups & Workspaces

**Groups:** Admins can create functional groups (e.g., "Plumbing Team," "Stakeholders"). Permissions assigned to a Group are inherited by all member Workers/Clients.

**Workspaces:** A physical or logical area (e.g., "Site 42"). A Workspace acts as a container for specific folders, documents, and boards.

**Inheritance:** When a document or task is added to a "Workplace," every user or Group assigned to that Workplace automatically gains the appropriate permissions to see it.

### 3.2 Client Kanban Access (New)

**Progress Transparency:** Admins can grant "Workboard View" access to specific Clients.

**Data Masking:** When a Client accesses the Workboard, sensitive internal worker data (e.g., hourly rates or internal comments) is masked, showing only task status and time spent on milestones.

### 3.3 Workspace Scoping

**Authorized Client Context:** Clients assigned to "Workspace A" see only the documents and progress reports for that specific site.

**Worker Task Isolation:** Workers see tasks filtered by their Group (e.g., "Current Plumbing Tasks") or their assigned Workplace.

---

## 4) Destination Deep-Dive: Workboard Mode (The Kanban Engine)

The Workboard button in the main navigation leads authorized personnel and permitted clients to their active productivity hub.

### 4.1 Workboard Implementation

Based on the WORKBOARD_REUSE_PLAN.md, the interface includes:

**Workboard Button:** A primary, high-visibility action button within the Work interface that triggers the full Kanban view.

**WorkBoard.tsx:** The main container for the Kanban interface.

**BoardSelector.tsx:** Used by Workers, Leaders, and Clients to switch between assigned Workspaces/Projects within the Workboard hub.

**Kanban Service:** Manages the persistent state of task cards in the SQLite/PostgreSQL backend.

### 4.2 Integration Fixes

**Import Correction:** WorkBoard.tsx must explicitly import BoardSelector from `./BoardSelector`.

**Naming Standardization:** Ensure all references use PascalCase `BoardSelector` to match the component export, regardless of the filename (`boardSelector.tsx`).

---

## 5) Role Distinctions: Admin vs. Super Admin

### 5.1 Tenant Admin (Organization Level)

**Scope:** Single Tenant only.

**Responsibilities:**
- Creating Groups and Workspaces
- Managing the BoardSelector availability for users (including Clients)
- Document visibility

**Access:** Cannot see data or users from other Tenants.

### 5.2 Super Admin (System Level)

**Scope:** Global / Multi-Tenant.

**Responsibilities:**
- Create/Delete Tenants
- Global licenses
- System health

**Access:** Unrestricted cross-tenant visibility for maintenance.

---

## 6) Technical Implementation Guidelines

### RBAC & Visibility Logic

```typescript
const navItems = [
  { label: 'Simple', visible: !!user },
  { label: 'Technical', visible: user.hasPermission('technical') || user.role === 'super_admin' },
  { label: 'Claw', visible: ['leader', 'admin', 'super_admin'].includes(user.role) },
  { label: 'Docs', visible: !!user && (user.groups.length > 0 || user.workspaces.length > 0) },
  { 
    label: 'Workboard', 
    visible: !!user && (user.role !== 'client' || user.hasPermission('view_kanban')) 
  }, 
  { label: 'Admin', visible: user.role === 'admin' || user.role === 'super_admin' },
  { label: 'Profile', visible: !!user },
];
```

### Security Enforcement

**Server-Side Path Validation:** The backend checks the `workspace_permissions` and `group_memberships` tables in SQLite.

**Query logic:** `(user_id OR group_id) + workspace_id + file_path = access_granted`

---

## 7) Summary of Improvements

- **Client Transparency:** Authorized Clients can now monitor project time management via the Workboard if permitted.
- **Standardized Terminology:** The primary worker destination is consistently labeled as Workboard.
- **Zero-Trust Enforcement:** No resource is shared unless explicitly placed in an assigned Workplace or Group.
- **Scalability:** Groups and Workspaces allow Admins to manage 100+ workers without manual individual assignments.
- **Granular Control:** Admins explicitly define the "boundaries" of what a team can see.