set dotenv-load := true

default:
    @just --list

# Way of Pi — upstream Pi (GitHub / npm) availability + optional doc mirror; see scripts/wop-upstream/README.md
wop-upstream-check:
    bun scripts/wop-pi-upstream.ts check

wop-upstream-sync *args:
    bun scripts/wop-pi-upstream.ts sync {{args}}

# g1

# 1. default pi (always load playground .env so OPENROUTER_API_KEY is set)
pi:
    #!/usr/bin/env bash
    set -euo pipefail
    ROOT="{{justfile_directory()}}"
    if [[ -f "$ROOT/.env" ]]; then
        set -a
        # shellcheck source=/dev/null
        source "$ROOT/.env"
        set +a
    fi
    exec pi "$@"

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
    pi -e extensions/pure-focus.ts

# 3. Minimal pi: model name + 10-block context meter
ext-minimal:
    pi -e extensions/minimal.ts -e extensions/theme-cycler.ts

# 4. Cross-agent pi: load commands from .claude/, .gemini/, .codex/ dirs
ext-cross-agent:
    pi -e extensions/cross-agent.ts -e extensions/minimal.ts

# 5. Purpose gate pi: declare intent before working, persistent widget, focus the system prompt on the ONE PURPOSE for this agent
ext-purpose-gate:
    pi -e extensions/purpose-gate.ts -e extensions/minimal.ts

# 6. Customized footer pi: Tool counter, model, branch, cwd, cost, etc.
ext-tool-counter:
    pi -e extensions/tool-counter.ts

# 7. Tool counter widget: tool call counts in a below-editor widget
ext-tool-counter-widget:
    pi -e extensions/tool-counter-widget.ts -e extensions/minimal.ts

# 8. Subagent widget: /sub <task> with live streaming progress
ext-subagent-widget:
    pi -e extensions/subagent-widget.ts -e extensions/pure-focus.ts -e extensions/theme-cycler.ts

# 9. TillDone: task-driven discipline — define tasks before working
ext-tilldone:
    pi -e extensions/tilldone.ts -e extensions/theme-cycler.ts

#g2

# 10. Agent team: dispatcher orchestrator with team select and grid dashboard (incl. build-orchestra roster)
ext-agent-team:
    pi -e extensions/session-memory.ts -e extensions/context-local-hints.ts -e extensions/agent-team.ts -e extensions/theme-cycler.ts

# 10b. Builder-orchestra dispatcher (separate -e entry from ext-agent-team — starts on team build-orchestra)
ext-builder-team:
    pi -e extensions/session-memory.ts -e extensions/context-local-hints.ts -e extensions/agent-team-build-orchestra.ts -e extensions/theme-cycler.ts

# 11. System select: /system to pick an agent persona as system prompt
ext-system-select:
    pi -e extensions/system-select.ts -e extensions/minimal.ts -e extensions/theme-cycler.ts

# 12. Launch with Damage-Control safety auditing
ext-damage-control:
    pi -e extensions/damage-control.ts -e extensions/minimal.ts -e extensions/theme-cycler.ts

# 13. Agent chain: sequential pipeline orchestrator
ext-agent-chain:
    pi -e extensions/session-memory.ts -e extensions/context-local-hints.ts -e extensions/agent-chain.ts -e extensions/theme-cycler.ts

#g3

# 14. Pi Pi: meta-agent that builds Pi agents with parallel expert research
ext-pi-pi:
    pi -e extensions/pi-pi.ts -e extensions/theme-cycler.ts

#ext

# 15. Session Replay: scrollable timeline overlay of session history (legit)
ext-session-replay:
    pi -e extensions/session-replay.ts -e extensions/minimal.ts

# 16. Theme cycler: Ctrl+X forward, Ctrl+Q backward, /theme picker
ext-theme-cycler:
    pi -e extensions/theme-cycler.ts -e extensions/minimal.ts

# 17. Extension picker: /extensions from installed Pi packages; /remember /memory
ext-extension-picker:
    pi -e extensions/extension-picker.ts -e extensions/minimal.ts

# 18. Session memory: reinject recent chat into system prompt (/sessionmemory)
ext-session-memory:
	pi -e extensions/session-memory.ts -e extensions/minimal.ts

# 18b. Session memory + local context awareness only (+ minimal). For agent-team / agent-chain use those recipes (they include this stack).
ext-context-local-hints:
	pi -e extensions/session-memory.ts -e extensions/context-local-hints.ts -e extensions/minimal.ts

# 19. Session saver: auto-save + /save /list /show /load
ext-session-saver:
    pi -e extensions/sessions/index.ts -e extensions/minimal.ts

