# Hermes integration (with Honcho memory)

**Installation in Way of Pi:** Install Hermes CLI in this project at **`/home/zerwiz/CodeP/Way of pi/.hermes/`** following the steps below.

## 1. Installing Hermes in Way of Pi

**Location:** Install Hermes CLI at **`/home/zerwiz/CodeP/Way of pi/.hermes/`**

### Installation Steps

1. **Create the Hermes directory (with leading dot):**
   ```bash
   mkdir -p /home/zerwiz/CodeP/Way\ of\ pi/.hermes
   cd /home/zerwiz/CodeP/Way\ of\ pi/.hermes
   ```

2. **Set up Python virtual environment:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Hermes CLI and dependencies:**
   ```bash
   pip install hermes-agent
   ```

4. **Configure Hermes with Honcho integration:**
   ```bash
   hermes honcho setup
   ```

5. **Configure Hermes in Way of Pi:**
   - Create config: `${USER_HOME}/.hermes/config.yaml`
   - Set `HONCHO_BASE_URL` environment variable
   - Verify with: `hermes status`

### Project-Specific Hermes Setup

After installation at **`/home/zerwiz/CodeP/Way of pi/.hermes/`**:

| Configuration File | Purpose |
|--------------------|-------------|
| `.hermes/config.yaml` | Hermes settings with Honcho integration |
| `.env` | Environment variables (Honcho URL, workspace, peer ID) |
| `hermes` binary | CLI executable in venv |

---

### Quick Installation Command

From any directory:
```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
source ${USER_HOME}/.bashrc
hermes
```

This installs Hermes CLI globally. To install directly in Way of Pi:

```bash
cd /home/zerwiz/CodeP/Way\ of\ pi
mkdir -p .hermes
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

**Note:** Hermes installation uses `${USER_HOME}/.hermes` as the default config directory. After installation, we'll symlink or configure it to work with the Way of Pi project at `.hermes`.

### UI Layout Specification

```
┌─────────────────────────────────────────────────────────────────┐
│  WAY OF PI HEADER  |  Menu  |  Search  |  Settings              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────────┐  │
│  │                     │  │     FILE BROWSER                   │  │
│  │  HERMES             │  │                                 │  │
│  │  TERMINAL           │  │  ┌───────────────────────────┐  │  │
│  │                     │  │  │                             │  │  │
│  │  ┌───────┐         │  │  📁 /home/zerwiz/CodeP/Way of   │  │  │
│  │  │ ➜     │         │  │  📄 pi/.hermes/                │  │  │
│  │  │ hermes│         │  │  📄 .hermes/                    │  │  │
│  │  │ status│         │  │  📄 config.yaml                 │  │  │
│  │  └───────┘         │  │  🔧 hermes-cli                   │  │  │
│  │   [Input...]       │  │  🧪 .venv/                      │  │  │
│  │                     │  │  [Dock Split Handle]            │  │  │
│  │                     │  │                                 │  │  │
│  │                     │  │  ┌───────────────────────────┐  │  │
│  │                     │  │  │     TERMINAL OUTPUT        │  │  │
│  │                     │  │  │                             │  │  │
│  │                     │  │  │ ➜ hermes status             │  │  │
│  │                     │  │  │ [+] Hermes ready            │  │  │
│  │                     │  │  │ [+] Honcho: ACTIVE          │  │  │
│  │                     │  │  │                             │  │  │
│  │                     │  │  └───────────────────────────┘  │  │
│  └───────────────────────┴───────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Resizable Panel Design

**Dock Split Handle Features:**
- Draggable vertical separator between terminal and file browser
- Resizes using `DockSplitHandle` component (Zed-style)
- Persisted weights in session storage
- Edge-drop grid grow (up to 3×4 grid layout)
- Keyboard shortcuts for panel resizing

**Panel Configuration:**
- Terminal panel (left): Default weight ~70%
- File browser (right): Default weight ~30%
- Minimum widths: Terminal 400px, File Browser 200px
- Handle shows resize cursor on hover
- Click-and-drag to resize

### Implementation Notes

**Component Structure:**
- `HermesTerminalView.tsx` — Main terminal pane in the center
- `HermesFileBrowser.tsx` — File browser on the right side
- `HermesPage.tsx` — Container layout

