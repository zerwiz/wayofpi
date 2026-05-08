set dotenv-load := true

default:
    @just --list

# Way of Pi — upstream Pi (GitHub / npm) availability + optional doc mirror; see scripts/wop-upstream/README.md
wop-upstream-check:
    bun scripts/wop-pi-upstream.ts check

wop-upstream-sync *args:
    bun scripts/wop-pi-upstream.ts sync {{args}}

# Way of Pi web shell — Bun API + WebSocket (:3333) and Vite (:5173); same as apps/wayofpi-ui `npm run dev`
wayofpi-full:
    set -euo pipefail
    exec "{{justfile_directory()}}/start-wayofpi.sh --web"

# Way of Pi web shell in an Electron window (same stack as wayofpi-full; no default browser open)
wayofpi-electron:
    #!/usr/bin/env bash
    set -euo pipefail
    exec "{{justfile_directory()}}/start-wayofpi-electron.sh"

# g1

# Internal helper to run pi with the dynamic loader
# This ensures we only use ONE -e flag, which is more stable in 0.70.5
run-pi stack *args: pi-verify
    #!/usr/bin/env bash
    set -euo pipefail
    ROOT="{{justfile_directory()}}"
    export PI_STACK="{{ stack }}"
    export PI_CODING_AGENT_DIR="$ROOT/.pi/agent"
    # Always load playground .env
    if [[ -f "$ROOT/.env" ]]; then
        set -a
        source "$ROOT/.env"
        set +a
    fi
    exec "$ROOT/node_modules/.bin/pi" -e .pi/extensions/util/pi-loader.ts "$@"

# g1

# 1. default pi (always load playground .env so OPENROUTER_API_KEY is set)
pi *args:
    #!/usr/bin/env bash
    set -euo pipefail
    ROOT="{{justfile_directory()}}"
    export PI_CODING_AGENT_DIR="$ROOT/.pi/agent"
    if [[ -f "$ROOT/.env" ]]; then
        set -a
        source "$ROOT/.env"
        set +a
    fi
    exec "$ROOT/node_modules/.bin/pi" "$@"

# Verify pi version matches PI_PINNED_VERSION
pi-verify:
    @./scripts/pi-version-check.sh

# Reinstall pinned pi version to resolve conflicts/broken updates
pi-fix-version:
    #!/usr/bin/env bash
    set -euo pipefail
    ROOT="{{justfile_directory()}}"
    echo "Reinstalling project-local pi..."
    bun install
    echo "✅ Done. Local pi version:"
    "$ROOT/node_modules/.bin/pi" --version

# 1a. Standard Pi (upstream minimal harness): no project extension/skill/theme/prompt discovery — `scripts/pi-standard` (optional leading `.`)
pi-standard *args:
    #!/usr/bin/env bash
    set -euo pipefail
    ROOT="{{justfile_directory()}}"
    exec "$ROOT/scripts/pi-standard" "$@"

# 1b. Pi with model cycle: OpenRouter :free first, then OpenRouter paid, Ollama, OpenAI last
#     (Legacy hand-built list; prefer `pi-picker-ollama-free-or` for Ollama-first picker + Ctrl+P.)
pi-cycle-or-free-first:
    pi --models "openrouter/google/gemma-3-4b-it:free,openrouter/google/gemma-3n-e2b-it:free,openrouter/meta-llama/llama-3.3-70b-instruct:free,openrouter/qwen/qwen3-4b:free,openrouter/google/gemini-3-flash-preview,openrouter/anthropic/claude-sonnet-4,ollama/qwen3.5:9b"

# 1c. /model + Ctrl+P scoped to: Ollama (from agent/models.json) → OpenRouter :free → rest of OpenRouter from pi.config.json → OpenAI
pi-picker-ollama-free-or:
    pi --models "$(bun scripts/pi-models-scoped-priority.ts)"

# 2. Pure focus pi: strip footer and status line entirely
ext-pure-focus:
    @just run-pi "pure-focus"

# 3. Minimal pi: model name + 10-block context meter
ext-minimal:
    @just run-pi "minimal,theme-cycler"

# 4. Cross-agent pi: load commands from .claude/, .gemini/, .codex/ dirs
ext-cross-agent:
    @just run-pi "cross-agent,minimal"

# 5. Purpose gate pi: declare intent before working, persistent widget, focus the system prompt on the ONE PURPOSE for this agent
ext-purpose-gate:
    @just run-pi "purpose-gate,minimal"

