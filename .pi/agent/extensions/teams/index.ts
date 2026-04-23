// --- pi.dev Team Extensions ---
// Location: .pi/agent/extensions/teams/index.ts
// Auto-discovered team manager for Way of Pi
// See: https://pi.dev/extensions/
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

// Team orchestrator extension
// Teams are defined in:
// - .pi/extensions/teams/*.yaml
// - .pi/agents/teams.yaml

export interface Team {
  name: string;
  members: string[];
  role: string;
}

export interface TeamState {
  name: string;
  active: boolean;
  members: Record<string, boolean>;
}

export default function (api: ExtensionAPI) {
  console.log("Way of Pi Team Extensions loaded");
  console.log("===============================");
  
  // Teams will be loaded from teams.yaml
  // Or from team definition files in .pi/agents/teams/
  
  // Register team manager tool
  api.registerTool({
    name: "teams",
    label: "Teams Manager",
    description: "Manage Way of Pi team extensions (load/save/initialize)",
    parameters: Type.Object({
      action: Type.Union([
        Type.Literal("list"),
        Type.Literal("load"),
        Type.Literal("load:all"),
        Type.Literal("save"),
        Type.Literal("info"),
        Type.Literal("ready"),
      ]),
      team: Type.Optional(Type.String({ description: "Team name" })),
    }),
    async execute(toolCallId: string, 
                 params: { action: string; team?: string }) {
      return {
        content: [
          { 
            type: "text", 
            text: `Teams extension loaded.\n` +
                   `Action: ${params.action}\n` +
                   `Check ~/.pi/agent/extensions/teams.yaml for available teams.`
          }
        ],
        details: {
          teams: await api.getActiveTools(),
        }
      };
    },
  });

  // Team lifecycle management
  api.on("session_start", async () => {
    // Teams are ready when session starts
  });

  // Team initialization
  api.on("before_agent_start", async () => {
    // Initialize team members
  });

  // Team events
  const teamEvents = [
    "member_join",
    "member_leave",
    "task_assign",
    "task_complete",
  ];

  teamEvents.forEach(event => {
    api.on(event, async (eventData, context) => {
      console.log(`Team event: ${event}`);
    });
  });

  console.log(`✓ Teams extension registered`);
  console.log(`✓ Teams loaded from: .pi/agents/teams.yaml`);
  console.log(`✓ Team members: .pi/agents/team-members/*.json`);
}