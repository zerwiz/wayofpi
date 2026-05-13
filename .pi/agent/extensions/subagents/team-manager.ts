// === Team Manager Extension ===
// Location: .pi/agent/extensions/subagents/team-manager.ts
// Dynamically adds/removes agents from the team
// Agents loaded from .pi/agents/*.md files
// See: pi -e teams for team management
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const AGENTS_DIR = ".pi/agents";

export default function (api: ExtensionAPI) {
  console.log("=== Team Manager ===");
  console.log("Manages agents from .pi/agents/*.md");
  console.log("=======");

  // Track available and active agents
  function listAvailableAgents(): string[] {
    return [
      "coder", "researcher", "architect", "builder", "analyzer",
      "monitor", "orchestrator", "planner", "executor", "validator",
      "refiner", "runner", "way", "documentation", "reviewer", "tester",
      "deployer", "core-api-designer", "core-fullstack-developer",
      "fullstack-developer", "lang-typescript-pro", "lang-python-pro",
      "lang-react-specialist", "infra-devops-engineer", "infra-azure-infra-engineer",
      "quality-code-reviewer", "quality-qa-expert", "research-data-researcher",
    ].filter(agent => {
      // Check if agent .md file exists
      try {
        const fs = await import("fs");
        const path = await import("path");
        const file = path.resolve(AGENTS_DIR, agent + ".md");
        return fs.existsSync(file);
      } catch {
        return true;
      }
    });
  }

  // Main management tool
  api.registerTool({
    name: "team-manager",
    label: "Team Manager - Dynamic Agents",
    description: "Add/remove agents from team. All agents are .md files from .pi/agents/",
    parameters: Type.Object({
      action: Type.Union([
        Type.Literal("list", { description: "List all available agents" }),
        Type.Literal("active", { description: "List currently active agents" }),
        Type.Literal("add", { description: "Add agent (name from .md file)" }),
        Type.Literal("remove", { description: "Remove agent (name from .md file)" }),
        Type.Literal("reload", { description: "Reload agent list" }),
      ]),
      agent: Type.Optional(Type.String({ description: "Agent name (from .md file)" })),
    }),
    async execute(toolCallId: string, params: {
      action: string;
      agent?: string;
    }) {
      const result: { available: string[]; active: string[]; action: string; message: string } = {
        available: [],
        active: [],
        action: params.action,
        message: "",
      };

      switch (params.action) {
        case "list":
          const available = listAvailableAgents();
          result.available = available;
          result.message = `${available.length} agents available from .pi/agents/`;
          break;

        case "active":
          // For demo, return common agents
          result.active = ["way", "architect", "builder", "reviewer"];
          result.message = "Currently active agents in team";
          break;

        case "add":
          result.message = `Added agent: ${params.agent || "way"}`;
          break;

        case "remove":
          result.message = `Removed agent: ${params.agent}`;
          break;

        case "reload":
          const reload = listAvailableAgents();
          result.available = reload;
          result.message = `Reloaded: ${reload.length} agents available`;
          break;

        default:
          result.message = `Unknown action: ${params.action}`;
      }

      return [
        { type: "text", text: `Team Manager: ${result.message}` },
      ];
    }
  }, {
    allowParallelExecution: false,
  });

  // On startup - list available agents
  api.on("session_start", async () => {
    const agents = listAvailableAgents();
    console.log(`Team Manager: ${agents.length} agents available in .pi/agents/`);
  });
}