**Features:**
- Full interactive terminal in the middle for running Hermes commands
- File browser on the right showing contents of `/home/zerwiz/CodeP/Way of pi/.hermes/`
- Real-time command output streaming
- Session persistence using Honcho memory backend
- Quick-access commands panel

**Terminal Features:**
- Executable Hermes commands
- View command history
- Copy output to clipboard
- Auto-scroll to bottom
- Syntax highlighting for command output

**File Browser Features:**
- Navigate hermes directory structure
- View config files (`.yaml`, `.env`)
- Search for files
- Quick-open files in terminal


**Hermes** is a separate agent/CLI stack from **Pi**.

**Editing (Honcho-related sections):** Keep in sync with all other Honcho docs—**[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md#keeping-honcho-documentation-in-sync)**.

This doc covers how **Hermes** is configured to use **Honcho** as a **cross-session memory** backend (profiles, search, context, conclusions)—so Hermes can recall structured notes across runs. It does **not** replace Pi’s per-chat **JSONL** transcript; it complements it when you work in Hermes.

For the **Honcho server** (Docker, API, SDK config), see **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)**. For a one-page overview of both sides, see **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)**.

---

## 1. What Hermes gains from Honcho

With the **`honcho`** toolset enabled, Hermes can call Honcho-backed tools (names may match your Hermes build), for example:

| Tool (typical) | Purpose |
|----------------|---------|
| `honcho_profile` | User/session profile material |
| `honcho_search` | Semantic search over stored memory |
| `honcho_context` | Pull relevant context for the current task |
| `honcho_conclude` | Record summaries / wrap-up |

If Honcho is down, Hermes often reports something like **`Honcho init failed: Connection refused`**.

---

## 🎨 Hermes UI Shared Header & Menu

**Located in:** `apps/wayofwork-ui/src/layouts/WayOfPiLayout.tsx`

The Hermes page uses the same header and menu as other Way of Pi pages:

**Installation Path Note:** Hermes installs into `${USER_HOME}/.hermes` (user home directory) by default. For Way of Pi integration, we create a symlink or configure the project to use `/home/zerwiz/CodeP/Way of pi/.hermes/` as the project workspace.

To set up the Way of Pi hermes workspace:

```bash
# Create hermes in Way of Pi project
mkdir -p /home/zerwiz/CodeP/Way\ of\ pi/.hermes

# Copy or symlink from global install (if installed globally)
# or run installer directly in Way of Pi project
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# Configure to use Way of Pi hermes directory
ln -s ${USER_HOME}/.hermes /home/zerwiz/CodeP/Way\ of\ pi/.hermes
```

The `.hermes` directory is the standard Hermes installation location and should be used for all Hermes CLI operations.

### Shared Header & Menu Features:
### Shared Header & Menu Features:

Hermes reads project/user config from **`${USER_HOME}/.hermes/`**. The pieces that matter for Honcho usually include:

