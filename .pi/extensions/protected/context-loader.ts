/**
 * @name context-loader
 * @description Automatically provides access to AGENTS.md project layout
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

const AGENTS_PATH = "/home/zerwiz/CodeP/Way of pi/AGENTS.md";

export default function(pi: ExtensionAPI) {
  const contextTool = {
    name: "context",
    description: "Read the AGENTS.md project layout file and return the content. Use this to get project structure and available skills.",
    parameters: {},
    async execute() {
      const response = await pi.filesystem.read(AGENTS_PATH);
      return {
        layout: "AGENTS.md project layout context is now available",
        path: AGENTS_PATH,
        loaded: true,
        content: response.content 
      };
    },
    responseFormat: "markdown"
  };

  try {
    pi.registerTool(contextTool);
  } catch (e) {
    console.log("[context-loader] Tool registration skipped (possibly already registered)");
  }
}
