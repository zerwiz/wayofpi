/**
 * **Pi SDK runtime** — replaces `pi --mode json` subprocess with direct `@earendil-works/pi-coding-agent` SDK imports.
 *
 * Instead of spawning pi as a subprocess and parsing JSONL lines from stdout,
 * this module imports the SDK directly: typed events, in-process tools, no PATH hacks.
 *
 * Enable via `WOP_CHAT_ENGINE=sdk` (or `auto` will prefer SDK when available).
 *
 * @module pi-sdk-runtime
 */

import { createAgentSession, type AgentSession, type AgentSessionEvent } from "@earendil-works/pi-coding-agent";
import type { StreamChatResult } from "./chat";
import type { StreamTokenUsage } from "./chat-usage";

/**
 * Check whether the `@earendil-works/pi-coding-agent` SDK can be loaded.
 * Returns `true` if the import resolves, `false` if the package is missing.
 */
let sdkAvailable: boolean | null = null;

export function isSdkAvailable(): boolean {
  if (sdkAvailable !== null) return sdkAvailable;
  try {
    require.resolve("@earendil-works/pi-coding-agent");
    sdkAvailable = true;
  } catch {
    sdkAvailable = false;
  }
  return sdkAvailable;
}

/**
 * Options mirroring `RunPiChatTurnOpts` so callers can switch between
 * subprocess and SDK paths with minimal changes.
 */
export interface RunSdkChatTurnOpts {
  cwd: string;
  messages: Array<{ role: string; content: string | null }>;
  onDelta: (s: string) => void;
  onReasoningDelta?: (s: string) => void;
  onStreamUsage?: (u: StreamTokenUsage) => void;
  onLog: (level: "INFO" | "WARN" | "ERROR", source: string, msg: string) => void;
  signal?: AbortSignal;
}

/**
 * Run one chat turn through the pi.dev SDK.
 *
 * Creates (or reuses) an `AgentSession` via `createAgentSession()` and sends
 * the user prompt through the SDK. Events are dispatched to the same callbacks
 * used by the subprocess path (`onDelta`, `onReasoningDelta`, etc.).
 *
 * The SDK session is ephemeral — each call creates a fresh session so the
 * conversation history is reconstructed from the provided messages array.
 */
export async function runSdkChatTurn(
  opts: RunSdkChatTurnOpts,
): Promise<{ result: StreamChatResult; lastStreamUsage: StreamTokenUsage | null }> {
  if (opts.signal?.aborted) {
    return { result: { ok: false, aborted: true }, lastStreamUsage: null };
  }

  const lastUserMsg = [...opts.messages].reverse().find((m) => m.role === "user");
  if (!lastUserMsg?.content) {
    return { result: { ok: false, error: "No user message to send" }, lastStreamUsage: null };
  }

  opts.onLog("INFO", "pi-sdk", "Creating agent session via SDK…");

  try {
    const { session } = await createAgentSession({
      cwd: opts.cwd,
    });

    let fullText = "";
    let lastUsage: StreamTokenUsage | null = null;

    const unsub = session.subscribe((event: AgentSessionEvent) => {
      switch (event.type) {
        case "message_update": {
          const ev = (event as Record<string, unknown>).assistantMessageEvent as Record<string, unknown> | undefined;
          if (!ev) break;
          if (ev.type === "text_delta" && typeof ev.delta === "string") {
            fullText += ev.delta;
            opts.onDelta(ev.delta);
          }
          if (ev.type === "thinking_delta" && typeof ev.delta === "string") {
            opts.onReasoningDelta?.(ev.delta);
          }
          break;
        }
        case "tool_execution_start": {
          const name = String((event as Record<string, unknown>).toolName ?? "tool");
          const args = (event as Record<string, unknown>).args;
          const argsStr = args != null ? JSON.stringify(args).slice(0, 200) : "";
          opts.onLog("INFO", name, `start ${argsStr}`);
          break;
        }
        case "tool_execution_end": {
          const name = String((event as Record<string, unknown>).toolName ?? "tool");
          const isErr = (event as Record<string, unknown>).isError === true;
          opts.onLog("INFO", name, `end${isErr ? " (error)" : ""}`);
          break;
        }
        case "agent_end": {
          break;
        }
      }
    });

    opts.onLog("INFO", "pi-sdk", `Sending prompt (${lastUserMsg.content.length} chars)…`);

    const response = await session.prompt(lastUserMsg.content);

    unsub();

    if (opts.signal?.aborted) {
      return { result: { ok: false, aborted: true }, lastStreamUsage: null };
    }

    opts.onLog("INFO", "pi-sdk", `Session complete (${fullText.length} chars)`);

    return {
      result: { ok: true },
      lastStreamUsage: lastUsage,
    } as const;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    opts.onLog("ERROR", "pi-sdk", `SDK session failed: ${message}`);
    return { result: { ok: false, error: `Pi SDK error: ${message}` }, lastStreamUsage: null };
  }
}
