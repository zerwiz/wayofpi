# Way of Pi - Project Structure

## Overview

Way of Pi is a Pi coding agent playground with extensions, agents, skills, and a web UI (`wayofpi-ui`). It includes tooling for project management, session memory, agent teams, and integration with Hermes/Honcho.

---

## Root Directory Structure

```
Way of pi/
├── agent/                          # Agent session JSONL files (chat logs by mode)
│   └── sessions/
│       ├── wayofpi-chat-claw.*.jsonl
│       ├── wayofpi-chat-simple.*.jsonl
│       └── wayofpi-chat-technical.*.jsonl
├── agent-sessions/                 # Legacy agent sessions (empty)
├── AGENTS.md                       # Orchestrator agent config & project rules
├── apps/                           # Applications
│   ├── mandelbrot.html             # Mandelbrot set visualization
│   ├── wayofpi-server/             # Bun-based API/WS backend
│   │   ├── bundled/               # Bundled output
│   │   ├── src/                   # Server source code
│   │   ├── index.js               # Entry point
│   │   └── package.json
│   └── wayofpi-ui/                # Electron + Vite + React frontend
│       ├── agent/                  # UI agent definitions
│       ├── electron/               # Electron main process
│       ├── server/                 # UI dev server
│       ├── src/                    # React source (components, hooks, panes)
│       ├── shared/                 # Shared types/utils
│       ├── public/                 # Static assets
│       ├── scripts/                # UI utility scripts
│       └── deps/                   # UI dependencies
├── build-release.sh                # Debian/Release build script
├── bun.lock                        # Bun lockfile
├── Calculator                      # Compiled calculator binary
├── Calculator.c                    # C calculator source
├── CHANGELOG.md                    # Project changelog (88KB, comprehensive)
├── chronicle/                      # Chronicle ledger for session tracking
│   └── ledger.json
├── damage-control-rules.yaml       # Symlink → ~/.pi/.pi/damage-control-rules.yaml
├── debian/                         # Debian packaging
│   ├── build/                     # Build output
│   ├── codedir/                   # Packaged code layout
│   └── source/debian/             # Debian control files
├── docs/                           # Project documentation (see § docs/ below)
├── doctor.sh                       # Diagnostics script for Pi environment
├── done/                           # Ralph Wiggum completed tickets
│   └── TEST-ALL-TOOLS.txt
├── .env                            # Environment variables (secrets, API keys)
├── .env.sample                     # Sample env file
├── full_server_index.ts.tmp        # Temp server index (generated)
├── hooks/                          # Custom React hooks (useAgents, useServerConfig)
├── hooks-alongside/                # Extended hooks (mobile, workspace, views)
├── images/                         # Project images (logo, icon)
│   ├── pi-logo.png/svg
│   └── wayofpi-icon.png
├── inprogress/                     # Ralph Wiggum in-progress tickets
├── install-global                  # Script to install Pi globally
├── justfile                        # Just command recipes (1444 lines)
├── LICENSE                         # Project license (MIT)
├── linux/                          # Linux desktop integration
│   ├── wayofpi.desktop.in         # Desktop file template
│   ├── wayofpi-launch.sh          # Launcher script
│   └── install-wayofpi-menuitem.sh
├── node_modules/                   # NPM dependencies
├── PI-COMMANDS.md                  # Pi slash commands reference
├── pienv                           # Pi environment loader
├── PI_VS_OPEN_CODE.md              # Comparison: Pi vs OpenCode
├── planning.md                     # High-level planning notes
├── plans/                          # Project plans & specs (see § plans/ below)
├── README.md                       # Root readme (Kilo component docs)
├── ref/                            # Reference implementations (see § ref/ below)
├── RESERVED_KEYS.md                # Reserved keyboard shortcuts
├── rules/                          # Pi agent rules (see § rules/ below)
├── rules.md                        # Root rules file
├── scripts/                        # Tooling scripts (see § scripts/ below)
├── settings.json                   # Pi settings (models, theme, etc.)
├── specs/                          # Specs directory (placeholder)
│   └── README.md
├── startup-scripts/                # Auto-start scripts
│   └── auto-start-pty-server.sh
├── start-wayofpi.sh                # Main startup script (Electron + server)
├── storage/                        # Runtime storage
│   ├── config.json                 # Stored config
│   ├── last-extension.json         # Last used extension
│   ├── reviewer/                   # Reviewer agent data
│   └── sessions/                   # Session JSON files
├── SYSTEM.md                       # System architecture & conduct rules
├── theme-lib/                      # Theme utilities
│   └── themeMap.ts
├── THEME.md                        # Theme documentation
├── tilldone-checklist.md           # TillDone checklist
├── todo/                           # Ralph Wiggum todo tickets
├── Way of pi.code-workspace        # VSCode workspace config
├── wop.upstream.lock.json          # Way of Pi upstream version lock
├── .claude/                        # Claude Code config
├── .claw/                          # Claw agent config
├── .cursor/                        # Cursor rules
├── .hermes/                        # Hermes CLI config
├── .honcho/                        # Honcho config
├── .kilo/                          # Kilo component config
├── .pi/                            # Pi agent runtime (see § .pi/ below)
├── .vscode/                        # VSCode launch config
└── .wayofpi/                       # Way of Pi index state
    ├── index/
    └── manifest.json
```

