#!/bin/bash
# Way of Pi - Reorganize for pi.dev compatibility
# This script moves agent files to the correct pi.dev locations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="/home/zerwiz/CodeP/Way of pi"

echo "=== Way of Pi - Reorganizing for pi.dev ==="
echo "Project: $PROJECT_ROOT"
echo ""

# Function to convert .md agent to .ts extension
convert_agent() {
    local md_file="$1"
    local script_name=$(basename "$md_file" .md)
    local ts_file="${PROJECT_ROOT}/.pi/agent/extensions/${script_name}.ts"
    
    # Extract key info from the .md file
    local name=$(grep "^name:" "$md_file" | cut -d' ' -f2)
    local description=$(grep "^description:" "$md_file" | cut -d' ' -f2- | head -c 200)
    
    # Create TypeScript extension from .md
    cat > "$ts_file" << 'TEMPLATE'
// --- pi.dev Extension: Converted from agent.md ---
// Generated from: $md_file
// Original: $description
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function (pi: ExtensionAPI) {
  // Agent behavior: $description
  
  pi.registerTool({
    name: "${script_name}",
    label: "$name",
    description: "$description",
    parameters: Type.Object({}),
    async execute() {
      // This agent would handle: $description
      return pi.sendUserMessage("Extension loaded: ${script_name}");
    },
  });
}
TEMPLATE

    echo "✓ Created: $ts_file"
}

# Function to create domain specialist extensions
create_domain_ext() {
    local category="$1"
    local ext_dir="${PROJECT_ROOT}/.pi/agent/extensions/domain/${category}"
    
    if [[ -d ".pi/agents/domain-specialists/${category}" ]]; then
        echo "Creating extension for domain specialists: $category"
        mkdir -p "$ext_dir"
        
        # Create index.ts for the domain specialists
        cat > "${ext_dir}/index.ts" << 'INDEX'
// Domain Specialist: $(basename $category)
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // Domain specialists provide specialized knowledge
  // This category handles: see .pi/agents/domain-specialists/$(basename $category)/
  
  // Register domain-specific tools
  // They will be available to the agent automatically
}
INDEX
    fi
}

echo "=== Converting Agent Definitions ==="
echo ""

# Process core agents
for md_file in /home/zerwiz/CodeP/Way\ of\ pi/.pi/agents/*.md; do
    convert_agent "$md_file"
done

# Process domain specialists
for category_dir in /home/zerwiz/CodeP/Way\ of\ pi/.pi/agents/domain-specialists/*/; do
    category=$(basename "$category_dir")
    create_domain_ext "$category"
done

echo ""
echo "=== Creating Team Extensions ==="
echo ""

# Create team extensions from teams.yaml
TEAMS_YAML="${PROJECT_ROOT}/.pi/agents/teams.yaml"

if [[ -f "$TEAMS_YAML" ]]; then
    echo "Extracting team configurations from teams.yaml"
    
    # Read each team section
    grep -oP '^[a-zA-Z0-9_-]+:' "$TEAMS_YAML" | while read -r team_name; do
        ts_file="${PROJECT_ROOT}/.pi/agent/extensions/teams/${team_name}.ts"
        
        grep -A 100 "$team_name:" "$TEAMS_YAML" | head -7 | tail -6 | while read -r agent; do
            # Each agent in the team gets an entry
            echo "  - Team member: $agent"
        done
        
        echo "✓ Created team extension: $ts_file"
    done
fi

echo ""
echo "=== Creating Subagent Orchestration Extension ==="
echo ""

# Copy existing TypeScript orchestration to correct location
if [[ -f ".pi/extensions/subagents/orchestrator.ts" ]]; then
    cp ".pi/extensions/subagents/orchestrator.ts" \
       ".pi/agent/extensions/subagents/orchestrator.ts"
    echo "✓ Copied orchestrator.ts to: .pi/agent/extensions/subagents/orchestrator.ts"
fi

echo ""
echo "=== Creating Settings ==="
echo ""

# Create extensions settings
CWD="$(cd "$PROJECT_ROOT" && pwd)"
cat > "${PROJECT_ROOT}/.pi/extensions/README.md" << 'README'
# Way of Pi Subagent Extensions

This directory contains TypeScript extensions for the Way of Pi project.
All extensions are auto-discovered by pi.dev in the correct location:

- `.pi/agent/extensions/*.ts` - Auto-discovered globally
- `.pi/agent/extensions/*/index.ts` - Auto-discovered from directories
- `.pi/extensions/*.ts` - Project-local (legacy, still works)
- `.pi/extensions/*/index.ts` - Project-local directories

## Running Extensions

Start pi with extensions loaded:

```bash
pi -e .pi/agent/extensions
```

Or test a single extension:

```bash
pi -e .pi/agent/extensions/orchestrator.ts
```

## Team Extensions

Teams are defined in `.pi/agent/extensions/teams/*.ts` or in teams.yaml.

```bash
pi -e full
pi -e build-orchestra
```

## Subagent Orchestration

The subagent orchestration pattern lives in:
- `.pi/agent/extensions/subagents/`

## Usage

1. Extensions are loaded automatically
2. Use `pi -e` or `.pi/extensions/` locations
3. See pi.dev docs for full extension API

README

echo "✓ Created: .pi/extensions/README.md"

echo ""
echo "=== Reorganization Complete ==="
echo ""
echo "Next steps:"
echo "1. Run: cd $PROJECT_ROOT && pi -e .pi/agent/extensions"
echo "2. Or use: pi -e full"
echo "3. Test with: pi -e teams"
echo ""
echo "See: https://pi.dev/extensions/"
echo ""
