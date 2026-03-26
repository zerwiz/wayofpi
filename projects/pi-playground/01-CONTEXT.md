# Context

This file describes the **stack** and **structure** of the `/home/zerwiz/.pi` project playground.

---

## Repository / paths

- **Root:** `/home/zerwiz/.pi`

## Stack

- **Runtime:** Bun ≥ 1.3.2
- **Package manager:** Bun
- **Task runner:** `just` (via `justfile`)
- **Pi CLI:** `pi` binary

## Commands

```bash
# Install dependencies
bun install

# Run Pi (plain)
pi

# Run with just recipe
just ext-minimal

# Open (new terminal with extensions)
just open

# Launch extension stack
pi -e extensions/minimal.ts -e extensions/cross-agent.ts

# Just recipes
just
#  Use just to list / run recipes
```

### Using Scripts

```bash
# Use ppi (just recipe launcher)
ppi

# Launch extension
ppi ext-purpose-gate

# Install global PATH
./install-global

# Use pi-with-env for bare pi command
./scripts/pi-with-env
pi
```

## Environment

The playground does not auto-source `.env`. Use one of:

- `source .env && pi`
- `just pi` (auto-loads `.env` via dotenv settings)
- `./scripts/pi-with-env`

**Env vars (names only, no values):**
- `OPENAI_API_KEY` — OpenAI API
- `ANTHROPIC_API_KEY` — Anthropic API
- `GEMINI_API_KEY` — Google Gemini API
- `OPENROUTER_API_KEY` — OpenRouter API
- `FIRECRAWL_API_KEY` — Firecrawl for web crawling

---

## Integration points

- **Ollama API:** `http://localhost:11434/v1` (local models)
- **OpenRouter API:** `https://openrouter.ai/api/v1` (via `OPENROUTER_API_KEY`)
- **Port:** `11434` — Ollama LLM server
- **Tools:** `read`, `bash`, `edit`, `write`, `grep`, and ext-tool `dispatch_agent`

---

## Top-level directories

| Directory | Contents |
|-----------|---------|
| `extensions/` | TypeScript extension source files |
| `.pi/` | Pi runtime config, agents, skills, themes, rules |
| `agent/` | Pi agent install (AGENTS.md, sessions, models.json) |
| `projects/` | Per-codebase docs (copy from `_template/`) |
| `docs/` | Human documentation guides |
| `specs/` | Extension specifications |
| `.cursor/rules/` | Cursor AI rules |
| `scripts/` | Shell scripts for `ppi` launcher |
| `images/` | Static assets |
| `justfile` | Just recipes |
| `README.md` | Main playground readme |
| `CHANGELOG.md` | Playground changes |
| `TOOL.md` | Core tool signatures |
| `THEME.md` | Color language reference |
| `COMPARISON.md` | Pi vs Claude Code comparison |

---

## Important files

- `.pi/settings.json` — Loaded extensions, theme, prompts
- `.pi/damage-control-rules.yaml` — Safety rules
- `.pi/agents/teams.yaml` — Team definitions
- `.pi/agents/agent-chain.yaml` — Sequential pipelines
- `justfile` — Just recipes

---

## Gitignored subtrees (from `.gitignore`)

- `.pi/agent-sessions/` — Ephemeral subagent sessions
- `.pi/storage/` — Session-saver snapshots
- `.pi/chronicle/` — Chronicle ledger
- `agent/sessions/` — Chat transcripts
- `.env` — API keys (use `.env.sample`)

---

## Key Paths Summary

```
/home/zerwiz/.pi/
├── extensions/               # Extension source files (*.ts)
├── .pi/                      # Pi workspace
│   ├── agents/              # Agent definitions (*.md)
│   ├── agents/pi-pi/        # pi-pi meta-agent experts
│   ├── skills/              # Skills (SKILL.md)
│   ├── themes/              # JSON theme configs
│   ├── extensions/          # Shim files
│   ├── agent-sessions/      # Gitignored
│   ├── storage/             # Gitignored
│   ├── chronicle/           # Gitignored
│   ├── damage-control-rules.yaml
│   └── settings.json
├── agent/                   # Pi agent install
│   ├── AGENTS.md
│   ├── models.json
│   └── sessions/
├── projects/                # Per-codebase docs
│   ├── _template/          # Template files
│   ├── pi-playground/     # This folder
│   └── <slug>/             # New projects
├── docs/                    # Documentation guides
├── specs/                   # Feature specs
├── .cursor/rules/          # Cursor AI rules
├── scripts/                # Shell scripts
├── justfile                # Just recipes
├── README.md               # Main readme
├── CHANGELOG.md            # Changelog
└── THEME.md                # Theme reference
```