---

## `.pi/` Directory - Pi Agent Runtime

```
.pi/
├── agents/                         # Agent definitions (.ts files)
├── extensions/                     # Pi extensions (shims to ref/extensions/)
├── settings.json                   # Pi settings (extension enable/disable)
├── skills/                         # Skills (SKILL.md packages)
├── storage/                        # Pi storage
│   ├── sessions/                   # Auto-saved session JSONs (huge, gitignored)
│   └── config.json
├── themes/                         # UI themes (catppuccin, dracula, gruvbox, etc.)
│   ├── catppuccin-mocha.json
│   ├── cyberpunk.json
│   ├── dracula.json
│   ├── everforest.json
│   ├── gruvbox.json
│   ├── midnight-ocean.json
│   ├── nord.json
│   ├── ocean-breeze.json
│   ├── rose-pine.json
│   ├── synthwave.json
│   └── tokyo-night.json
└── tilldone-checklist.md           # TillDone checklist (runtime copy)
```

---

## `docs/` Directory - Documentation

```
docs/
├── README.md                       # Docs hub: table of all documents
├── STRUCTURE.md                    # This file - full project structure
├── REPO_INDEX.md                   # Repo map: folders, paths, apps
├── SYSTEM.md                       # Session memory, skills, extensions, rules
├── AGENTS.md                       # Agent definitions & scan paths
├── AGENT_TEAMS.md                   # Agent-team extension docs
├── AGENT_MEMORY.md                  # Session memory guide
├── EXTENSIONS.md                   # Extension model & inventory
├── SKILLS.md                       # Skills discovery & inventory
├── TOOLS.md                        # Tools: built-in & extension-registered
├── TUI.md                          # Terminal UI keybindings
├── CONCEPTS.md                     # Skills vs agents vs extensions vs tools
├── PLAYGROUND.md                   # Pi playground modes (FULL vs project-scoped)
├── HOW_TO_USE_AGENTS.md            # Practical agent usage guide
├── HOW_TO_USE_EXTENSIONS.md        # Practical extensions usage guide
├── HOW_TO_USE_SKILLS.md           # Practical skills usage guide
├── HOW_TO_USE_TOOLS.md             # Practical tools usage guide
├── commands/
│   └── REFERENCE.md                # Slash command reference
├── debug/                          # Debug logs & status docs
│   ├── 04-23-paths-debugging-log.md
│   ├── CURRENT-STATUS-CONTROL.md
│   ├── ELECTRON_START_DEBUG.md
│   └── SYSTEM_STARTUP_FIX_2026-05-04.md
├── hermes/                         # Hermes integration docs
│   ├── Hermes_Honcho_connection.md
│   ├── HERMES_INTEGRATION.md
│   ├── HERMES_MULTI_PROVIDER.md
│   ├── HERMES_STATUS.md
│   ├── HONCHO_FINAL_STATUS.md
│   ├── HONCHO_MULTI_MODEL_SETUP.md
│   ├── HONCHO_SUMMARY.md
│   ├── HONCHO_TESTS.md
│   └── HONCHO_VERIFICATION.md
├── honcho/                         # Honcho integration docs
│   ├── HONCHO_CAPABILITIES.md
│   ├── HONCHO_INTEGRATION.md
│   ├── HONCHO_LOCAL_AI.md
│   └── HONCHO_OPERATIONS.md
├── pi/                             # Pi-specific docs
│   ├── AGENT_MEMORY.md
│   ├── AGENTS.md
│   ├── AGENT_TEAMS.md
│   ├── all-shortcuts.md
│   ├── CLAUDE_CODE_VS_PI_GAPS.md
│   ├── COMPARISON.md
│   ├── PI_LOCAL_AI.md
│   ├── SKILLS.md
│   └── TOOLS.md
├── specs/                          # Spec references
│   ├── agent-forge.md
│   ├── AGENTS.md
│   ├── agent-workflow.md
│   ├── damage-control.md
│   ├── fd-intro.md
│   ├── github-management.md
│   └── pi-pi.md
├── wayofpi/                        # Way of Pi product docs (see § Way of Pi Docs below)
├── WOP_PLANNING.md                 # Planning hub
├── WOP_PRODUCT_OVERVIEW.md         # Product overview & onboarding
├── WOP_PRODUCT_CAPABILITIES.md     # Product capabilities matrix
├── WOP_COMBINED_BUILD_TODO.md      # Combined build TODO
├── WOP_STANDALONE_SYSTEM_PLAN.md   # Way of Pi product plan
├── WOP_PI_BACKEND_WIRING_PLAN.md   # Web UI → Pi backend wiring
├── WOP_PI_TOKEN_CONTEXT_DISCIPLINE.md  # Token/context discipline
├── WOP_ORCHESTRATOR_VS_PI_DISPATCHER.md
├── WOP_PI_TOOLS_AND_ORCHESTRATOR_PARITY.md
├── IDE_EXPLORER_PARITY.md          # Explorer/IDE shell comparison
├── WOP_CODE_EDITOR_LINE_NUMBERS.md
├── WOP_GENERATED_FILES_AND_LINE_PARITY.md
├── WOP_TECHNICAL_UI.md             # wayofpi-ui technical shell
├── WOP_MOBILE_UI_PLAN.md           # Mobile UI plan
├── WOP_ORCHESTRATION_EXTENSIONS_PANEL.md
├── WOP_MODULAR_DOCKS_PLAN.md       # Modular docks roadmap
├── WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md
├── WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md
├── WOP_WORKSPACE_AGENTS_UI_PLAN.md
├── WOP_BUILD_PLAN_MODE.md          # Build vs Plan mode
├── WOP_CLAW_MODE_PLAN.md           # Claw mode plan
├── WOP_CLAW_UI_PLAN.md             # Claw UI plan
├── WOP_TELEGRAM_PLAN.md            # Telegram bot plan
├── WOP_MENU_BAR_BACKLOG.md
├── WOP_NAMESPACE.md                # WOP_* namespace docs
├── WOP_NGROK.md                    # ngrok tunnel docs
├── WOP_UI_MANIFEST.md              # UI manifest strategy
├── WOP_MULTI_AGENT_WEBSOCKET.md    # Orchestration WS contract
├── WOP_SAFE_CUSTOMIZATION.md       # Safe customization pipeline
├── WOP_UPSTREAM_SYNC.md            # Upstream sync process
├── WOP_OPEN_TODOS.md               # Way of Pi backlog
├── PLAN_AGENT_MODEL_ROUTING.md     # Auto agent/model fit
├── PLAN_AWESOME_CODEX_SUBAGENTS.md # Codex subagents port plan
├── SUPERPOWERS_BUILD_MAP.md        # Superpowers → Pi mapping
├── SUPERPOWERS_TODO.md             # Superpowers implementation TODO
├── EVALUATION_AGENT_TEAM_SESSION_2026-03-25.md
├── OpenRouterInfo.md
├── sessionmemory.md
├── sessions.md                     # Legacy session-saver doc
├── subagents-implementation-guide.md
├── subagents-overview.md
├── executive-verdict.md
├── terminal-close-button-fix.md
└── PI_CODING_AGENT_GUIDE.md        # (in various locations)
```

