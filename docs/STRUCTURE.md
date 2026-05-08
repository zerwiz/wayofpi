# Way of Pi - Project Structure

## Overview

Way of Pi is a Pi coding agent playground with extensions, agents, skills, and a web UI (`wayofpi-ui`). It includes tooling for project management, session memory, agent teams, and integration with Hermes/Honcho.

---

## Root Directory Structure

```
Way of pi/
├── agent/                          # Agent session JSONL files (may be empty)
│   └── sessions/                   # (may be empty)
├── agent-sessions/                 # Legacy agent sessions (empty)
├── AGENTS.md                       # Orchestrator agent config & project rules
├── apps/                           # Applications
│   ├── wayofpi-server/             # Bun-based API/WS backend
│   │   ├── bundled/               # Bundled output
│   │   ├── src/                   # Server source code
│   │   ├── index.js               # Entry point
│   │   └── package.json
│   ├── wayofpi-ui/                # Electron + Vite + React frontend
│   │   ├── agent/                  # UI agent definitions
│   │   ├── electron/               # Electron main process
│   │   ├── server/                 # UI dev server
│   │   ├── src/                    # React source (components, hooks, panes)
│   │   ├── shared/                 # Shared types/utils
│   │   ├── public/                 # Static assets
│   │   ├── scripts/                # UI utility scripts
│   │   └── deps/                   # UI dependencies
│   ├── workerportal/               # Worker portal (work-button implementation)
│   │   ├── .env.example
│   │   ├── index.html
│   │   ├── README.md
│   │   ├── WORK_BUTTON.css
│   │   ├── WORK_BUTTON.tsx
│   │   ├── workerportal.tsx
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── index.ts
│   │   │   │   ├── PortalAuth.tsx
│   │   │   │   ├── PortalHeader.tsx
│   │   │   │   └── PortalNavigation.tsx
│   │   │   └── pages/
│   │   │       └── TimeEntriesPage.tsx
│   │   └── deploy/
│   │       └── wayofpi-sqlite-init.sql
│   └── mandelbrot.html             # Mandelbrot set visualization
├── build-release.sh                # Debian/Release build script
├── bun.lock                        # Bun lockfile
├── Calculator                      # Compiled calculator binary
├── Calculator.c                    # C calculator source
├── CHANGELOG copy.md               # Copy of project changelog
├── CHANGELOG.md                    # Project changelog (88KB, comprehensive)
├── chronicle/                      # Chronicle ledger for session tracking
│   └── ledger.json
├── damage-control-rules.yaml       # Symlink → ~/.pi/.pi/damage-control-rules.yaml
├── debian/                         # Debian packaging
│   ├── build/                     # Build output
│   ├── codedir/                   # Packaged code layout
│   └── source/debian/             # Debian control files
├── default/                        # Default configuration files
├── docker/                         # Docker-related files
├── docs/                           # Project documentation (see § docs/ below)
├── doctor.sh                       # Diagnostics script for Pi environment
├── done/                           # Ralph Wiggum completed tickets
│   └── TEST-ALL-TOOLS.txt
├── .env                            # Environment variables (secrets, API keys)
├── .env.example                    # Environment sample (version 2)
├── .env.sample                     # Sample env file
├── extensions -> .pi/extensions     # Symlink to Pi extensions
├── .gitignore                      # Git ignore rules
├── .gitmodules                     # Git submodules config
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
├── package-lock.json               # NPM lockfile
├── pienv                           # Pi environment loader
├── PI-COMMANDS.md                  # Pi slash commands reference
├── pip/                            # Pip-related files
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
├── start-wayofpi-electron.sh       # Electron startup script
├── start-wayofpi-ui.sh -> start-wayofpi.sh  # Symlink to main startup script
├── storage/                        # Runtime storage
│   ├── config.json                 # Stored config
│   ├── last-extension.json         # Last used extension
│   └── sessions/                   # Session JSON files
├── SYSTEM.md                       # System architecture & conduct rules
├── test_agents.ts                  # Test agents file
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
├── agent/                          # Pi agent runtime
│   ├── auth.json                   # Authentication config
│   ├── bin/                       # Agent binaries/scripts
│   ├── extensions/                # Agent extensions
│   ├── git/                       # Git integration
│   ├── models.json                # Model configurations
│   ├── run-history.jsonl          # Run history log
│   ├── sessions/                  # Session files
│   └── settings.json             # Agent settings
├── agents/                         # Agent definitions
│   ├── fluent/                    # Fluent agent
│   ├── local/                     # Local agents
│   ├── protected/                 # Protected agents
│   ├── wop-agents/               # Way of Pi agents
│   ├── package.json               # Agents package config
│   └── teams.yaml                 # Agent teams config
├── agent-sessions/                # Legacy agent sessions
├── chronicle/                      # Chronicle ledger
│   └── ledger.json
├── damage-control-core/           # Damage control core files
│   ├── extension.ts
│   ├── file-system.ts
│   ├── package.json
│   └── README.md
├── damage-control-rules.yaml      # Damage control rules (symlink target)
├── db/                             # Database files
│   └── wayofpi.sqlite
├── extensions/                     # Pi extensions
│   ├── find-hardcoded-paths.sh
│   ├── fluent/                    # Fluent extensions
│   ├── local/                     # Local extensions
│   ├── protected/                 # Protected extensions
│   └── util/                      # Utility extensions
├── node_modules/                   # Node modules for .pi/
│   └── @walrus/                   # Walrus package
├── prompts/                        # Prompt templates
│   └── code-review.md
├── rules/                          # Pi rules
│   ├── developer-rules.md
│   ├── rules-commands.md
│   ├── scripts/                   # Rule scripts
│   └── securitypolicy.md
├── scripts/                        # Pi scripts
│   └── reorganize-pi-dev.sh
├── settings.json                   # Pi settings (extension enable/disable)
├── skills/                         # Skills (SKILL.md packages)
│   ├── bowser/                    # Bowser skill
│   ├── context-loader/            # Context loader skill
│   ├── find-skills/               # Find skills utility
│   ├── github/                    # GitHub skill
│   ├── indexer/                   # Indexer skill
│   ├── ralph/                     # Ralph skill
│   ├── rules-lookup/              # Rules lookup skill
│   └── tools/                     # Tools skill
├── storage/                        # Pi storage
│   └── sessions/                   # Session JSONs (gitignored)
└── themes/                         # UI themes
    ├── catppuccin-mocha.json
    ├── cyberpunk.json
    ├── dracula.json
    ├── everforest.json
    ├── gruvbox.json
    ├── midnight-ocean.json
    ├── nord.json
    ├── ocean-breeze.json
    ├── rose-pine.json
    ├── synthwave.json
    └── tokyo-night.json
```

