import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { broadcastToolLog } from "./tool-log-broadcast";
import { parseStreamUsage, type StreamTokenUsage } from "./chat-usage";

export type PiJsonChatResult =
	| { ok: true; fullText: string; lastStreamUsage: StreamTokenUsage | null }
	| { ok: false; error: string }
	| { ok: false; aborted: true };

const MAX_ARG_CHARS = 90_000;

function piJsonTimeoutMs(): number {
	const raw = process.env.WOP_PI_JSON_TIMEOUT_MS?.trim();
	if (raw && /^\d+$/.test(raw)) {
		const n = parseInt(raw, 10);
		if (n >= 30_000 && n <= 3_600_000) return n;
	}
	return 900_000;
}

async function* linesFromStream(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
	const reader = stream.getReader();
	const dec = new TextDecoder();
	let buf = "";
	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			buf += dec.decode(value, { stream: true });
			const parts = buf.split("\n");
			buf = parts.pop() ?? "";
			for (const p of parts) {
				if (p.length > 0) yield p;
			}
		}
		if (buf.trim().length > 0) yield buf;
	} finally {
		try {
			reader.releaseLock();
		} catch {
			/* ignore */
		}
	}
}

function extractTextDelta(line: Record<string, unknown>): string {
	if (line.type !== "message_update") return "";
	const ev = line.assistantMessageEvent;
	if (!ev || typeof ev !== "object") return "";
	const e = ev as Record<string, unknown>;
	if (e.type === "text_delta" && typeof e.delta === "string") return e.delta;
	return "";
}

function tryUsageFromLine(line: Record<string, unknown>): StreamTokenUsage | null {
	const msg = line.message;
	if (!msg || typeof msg !== "object") return null;
	return parseStreamUsage({ usage: (msg as { usage?: unknown }).usage });
}

/**
 * Run one user turn through **`pi --mode json`** (upstream Pi coding-agent JSON event stream).
 * cwd should be the workspace root so **`.pi/settings.json`**, extensions, and agents match the TUI.
 */
export async function streamPiJsonChatTurn(opts: {
	piBinary: string;
	cwd: string;
	prompt: string;
	signal?: AbortSignal;
	onDelta: (s: string) => void;
	onLog: (level: "INFO" | "WARN" | "ERROR", source: string, msg: string) => void;
}): Promise<PiJsonChatResult> {
	if (opts.signal?.aborted) {
		return { ok: false, aborted: true };
	}
	const timeoutMs = piJsonTimeoutMs();
	let promptArg = opts.prompt;
	let tmpFile: string | null = null;
	if (promptArg.length > MAX_ARG_CHARS) {
		const dir = join(tmpdir(), "wayofpi-pi-json");
		await mkdir(dir, { recursive: true });
		tmpFile = join(dir, `prompt-${randomBytes(12).toString("hex")}.txt`);
		await writeFile(tmpFile, promptArg, "utf8");
		promptArg = `@${tmpFile}`;
		opts.onLog("INFO", "pi", `Long prompt (${opts.prompt.length} chars) passed as ${promptArg}`);
	}

	const proc = Bun.spawn([opts.piBinary, "--mode", "json", promptArg], {
		cwd: opts.cwd,
		stdin: "ignore",
		stdout: "pipe",
		stderr: "pipe",
		env: { ...process.env },
	});

	let lastUsage: StreamTokenUsage | null = null;
	let fullText = "";
	let stderrBuf = "";

	const onAbort = () => {
		try {
			proc.kill("SIGTERM");
		} catch {
			/* ignore */
		}
	};
	if (opts.signal) {
		if (opts.signal.aborted) onAbort();
		else opts.signal.addEventListener("abort", onAbort, { once: true });
	}

	const timer = setTimeout(onAbort, timeoutMs);

	const stderrStream = proc.stderr as unknown as ReadableStream<Uint8Array>;
	const readStderr = async () => {
		try {
			for await (const line of linesFromStream(stderrStream)) {
				stderrBuf += line + "\n";
				if (stderrBuf.length > 20_000) stderrBuf = `${stderrBuf.slice(0, 20_000)}\n…`;
			}
		} catch {
			/* ignore */
		}
	};
	const stderrTask = readStderr();

	const stdoutStream = proc.stdout as unknown as ReadableStream<Uint8Array>;
	try {
		for await (const raw of linesFromStream(stdoutStream)) {
			if (opts.signal?.aborted) {
				onAbort();
				await stderrTask.catch(() => {});
				if (tmpFile) await unlink(tmpFile).catch(() => {});
				return { ok: false, aborted: true };
			}
			let parsed: Record<string, unknown>;
			try {
				parsed = JSON.parse(raw) as Record<string, unknown>;
			} catch {
				opts.onLog("WARN", "pi-json", `Non-JSON line: ${raw.slice(0, 120)}`);
				continue;
			}
			const t = parsed.type;
			if (t === "session") {
				opts.onLog("INFO", "pi", `Pi session ${String(parsed.id ?? "")} cwd=${String(parsed.cwd ?? opts.cwd)}`);
				continue;
			}
			const delta = extractTextDelta(parsed);
			if (delta) {
				fullText += delta;
				opts.onDelta(delta);
			}
			if (t === "tool_execution_start") {
				const name = String(parsed.toolName ?? "tool");
				const args = parsed.args != null ? JSON.stringify(parsed.args).slice(0, 200) : "";
				broadcastToolLog("INFO", name, `start ${args}`);
			} else if (t === "tool_execution_end") {
				const name = String(parsed.toolName ?? "tool");
				const err = parsed.isError === true ? " (error)" : "";
				const res =
					parsed.result != null ? String(JSON.stringify(parsed.result)).slice(0, 400) : "";
				broadcastToolLog("INFO", name, `end${err} ${res}`);
			}
			const u = tryUsageFromLine(parsed);
			if (u) lastUsage = u;
			if (t === "message_end") {
				const u2 = parseStreamUsage(parsed);
				if (u2) lastUsage = u2;
			}
		}

		await stderrTask;
		clearTimeout(timer);
		const code = await proc.exited;
		if (tmpFile) await unlink(tmpFile).catch(() => {});

		if (opts.signal?.aborted) {
			return { ok: false, aborted: true };
		}
		if (code !== 0) {
			const hint = stderrBuf.trim() || `exit ${code}`;
			return {
				ok: false,
				error: `Pi --mode json exited with ${code}. ${hint.slice(0, 800)}`,
			};
		}
		return { ok: true, fullText, lastStreamUsage: lastUsage };
	} catch (e) {
		onAbort();
		await stderrTask.catch(() => {});
		if (tmpFile) await unlink(tmpFile).catch(() => {});
		if (opts.signal?.aborted || (e instanceof Error && e.name === "AbortError")) {
			return { ok: false, aborted: true };
		}
		const message = e instanceof Error ? e.message : String(e);
		return { ok: false, error: message };
	} finally {
		clearTimeout(timer);
	}
}
