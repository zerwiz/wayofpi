# UI/UX Routing & Header Architecture

This document outlines the standard architecture for routing, authentication, and the global header display in the **Way of Pi** application. The goal is to provide a seamless, role-aware experience where power users get IDE-like controls, while clients and workers get focused, simplified dashboards.

---

## 1. Unified Authentication (The Gatekeeper)

Instead of having multiple login forms scattered across different portals, the application uses a **Unified Login Page** (`/login`).

### Logic:
1. All unauthenticated users navigating to a protected route (or the root `/`) are redirected to `/login`.
2. The login page accepts a User ID and PIN.
3. Upon successful authentication, the server returns a JWT containing the user's `role` (`WORKER`, `LEADER`, `CLIENT`, `ADMIN`, `SUPER_ADMIN`).
4. The frontend routes the user to their designated landing page based on their role.

### Role-Based Routing Matrix:
| Role | Default Landing Page | Access Scope |
| :--- | :--- | :--- |
| **CLIENT** | `/client` (Client Dashboard) | Strictly limited to the Client Dashboard. Cannot access IDE modes. |
| **WORKER** | `/portal` (Worker Portal) | Worker Portal. Can also access standard IDE modes if permissions allow. |
| **LEADER** | `/portal` (Worker Portal) | Worker Portal + Leader features. Access to IDE modes. |
| **ADMIN** | `/admin` (Admin Console) | Admin Console + Worker Portal + All IDE modes. |
| **SUPER_ADMIN** | `/` (Technical / IDE Mode) | Full system access, Developer View (`/super-admin`), and all IDE modes. |

## 2. User Journeys & Redirection Logic

The application automatically directs users to the most relevant "Starting Point" based on their role, but allows high-privilege users to move between specialized views.

### Journey: The Client
- **Login**: Enters Client ID and PIN at `/login`.
- **Destination**: Redirected to `/client`.
- **Experience**: Clean dashboard showing project progress, drawings, and feedback.
- **Header**: **Minimalist Portal Header** (Branding + Logout). No IDE menus or mode toggles.
- **Constraints**: No access to `/`, `/portal`, or `/admin`.

### Journey: The Worker
- **Login**: Enters Worker ID and PIN at `/login`.
- **Destination**: Redirected to `/portal`.
- **Experience**: Mobile-friendly view focused on daily tasks, file downloads, and time entries.
- **Header**: **Task-Focused Header** (Portal info + Logout).
- **Flexibility**: If permissions allow, can switch to `Simple` mode to chat with AI assistants.

### Journey: The Admin / SuperAdmin
- **Login**: Enters Admin/Super ID and PIN at `/login`.
- **Destination**: Redirected to the **Technical Mode** (`/`).
- **Experience**: Enters the high-level engineering workspace.
- **Header**: **Unified Global Header** (Way of Pi Logo + Full Menus + Mode/Context Nav).
- **Navigation**:
    - Can click **"Portal"** in the Context Nav to enter the Worker Portal (to approve time entries or manage tasks).
    - Can click **"Admin"** to manage users and system-wide settings.
    - Can click **"DevView"** (SuperAdmin only) to monitor system health.

---

## 3. UI Transition Logic (State Management)

The visibility of the Global Header is determined by the intersection of the **User Role** and the **Active Path**.

### Header Visibility Matrix:
| Path | Header Type | Visible To |
| :--- | :--- | :--- |
| `/login` | None | Anyone |
| `/client` | Portal Header | Client, Admin, SuperAdmin |
| `/portal` | Portal Header | Worker, Leader, Admin, SuperAdmin |
| `/` (IDE) | **Global Header** | Admin, SuperAdmin (Optional: Worker/Leader) |
| `/admin` | **Global Header** | Admin, SuperAdmin |
| `/super-admin` | **Global Header** | SuperAdmin |

### The "Admin Bridge" Logic:
When an Admin/SuperAdmin is in the **Engineering View** (`/`), they see the Global Header. This header provides the "Bridge" to the simplified portals.
1. Admin clicks **"Portal"** in the top navigation.
2. The UI switches to the `/portal` path.
3. The `App.tsx` layout logic detects the path change and **unmounts the Global Header**, replacing it with the **Portal Header**.
4. This ensures that even high-privilege users experience the "Focused" UI of the portal when they are doing portal-specific work (like approving logs).

---

## 4. Implementation Blueprint (App.tsx)

To achieve this, the root `App.tsx` acts as the router and layout manager.

### Authentication State:
`App.tsx` must read the JWT token on mount. If no valid token exists, it immediately returns the `<LoginPage />`.

### Layout Rendering:
Once authenticated, `App.tsx` checks the current `window.location.pathname`.

**Case A: Standalone Portals (No Global Header)**
If the path is `/client` or `/portal`:
```tsx
if (isClient) return <ClientDashboard />;
if (isPortal) return <WorkerPortal />;
```

**Case B: IDE Modes (With Global Header)**
If the path is `/` (or other IDE routes), `App.tsx` renders a unified shell wrapper that contains the `<MenuBar />` (which internally includes `<Navigation />` in its center) and the active mode component (`TechnicalWorkspaceGrid`, `ClawApp`, `WorkApp`, etc.).

### Navigation Component Refactor:
The `<Navigation />` component should be embedded *inside* the `<MenuBar />` component, bridging the gap between the left-aligned Logo/Menu and the right-aligned Search/Model controls.

```tsx
// Abstract representation of the Global Header
<MenuBar>
  <Left>
     <Logo />
     <AppMenus /> {/* File, Edit, View */}
  </Left>
  <Center>
     <Navigation /> {/* Simple, Technical, Claw | Portal, Admin */}
  </Center>
  <Right>
     <Search />
     <ModelSelector />
  </Right>
</MenuBar>
```

---

## 4. Files to be Modified

This refactor involves changes across the core routing, layout, and portal pages.

| File Path | Description of Change |
| :--- | :--- |
| [**`App.tsx`**](../apps/wayofwork-ui/src/App.tsx) | Implement global Auth Gate and path-based layout logic (Header vs No Header). |
| [**`MenuBar.tsx`**](../apps/wayofwork-ui/src/components/MenuBar.tsx) | Add `appNavigation` prop to host the `Navigation` component. Add Way of Pi logo. |
| [**`Navigation.tsx`**](../apps/wayofwork-ui/src/components/Navigation.tsx) | Refine role-based visibility and styling for integration into the MenuBar. |
| [**`LoginPage.tsx`**](../apps/wayofwork-ui/src/pages/LoginPage.tsx) | (New) Single entry point for all users. |
| [**`ClientDashboard.tsx`**](../apps/wayofwork-ui/src/pages/ClientDashboard.tsx) | Remove internal login form. Rely on global auth. |
| [**`WorkerPortal.tsx`**](../apps/wayofwork-ui/src/pages/WorkerPortal.tsx) | Remove internal login form. Rely on global auth. |
| [**`AdminDashboard.tsx`**](../apps/wayofwork-ui/src/pages/AdminDashboard.tsx) | Standardize layout to receive Global Header via App.tsx. |
| [**`SuperAdminDashboard.tsx`**](../apps/wayofwork-ui/src/pages/SuperAdminDashboard.tsx) | Standardize layout to receive Global Header via App.tsx. |

---

## 5. Summary of UX Goals
1. **No accidental entry**: You cannot hit `/client` without logging in.
2. **No UI clutter**: Clients don't see "File > Open Workspace".
3. **Power user flexibility**: Admins can seamlessly jump from code editing (with menus) to approving timesheets (clean portal view).
4. **Single source of truth**: One login page handles all initial routing logic based on the secure JWT role payload.