---

## `docs/` Directory - Documentation

```
docs/
├── README.md                       # Docs hub: table of all documents
├── STRUCTURE.md                    # This file - full project structure
├── STARTUP_GUIDE.md                # Startup and usage guide
├── LOCAL_HOSTING.md                # Local and remote deployment guide
├── PRODUCTION_DELIVERY_PLAN.md     # Production delivery plan (desktop, cloud, self-host)
├── ARCHITECTURE_TARGET.md          # Target architecture documentation
├── UI_UX_WORKSPACE_PLAN.md         # Per-role workspace designs and wireframes
├── UI_UX_ROUTING_AND_HEADER.md     # Routing and header implementation plan
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
└── old/                            # Archived documentation
    ├── commands/
    │   └── REFERENCE.md            # Slash command reference
    ├── pi/                         # Pi-specific docs (archived)
    │   ├── AGENT_MEMORY.md
    │   ├── AGENTS.md
    │   ├── AGENT_TEAMS.md
    │   ├── all-shortcuts.md
    │   ├── CLAUDE_CODE_VS_PI_GAPS.md
    │   ├── COMPARISON.md
    │   ├── PI_LOCAL_AI.md
    │   ├── SKILLS.md
    │   └── TOOLS.md
    ├── specs/                      # Spec references (archived)
    │   ├── agent-forge.md
    │   ├── AGENTS.md
    │   ├── agent-workflow.md
    │   ├── damage-control.md
    │   ├── fd-intro.md
    │   ├── github-management.md
    │   └── pi-pi.md
    └── wayofpi/                    # Way of Pi product docs (archived)
        ├── CABA.md
        ├── WAY_OF_PI_INTRODUCTION.md
        ├── WOP_BUILD_PLAN_MODE.md
        ├── WOP_CLAW_MODE_PLAN.md
        ├── WOP_CLAW_UI_PLAN.md
        ├── WOP_CODE_EDITOR_LINE_NUMBERS.md
        ├── WOP_COMBINED_BUILD_TODO.md
        ├── WOP_EXTENSION_APPEARANCES_VIEWS_PLAN.md
        ├── WOP_GENERATED_FILES_AND_LINE_PARITY.md
        ├── WOP_MENU_BAR_BACKLOG.md
        ├── WOP_MOBILE_UI_PLAN.md
        ├── WOP_MODULAR_DOCKS_PLAN.md
        ├── WOP_MODULAR_DOCKS_RULE_FUNCTIONAL_PLAN.md
        ├── WOP_MULTI_AGENT_WEBSOCKET.md
        ├── WOP_NAMESPACE.md
        ├── WOP_NGROK.md
        ├── WOP_OPEN_TODOS.md
        ├── WOP_ORCHESTRATION_EXTENSIONS_PANEL.md
        ├── WOP_ORCHESTRATOR_VS_PI_DISPATCHER.md
        ├── WOP_PI_BACKEND_WIRING_PLAN.md
        ├── WOP_PI_TOKEN_CONTEXT_DISCIPLINE.md
        ├── WOP_PI_TOOLS_AND_ORCHESTRATOR_PARITY.md
        ├── WOP_PLANNING.md
        ├── WOP_PRODUCT_CAPABILITIES.md
        ├── WOP_PRODUCT_OVERVIEW.md
        ├── WOP_SAFE_CUSTOMIZATION.md
        ├── WOP_SIMPLE_UI_VIEWS.md
        ├── WOP_STANDALONE_SYSTEM_PLAN.md
        ├── WOP_TECHNICAL_UI.md
        ├── WOP_TELEGRAM_PLAN.md
        ├── WOP_UI_MANIFEST.md
        ├── WOP_UPSTREAM_SYNC.md
        └── WOP_WORKSPACE_AGENTS_UI_PLAN.md
```
---

