// === Researcher Subagent ===
// Location: .pi/agent/extensions/subagents/researcher.ts
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function (api: ExtensionAPI) {
  console.log("Researcher subagent loaded");

  api.registerTool({
    name: "subagent:researcher",
    label: "Researcher",
    description: "Search and synthesize knowledge from documentation",
    parameters: Type.Object({
      query: Type.String({ description: "What to research" }),
    }),
    async execute(toolCallId: string, params: { query: string }) {
      return {
        content: [
          { 
            type: "text", 
            text: `Researcher subagent ready!\n` +
                   `Query: ${params.query}\n` +
                   `Will search documentation, knowledge bases, and provide synthesized results.`
          }
        ],
        details: {
          query: params.query,
          status: "ready"
        }
      };
    },
  });
}