# 20. Chronicle: workflow ledger + chronicle_* tools + /chronicle
ext-chronicle:
    pi -e extensions/chronicle.ts -e extensions/minimal.ts

# 21. Agent Forge: forge_list / forge_create (writes extensions/forge-*.ts)
ext-agent-forge:
    pi -e extensions/agent-forge.ts -e extensions/minimal.ts

# 22. Dynamic loader: /extension-hint for pi -e stacks
ext-dynamic-loader:
    pi -e extensions/dynamic-loader.ts -e extensions/minimal.ts

# 23. Pi doctor: /doctor health checks (bun, configs, extensions, skills)
ext-pi-doctor:
    pi -e extensions/pi-doctor.ts -e extensions/minimal.ts

# 24. Web tools: web_search + web_fetch (Brave optional; pair with web-searcher agent)
ext-web-tools:
    pi -e extensions/web-tools.ts -e extensions/minimal.ts

# 25. Ralph: todo/inprogress/done ticket queue + ralph_queue_status + /ralph
ext-ralph:
    pi -e extensions/ralph.ts -e extensions/minimal.ts

# Hermes (Honcho stack / UI live in ~/honcho-server — see that repo’s justfile + scripts/install-honcho-bin.sh)
hermes-status:
    "$HOME/.hermes/hermes-agent/venv/bin/hermes" status

hermes-honcho-status:
    "$HOME/.hermes/hermes-agent/venv/bin/hermes" honcho status

hermes-honcho-setup:
    "$HOME/.hermes/hermes-agent/venv/bin/hermes" honcho setup

# utils

# Ensure OpenRouter `:free` entries are grouped before other OpenRouter rows in pi.config.json
normalize-pi-config-models:
    python3 scripts/normalize-pi-config-model-order.py