## `plans/` Directory - Project Plans

```
plans/
├── README.md (in subdirs)
├── claw/                           # Claw-specific plans
│   └── pi-schedule-prompt-integration-spec.md
├── grid-chooser-fix/              # Grid chooser fix
│   └── grid-chooser-issue-plan.md
├── mobile/                         # Mobile implementation
│   ├── Comprehensive-Mobile-Implementation-Plan.md
│   └── README.md
├── old/                            # Archived plans
│   ├── ChatExplorer.md
│   ├── DOCUMENTATION_TRACKER.md
│   ├── EXTENSION_FIX_PLAN.md
│   ├── ModalDropdownFixPlan.md
│   ├── PI_CODING_AGENT_GUIDE.md
│   ├── PI_EXTENSION_STRATEGY_NEW.md
│   ├── PLAN-20250311-chat-image-clipboard.md
│   ├── PLAN-20250311-GIT-PUSH-SYSTEM-MARKUP.md
│   ├── PLAN-20250311-UI-fixes-updated.md
│   ├── PLAN-20260311-git-file-explorer-reset-issue.md
│   ├── PLAN-20260326-gh-management-tool.md
│   ├── PLAN-20260411-connect-telegram.md
│   ├── PLAN-20260412-herrmes-full-intergration.md
│   ├── PLAN-DOCS-UI.md
│   ├── PLAN-RALPH-TICKET-FUNCTION.md
│   ├── PTY_AUTO_START_INTEGRATION.md
│   ├── PTY_SERVER_AUTO_START_COMPLETE.md
│   ├── README_TERMINAL_PTY.md
│   ├── Sessionmemoryupdate.md
│   ├── session saver and compaction.md
│   ├── sqlmemoryplan.md
│   ├── System-Architecture.md
│   ├── TERMINAL_IMPLEMENTATION_SUMMARY.md
│   ├── TERMINAL_USAGE_GUIDE.md
│   └── TERMINAL_VIEW_FIX_DOCUMENTATION.md
├── pip/                            # Pip-specific plans
│   ├── ARCHITECTURE.md
│   ├── INTEGRATION.md
│   ├── README.md
│   └── TODO.md
├── pi/plans/                       # Pi-specific plans (legacy path)
│   ├── IMPLEMENTATION_STEPS.md
│   ├── Memory-Context-Management.md
│   └── PLAN_RULE_SYSTEM.md
├── productionready/                # Production readiness plans
│   ├── hosting/
│   │   └── URGENT_DEPLOY_CLIENT_DEMO.md
│   ├── investigation/
│   │   └── HERMES_PAGE_NOT_VISIBLE.md
│   └── reference/
│       ├── APPLICATION_LAUNCH_GUIDE.md
│       ├── GIT_WORKFLOW.md
│       ├── INDEX.md
│       ├── KANBAN_REUSE_PLAN.md
│       ├── PHASE1_IMPLEMENTATION.md
│       ├── PHASE_1_SECURITY_DATA_GUIDE.md
│       ├── PI_INTEGRATION_DOCKER_PLAN.md
│       ├── PI_VERSION_MANAGEMENT.md
│       ├── PRODUCTION_AUTH_TENANCY_WORKLEADER_ALIGNMENT.md
│       ├── PRODUCTION_READY_GUIDE.md
│       ├── SAFE_UPDATE_GUIDE.md
│       ├── TECH_STACK.md
│       └── TODO.md
├── projects/                       # Project-specific plans
│   ├── scout-findings-documentation.md
│   └── work-button-improvements/     # Planning docs only (implementation in apps/workerportal/)
│       ├── 01-PLAN.md
│       ├── 02-NAVIGATION-ARCHITECTURE.md
│       ├── 03-WORKER-PORTAL-DEMO-MODE.md
│       ├── 04_WHATSAPP_INTEGRATION_PLAN.md
│       ├── DEPLOYMENT.md
│       ├── IMPLEMENTATION-COMPLETE.md
│       ├── mobile/
│       │   └── RESPONSIVE-VIEW-SPEC.md
│       ├── NGROK_SETUP.md
│       ├── ref/                       # Reference docs
│       ├── TODO.md
│       └── VPS_SETUP.md
└── refactoring/                    # Refactoring plans
    ├── PHASE-1-COMPLETION.md
    ├── PLAN-20250311-app-component-split.md
    └── docs/components/
        ├── COMPONENT_DISPLAY_PLANNING.md
        └── verification/
            ├── COMPONENT_EXTRACTION_VERIFICATION.md
            └── components/menus/
                ├── EditMenu.tsx
                ├── FileMenu.tsx
                ├── GoMenu.tsx
                ├── RunMenu.tsx
                └── ViewMenu.tsx
```

