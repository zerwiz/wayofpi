import type { ChatAssistantToolCall, ChatMessage, ChatRuntimeModel, StreamChatResult } from "./chat";
import { formatLlmHttpError, messagesToOpenAIFormat, ollamaErrorHint } from "./chat";
import { parseStreamUsage, type StreamTokenUsage } from "./chat-usage";
import { executeOrchestratorTool, orchestratorToolsForLlm } from "./orchestrator-tools-exec";
import { resolveOllamaHost, resolveOllamaModelDefault } from "./pi-ollama-env";

const MAX_ORCHESTRATOR_TOOL_STEPS = 14;

type StreamToolRound = {
	text: string;
	finishReason: string | null;
	toolCalls: ChatAssistantToolCall[] | null;
	usage: StreamTokenUsage | null;
};

function mergeUsage(a: StreamTokenUsage | null, b: StreamTokenUsage | null): StreamTokenUsage | null {
	if (!a) return b;
	if (!b) return a;
	return {
		promptTokens: a.promptTokens + b.promptTokens,
		completionTokens: a.completionTokens + b.completionTokens,
	};
}

async function consumeOpenAiToolStream(
	res: Response,
	onDelta: (t: string) => void,
	onLog: (level: "INFO" | "WARN" | "ERROR", source: string, msg: string) => void,
	opts?: { signal?: AbortSignal },
): Promise<StreamToolRound> {
	const signal = opts?.signal;
	const reader = res.body?.getReader();
	if (!reader) throw new Error("No response body");
	const dec = new TextDecoder();
	let buf = "";
	let text = "";
	let finishReason: string | null = null;
	const acc = new Map<number, { id?: string; name: string; arguments: string }>();
	let lastUsage: StreamTokenUsage | null = null;

	for (;;) {
		if (signal?.aborted) {
			try {
				await reader.cancel();
			} catch {
				/* ignore */
			}
			throw new DOMException("Aborted", "AbortError");
		}
		const { done, value } = await reader.read();
		if (done) break;
		buf += dec.decode(value, { stream: true });
		const lines = buf.split("\n");
		buf = lines.pop() || "";
		for (const line of lines) {
			const s = line.trim();
			if (!s.startsWith("data:")) continue;
			const data = s.slice(5).trim();
			if (data === "[DONE]") {
				return finalizeRound(text, finishReason, acc, lastUsage);
			}
			try {
				const json = JSON.parse(data) as {
					choices?: Array<{
						delta?: {
							content?: string | null;
							tool_calls?: Array<{
								index?: number;
								id?: string;
								type?: string;
								function?: { name?: string; arguments?: string };
							}>;
						};
						finish_reason?: string | null;
					}>;
				};
				const ch0 = json.choices?.[0];
				const d = ch0?.delta;
				if (typeof d?.content === "string" && d.content) {
					text += d.content;
					onDelta(d.content);
				}
				for (const tc of d?.tool_calls ?? []) {
					const idx = typeof tc.index === "number" ? tc.index : 0;
					let cell = acc.get(idx);
					if (!cell) {
						cell = { id: undefined, name: "", arguments: "" };
						acc.set(idx, cell);
					}
					if (tc.id) cell.id = tc.id;
					if (tc.function?.name) cell.name += tc.function.name;
					if (tc.function?.arguments) cell.arguments += tc.function.arguments;
				}
				if (ch0?.finish_reason) finishReason = ch0.finish_reason;
				const u = parseStreamUsage(json);
				if (u) lastUsage = u;
			} catch {
				onLog("WARN", "sse", "Bad chunk (orchestrator tools)");
			}
		}
	}
	return finalizeRound(text, finishReason, acc, lastUsage);
}

function finalizeRound(
	text: string,
	_finishReason: string | null,
	acc: Map<number, { id?: string; name: string; arguments: string }>,
	lastUsage: StreamTokenUsage | null,
): StreamToolRound {
	const sorted = [...acc.entries()].sort((a, b) => a[0] - b[0]);
	const toolCalls: ChatAssistantToolCall[] = sorted
		.map(([i, v]) => ({
			id: v.id || `call_${i}`,
			type: "function" as const,
			function: { name: v.name.trim(), arguments: v.arguments },
		}))
		.filter((t) => t.function.name.length > 0);

	/* If the model streamed any complete tool call objects, run them (even if finish_reason is missing). */
	const wantTools = toolCalls.length > 0;

	return {
		text,
		finishReason: _finishReason,
		toolCalls: wantTools ? toolCalls : null,
		usage: lastUsage,
	};
}

/**
 * Workspace chat: stream with Pi-shaped **read / list_dir / grep / write / bash** tool rounds when enabled (workspace-jailed).
 * Mutates `messages` by appending assistant + tool rows between the last user message and the final assistant reply.
 */
