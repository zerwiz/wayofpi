// === Code Coder Subagent ===
// Location: .pi/agent/extensions/subagents/coder.ts
// Wraps the .md agent definition
// See: pi.dev for more
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function (api: ExtensionAPI) {
  console.log("Code Coder subagent loaded");

  api.registerTool({
    name: "subagent:coder",
    label: "Code Coder",
    description: "Generate, refactor, and test code",
    parameters: Type.Object({
      task: Type.String({ description: "What code generation task?" }),
      context: Type.Optional(Type.String({ description: "Files or code context" })),
    }),
    async execute(toolCallId: string, params: { task: string; context?: string }) {
      // Code Coder behavior
      // 1. Analyze requirements
      // 2. Generate code
      // 3. Write tests
      // 4. Run tests
      
      return {
        content: [
          { 
            type: "text", 
            text: `Code Coder subagent ready!\n` +
                   `Task: ${params.task}\n` +
                   `Context: ${params.context || "all files"}\n` +
                   `Will generate, test, and refactor code.`
          }
        ],
        details: {
          task: params.task,
          status: "ready"
        }
      };
    },
  });
}