---

## `ref/` Directory - Reference Implementations

```
ref/
├── agent-team.ts                  # Agent team reference implementation
├── calendar/                      # Calendar components
│   ├── CalendarGrid.tsx
│   ├── EventDetails.tsx
│   └── EventEditor.tsx
├── context-local-hints.ts          # Context hint utilities
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
├── kanban/                        # Kanban board components
│   ├── BoardDocsView.tsx
│   ├── BoardDriveView.tsx
│   ├── BoardMembers.tsx
│   ├── BoardSelector.tsx
│   ├── BoardSettingsModal.tsx
│   ├── CardView.tsx
│   ├── Kanban.tsx
│   ├── PushTaskListToKanbanModal.tsx
│   ├── PushToKanbanModal.tsx
│   └── PushWorkflowToKanbanModal.tsx
├── piwithstuff/                   # Reference Pi setup with stuff
│   ├── agent/sessions/            # Agent session configs
│   │   ├── .md
│   │   └── rules/README.md
│   ├── bin/                       # Shell scripts
│   │   ├── openai-filter-toggle.sh
│   │   └── toggle-filter.py
│   ├── .context/                  # Context state
│   │   └── session-state.json
│   ├── .env.sample
│   ├── .gitignore
│   ├── extensions/                # Extension implementations
│   │   ├── agent-chain.ts
│   │   ├── agent-team.ts
│   │   ├── cross-agent.ts
│   │   ├── damage-control.ts
│   │   ├── minimal.ts
│   │   ├── pi-pi.ts
│   │   ├── pure-focus.ts
│   │   ├── purpose-gate.ts
│   │   ├── session-replay.ts
│   │   ├── subagent-widget.ts
│   │   ├── system-select.ts
│   │   ├── theme-cycler.ts
│   │   ├── themeMap.ts
│   │   ├── tilldone.ts
│   │   ├── tool-counter.ts
│   │   └── tool-counter-widget.ts
│   ├── images/                    # Pi logos
│   │   ├── pi-logo.png
│   │   └── pi-logo.svg
│   ├── .pi/                       # Pi config (agents, docs, teams, etc.)
│   │   ├── agents/               # Agent definitions (yaml, md)
│   │   ├── agent-team.ts
│   │   ├── damage-control-rules.yaml
│   │   ├── docs/                 # Documentation
│   │   ├── .github/              # GitHub workflows
│   │   ├── planning/             # Planning docs
│   │   ├── README.md
│   │   ├── security-audit.log
│   │   ├── settings.json
│   │   ├── teams.yaml
│   │   └── themes/              # Theme files
│   ├── __pycache__/              # Python cache
│   ├── specs/                     # Spec files
│   │   ├── agent-forge.md
│   │   ├── agent-workflow.md
│   │   ├── damage-control.md
│   │   └── pi-pi.md
│   ├── state/                     # State files
│   │   ├── filter-instructions.txt
│   │   └── filter-status.json
│   ├── utils/                     # Python utilities
│   │   └── filter_models.py
│   ├── models.py, model_resolver.py, model_selector.py
│   ├── prompt_templates.py
│   ├── test_openai_model_filtering.py
│   ├── package.json, bun.lock, justfile
│   ├── readme.md, RESERVED_KEYS.md, THEME.md, TOOLS.md
│   └── pi-session-*.html          # Session replay HTML
├── session-memory.ts              # Session memory reference implementation
├── session-replay.ts              # Session replay reference
└── sub-agents/                    # Sub-agent definitions
    └── planner.md
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
├── host-for-demo.sh                       # Host Way of Pi for demo
├── import-domain-specialists.cjs           # Import domain specialists
├── init-project-local-pi-env.sh           # Init local Pi environment
├── install-ngrok-optional.sh               # Install ngrok (optional)
├── install.ps1                             # PowerShell install script
├── install-ppi-global.sh                   # Install ppi globally
├── install.sh                              # Install script
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

## Way of Pi Docs (Archived)

The `docs/wayofpi/` content has been moved to `docs/old/wayofpi/` for archival. See the `docs/` section above for current location.

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

*Generated: 2026-05-05 - Way of Pi Project Structure (updated to match current file system)*