---

## `plans/` Directory - Project Plans

```
plans/
├── README.md (in subdirs)
├── ChatExplorer.md                 # Chat explorer plan
├── DOCUMENTATION_TRACKER.md        # Docs tracking
├── ModalDropdownFixPlan.md         # Modal/dropdown fix plan
├── PI_CODING_AGENT_GUIDE.md        # Coding agent guide
├── PLAN-20250311-chat-image-clipboard.md
├── PLAN-20250311-GIT-PUSH-SYSTEM-MARKUP.md
├── PLAN-20250311-UI-fixes-updated.md
├── PLAN-20260311-git-file-explorer-reset-issue.md
├── PLAN-20260326-gh-management-tool.md
├── PLAN-20260411-connect-telegram.md
├── PLAN-20260412-herrmes-full-intergration.md
├── PLAN-RALPH-TICKET-FUNCTION.md  # Ralph ticket system
├── PTY_AUTO_START_INTEGRATION.md   # PTY auto-start
├── PTY_SERVER_AUTO_START_COMPLETE.md
├── README_TERMINAL_PTY.md
├── Sessionmemoryupdate.md          # Session memory update plan
├── session saver and compaction.md
├── sqlmemoryplan.md                # SQL memory plan
├── System-Architecture.md         # System architecture plan
├── TERMINAL_IMPLEMENTATION_SUMMARY.md
├── TERMINAL_USAGE_GUIDE.md
├── TERMINAL_VIEW_FIX_DOCUMENTATION.md
├── claw/                           # Claw-specific plans
│   ├── pi-schedule-prompt-integration-spec.md
│   └── whatsapp-pi-claw-integration-spec.md
├── grid-chooser-fix/              # Grid chooser fix
│   └── grid-chooser-issue-plan.md
├── mobile/                         # Mobile implementation
│   ├── Comprehensive-Mobile-Implementation-Plan.md
│   └── README.md
├── pi/plans/                       # Pi-specific plans
│   ├── IMPLEMENTATION_STEPS.md
│   ├── Memory-Context-Management.md
│   └── PLAN_RULE_SYSTEM.md
└── refactoring/                    # Refactoring plans
    ├── PHASE-1-COMPLETION.md
    ├── PLAN-20250311-app-component-split.md
    └── docs/components/
        ├── COMPONENT_DISPLAY_PLANNING.md
        └── verification/
            ├── COMPONENT_EXTRACTION_VERIFICATION.md
            └── components/menus/
                ├── EditMenu.tsx, FileMenu.tsx, GoMenu.tsx, RunMenu.tsx, ViewMenu.tsx
```