# 6. Customized footer pi: Tool counter, model, branch, cwd, cost, etc.
ext-tool-counter:
    @just run-pi "tool-counter"

# 7. Tool counter widget: tool call counts in a below-editor widget
ext-tool-counter-widget:
    @just run-pi "tool-counter-widget,minimal"

# 8. Subagent widget: /sub <task> with live streaming progress
ext-subagent-widget:
    @just run-pi "subagent-widget,pure-focus,theme-cycler"

# 9. TillDone: task-driven discipline — define tasks before working
ext-tilldone:
    @just run-pi "tilldone,theme-cycler"

# g2

# 10. Agent team: dispatcher orchestrator with team select and grid dashboard (incl. build-orchestra roster)
ext-agent-team:
    @just run-pi "agent-team,theme-cycler"

# 10b. Builder-orchestra dispatcher (separate -e entry from ext-agent-team — starts on team build-orchestra)
ext-builder-team:
    @just run-pi "session-memory,agent-team,theme-cycler"

# 11. System select: /system to pick an agent persona as system prompt
ext-system-select:
    @just run-pi "system-select,minimal,theme-cycler"

# 12. Launch with Damage-Control safety auditing
ext-damage-control:
    @just run-pi "damage-control,minimal,theme-cycler"

# 13. Agent chain: sequential pipeline orchestrator
ext-agent-chain:
    @just run-pi "session-memory,agent-chain,theme-cycler"


# g3

# 14. Pi Pi: meta-agent that builds Pi agents with parallel expert research
ext-pi-pi:
    @just run-pi "pi-pi,theme-cycler"

# ext

# 15. Session Replay: scrollable timeline overlay of session history (legit)
ext-session-replay:
    @just run-pi "session-replay,minimal"

# 16. Theme cycler: Ctrl+X forward, Ctrl+Q backward, /theme picker
ext-theme-cycler:
    @just run-pi "theme-cycler,minimal"

# 17. Extension picker: /extensions from installed Pi packages; /remember /memory
ext-extension-picker:
    @just run-pi "extension-picker,minimal"

# 18. Session memory: reinject recent chat into system prompt (/sessionmemory)
ext-session-memory:
    @just run-pi "session-memory,minimal"

# 18b. Session memory + local context awareness only (+ minimal). For agent-team / agent-chain use those recipes (they include this stack).
ext-context-local-hints:
    @just run-pi "session-memory,context-local-hints,minimal"

# 19. Session saver: auto-save + /save /list /show /load
ext-session-saver:
    @just run-pi "sessions,minimal"

# 20. Chronicle: workflow ledger + chronicle_* tools + /chronicle
ext-chronicle:
    @just run-pi "chronicle,minimal"

# 21. Agent Forge: forge_list / forge_create (writes extensions/forge-*.ts)
ext-agent-forge:
    @just run-pi "agent-forge,minimal"

# 22. Dynamic loader: /extension-hint for pi -e stacks
ext-dynamic-loader:
    @just run-pi "dynamic-loader,minimal"

# 23. Pi doctor: /doctor health checks (bun, configs, extensions, skills)
ext-pi-doctor:
    @just run-pi "pi-doctor,minimal"

# 24. Web tools: web_search + web_fetch (Brave optional; pair with web-searcher agent)
ext-web-tools:
    @just run-pi "web-tools,minimal"

# 25. Ralph: todo/inprogress/done ticket queue + ralph_queue_status + /ralph
ext-ralph:
    @just run-pi "ralph,minimal"