# Symlink ppi / pi-e / ppi-* into ~/.local/bin (same as ./install-global at repo root)
install-global:
    @./scripts/install-ppi-global.sh

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
        "pure-focus|extensions/pure-focus.ts"
        "minimal|extensions/minimal.ts"
        "theme-cycler|extensions/theme-cycler.ts"
        "cross-agent|extensions/cross-agent.ts"
        "purpose-gate|extensions/purpose-gate.ts"
        "tool-counter|extensions/tool-counter.ts"
        "tool-counter-widget|extensions/tool-counter-widget.ts"
        "subagent-widget|extensions/subagent-widget.ts"
        "tilldone|extensions/tilldone.ts"
        # Adjacent: standard dispatcher first, builder-orchestra next (do not insert other menu lines between these two).
        "agent-team|extensions/agent-team.ts"
        "agent-team (build-orchestra)|extensions/agent-team-build-orchestra.ts"
        "system-select|extensions/system-select.ts"
        "damage-control|extensions/damage-control.ts"
        "agent-chain|extensions/agent-chain.ts"
        "pi-pi|extensions/pi-pi.ts"
        "session-replay|extensions/session-replay.ts"
        "extension-picker|extensions/extension-picker.ts"
        "session-memory|extensions/session-memory.ts"
        "session-saver|extensions/sessions/index.ts"
        "chronicle|extensions/chronicle.ts"
        "agent-forge|extensions/agent-forge.ts"
        "dynamic-loader|extensions/dynamic-loader.ts"
        "pi-doctor|extensions/pi-doctor.ts"
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
    pi_args=()
    LINK_SELECTED=0
    PLAYGROUND_FULL_ENABLE=0
    # Any menu line 3+ (real extension) or `all` — Pi should load only stacked -e, not full JSON.
    HAD_MENU_EXTENSION=0

    add_file() {
        local f="$1"
        if [[ -z "$f" ]]; then return; fi
        # Pseudo-option: enable this playground's resources (extensions/skills/prompts)
        # in the current project by writing .pi/settings.json (opt-in).
        if [[ "$f" == "__ENABLE_PLAYGROUND__" ]]; then
            "$PLAYGROUND_ROOT/scripts/enable-playground-in-project" "$PROJECT_DIR"
            LINK_SELECTED=1
            PLAYGROUND_FULL_ENABLE=1
            return
        fi
        if [[ "$f" == "__PROJECT_LOCAL_PI__" ]]; then
            "$PLAYGROUND_ROOT/scripts/init-project-local-pi-env.sh" "$PROJECT_DIR" "$PLAYGROUND_ROOT"
            LINK_SELECTED=1
            return
        fi
        if [[ -z "${seen[$f]+x}" ]]; then
            seen["$f"]=1
            pi_args+=(-e "$f")
        fi
    }

    if [[ "${sel}" == "all" ]]; then
        HAD_MENU_EXTENSION=1
        for opt in "${options[@]}"; do
            IFS='|' read -r _label file <<< "$opt"
            [[ "$file" == __* ]] && continue
            add_file "$file"
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
                        add_file "$file"
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
                        add_file "$file"
                        break
                    fi
                done
            fi
        done
    fi

    # agent-team / agent-chain: prepend session-memory + context-local-hints if missing.
    if [[ -n "${seen[extensions/agent-team.ts]+x}" || -n "${seen[extensions/agent-team-build-orchestra.ts]+x}" || -n "${seen[extensions/agent-chain.ts]+x}" ]]; then
        prepend=()
        if [[ -z "${seen[extensions/session-memory.ts]+x}" ]]; then
            prepend+=(-e "extensions/session-memory.ts")
            seen["extensions/session-memory.ts"]=1
        fi
        if [[ -z "${seen[extensions/context-local-hints.ts]+x}" ]]; then
            prepend+=(-e "extensions/context-local-hints.ts")
            seen["extensions/context-local-hints.ts"]=1
        fi
        if [[ ${#prepend[@]} -gt 0 ]]; then
            pi_args=("${prepend[@]}" "${pi_args[@]}")
        fi
    fi

    # If user didn't choose a base footer, default to `minimal` unless an extension
    # already brings its own chrome (pure-focus hides chrome; agent-team is grid UI).
    has_pure_focus=false
    has_agent_team=false
    for f in "${!seen[@]}"; do
        if [[ "$f" == "extensions/pure-focus.ts" ]]; then
            has_pure_focus=true
        fi
        if [[ "$f" == "extensions/agent-team.ts" || "$f" == "extensions/agent-team-build-orchestra.ts" ]]; then
            has_agent_team=true
        fi
    done

    # Option 1 only (no menu extension lines): JSON already lists extensions — skip auto minimal.
    # Option 1 + extension picks (e.g. 1 12): use CLI stack only; auto minimal unless pure-focus / agent-team.
    if [[ "$PLAYGROUND_FULL_ENABLE" == "1" && "$HAD_MENU_EXTENSION" == "0" ]]; then
        :
    elif ! $has_pure_focus && ! $has_agent_team; then
        add_file "extensions/minimal.ts"
    fi

    # Keep JSON extensions[] only for "setup only": 1 and/or 2 with no menu line 3+.
    # 1 + 12 → clear for this run (link/settings on disk, but Pi loads only -e). PIE_KEEP_* overrides.
    if [[ "${PIE_KEEP_SETTINGS_EXTENSIONS:-0}" == "1" ]]; then
        export PIE_CLEAR_SETTINGS_EXTENSIONS=0
    elif [[ "$PLAYGROUND_FULL_ENABLE" == "1" && "$HAD_MENU_EXTENSION" == "0" ]]; then
        export PIE_CLEAR_SETTINGS_EXTENSIONS=0
    else
        export PIE_CLEAR_SETTINGS_EXTENSIONS=1
    fi

    # Run Pi in PROJECT_DIR with absolute -e paths; when playground link (option 1 or 2) ran,
    # default to shadowing ./tools for this session so upstream Pi skips legacy-tools nag.
    if [[ "$LINK_SELECTED" == 1 ]]; then
        export PI_SHADOW_LEGACY_PROJECT_TOOLS="${PI_SHADOW_LEGACY_PROJECT_TOOLS:-1}"
    fi
    echo
    if [[ "$PIE_CLEAR_SETTINGS_EXTENSIONS" == 1 ]]; then
        if [[ "$PLAYGROUND_FULL_ENABLE" == "1" ]]; then
            echo "FULL setup on disk, but you picked extension lines — only your -e stack loads this run (extensions[] cleared until exit)."
        else
            echo "Project-scoped: ignoring extensions[] in .pi/settings.json for this run (restored on exit) — only your -e list loads."
        fi
    elif [[ "${PIE_KEEP_SETTINGS_EXTENSIONS:-0}" == "1" ]]; then
        echo "PIE_KEEP_SETTINGS_EXTENSIONS=1: merging extensions[] from .pi/settings.json with your -e list."
    elif [[ "$PLAYGROUND_FULL_ENABLE" == "1" ]]; then
        echo "FULL link only (no menu extension lines 3+): using extensions[] from .pi/settings.json (full playground)."
    fi
    echo "Launching from $PROJECT_DIR: pi ${pi_args[*]}"
    exec "$PLAYGROUND_ROOT/scripts/pi-launch-from-project.sh" "$PROJECT_DIR" "$PLAYGROUND_ROOT" "${pi_args[@]}"

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