---

## `ref/` Directory - Reference Implementations

```
ref/
├── context-local-hints.ts          # Context hint utilities
├── session-memory.ts              # Session memory reference implementation
├── session-replay.ts              # Session replay reference
├── extensions/                     # Reference extensions (28 files)
│   ├── agent-chain.ts             # Chain multiple agents
│   ├── agent-dir-scan.ts          # Scan agent directories
│   ├── agent-forge.ts             # Forge new agents
│   ├── agent-team.ts              # Agent team orchestration
│   ├── agent-team-build-orchestra.ts
│   ├── chronicle.ts               # Chronicle extension
│   ├── cross-agent.ts             # Cross-agent communication
│   ├── damage-control.ts          # Damage control rules
│   ├── dynamic-loader.ts          # Dynamic extension loader
│   ├── extension-picker.ts        # Extension picker UI
│   ├── footer-context-stats.ts    # Footer context statistics
│   ├── github-management.ts       # GitHub management tool
│   ├── honcho-mirror.ts           # Honcho mirror extension
│   ├── minimal.ts                 # Minimal extension template
│   ├── pi-doctor.ts               # Pi diagnostics
│   ├── pi-pi.ts                   # Pi self-reference
│   ├── pure-focus.ts              # Focus mode
│   ├── purpose-gate.ts            # Purpose validation
│   ├── ralph.ts                   # Ralph Wiggum queue
│   ├── subagent-widget.ts         # Sub-agent widget
│   ├── system-select.ts           # System/model selector
│   ├── theme-cycler.ts            # Theme cycling
│   ├── themeMap.ts                # Theme mapping
│   ├── tilldone.ts                # TillDone checklist
│   ├── tool-counter.ts            # Tool usage counter
│   ├── tool-counter-widget.ts     # Tool counter widget
│   ├── web-tools.ts               # Web tools (fetch, search)
│   └── workspace-boundary.ts      # Workspace boundary enforcement
├── piwithstuff/                   # Reference Pi setup with stuff
│   ├── agent/sessions/            # Agent session configs
│   ├── bin/                       # Shell scripts (openai-filter-toggle, etc.)
│   ├── extensions/                # Extension implementations
│   ├── images/                    # Pi logos
│   ├── .pi/                       # Pi config (agents, docs, teams, etc.)
│   ├── specs/                     # Spec files (agent-forge, etc.)
│   ├── state/                     # State files (filter status)
│   ├── utils/                     # Python utilities (filter_models.py)
│   ├── models.py, model_resolver.py, model_selector.py
│   ├── prompt_templates.py
│   ├── test_openai_model_filtering.py
│   ├── package.json, bun.lock
│   ├── justfile
│   ├── readme.md, RESERVED_KEYS.md, THEME.md, TOOLS.md
│   └── pi-session-*.html          # Session replay HTML
├── sub-agents/                    # Sub-agent definitions
│   └── planner.md
```

