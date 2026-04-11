import type { ServerConfig } from "../hooks/useServerConfig";
import { useTerminalUiPreferences } from "../hooks/useTerminalUiPreferences";
import { TERMINAL_UI_DEFAULT_FONT } from "../utils/terminalUiPreferences";

/** Shared terminal setup: server status (from `/api/config`) + client xterm prefs (localStorage). */
export function TerminalSettingsSection({
	config,
	appearanceDark,
	compact,
}: {
	config: ServerConfig | null;
	/** Simple UI light vs dark chrome. */
	appearanceDark?: boolean;
	/** Technical settings sidebar: tighter typography. */
	compact?: boolean;
}) {
	const { prefs, setPrefs, reset } = useTerminalUiPreferences();
	const dark = appearanceDark !== false;
	const label = compact
		? "mb-1.5 text-[10px] font-bold uppercase text-[#858585]"
		: "mb-2 text-[11px] font-bold uppercase text-[#858585]";
	const box = compact
		? "mb-3 rounded border border-[#3c3c3c] bg-[#1e1e1e] p-2.5 text-[11px] leading-snug text-[#cccccc]"
		: dark
			? "mb-4 rounded-xl border border-[#3c3c3c] bg-[#1e1e1e] p-4 text-[13px] leading-relaxed text-[#cccccc]"
			: "mb-4 rounded-xl border border-[#e5e5e5] bg-white p-4 text-[13px] leading-relaxed text-[#333333]";
	const muted = dark ? "text-[#858585]" : "text-[#616161]";
	const code = dark
		? "rounded bg-[#2d2d2d] px-1 py-0.5 font-mono text-[11px] text-[#dcdcaa]"
		: "rounded bg-[#f3f3f3] px-1 py-0.5 font-mono text-[11px] text-[#7c3aed]";
	const input = dark
		? "w-full rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1.5 font-mono text-[12px] text-[#cccccc] outline-none focus:border-[#0e639c]"
		: "w-full rounded border border-[#d4d4d4] bg-white px-2 py-1.5 font-mono text-[12px] text-[#333333] outline-none focus:border-[#007acc]";
	const btn =
		dark && !compact
			? "rounded border border-[#3c3c3c] bg-[#3c3c3c] px-3 py-1.5 text-[12px] text-[#cccccc] hover:bg-[#4a4a4a]"
			: !dark && !compact
				? "rounded border border-[#d4d4d4] bg-[#f3f3f3] px-3 py-1.5 text-[12px] text-[#333333] hover:bg-[#e5e5e5]"
				: "rounded border border-[#3c3c3c] px-2 py-1 text-[10px] text-[#cccccc] hover:bg-[#3c3c3c]";

	const shellExe = config?.shellExecutable ?? "—";
	const shellArgs = config?.shellArgs?.length ? config.shellArgs.join(" ") : "";
	const enabled = config?.terminalEnabled === true;
	const custom = config?.customShell === true;

	return (
		<>
			<div className={label}>Integrated terminal</div>
			<div className={box}>
				<p className={compact ? `mb-2 ${muted}` : `mb-3 ${muted}`}>
					The panel uses WebSocket <code className={code}>/ws/terminal</code>. The shell runs on the{" "}
					<strong className={dark ? "text-[#d4d4d4]" : "text-[#111]"}>Bun server host</strong>, cwd = workspace
					root. Enable or change the shell with environment variables on that process, then restart the server.
				</p>
				{config ? (
					<ul className={`list-none space-y-1.5 p-0 font-mono ${compact ? "text-[10px]" : "text-[11px]"}`}>
						<li>
							<span className={muted}>Status: </span>
							<span className={enabled ? "text-[#89d185]" : "text-[#ce9178]"}>
								{enabled ? "Enabled" : "Disabled"}
							</span>
						</li>
						<li className="break-all">
							<span className={muted}>Shell: </span>
							<span className="text-[#9cdcfe]">{shellExe}</span>
							{shellArgs ? <span className="text-[#858585]"> {shellArgs}</span> : null}
							{custom ? (
								<span className={`ml-1 ${muted}`}>(<code className={code}>WOP_SHELL</code>)</span>
							) : (
								<span className={`ml-1 ${muted}`}>(default)</span>
							)}
						</li>
						{config.platform ? (
							<li>
								<span className={muted}>Server OS: </span>
								<span className="text-[#cccccc]">{config.platform}</span>
							</li>
						) : null}
					</ul>
				) : (
					<p className={muted}>Loading server config…</p>
				)}
				<p className={`mt-3 ${compact ? "text-[10px]" : "text-[12px]"} leading-snug ${muted}`}>
					Set <code className={code}>WOP_ALLOW_TERMINAL=1</code> to allow the PTY (trusted hosts only). Optional:{" "}
					<code className={code}>WOP_SHELL</code> = path to <code className={code}>bash</code>,{" "}
					<code className={code}>zsh</code>, etc. In production, unset defaults to off unless you opt in.
				</p>
			</div>

			<div className={label}>Terminal appearance (this browser)</div>
			<div className={box}>
				<div className={compact ? "space-y-2" : "space-y-3"}>
					<div>
						<label className={`mb-1 block ${muted} ${compact ? "text-[10px]" : "text-[12px]"}`}>Font size (px)</label>
						<input
							type="number"
							min={8}
							max={36}
							value={prefs.fontSize}
							onChange={(e) => {
								const n = Number(e.target.value);
								setPrefs({ fontSize: Number.isFinite(n) ? n : prefs.fontSize });
							}}
							className={input}
						/>
					</div>
					<div>
						<label className={`mb-1 block ${muted} ${compact ? "text-[10px]" : "text-[12px]"}`}>
							Font family (CSS)
						</label>
						<input
							type="text"
							value={prefs.fontFamily}
							onChange={(e) => setPrefs({ fontFamily: e.target.value })}
							placeholder={TERMINAL_UI_DEFAULT_FONT}
							className={input}
							spellCheck={false}
						/>
						<p className={`mt-1 ${compact ? "text-[9px]" : "text-[11px]"} ${muted}`}>
							Leave empty for the default stack ({TERMINAL_UI_DEFAULT_FONT}).
						</p>
					</div>
					<button type="button" onClick={reset} className={btn}>
						Reset appearance to defaults
					</button>
				</div>
			</div>
		</>
	);
}
