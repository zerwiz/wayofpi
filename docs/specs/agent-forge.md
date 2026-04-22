# Specification: Agent Forge (Evolutionary Tooling)

> **Status (v1 implemented):** Phase-1 code lives in `extensions/agent-forge.ts`. It registers LLM tools `forge_list` and `forge_create`, maintains `extensions/forge-registry.json`, and writes `extensions/forge-*.ts` modules. After creating a forge module, add a shim under `.pi/extensions/` and `/reload` so Pi loads the new default export (Pi does not hot-load extensions).

## 1. Overview
**Agent Forge** is an evolutionary extension for the Pi Coding Agent. It enables the agent to expand its own capabilities by dynamically generating, validating, and loading new TypeScript tools on demand. Instead of a static set of capabilities, Agent Forge turns the agent into a meta-developer that builds its own infrastructure.

## 2. Core Architecture

### 2.1 The Toolbox (v1)
- **`extensions/forge-<slug>.ts`**: Generated extension module (one `registerTool`, one string param `input`).
- **`extensions/forge-registry.json`**: Manifest listing forged tools (name, file path, description, `createdAt`).

> Spec-only (not v1): per-tool **`forge-<name>.json`** metadata files and **`before_agent_start`** auto-discovery.

### 2.2 Execution model (v1)
Forged tools are normal Pi extensions: after **`forge_create`**, add a **`.pi/extensions/`** shim + **`settings.json`** entry, then **`/reload`**. They run in-process like any other extension; there is no separate `jiti` “proxy execute” path in v1.

## 3. Core Tools (v1 — implemented names)

### 3.1 `forge_create` (implements “forge_tool” intent)
- Writes `extensions/forge-<slug>.ts` (default export registers one `registerTool` with one string parameter `input`).
- `executeBody` is pasted into the generated `execute` function; must return Pi tool result shape.
- Updates `forge-registry.json`.

### 3.2 Loading forged tools
- Pi loads extensions at startup only. After `forge_create`, add `.pi/extensions/forge-x.ts` shim + `settings.json` entry, then **`/reload`** (or restart Pi). There is no in-process `use_forge_tool` in v1.

### 3.3 `forge_list`
- Reads `forge-registry.json` and lists registered forged tools.

## 4. Safety & Self-Healing (spec; mostly not v1)
- **Sandboxing**, **`.bak` versioning**, and **jiti pre-flight / self-healing** are **not** implemented in v1; forged files are plain TypeScript the model must get right. Prefer small `executeBody` snippets and review before **`/reload`**.

## 5. UI Integration
- **Forge Widget**: A dedicated dashboard element showing:
    - **Evolved Tools**: Count of active tools.
    - **Last Action**: "Forged 'sql-explorer' 2m ago" or "Executing 'log-parser'...".
    - **Health**: Indicator of any tools currently in a "broken" state.
- **Status Bar**: Displays the "Forge Tier" (based on number of successful tools).

## 6. Template Structure
Every forged tool follows this mandatory structure:
```typescript
import { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export const metadata = {
  name: "custom_tool",
  description: "...",
  parameters: Type.Object({ ... })
};

export async function execute(params: any, pi:_EXTENSION_API, ctx: any) {
  // Logic goes here
}
```

## 7. Integration with Agent-Team
Agent Forge can act as a "specialist" within an `agent-team`. The "Engineer" agent in a team can use Agent Forge to build tools for the "Analyst" or "Builder" agents, creating a collaborative ecosystem of meta-programming.