| Key / section | Role |
|---------------|-------|
| **`model.*`** | LLM provider Hermes uses for its own reasoning (independent of Honcho's internal LLM usage). |
| **`honcho.enabled`** | Turn Honcho integration on or off. |
| **`honcho.base_url`** | Honcho HTTP API base (must match the running API, e.g. `http://localhost:18000`). |
| **`honcho.workspace`** | Honcho workspace id (isolates memory namespaces). |
| **`honcho.user_peer`** | Stable id for the human/user peer in Honcho. |
| **`honcho.session_id`** | Session id Hermes uses when talking to Honcho (may tie to a project or machine). |
- Toolsets must include **`honcho`** (and whatever else you use, e.g. **`hermes-cli`**).

**Precedence note:** If **`${USER_HOME}/.honcho/config.json`** sets **`baseUrl`**, it can override or shadow what Hermes YAML says for the SDK path Hermes uses—keep them aligned. See **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** §2.

### Example snippet (adjust all values)

```yaml
honcho:
  enabled: true
  base_url: http://localhost:18000
  workspace: your-workspace
  user_peer: your-user-id
  session_id: your-session-id

toolsets: [honcho, hermes-cli]
```

---

## 3. Shell environment (optional but common)

Your shell may export variables consumed by Hermes or helper scripts, for example:

| Variable | Typical use |
|----------|-------------|
| `HONCHO_BASE_URL` | Match Honcho API URL if tools read env. |
| `HONCHO_WORKSPACE` | Default workspace name. |
| `HONCHO_PEER_ID` | User peer id. |
| `HERMES_TOOL_PARSER` | Parser mode (e.g. `hermes`)—set per your install docs. |

After changing **`${USER_HOME}/.bashrc`** (or similar), reload the shell or re-source the file.

---

## 4. Commands and `just` recipes (this repo)

From the playground **`justfile`** (paths assume Hermes venv under **`${USER_HOME}/.hermes/hermes-agent/venv/`**—edit if yours differs):

| Recipe | What it does |
|--------|----------------|
| **`just hermes-status`** | `hermes status` |
| **`just hermes-honcho-status`** | `hermes honcho status` — good sanity check that Hermes sees Honcho |
| **`just hermes-honcho-setup`** | `hermes honcho setup` — repair / re-init path when connection or config drift |

Start Honcho before expecting these to succeed: **`cd ${USER_HOME}/honcho-server && just honcho-up`** or **`just honcho-up-api`** (from **`${USER_HOME}/honcho-server`**).

---

## 5. Relationship to Pi (this repository)

| System | Memory style |
|--------|----------------|
| **Pi** | Session **JSONL**, optional **session-memory** / **session-saver** / **`/remember`**—see **[AGENT_MEMORY.md](AGENT_MEMORY.md)**. |
| **Hermes + Honcho** | **Cross-session** structured memory via Honcho API. |

You can use both: Pi for coding-agent sessions in this repo, Hermes for CLI flows—with **Honcho** as shared memory when Pi's **honcho-mirror** extension is loaded (default in this playground's **`.pi/settings.json`**) and Hermes has the **honcho** toolset. Pi **still** uses **[AGENT_MEMORY.md](AGENT_MEMORY.md)** for its own session context; mirroring does not replace that. Align **`baseUrl`** / workspace. Disable Pi mirroring with **`PI_HONCHO_MIRROR=0`**; see **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** §9.

---

## 6. Troubleshooting (Hermes-side)

| Symptom | Check |
|---------|-------|
| `Connection refused` | Honcho API not running — **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** §4–5. |
| Wrong workspace / peer | `honcho.*` keys in **`config.yaml`** vs **`${USER_HOME}/.honcho/config.json`**. |
| Toolset missing | `toolsets` includes **`honcho`**. |
| Stale URL | Port changed in Docker — update YAML, SDK JSON, and env vars together. |

---

## 7. Pi agent `hermes` (talk to Hermes from Pi)

This repo defines a Pi specialist **`hermes`** ([`.pi/agents/hermes.md`](../.pi/agents/hermes.md)) for **agent-team** / **`dispatch_agent`**. It runs the **Hermes CLI** in **non-interactive** mode:

```bash
"$HOME/.hermes/hermes-agent/venv/bin/hermes" chat -q 'Your message' -Q
```

Hermes prints its **reply on stdout** (and often a **`session_id:`** line). The Pi agent relays that output to the user. For a **continued** Hermes thread, pass **`--resume SESSION_ID`** from the prior run.

Teams: **`hermes`** (solo), and **`hermes`** is on team **`info`** in **`.pi/agents/teams.yaml`**. Team **`full`** uses **`ralph`** instead of **`hermes`**; switch to **`hermes`** or **`info`** to **`dispatch_agent` `hermes`**, or add **`hermes`** to the active roster. Hermes must be installed and configured separately; this does not embed Hermes inside Pi.

---

## 8. Related docs

| Doc | Topic |
|-----|--------|
| **[HONCHO_INTEGRATION.md](HONCHO_INTEGRATION.md)** | Server, Docker, SDK config, dreaming/deriver |
| **[Hermes_Honcho_connection.md](Hermes_Honcho_connection.md)** | Hermes ↔ Honcho bridge (not Pi) |
| **[PI_LOCAL_AI.md](PI_LOCAL_AI.md)** | Pi-first local AI (memory, mirror, `hermes` agent) |
| **[HONCHO_LOCAL_AI.md](HONCHO_LOCAL_AI.md)** | Pi + Hermes + Honcho stack patterns |
| **[AGENT_MEMORY.md](AGENT_MEMORY.md)** | Pi memory layers |
| **[AGENTS.md](AGENTS.md)** | Agent inventory including **`hermes`** |
