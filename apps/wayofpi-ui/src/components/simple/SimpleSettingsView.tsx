import type { SimpleColorMode } from "../../hooks/useSimplePreferences";
import type { ServerConfig } from "../../hooks/useServerConfig";
import { GithubManageSettingsCard } from "../GithubManageSettingsCard";
import { TerminalSettingsSection } from "../TerminalSettingsSection";

function ToggleRow({
	title,
	description,
	on,
	onToggle,
	appearanceDark,
}: {
	title: string;
	description: string;
	on: boolean;
	onToggle: () => void;
	appearanceDark: boolean;
}) {
	const card = appearanceDark
		? "border-[#3c3c3c] bg-[#252526]"
		: "border-[#e5e5e5] bg-white shadow-sm";
	const titleC = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const desc = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const trackOff = appearanceDark ? "bg-[#6f6f6f]" : "bg-[#c8c8c8]";

	return (
		<div className={`flex flex-col gap-4 rounded-2xl border p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between ${card}`}>
			<div>
				<h3 className={`font-bold ${titleC}`}>{title}</h3>
				<p className={`mt-1 text-sm ${desc}`}>{description}</p>
			</div>
			<button
				type="button"
				role="switch"
				aria-checked={on}
				onClick={onToggle}
				className={`relative h-6 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${on ? "bg-[#ea580c]" : trackOff}`}
			>
				<span
					className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${on ? "right-1" : "left-1"}`}
				/>
			</button>
		</div>
	);
}

/** Simple shell — **wired for local prefs**: appearance, approval queue toggle, switch to technical UI. */
export function SimpleSettingsView({
	colorMode,
	onColorMode,
	approvalQueue,
	onApprovalQueue,
	onSwitchToTechnical,
	onOpenIndexingDocs,
	serverConfig,
}: {
	colorMode: SimpleColorMode;
	onColorMode: (m: SimpleColorMode) => void;
	approvalQueue: boolean;
	onApprovalQueue: (next: boolean) => void;
	onSwitchToTechnical: () => void;
	/** Settings menu parity: codebase index + docs (server). */
	onOpenIndexingDocs?: () => void;
	/** `/api/config` — terminal enable flag and shell hints. */
	serverConfig: ServerConfig | null;
}) {
	const appearanceDark = colorMode === "dark";
	const pageBg = appearanceDark ? "" : "bg-[#f3f3f3]";
	const heading = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const sub = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const card = appearanceDark
		? "border-[#3c3c3c] bg-[#252526]"
		: "border-[#e5e5e5] bg-white shadow-sm";

	return (
		<div className={`flex-1 overflow-y-auto p-8 ${pageBg}`}>
			<div className="mx-auto max-w-4xl">
				<h1 className={`mb-2 text-2xl font-extrabold ${heading}`}>Settings</h1>
				<p className={`mb-8 font-medium ${sub}`}>Simple UI preferences (stored in this browser).</p>

				<div className="space-y-4">
					<GithubManageSettingsCard appearanceDark={appearanceDark} />

					<div className={`rounded-2xl border p-6 shadow-sm ${card}`}>
						<h3 className={`mb-2 font-bold ${heading}`}>Appearance</h3>
						<p className={`mb-4 text-sm ${sub}`}>
							<strong className={heading}>Dark mode</strong> — same grays as Technical UI (default).{" "}
							<strong className={heading}>White mode</strong> — light neutral chrome.
						</p>
						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => onColorMode("dark")}
								className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
									colorMode === "dark"
										? "border-[#ea580c] bg-[#ea580c]/20 text-[#fed7aa]"
										: appearanceDark
											? "border-[#6f6f6f] text-[#cccccc] hover:bg-[#3c3c3c]"
											: "border-[#d4d4d4] text-[#333333] hover:bg-[#e5e5e5]"
								}`}
							>
								Dark mode
							</button>
							<button
								type="button"
								onClick={() => onColorMode("light")}
								className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
									colorMode === "light"
										? "border-[#ea580c] bg-[#ea580c]/12 text-[#c2410c]"
										: appearanceDark
											? "border-[#6f6f6f] text-[#cccccc] hover:bg-[#3c3c3c]"
											: "border-[#d4d4d4] text-[#333333] hover:bg-[#e5e5e5]"
								}`}
							>
								White mode
							</button>
						</div>
					</div>

					<ToggleRow
						title="Approval queue (preview)"
						description="Stored for future wiring to tool approval on the agent host."
						on={approvalQueue}
						onToggle={() => onApprovalQueue(!approvalQueue)}
						appearanceDark={appearanceDark}
					/>

					{onOpenIndexingDocs ? (
						<div className={`rounded-2xl border p-6 shadow-sm ${card}`}>
							<h3 className={`font-bold ${heading}`}>Indexing & Docs</h3>
							<p className={`mt-1 text-sm ${sub}`}>
								Local workspace manifest under <code className="text-xs">.wayofpi/index</code>, optional chat
								context, and HTTP(S) doc crawls — same product area as Cursor’s Indexing & Docs (without cloud
								embeddings).
							</p>
							<button
								type="button"
								onClick={onOpenIndexingDocs}
								className="mt-4 rounded-xl bg-[#ea580c] px-4 py-2 text-sm font-bold text-white hover:bg-[#c2410c]"
							>
								Open Indexing & Docs…
							</button>
						</div>
					) : null}

					<div className={`rounded-2xl border p-6 shadow-sm ${card}`}>
						<TerminalSettingsSection config={serverConfig} appearanceDark={appearanceDark} />
					</div>

					<div className={`rounded-2xl border p-6 shadow-sm ${card}`}>
						<h3 className={`font-bold ${heading}`}>Technical layout</h3>
						<p className={`mt-1 text-sm ${sub}`}>
							Switch to the IDE-style UI (same as the Simple / Technical toggle in the top bar).
						</p>
						<button
							type="button"
							onClick={onSwitchToTechnical}
							className="mt-4 rounded-xl bg-[#ea580c] px-4 py-2 text-sm font-bold text-white hover:bg-[#c2410c]"
						>
							Open Technical UI
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
