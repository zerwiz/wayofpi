set dotenv-load := true

default:
    @just --list

# g1

# 1. default pi
pi:
    pi

# 1b. Pi with model cycle: OpenRouter :free first, then OpenRouter paid, Ollama, OpenAI last
#     (Pi /model sorts providers A–Z so openai appears before openrouter; --models fixes Ctrl+P order.)
pi-cycle-or-free-first:
    pi --models "openrouter/google/gemma-3-4b-it:free,openrouter/google/gemma-3n-e2b-it:free,openrouter/meta-llama/llama-3.3-70b-instruct:free,openrouter/qwen/qwen3-4b:free,openrouter/openai/gpt-oss-20b:free,openrouter/google/gemini-3-flash-preview,openrouter/anthropic/claude-sonnet-4,ollama/qwen3.5:9b,openai/gpt-4o-mini"

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

# 10. Agent team: dispatcher orchestrator with team select and grid dashboard
ext-agent-team:
    pi -e extensions/agent-team.ts -e extensions/theme-cycler.ts

# 11. System select: /system to pick an agent persona as system prompt
ext-system-select:
    pi -e extensions/system-select.ts -e extensions/minimal.ts -e extensions/theme-cycler.ts

# 12. Launch with Damage-Control safety auditing
ext-damage-control:
    pi -e extensions/damage-control.ts -e extensions/minimal.ts -e extensions/theme-cycler.ts

# 13. Agent chain: sequential pipeline orchestrator
ext-agent-chain:
    pi -e extensions/agent-chain.ts -e extensions/theme-cycler.ts

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

# 23. Ralph: todo/inprogress/done ticket queue + ralph_queue_status + /ralph
ext-ralph:
    pi -e extensions/ralph.ts -e extensions/minimal.ts

# honcho / hermes (cross-session memory + orchestration)
honcho-up:
    cd "$HOME/honcho-server" && docker compose up -d database redis api deriver

honcho-up-api:
    cd "$HOME/honcho-server" && docker compose up -d database redis api

honcho-down:
    cd "$HOME/honcho-server" && docker compose down

honcho-status:
    curl -sS --connect-timeout 2 http://localhost:18000/ || true

hermes-status:
    "$HOME/.hermes/hermes-agent/venv/bin/hermes" status

hermes-honcho-status:
    "$HOME/.hermes/hermes-agent/venv/bin/hermes" honcho status

hermes-honcho-setup:
    "$HOME/.hermes/hermes-agent/venv/bin/hermes" honcho setup

# utils

# Symlink ppi / pi-e / ppi-* into ~/.local/bin (same as ./install-global at repo root)
install-global:
    @./scripts/install-ppi-global.sh

# pi-e: interactive multi-select for stacked `pi -e ...` in one session
#
# Use: `just pi-e`
# Input: numbers separated by space/comma (e.g. `2 4 18`) or `all`
pi-e:
    #!/usr/bin/env bash
    set -euo pipefail

    options=(
        "enable-playground-resources|__ENABLE_PLAYGROUND__"
        "pure-focus|extensions/pure-focus.ts"
        "minimal|extensions/minimal.ts"
        "theme-cycler|extensions/theme-cycler.ts"
        "cross-agent|extensions/cross-agent.ts"
        "purpose-gate|extensions/purpose-gate.ts"
        "tool-counter|extensions/tool-counter.ts"
        "tool-counter-widget|extensions/tool-counter-widget.ts"
        "subagent-widget|extensions/subagent-widget.ts"
        "tilldone|extensions/tilldone.ts"
        "agent-team|extensions/agent-team.ts"
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
    )

    echo "Pick one or more extensions to launch (stacked in a single Pi session)."
    echo "Enter numbers separated by space/comma (e.g. 1 3 18) or type 'all'."
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

    add_file() {
        local f="$1"
        if [[ -z "$f" ]]; then return; fi
        # Pseudo-option: enable this playground's resources (extensions/skills/prompts)
        # in the current project by writing .pi/settings.json (opt-in).
        if [[ "$f" == "__ENABLE_PLAYGROUND__" ]]; then
            "$HOME/.pi/scripts/enable-playground-in-project" "$PWD"
            return
        fi
        if [[ -z "${seen[$f]+x}" ]]; then
            seen["$f"]=1
            pi_args+=(-e "$f")
        fi
    }

    if [[ "${sel}" == "all" ]]; then
        for opt in "${options[@]}"; do
            IFS='|' read -r _label file <<< "$opt"
            add_file "$file"
        done
    else
        for token in $sel; do
            if [[ "$token" =~ ^[0-9]+$ ]]; then
                idx=$((token-1))
                if (( idx >= 0 && idx < ${#options[@]} )); then
                    IFS='|' read -r _label file <<< "${options[$idx]}"
                    add_file "$file"
                else
                    echo "Ignoring out-of-range selection: $token"
                fi
            else
                # Allow selecting by label (best-effort match)
                for opt in "${options[@]}"; do
                    IFS='|' read -r label file <<< "$opt"
                    if [[ "$label" == "$token" ]]; then
                        add_file "$file"
                        break
                    fi
                done
            fi
        done
    fi

    # If user didn't choose a base footer, default to `minimal` (unless they picked pure-focus).
    has_pure_focus=false
    for f in "${!seen[@]}"; do
        if [[ "$f" == "extensions/pure-focus.ts" ]]; then
            has_pure_focus=true
        fi
    done

    if ! $has_pure_focus; then
        add_file "extensions/minimal.ts"
    fi

    echo
    echo "Launching: pi ${pi_args[*]}"
    exec pi "${pi_args[@]}"

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
    just open agent-team theme-cycler
    just open system-select minimal theme-cycler
    just open damage-control minimal theme-cycler
    just open agent-chain theme-cycler
    just open pi-pi theme-cycler
    just open extension-picker minimal
    just open sessions/index minimal
    just open chronicle minimal
    just open agent-forge minimal
    just open dynamic-loader minimal
    just open ralph minimal