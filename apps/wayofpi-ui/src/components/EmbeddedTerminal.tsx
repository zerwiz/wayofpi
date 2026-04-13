import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";
import { useServerConfig } from "../hooks/useServerConfig";
import { useTerminalUiPreferences } from "../hooks/useTerminalUiPreferences";
import { TERMINAL_UI_DEFAULT_FONT } from "../utils/terminalUiPreferences";
import { registerTerminalInputSender } from "../utils/terminalInputBridge";
import "@xterm/xterm/css/xterm.css";

/** Ubuntu brand orange — block cursor fill in the integrated terminal. */
const WOP_TERMINAL_CURSOR = "#E95420";
/** Glyph color on top of the block cursor (contrast on Ubuntu orange). */
const WOP_TERMINAL_CURSOR_ACCENT = "#ffffff";

function terminalWsUrl(): string {
	const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${proto}//${window.location.host}/ws/terminal`;
}

export function EmbeddedTerminal() {
	const containerRef = useRef<HTMLDivElement>(null);
	const termRef = useRef<Terminal | null>(null);
	const { config } = useServerConfig();
	const enabled = config?.terminalEnabled === true;
	const { prefs } = useTerminalUiPreferences();
	const fontFamily = prefs.fontFamily.trim() || TERMINAL_UI_DEFAULT_FONT;

	useEffect(() => {
		if (!enabled) return;
		const el = containerRef.current;
		if (!el) return;

		const term = new Terminal({
			cursorBlink: true,
			cursorStyle: "block",
			fontSize: prefs.fontSize,
			fontFamily,
			theme: {
				background: "#1e1e1e",
				foreground: "#d4d4d4",
				cursor: WOP_TERMINAL_CURSOR,
				cursorAccent: WOP_TERMINAL_CURSOR_ACCENT,
				black: "#1e1e1e",
				red: "#f14c4c",
				green: "#89d185",
				yellow: "#dcdcaa",
				blue: "#569cd6",
				cyan: "#4ec9b0",
				white: "#d4d4d4",
				brightBlack: "#858585",
			},
		});
		termRef.current = term;
		const fit = new FitAddon();
		term.loadAddon(fit);
		term.open(el);
		fit.fit();

		/** Clipboard: xterm consumes Ctrl/Cmd+C/V; wire common shortcuts so users can copy out / paste in (see xtermjs#2478). */
		term.attachCustomKeyEventHandler((ev) => {
			if (ev.type !== "keydown") return true;
			const sel = term.getSelection();
			const hasSel = sel.length > 0;

			// Copy — Ctrl+Shift+C / Cmd+Shift+C (avoid plain Ctrl+C = SIGINT)
			if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.code === "KeyC" && hasSel) {
				void navigator.clipboard
					.writeText(sel)
					.then(() => term.clearSelection())
					.catch(() => {});
				return false;
			}
			// Copy — Ctrl+Insert (Linux habit)
			if (ev.ctrlKey && !ev.metaKey && ev.code === "Insert" && hasSel) {
				void navigator.clipboard
					.writeText(sel)
					.then(() => term.clearSelection())
					.catch(() => {});
				return false;
			}
			// Copy — Ctrl+C when there is a selection (VS Code–style); else let SIGINT through
			if (ev.ctrlKey && !ev.metaKey && !ev.shiftKey && ev.code === "KeyC" && hasSel) {
				void navigator.clipboard
					.writeText(sel)
					.then(() => term.clearSelection())
					.catch(() => {});
				return false;
			}
			// Copy — Cmd+C with selection (macOS)
			if (ev.metaKey && !ev.ctrlKey && ev.code === "KeyC" && hasSel) {
				void navigator.clipboard
					.writeText(sel)
					.then(() => term.clearSelection())
					.catch(() => {});
				return false;
			}

			// Paste — Ctrl+Shift+V / Cmd+Shift+V
			if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.code === "KeyV") {
				void navigator.clipboard.readText().then((t) => {
					if (t) term.paste(t);
				});
				return false;
			}
			// Paste — Shift+Insert
			if (ev.shiftKey && ev.code === "Insert" && !ev.ctrlKey && !ev.metaKey) {
				void navigator.clipboard.readText().then((t) => {
					if (t) term.paste(t);
				});
				return false;
			}
			// Paste — Ctrl+V / Cmd+V: let the browser paste into xterm’s hidden textarea
			if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && ev.code === "KeyV") {
				return false;
			}

			return true;
		});

		const ws = new WebSocket(terminalWsUrl());
		let open = false;

		ws.onopen = () => {
			open = true;
			term.focus();
			registerTerminalInputSender((data) => {
				if (ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify({ type: "term_in", data }));
				}
			});
		};

		ws.onmessage = (ev) => {
			try {
				const msg = JSON.parse(String(ev.data)) as {
					type?: string;
					data?: string;
					stream?: string;
					message?: string;
					cwd?: string;
					code?: number;
				};
				if (msg.type === "term_ready" && msg.cwd) {
					term.writeln(`\x1b[90m# cwd: ${msg.cwd}\x1b[0m`);
					term.focus();
					return;
				}
				if (msg.type === "term_out" && typeof msg.data === "string") {
					term.write(msg.data);
					return;
				}
				if (msg.type === "term_error" && msg.message) {
					term.writeln(`\r\n\x1b[31m${msg.message}\x1b[0m\r\n`);
					return;
				}
				if (msg.type === "term_exit") {
					term.writeln(`\r\n\x1b[90m[Process exited${msg.code != null ? ` (${msg.code})` : ""}]\x1b[0m\r\n`);
				}
			} catch {
				/* ignore */
			}
		};

		ws.onerror = () => {
			if (open) return;
			term.writeln("\r\n\x1b[31mTerminal WebSocket error (is the server running with WOP_ALLOW_TERMINAL=1?)\x1b[0m\r\n");
		};

		ws.onclose = () => {
			open = false;
		};

		const sub = term.onData((data) => {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify({ type: "term_in", data }));
			}
		});

		const ro = new ResizeObserver(() => {
			try {
				fit.fit();
				const dims = fit.proposeDimensions();
				if (dims && ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify({ type: "term_resize", cols: dims.cols, rows: dims.rows }));
				}
			} catch {
				/* ignore */
			}
		});
		ro.observe(el);

		const onWinResize = () => {
			try {
				fit.fit();
			} catch {
				/* ignore */
			}
		};
		window.addEventListener("resize", onWinResize);

		return () => {
			termRef.current = null;
			registerTerminalInputSender(null);
			window.removeEventListener("resize", onWinResize);
			ro.disconnect();
			sub.dispose();
			try {
				ws.close();
			} catch {
				/* ignore */
			}
			term.dispose();
		};
	}, [enabled, prefs.fontSize, fontFamily]);

	if (config === null) {
		return <div className="p-4 font-mono text-[12px] text-[#858585]">Loading server config…</div>;
	}

	if (!enabled) {
		return (
			<div className="space-y-2 p-4 font-mono text-[12px] leading-relaxed">
				<p className="text-[#ce9178]">Interactive terminal is off on the server.</p>
				<p className="text-[#858585]">
					For a real shell (cwd = workspace), set{" "}
					<code className="rounded bg-[#2d2d2d] px-1.5 py-0.5 text-[#dcdcaa]">WOP_ALLOW_TERMINAL=1</code> on
					the Way of Pi UI server, restart it, then reload. Development normally enables this by default when
					unset; if you disabled it with{" "}
					<code className="rounded bg-[#2d2d2d] px-1.5 py-0.5 text-[#dcdcaa]">WOP_ALLOW_TERMINAL=0</code>,
					remove that or set to{" "}
					<code className="rounded bg-[#2d2d2d] px-1.5 py-0.5 text-[#dcdcaa]">1</code>. Trusted machines only.
				</p>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className="h-full min-h-[160px] w-full flex-1 overflow-hidden p-1"
			onMouseDown={() => termRef.current?.focus()}
		/>
	);
}