---

## `rules/` Directory - Pi Agent Rules

```
rules/
├── README.md                       # Rules directory documentation
├── DAMAGE_CONTROL_RULES.md         # Damage control rules
├── hardcoded_paths.md              # Hardcoded path definitions
├── PI_CODING_AGENT_GUIDE.md        # Coding agent guide
├── rules.md                        # Root rules
├── pi agent rules/                 # Active agent rules (space in name)
│   ├── README.md
│   ├── master.md                   # Main rule document
│   ├── modes.md                    # Model/mode configuration
│   ├── packages.md                 # Package installation rules
│   ├── errors.md                   # Error handling definitions
│   ├── skills.md                   # Tool skills document
│   ├── agents.md                   # Agent workflow definitions
│   ├── architecture.md             # System architecture patterns
│   ├── external-links.md           # External API documentation
│   ├── models.json.md              # API endpoint definitions
│   ├── securitypolicy.md           # Security policy
│   └── summary.md                  # Rules summary
└── pi agent rules.zip              # Zipped copy of rules
```

---

## `scripts/` Directory - Tooling Scripts

```
scripts/
├── README.md                              # Scripts documentation
├── README_UPDATE.md                        # README update notes
├── bootstrap-wayofpi-environment.sh       # Environment bootstrap
├── disable-playground-in-project           # Disable playground in project
├── enable-playground-in-project            # Enable playground in project
├── ghm-install.js                          # GitHub management install
├── github-management-cli.js                # GitHub management CLI
├── import-domain-specialists.cjs           # Import domain specialists
├── init-project-local-pi-env.sh           # Init local Pi environment
├── install-ngrok-optional.sh               # Install ngrok (optional)
├── install-ppi-global.sh                   # Install ppi globally
├── link-playground-agent-trees.sh          # Link playground agent trees
├── normalize-pi-config-model-order.py      # Normalize model order
├── pi-e                                    # Pi extensions CLI
├── pi-e-clear-settings-extensions.py       # Clear settings/extensions
├── pi-e-expand-selection.py                # Expand selection utility
├── pi-launch-from-project.sh               # Launch Pi from project
├── pi-models-scoped-priority.ts            # Model priority scoping
├── pi-standard                             # Standard Pi launcher
├── pi-with-env                             # Pi with environment
├── pi-with-project-tools                    # Pi with project tools
├── ppi                                     # Pi package installer
├── quick-start.sh                          # Quick start script
├── render-playground-project-settings.py   # Render playground settings
├── render-project-wired-playground-settings.py
├── sanitize-linked-playground-settings.py  # Sanitize settings
├── setup-github-cli.sh                     # Setup GitHub CLI
├── wop-headless-pi                         # Way of Pi headless launcher
├── wop-pi-upstream.ts                      # Pi upstream sync
├── wop-recover.sh                          # Recovery script
├── wop-update-simple.sh                    # Simple update
├── wop-update-system.sh                    # System update
└── wop-upstream/                           # Upstream config
    ├── config.json
    └── README.md
```

---

## Way of Pi Docs (`docs/wayofpi/`)

