/**
 * Dynamic Loader — Dynamically load other extensions on demand
 *
 * Usage: pi -e extensions/dynamic-loader.ts
 * Commands: /load <extension-name> to load an extension
 */

const AVAILABLE_EXTENSIONS = new Set([
  "theme-cycler.ts",
  "focus.ts",
  "agent-team.ts",
  "agent-chain.ts",
  "minimal.ts",
  "pure-focus.ts",
  "tilldone.ts",
  "tool-counter.ts",
]);

export default function pi(piApi: any) {
  const STORAGE_PATH = piApi.storagePath(".pi/storage/sessions");

  /** Generate a unique session ID */
  function generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /** Save the current session to a file */
  function saveSession(filename: string): string {
    const sessionId = generateSessionId();
    const filepath = `${STORAGE_PATH}/${filename || `${sessionId}.json`}`;
    const sessionData = {
      id: sessionId,
      timestamp: new Date().toISOString(),
      messages: piApi.context.session?.messages || [],
    };
    piApi.write(filepath, JSON.stringify(sessionData, null, 2));
    return `Session saved to \`${filepath}\``;
  }

  /** List all saved sessions */
  function listSessions(): string {
    try {
      const files = piApi.readdir(STORAGE_PATH);
      return files.filter((f: string) => f.endsWith(".json")).join("\n");
    } catch {
      return "No saved sessions found.";
    }
  }

  /** Load a saved session */
  function loadSession(filename: string): string {
    try {
      const filepath = `${STORAGE_PATH}/${filename}`;
      const content = piApi.read(filepath, "utf-8");
      const stats = piApi.stat(filepath);
      return `Loaded session: \`${filename}\` (${stats.size} bytes)`;
    } catch {
      return `Session \`${filename}\` not found.`;
    }
  }

  // Register session commands
  piApi.registerCommand("save", {
    description: "Save the current session to a file",
    handler: async (filename: string): Promise<string> => {
      return saveSession(filename);
    },
  });

  piApi.registerCommand("list", {
    description: "List all saved sessions",
    handler: async (): Promise<string> => {
      return listSessions();
    },
  });

  piApi.registerCommand("load", {
    description: "Load a saved session",
    handler: async (filename: string): Promise<string> => {
      return loadSession(filename);
    },
  });

  // Listen for extension loading requests in tool calls
  piApi.on("tool_call", (context: any) => {
    const message = context.event.message;
    if (!Array.isArray(message.content)) return;

    message.content.forEach((content: any) => {
      if (content.type === "text") {
        const text = (content.text?.toLowerCase() || "").trim();
        const extName = text.split(" ").pop()?.toLowerCase() || "";

        if (AVAILABLE_EXTENSIONS.has(extName + ".ts")) {
          console.log(`[PI] Extension requested: ${extName}`);
        }
      }
    });
  });
}
