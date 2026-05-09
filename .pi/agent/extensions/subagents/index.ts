// --- pi.dev Subagent Orchestration Extension ---
// Location: .pi/agent/extensions/subagents/index.ts
// Auto-discovered by pi.dev for subagent orchestration
// See: https://pi.dev/extensions/
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";

// Type definitions for subagent orchestration
export interface SubAgentState {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'thinking' | 'executing' | 'completed' | 'error';
  currentTask: string | null;
}

export interface OrchestratorState {
  status: 'idle' | 'thinking' | 'executing' | 'completed';
  mainGoal: string | null;
  logs: {
    timestamp: number;
    message: string;
  }[];
  agents: Record<string, SubAgentState>;
}

export default function (api: ExtensionAPI) {
  console.log("Initializing Way of Pi subagents...");

  // Planner subagent - breaks down goals into sub-tasks
  api.registerTool({
    name: "subagent:planner",
    label: "Planner",
    description: "Break down complex goals into executable sub-tasks",
    parameters: Type.Object({
      goal: Type.String({ description: "The goal to decompose" }),
    }),
    async execute(toolCallId: string, params: { goal: string }) {
      const steps = [
        "Analyze the goal requirements",
        "Identify knowledge gaps",
        "Break into sub-tasks by domain",
        "Estimate resources needed",
        "Create execution plan"
      ];

      return {
        content: [
          { 
            type: "text", 
            text: `Planner ready! Goal to decompose: ${params.goal}\n` +
                   `Available sub-agents will be spawned as needed.\n` +
                   `Sub-tasks will be created with domain-specific expertise.`
          }
        ],
        details: {
          plannedSteps: steps
        }
      };
    }
  });

  // Researcher subagent - domain-specific knowledge
  api.registerTool({
    name: "subagent:researcher",
    label: "Researcher",
    description: "Search and synthesize knowledge from documentation",
    parameters: Type.Object({
      query: Type.String({ description: "What to research" }),
      domains: Type.Optional(Type.Array(Type.String())),
    }),
    async execute(toolCallId: string, params: { query: string; domains?: string[] }) {
      return {
        content: [
          { 
            type: "text", 
            text: `Researcher ready! Query: ${params.query}\n` +
                   `Domains: ${params.domains?.join(", ") || "all domains"}\n` +
                   `Will search documentation and knowledge bases.`
          }
        ],
        details: {
          domains: params.domains || []
        }
      };
    }
  });

  // Coder subagent - code generation and refactoring
  api.registerTool({
    name: "subagent:coder",
    label: "Coder",
    description: "Generate, refactor, and test code",
    parameters: Type.Object({
      task: Type.String({ description: "Coding task" }),
      context: Type.Optional(Type.String({ description: "Files or code context" })),
    }),
    async execute(toolCallId: string, params: { task: string; context?: string }) {
      return {
        content: [
          { 
            type: "text", 
            text: `Coder ready! Task: ${params.task}\n` +
                   `Context: ${params.context || "all files"}\n` +
                   `Will generate and test code.`
          }
        ],
        details: {
          task: params.task
        }
      };
    }
  });

  // Executor subagent - run scripts and commands
  api.registerTool({
    name: "subagent:executor",
    label: "Executor",
    description: "Run commands and scripts in environment",
    parameters: Type.Object({
      command: Type.String({ description: "Command to execute" }),
      timeout: Type.Optional(Type.Integer({ default: 60, description: "Execution timeout in seconds" })),
    }),
    async execute(toolCallId: string, params: { command: string; timeout?: number }) {
      return {
        content: [
          { 
            type: "text", 
            text: `Executor ready! Command: ${params.command}\n` +
                   `Timeout: ${params.timeout || 60}s`
          }
        ],
        details: {
          command: params.command
        }
      };
    }
  });

  // Reviewer subagent - code review and quality checks
  api.registerTool({
    name: "subagent:reviewer",
    label: "Reviewer",
    description: "Review code and provide feedback",
    parameters: Type.Object({
      content: Type.String({ description: "Code to review" }),
      style: Type.Optional(Type.String({ description: "Review style" })),
    }),
    async execute(toolCallId: string, params: { content: string; style?: string }) {
      return {
        content: [
          { 
            type: "text", 
            text: `Reviewer ready! Analyzing: ${params.content.length} chars\n` +
                   `Style: ${params.style || "standard"}`
          }
        ],
        details: {
          style: params.style
        }
      };
    }
  });

  // Orchestrator manages subagent lifecycle
  api.registerTool({
    name: "subagent:orchestrator",
    label: "Orchestrator",
    description: "Manage subagent spawning and coordination",
    parameters: Type.Object({
      action: Type.Union([
        Type.Literal("spawn"),
        Type.Literal("reassign"),
        Type.Literal("terminate"),
      ]),
      agentId: Type.Optional(Type.String({ description: "Agent ID to target" })),
    }),
    async execute(toolCallId: string, params: { action: string; agentId?: string }) {
      return {
        content: [
          { 
            type: "text", 
            text: `Orchestrator ready! Action: ${params.action}\n` +
                   `Agent ID: ${params.agentId || "any available"}`
          }
        ],
        details: {
          action: params.action
        }
      };
    }
  });

  // State persistence for subagents
  api.on("session_start", async () => {
    // Reconstruct subagent state when session starts
  });

  // Subagent events
  api.on("message_start", async () => {
    // Log subagent activity
  });

  console.log("Subagents ready!");
}