```
docs/wayofpi/
├── CABA.md                              # CABA documentation
├── WAY_OF_PI_INTRODUCTION.md            # Introduction to Way of Pi
├── WOP_BUILD_PLAN_MODE.md               # Build vs Plan mode
├── WOP_CLAW_MODE_PLAN.md                # Claw mode plan
├── WOP_CLAW_UI_PLAN.md                  # Claw UI plan
├── WOP_CODE_EDITOR_LINE_NUMBERS.md      # Code editor line numbers
├── WOP_COMBINED_BUILD_TODO.md           # Combined build TODO
├── WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md
├── WOP_GENERATED_FILES_AND_LINE_PARITY.md
├── WOP_MENU_BAR_BACKLOG.md              # Menu bar backlog
├── WOP_MOBILE_UI_PLAN.md                # Mobile UI plan
├── WOP_MODULAR_DOCKS_PLAN.md            # Modular docks plan
├── WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md
├── WOP_MULTI_AGENT_WEBSOCKET.md         # Multi-agent WebSocket
├── WOP_NAMESPACE.md                     # Namespace documentation
├── WOP_NGROK.md                         # ngrok documentation
├── WOP_OPEN_TODOS.md                     # Open TODOs
├── WOP_ORCHESTRATION_EXTENSIONS_PANEL.md
├── WOP_ORCHESTRATOR_VS_PI_DISPATCHER.md
├── WOP_PI_BACKEND_WIRING_PLAN.md        # Pi backend wiring
├── WOP_PI_TOKEN_CONTEXT_DISCIPLINE.md   # Token discipline
├── WOP_PI_TOOLS_AND_ORCHESTRATOR_PARITY.md
├── WOP_PLANNING.md                      # Planning hub
├── WOP_PRODUCT_CAPABILITIES.md           # Product capabilities
├── WOP_PRODUCT_OVERVIEW.md               # Product overview
├── WOP_SAFE_CUSTOMIZATION.md            # Safe customization
├── WOP_SIMPLE_UI_VIEWS.md               # Simple UI views
├── WOP_STANDALONE_SYSTEM_PLAN.md        # Standalone system plan
├── WOP_TECHNICAL_UI.md                  # Technical UI shell
├── WOP_TELEGRAM_PLAN.md                 # Telegram integration
├── WOP_UI_MANIFEST.md                   # UI manifest strategy
├── WOP_UPSTREAM_SYNC.md                 # Upstream sync
└── WOP_WORKSPACE_AGENTS_UI_PLAN.md      # Workspace agents UI
```

---

## Key Files Summary

| File/Dir | Purpose |
|----------|---------|
| `AGENTS.md` | Orchestrator agent config, project conventions, team definitions |
| `justfile` | Command recipes (1444 lines): `just wayofpi-electron`, `just hermes-*`, etc. |
| `CHANGELOG.md` | Comprehensive project changelog (88KB) |
| `start-wayofpi.sh` | Main startup: launches Electron + Bun server |
| `settings.json` | Pi settings: models, theme, extensions |
| `.pi/settings.json` | Pi runtime settings: extension enable/disable, teams |
| `SYSTEM.md` | System architecture, conduct rules, memory model |
| `rules.md` | Root rules file for Pi agent |
| `RESERVED_KEYS.md` | Keyboard shortcut reservations |
| `PI-COMMANDS.md` | Slash commands reference |
| `doctor.sh` | Diagnostics for Pi environment |

---

## Hidden Directories

| Directory | Purpose |
|-----------|---------|
| `.pi/` | Pi agent runtime: agents, extensions, skills, themes, storage |
| `.claude/` | Claude Code configuration |
| `.claw/` | Claw agent configuration |
| `.cursor/` | Cursor IDE rules (`.mdc` files) |
| `.hermes/` | Hermes CLI configuration |
| `.honcho/` | Honcho server configuration |
| `.kilo/` | Kilo component configuration |
| `.vscode/` | VSCode launch configuration |
| `.wayofpi/` | Way of Pi index state and manifest |
| `.git/` | Git repository data |

---

## File Type Summary

- **TypeScript/JavaScript**: Extensions, UI code, server code, hooks, scripts
- **Markdown**: Documentation (300+ `.md` files across project)
- **JSON**: Config files, session data, package manifests, themes
- **JSONL**: Agent session chat logs
- **Shell scripts**: Setup, launch, update, bootstrap scripts
- **Python**: Model filtering, utilities (in `ref/piwithstuff/`)
- **C**: Calculator source (`Calculator.c`)
- **HTML**: Mandelbrot visualization, session replay exports

---

*Generated: 2026-05-04 - Way of Pi Project Structure (3-level deep)*
