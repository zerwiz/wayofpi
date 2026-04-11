export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
	role: ChatRole;
	content: string;
}

function nowTime(): string {
	return new Date().toISOString().split("T")[1]?.slice(0, 12) ?? "";
}

export interface ChatRuntimeModel {
	ollamaHost?: string;
	ollamaModel?: string;
	openrouterModel?: string;
}

export type StreamChatResult = { ok: true } | { ok: false; error: string } | { ok: false; aborted: true };

export async function streamChatCompletion(
	messages: ChatMessage[],
	onDelta: (text: string) => void,
	onLog: (level: "INFO" | "WARN" | "ERROR", source: string, msg: string) => void,
	runtime?: ChatRuntimeModel,
	options?: { signal?: AbortSignal },
): Promise<StreamChatResult> {
	const signal = options?.signal;
	const provider = (process.env.WOP_LLM_PROVIDER || "ollama").toLowerCase();
	onLog("INFO", "chat", `Provider: ${provider}`);

	if (provider === "openrouter") {
		const key = process.env.OPENROUTER_API_KEY?.trim();
		const model =
			runtime?.openrouterModel?.trim() || process.env.OPENROUTER_MODEL?.trim() || "openrouter/auto";
		if (!key) return { ok: false, error: "OPENROUTER_API_KEY is not set" };
		onLog("INFO", "openrouter", `Model: ${model}`);
		let res: Response;
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
					messages,
					stream: true,
				}),
				signal,
			});
		} catch (e) {
			if (signal?.aborted || (e instanceof Error && e.name === "AbortError")) {
				return { ok: false, aborted: true };
			}
			const message = e instanceof Error ? e.message : String(e);
			return { ok: false, error: message };
		}
		if (!res.ok) {
			const t = await res.text();
			return { ok: false, error: `OpenRouter ${res.status}: ${t.slice(0, 500)}` };
		}
		try {
			await parseOpenAIStyleSse(res, onDelta, onLog, signal);
		} catch (e) {
			if (signal?.aborted || (e instanceof Error && e.name === "AbortError")) {
				return { ok: false, aborted: true };
			}
			throw e;
		}
		return { ok: true };
	}

	if (provider !== "ollama") {
		return {
			ok: false,
			error: `WOP_LLM_PROVIDER="${provider}" is not supported by Way of Pi web chat. Set it to "ollama" or "openrouter" on the server, or use Pi TUI for other backends.`,
		};
	}

	/* ollama OpenAI-compatible */
	const host = (runtime?.ollamaHost || process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/$/, "");
	const model = runtime?.ollamaModel?.trim() || process.env.OLLAMA_MODEL?.trim() || "llama3";
	onLog("INFO", "ollama", `${host} model=${model}`);
	let res: Response;
	try {
		res = await fetch(`${host}/v1/chat/completions`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model,
				messages,
				stream: true,
			}),
			signal,
		});
	} catch (e) {
		if (signal?.aborted || (e instanceof Error && e.name === "AbortError")) {
			return { ok: false, aborted: true };
		}
		const message = e instanceof Error ? e.message : String(e);
		return { ok: false, error: message };
	}
	if (!res.ok) {
		const t = await res.text();
		return { ok: false, error: `Ollama ${res.status}: ${t.slice(0, 500)}` };
	}
	try {
		await parseOpenAIStyleSse(res, onDelta, onLog, signal);
	} catch (e) {
		if (signal?.aborted || (e instanceof Error && e.name === "AbortError")) {
			return { ok: false, aborted: true };
		}
		throw e;
	}
	return { ok: true };
}

async function parseOpenAIStyleSse(
	res: Response,
	onDelta: (t: string) => void,
	onLog: (level: "INFO" | "WARN" | "ERROR", source: string, msg: string) => void,
	signal?: AbortSignal,
): Promise<void> {
	const reader = res.body?.getReader();
	if (!reader) throw new Error("No response body");
	const dec = new TextDecoder();
	let buf = "";
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
			if (data === "[DONE]") return;
			try {
				const json = JSON.parse(data) as {
					choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>;
				};
				const piece = json.choices?.[0]?.delta?.content;
				if (piece) onDelta(piece);
			} catch {
				onLog("WARN", "sse", `Bad chunk at ${nowTime()}`);
			}
		}
	}
}
