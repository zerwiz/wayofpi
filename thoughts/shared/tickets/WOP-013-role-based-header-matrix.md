# Role-Based Header Menus & Settings

**Goal:** Map the unified `MenuBar` options (Perspectives, Apps, Portals, Menus, Search) to the specific needs of each user role (Client, Worker, Leader, Admin, Super Admin) in the "Agentic OS".

---

## 1. Top-Level Visibility Matrix

This matrix defines which elements of the main header (as seen in the design image) are visible to which roles.

| Header Element | Client | Worker | Leader | Admin | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Perspectives (Simple, Tech, Claw)** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Apps (Docs, Workboard)** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Portals (Client, Portal, Admin)** | `Client` | `Portal` | `Portal` | `Admin`, `Portal` | `DevView`, `Admin`, `Portal` |
| **Profile** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **App Menus (File, Edit, etc.)** | ✅* | ✅* | ✅* | ✅ (All) | ✅ (All) |
| **Search / Command Bar** | ❌ | ✅ (Tasks) | ✅ (Tasks) | ✅ (Full) | ✅ (Full) |
| **Model Selector** | ❌ | ❌ | ❌ | ✅ | ✅ |

*\* App Menus for Clients, Workers, and Leaders are heavily adapted/restricted (see section 2).*

---

## 2. Menu Content Adaptation

The "App Menus" (File, Edit, etc.) must adapt to the context of the user. An Admin needs to edit files; a Worker needs to edit tasks.

### 2.1 The "File" Menu

| Role | Menu Options |
| :--- | :--- |
| **Super Admin / Admin** | New File, Open Workspace, Save, Save All, Auto-Save Toggle, Close Workspace, Exit |
| **Leader / Worker** | New Task, Log Time, Export Time Report (Leader only), Exit |
| **Client** | Export Project Status (PDF), Exit |

### 2.2 The "Edit" & "Selection" Menus

| Role | Menu Options |
| :--- | :--- |
| **Super Admin / Admin** | Full text-editing suite (Undo, Redo, Cut, Copy, Find, Replace, Select All, Expand Selection) |
| **Leader / Worker / Client** | *Hidden entirely* (Not relevant outside the IDE context) |

### 2.3 The "View" Menu

| Role | Menu Options |
| :--- | :--- |
| **Super Admin / Admin** | Layout Presets, Toggle Sidebar, Full Screen, Zen Mode, Zoom In/Out |
| **Leader / Worker** | Toggle Kanban/List View, Full Screen, Zoom In/Out |
| **Client** | Toggle Details View, Full Screen, Zoom In/Out |

### 2.4 The "Go" Menu

| Role | Menu Options |
| :--- | :--- |
| **Super Admin / Admin** | Go to File, Go to Symbol, Go to Line, Next Problem |
| **Leader / Worker** | Go to Dashboard, Go to Profile, Jump to Task (Search) |
| **Client** | Go to Dashboard, Go to Profile |

### 2.5 The "Run" & "Terminal" Menus

| Role | Menu Options |
| :--- | :--- |
| **Super Admin / Admin** | Start Debugging, Run Build Task, New Terminal, Split Terminal |
| **Leader / Worker / Client** | *Hidden entirely* |

### 2.6 The "Agents" Menu

| Role | Menu Options |
| :--- | :--- |
| **Super Admin / Admin** | Manage Agent Teams, Configure Agent Providers, View Agent Logs |
| **Leader** | Request Agent Assistance (e.g., "Draft ÄTA ticket"), Summarize Weekly Progress |
| **Worker / Client** | *Hidden entirely* |

### 2.7 The "Help" Menu

| Role | Menu Options |
| :--- | :--- |
| **All Roles** | How to Use Way of Pi, Keyboard Shortcuts (Contextual), Submit Feedback, About |

---

## 3. Role-Specific "Settings" Adaptation

The "Settings" menu (or modal) must adapt to the user's scope of control.

### 3.1 Client Settings
*   **Profile Settings**: Update name, contact info, PIN.
*   **Notification Settings**: Email frequency for project updates.
*   **Appearance**: Dark/Light mode toggle.

### 3.2 Worker Settings
*   **Profile Settings**: Update name, contact info, PIN.
*   **Work Preferences**: Default task view (List vs. Kanban), Default project filter.
*   **Appearance**: Dark/Light mode toggle.

### 3.3 Leader Settings
*   *(Includes all Worker Settings)*
*   **Team Settings**: Manage default assignees, set team notification rules.
*   **Workflow Settings**: Configure mandatory fields for ÄTA tickets before client submission.

### 3.4 Admin Settings
*   *(Includes all Leader Settings)*
*   **Workspace Settings**: Manage global `.env` vars, system paths.
*   **User Management**: Add/Remove users, reset passwords, change roles.
*   **Billing/Integrations**: Configure Fortnox/Visma API keys.

### 3.5 Super Admin Settings
*   *(Includes all Admin Settings)*
*   **System Health**: Configure telemetry, log retention.
*   **Multi-Tenant Config**: Manage tenant limits, database connections, and Caddy routing rules.
*   **Agent Runtime**: Configure local `pi-coding-agent` binary paths and model fallbacks.