export async function runOrchestratorToolLoop(
	messages: ChatMessage[],
	onDelta: (text: string) => void,
	onLog: (level: "INFO" | "WARN" | "ERROR", source: string, msg: string) => void,
	runtime: ChatRuntimeModel | undefined,
	options: { signal?: AbortSignal; onStreamUsage?: (u: StreamTokenUsage) => void },
): Promise<{ result: StreamChatResult; lastStreamUsage: StreamTokenUsage | null; finalAssistantText: string }> {
	const signal = options.signal;
	const provider = (process.env.WOP_LLM_PROVIDER || "ollama").toLowerCase();
	const tools = orchestratorToolsForLlm();
	let mergedUsage: StreamTokenUsage | null = null;
	let finalAssistantText = "";

	const bumpUsage = (u: StreamTokenUsage | null) => {
		if (!u) return;
		mergedUsage = mergeUsage(mergedUsage, u);
		options.onStreamUsage?.(u);
	};

	onLog(
		"INFO",
		"chat",
		`Orchestrator tool loop (${provider}) — tools: ${tools.map((t) => t.function.name).join(", ")}`,
	);

	for (let step = 0; step < MAX_ORCHESTRATOR_TOOL_STEPS; step++) {
		let res: Response;

		if (provider === "openrouter") {
			const key = process.env.OPENROUTER_API_KEY?.trim();
			const model =
				runtime?.openrouterModel?.trim() || process.env.OPENROUTER_MODEL?.trim() || "openrouter/auto";
			if (!key) {
				return {
					result: { ok: false, error: "OPENROUTER_API_KEY is not set" },
					lastStreamUsage: mergedUsage,
					finalAssistantText,
				};
			}
			try {
				res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${key}`,
						"Content-Type": "application/json",
						"HTTP-Referer": process.env.WOP_OPENROUTER_REFERER || "https://wayofpi.local",
						"X-Title": "Way of Pi",
					},
					body: JSON.stringify({
						model,
						messages: messagesToOpenAIFormat(messages),
						stream: true,
						tools,
						tool_choice: "auto",
						stream_options: { include_usage: true },
					}),
					signal,
				});
			} catch (e) {
				if (signal?.aborted || (e instanceof Error && e.name === "AbortError")) {
					return { result: { ok: false, aborted: true }, lastStreamUsage: mergedUsage, finalAssistantText };
				}
				const message = e instanceof Error ? e.message : String(e);
				return { result: { ok: false, error: message }, lastStreamUsage: mergedUsage, finalAssistantText };
			}
			if (!res.ok) {
				const t = await res.text();
				return {
					result: { ok: false, error: formatLlmHttpError("OpenRouter", res.status, t) },
					lastStreamUsage: mergedUsage,
					finalAssistantText,
				};
			}
		} else if (provider === "ollama") {
			const host = (runtime?.ollamaHost || resolveOllamaHost()).replace(/\/$/, "");
			const model = runtime?.ollamaModel?.trim() || resolveOllamaModelDefault();
			const url = `${host}/v1/chat/completions`;
			const body: Record<string, unknown> = {
				model,
				messages: messagesToOpenAIFormat(messages),
				stream: true,
				tools,
				tool_choice: "auto",
				stream_options: { include_usage: true },
			};
			try {
				res = await fetch(url, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
					signal,
				});
			} catch (e) {
				if (signal?.aborted || (e instanceof Error && e.name === "AbortError")) {
					return { result: { ok: false, aborted: true }, lastStreamUsage: mergedUsage, finalAssistantText };
				}
				const message = e instanceof Error ? e.message : String(e);
				return { result: { ok: false, error: message }, lastStreamUsage: mergedUsage, finalAssistantText };
			}

			if (!res.ok && res.status === 400) {
				const t400 = await res.text();
				const low = t400.toLowerCase();
				if (low.includes("stream_options") || low.includes("unexpected field") || low.includes("unknown field")) {
					onLog("WARN", "ollama", "Retrying orchestrator request without stream_options.");
					delete body.stream_options;
					res = await fetch(url, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(body),
						signal,
					});
				} else if (low.includes("tool") || low.includes("function")) {
					return {
						result: {
							ok: false,
							error: `${formatLlmHttpError("Ollama", res.status, t400)} — Pick a tool-capable model, set WOP_ORCHESTRATOR_TOOLS=0, or use OpenRouter.`,
						},
						lastStreamUsage: mergedUsage,
						finalAssistantText,
					};
				} else {
					const detail = formatLlmHttpError("Ollama", res.status, t400);
					return {
						result: { ok: false, error: ollamaErrorHint(res.status, detail, model) },
						lastStreamUsage: mergedUsage,
						finalAssistantText,
					};
				}
			}

			if (!res.ok) {
				const t = await res.text();
				const detail = formatLlmHttpError("Ollama", res.status, t);
				return {
					result: { ok: false, error: ollamaErrorHint(res.status, detail, model) },
					lastStreamUsage: mergedUsage,
					finalAssistantText,
				};
			}
		} else {
			return {
				result: {
					ok: false,
					error: `WOP_LLM_PROVIDER="${provider}" — orchestrator tools need ollama or openrouter.`,
				},
				lastStreamUsage: mergedUsage,
				finalAssistantText,
			};
		}

		let round: StreamToolRound;
		try {
			round = await consumeOpenAiToolStream(res, onDelta, onLog, { signal });
		} catch (e) {
			if (signal?.aborted || (e instanceof Error && e.name === "AbortError")) {
				return { result: { ok: false, aborted: true }, lastStreamUsage: mergedUsage, finalAssistantText };
			}
			throw e;
		}

		bumpUsage(round.usage);

		if (round.toolCalls && round.toolCalls.length > 0) {
			messages.push({
				role: "assistant",
				content: round.text.trim().length > 0 ? round.text : null,
				tool_calls: round.toolCalls,
			});
			for (const tc of round.toolCalls) {
				const out = await executeOrchestratorTool(tc.function.name, tc.function.arguments);
				messages.push({
					role: "tool",
					tool_call_id: tc.id,
					content: out,
					name: tc.function.name,
				});
			}
			continue;
		}

		finalAssistantText = round.text;
		messages.push({ role: "assistant", content: round.text });
		return { result: { ok: true }, lastStreamUsage: mergedUsage, finalAssistantText };
	}

	return {
		result: { ok: false, error: "Orchestrator tool loop exceeded max steps." },
		lastStreamUsage: mergedUsage,
		finalAssistantText,
	};
}
