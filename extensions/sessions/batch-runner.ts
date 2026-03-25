import type { Extension } from "@mariozechner/pi-coding-agent"

export const batchRunner: Extension = {
  name: "batch-runner",
  description: "A batch command execution assistant for testing",
  tools: {},
  events: [
    {
      pattern: "message/*",
      handler: (event) => {
        if (event.type !== "message" || !event.payload) return

        const content = typeof event.payload === "string" ? event.payload : ""
        if (!content.trim()) return

        // Show simple execution status
        event.reply({
          content: `Batch runner: received message: ${content}`,
        })
      },
    },
  ],
}
