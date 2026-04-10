import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import type { ServerWebSocket } from "bun";
import { getWorkspaceRoot } from "./paths";

export function terminalAllowed(): boolean {
	return process.env.WOP_ALLOW_TERMINAL?.trim() === "1";
}

export type TerminalWsData = {
	kind: "terminal";
	child: ChildProcessWithoutNullStreams | null;
};

function shellCommand(): { file: string; args: string[] } {
	if (process.platform === "win32") {
		return { file: "cmd.exe", args: ["/K"] };
	}
	const custom = process.env.WOP_SHELL?.trim();
	if (custom) {
		return { file: custom, args: [] };
	}
	return { file: "/bin/bash", args: [] };
}

export function attachTerminalSession(ws: ServerWebSocket<TerminalWsData>): void {
	const cwd = getWorkspaceRoot();
	if (!cwd || !existsSync(cwd)) {
		ws.send(
			JSON.stringify({
				type: "term_error",
				message: "No workspace folder (open a folder in Way of Pi so the server has a cwd).",
			}),
		);
		ws.close();
		return;
	}

	const { file, args } = shellCommand();
	let child: ChildProcessWithoutNullStreams;
	try {
		child = spawn(file, args, {
			cwd,
			env: {
				...process.env,
				TERM: "xterm-256color",
				COLORTERM: "truecolor",
			},
			stdio: ["pipe", "pipe", "pipe"],
			windowsHide: true,
		}) as ChildProcessWithoutNullStreams;
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		ws.send(JSON.stringify({ type: "term_error", message: `Failed to start shell: ${message}` }));
		ws.close();
		return;
	}

	ws.data.child = child;

	const safeSend = (payload: object) => {
		if (ws.readyState !== WebSocket.OPEN) return;
		try {
			ws.send(JSON.stringify(payload));
		} catch {
			/* ignore */
		}
	};

	child.stdout.setEncoding("utf8");
	child.stderr.setEncoding("utf8");

	child.stdout.on("data", (chunk: string) => {
		safeSend({ type: "term_out", stream: "stdout", data: chunk });
	});
	child.stderr.on("data", (chunk: string) => {
		safeSend({ type: "term_out", stream: "stderr", data: chunk });
	});

	child.on("error", (err) => {
		safeSend({ type: "term_error", message: err.message });
	});

	child.on("close", (code) => {
		safeSend({ type: "term_exit", code: code ?? 0 });
		try {
			ws.close();
		} catch {
			/* ignore */
		}
	});

	safeSend({ type: "term_ready", cwd });
}

export function handleTerminalMessage(ws: ServerWebSocket<TerminalWsData>, raw: string | Buffer): void {
	const child = ws.data.child;
	if (!child?.stdin?.writable) return;

	let msg: { type?: string; data?: string; cols?: number; rows?: number };
	try {
		msg = JSON.parse(String(raw)) as typeof msg;
	} catch {
		return;
	}

	if (msg.type === "term_in" && typeof msg.data === "string") {
		try {
			child.stdin.write(msg.data, "utf8");
		} catch {
			/* ignore */
		}
		return;
	}

	// Optional: PTY resize (no-op for pipe-based shell; kept for future PTY)
	if (msg.type === "term_resize") {
		/* no-op */
	}
}

export function disposeTerminal(ws: ServerWebSocket<TerminalWsData>): void {
	const child = ws.data.child;
	ws.data.child = null;
	if (!child) return;
	try {
		child.stdout.destroy();
		child.stderr.destroy();
		child.stdin.destroy();
	} catch {
		/* ignore */
	}
	try {
		child.kill("SIGTERM");
	} catch {
		/* ignore */
	}
	setTimeout(() => {
		try {
			if (!child.killed) child.kill("SIGKILL");
		} catch {
			/* ignore */
		}
	}, 400);
}