# 26. Sync agile extensions from PIP reference
pip-sync:
    @echo "🔄 Syncing agile extensions from PIP..."
    @mkdir -p .pi/extensions/fluent
    @cp -v /home/zerwiz/pip/ref/extensions/*.ts .pi/extensions/fluent/ || true
    @echo "✅ PIP sync complete"

# Hermes (Honcho stack / UI live in ~/honcho-server — see that repo’s justfile + scripts/install-honcho-bin.sh)
hermes-status:
    "$HOME/.hermes/hermes-agent/venv/bin/hermes" status

hermes-honcho-status:
    "$HOME/.hermes/hermes-agent/venv/bin/hermes" honcho status

hermes-honcho-setup:
    "$HOME/.hermes/hermes-agent/venv/bin/hermes" honcho setup

# utils

# Repo path doctor: stale .playground-from, absolute paths in settings*.json (pass --fix to rewrite)
doctor *args:
    ./doctor.sh {{args}}

# Probe OS/CPU and installed tools; print install hints (pass flags by running the script directly)
bootstrap-wayofpi:
    @./scripts/bootstrap-wayofpi-environment.sh

# Optional ngrok agent: print apt/brew commands (pass --install / -y to the script for Debian/Ubuntu apt). See scripts/README.md
install-ngrok-optional:
    @./scripts/install-ngrok-optional.sh

# pi-e: interactive multi-select for stacked `pi -e ...` in one session
#
# Use: `just pi-e`
# Input: numbers separated by space/comma (e.g. `1 3 17`) or `all`
# Keep "agent-team" and "agent-team (build-orchestra)" as consecutive options so the builder line is always N+1 after regular agent-team (e.g. 12 then 13 with the current list).
pi-e:
    #!/usr/bin/env bash
    set -euo pipefail
    PLAYGROUND_ROOT="{{justfile_directory()}}"
    PROJECT_DIR="${PI_E_PROJECT_DIR:-$PWD}"

    options=(
        "enable-playground FULL (all playground extensions + skills/themes — busy UI)|__ENABLE_PLAYGROUND__"
        "project-local .pi + playground agents/skills/themes (extensions[] empty — stack via menu)|__PROJECT_LOCAL_PI__"
        "pure-focus|pure-focus"
        "minimal|minimal"
        "theme-cycler|theme-cycler"
        "cross-agent|cross-agent"
        "purpose-gate|purpose-gate"
        "tool-counter|tool-counter"
        "tool-counter-widget|tool-counter-widget"
        "subagent-widget|subagent-widget"
        "tilldone|tilldone"
        "agent-team|agent-team"
        "agent-team (build-orchestra)|agent-team-build-orchestra"
        "system-select|system-select"
        "damage-control|damage-control"
        "agent-chain|agent-chain"
        "pi-pi|pi-pi"
        "session-replay|session-replay"
        "extension-picker|extension-picker"
        "session-memory|session-memory"
        "session-saver|sessions"
        "chronicle|chronicle"
        "agent-forge|agent-forge"
        "dynamic-loader|dynamic-loader"
        "pi-doctor|pi-doctor"
    )

    echo "Pick one or more items (stacked in one Pi session)."
    echo "  1 = FULL playground (writes/merges settings; full extensions[] only if you pick 1 and/or 2 alone)"
    echo "  2 = project-scoped (wired agents/skills; stack extensions from menu lines 3+)"
    echo "Enter numbers separated by space/comma (e.g. 1  or  2 12 5) or type 'all'. Greedy digit split (e.g. 112 -> 11,2)."
    echo "(Options 1–2 apply to: $PROJECT_DIR — set PI_E_PROJECT_DIR if you ran plain just pi-e.)"
    echo

    for i in "${!options[@]}"; do
        n=$((i+1))
        IFS='|' read -r label file <<< "${options[$i]}"
        echo "  $n) $label -> $file"
    done

    echo
    read -r -p "Selection: " sel
    sel="${sel//,/ }"
    sel="$(echo "$sel" | xargs || true)"

    if [[ -z "${sel}" ]]; then
        echo "No selection. Exiting."
        exit 1
    fi

    declare -A seen=()
    pi_stack=()
    LINK_SELECTED=0
    PLAYGROUND_FULL_ENABLE=0
    HAD_MENU_EXTENSION=0

    add_ext() {
        local e="$1"
        if [[ -z "$e" ]]; then return; fi
        if [[ "$e" == "__ENABLE_PLAYGROUND__" ]]; then
            "$PLAYGROUND_ROOT/scripts/enable-playground-in-project" "$PROJECT_DIR"
            LINK_SELECTED=1
            PLAYGROUND_FULL_ENABLE=1
            return
        fi
        if [[ "$e" == "__PROJECT_LOCAL_PI__" ]]; then
            "$PLAYGROUND_ROOT/scripts/init-project-local-pi-env.sh" "$PROJECT_DIR" "$PLAYGROUND_ROOT"
            LINK_SELECTED=1
            return
        fi
        if [[ -z "${seen[$e]+x}" ]]; then
            seen["$e"]=1
            pi_stack+=("$e")
        fi
    }

    if [[ "${sel}" == "all" ]]; then
        HAD_MENU_EXTENSION=1
        for opt in "${options[@]}"; do
            IFS='|' read -r _label file <<< "$opt"
            [[ "$file" == __* ]] && continue
            add_ext "$file"
        done
    else
        n_opts="${#options[@]}"
        EXPAND="$PLAYGROUND_ROOT/scripts/pi-e-expand-selection.py"
        for token in $sel; do
            if [[ "$token" =~ ^[0-9]+$ ]]; then
                while IFS= read -r num; do
                    [[ -z "$num" ]] && continue
                    if (( num >= 3 )); then
                        HAD_MENU_EXTENSION=1
                    fi
                    idx=$((num - 1))
                    if (( idx >= 0 && idx < n_opts )); then
                        IFS='|' read -r _label file <<< "${options[$idx]}"
                        add_ext "$file"
                    else
                        echo "Ignoring out-of-range selection: $num"
                    fi
                done < <(python3 "$EXPAND" "$n_opts" "$token")
            else
                for opt in "${options[@]}"; do
                    IFS='|' read -r label file <<< "$opt"
                    if [[ "$label" == "$token" ]]; then
                        if [[ "$file" != __* ]]; then
                            HAD_MENU_EXTENSION=1
                        fi
                        add_ext "$file"
                        break
                    fi
                done
            fi
        done
    fi

    # agent-team / agent-chain: prepend session-memory + context-local-hints if missing.
    if [[ -n "${seen[agent-team]+x}" || -n "${seen[agent-team-build-orchestra]+x}" || -n "${seen[agent-chain]+x}" ]]; then
        if [[ -z "${seen[session-memory]+x}" ]]; then
            pi_stack=("session-memory" "${pi_stack[@]}")
            seen["session-memory"]=1
        fi
        if [[ -z "${seen[context-local-hints]+x}" ]]; then
            # (Note: context-local-hints usually follows session-memory)
            pi_stack=("session-memory" "context-local-hints" "${pi_stack[@]}")
            seen["context-local-hints"]=1
        fi
    fi

    # If user didn't choose a base footer, default to `minimal` unless an extension
    # already brings its own chrome.
    has_pure_focus=false
    has_agent_team=false
    [[ -n "${seen[pure-focus]+x}" ]] && has_pure_focus=true
    [[ -n "${seen[agent-team]+x}" || -n "${seen[agent-team-build-orchestra]+x}" ]] && has_agent_team=true

    if [[ "$PLAYGROUND_FULL_ENABLE" == "1" && "$HAD_MENU_EXTENSION" == "0" ]]; then
        :
    elif ! $has_pure_focus && ! $has_agent_team; then
        if [[ -z "${seen[minimal]+x}" ]]; then
             pi_stack+=("minimal")
        fi
    fi

    stack_str=$(IFS=,; echo "${pi_stack[*]}")
    echo "Launching from $PROJECT_DIR with stack: $stack_str"
    export PI_STACK="$stack_str"
    exec "$PLAYGROUND_ROOT/scripts/pi-launch-from-project.sh" "$PROJECT_DIR" "$PLAYGROUND_ROOT" -e .pi/extensions/util/pi-loader.ts


# Open pi with one or more stacked extensions in a new terminal: just open minimal tool-counter
open +exts:
    #!/usr/bin/env bash
    args=""
    for ext in {{exts}}; do
        args="$args -e extensions/$ext.ts"
    done
    cmd="cd '{{justfile_directory()}}' && pi$args"
    escaped="${cmd//\\/\\\\}"
    escaped="${escaped//\"/\\\"}"
    osascript -e "tell application \"Terminal\" to do script \"$escaped\""

# Open every extension in its own terminal window
all:
    # Interactive multi-select; launches one stacked Pi session in this terminal.
    just pi-e

all-open:
    # Old behavior: open every extension in its own terminal window (macOS Terminal via osascript).
    just open pi
    just open pure-focus
    just open minimal theme-cycler
    just open cross-agent minimal
    just open purpose-gate minimal
    just open tool-counter
    just open tool-counter-widget minimal
    just open subagent-widget pure-focus theme-cycler
    just open tilldone theme-cycler
    just open session-memory context-local-hints agent-team theme-cycler
    just open session-memory context-local-hints agent-team-build-orchestra theme-cycler
    just open system-select minimal theme-cycler
    just open damage-control minimal theme-cycler
    just open session-memory context-local-hints agent-chain theme-cycler
    just open pi-pi theme-cycler
    just open extension-picker minimal
    just open sessions/index minimal
    just open chronicle minimal
    just open agent-forge minimal
    just open dynamic-loader minimal
    just open pi-doctor minimal
    just open ralph minimal
