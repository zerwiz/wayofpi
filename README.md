# Way of Pi

**Way of Pi** is a next-generation AI-augmented engineering platform designed for high-velocity software development, team orchestration, and automated workflow management. 

Built on top of the **[Pi Framework](https://www.pi.dev)**, Way of Pi provides a rich, Electron-first desktop experience that bridges the gap between raw terminal-based AI agents and a full-featured IDE. It is a "playground" for developers and a robust operational dashboard for project leaders and clients.

---

## 🚀 Core Pillars

### 1. The Multi-Mode Workspace
Way of Pi adapts to your current task with specialized UI "modes":
- **Technical Mode**: A high-density grid for power users, featuring a 3x4 split-pane editor, terminal integration, and deep agent orchestration.
- **Claw Mode**: The autonomous operations hub. Manage missions, schedules, and agent-driven channels.
- **Docs Mode**: A focus-mode for documentation, featuring AI-powered summarization, action-item extraction, and status tracking.
- **Work Mode**: A construction-oriented kanban board and time-tracking engine for team leads and workers.
- **Simple Mode**: A clean, chat-focused interface for quick interactions.

### 2. AI Orchestration Engine
Under the hood, Way of Pi leverages a sophisticated agent system:
- **Orchestrator Agent**: Manages the lifecycle of complex tasks, delegating to specialized sub-agents.
- **Domain Specialists**: Over 50+ specialized agents (from Blockchain and Quant to Security and SEO).
- **Pi Integration**: Seamless use of Pi extensions, skills, and memory layers (JSONL sessions, session-memory).
- **Local AI First**: Tight integration with local models via Ollama and Hermes.

### 3. Professional Dashboards
Role-based access control (RBAC) ensures everyone sees what they need:
- **Admin Dashboard**: Manage workers, clients, projects, and system-wide statistics.
- **Worker Portal**: Task management, time logging, and personal performance tracking.
- **Client Dashboard**: Transparent project progress, documents, and messaging.
- **Developer View**: System health, process metrics (Uptime, RAM, Node/Bun versions), and low-level logs.

---

## 🛠 Tech Stack

- **Runtime**: [Bun](https://bun.sh) (Backend API & WebSocket server)
- **Frontend**: [React](https://reactjs.org) + [Vite](https://vitejs.dev) + [Tailwind CSS](https://tailwindcss.com)
- **Desktop Shell**: [Electron](https://www.electronjs.org)
- **Database**: [SQLite](https://www.sqlite.org)
- **AI Framework**: [Pi Framework](https://www.pi.dev)
- **Utilities**: `just` (command runner), `ngrok` (secure tunneling)

---

## 🏁 Getting Started

### Prerequisites
- [Bun](https://bun.sh) installed.
- [Node.js](https://nodejs.org) (for Electron).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/zerwiz/wayofpi.git
   cd wayofpi
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Initialize the database:
   ```bash
   bun run apps/wayofpi-ui/server/init-db.ts
   ```

### Running the App
- **Desktop (Electron)**:
  ```bash
  ./start-wayofpi.sh
  ```
- **Web Only**:
  ```bash
  ./start-wayofpi.sh --web
  ```

---

## 📂 Project Structure

- `apps/wayofpi-ui`: Main React frontend and Electron shell.
- `apps/wayofpi-ui/server`: The Bun-powered backend serving APIs and agent orchestration.
- `.pi/agents`: Definitions for all AI agents.
- `.pi/skills`: Reusable agent instruction sets.
- `docs/`: Comprehensive technical documentation.
- `projects/`: Workspace-scoped project tracking and context.

---

## 🛡 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ by the Way of Pi Team.*
