import type { LogRow } from "../hooks/useWayOfPiSession";
import type { BottomPanelTab } from "../types/technicalShell";
import { EmbeddedTerminal } from "./EmbeddedTerminal";

export function ToolPanelBody({ tab, logs }: { tab: BottomPanelTab; logs: LogRow[] }) {
	if (tab === "tool_log") {
		return (
			<div className="flex flex-col gap-1.5">
				{logs.length === 0 ? (
					<span className="text-[#858585]">No log lines yet.</span>
				) : (
					logs.map((log, idx) => (
						<div key={`${log.time}-${idx}`} className="flex gap-4">
							<span className="w-24 shrink-0 text-[#858585]">[{log.time}]</span>
							<span
								className={`w-16 shrink-0 font-bold ${
									log.level === "INFO"
										? "text-[#ea580c]"
										: log.level === "WARN"
											? "text-[#ce9178]"
											: log.level === "SUCCESS"
												? "text-[#89d185]"
												: "text-[#f14c4c]"
								}`}
							>
								{log.level}
							</span>
							<span className="w-28 shrink-0 text-[#c586c0]">{log.source}</span>
							<span className="text-[#cccccc]">{log.msg}</span>
						</div>
					))
				)}
			</div>
		);
	}
	if (tab === "output") {
		return (
			<div className="text-[#cccccc]">
				Server and client share one origin in dev (Vite proxy). Logs stream over WebSocket.
			</div>
		);
	}
	if (tab === "problems") {
		return <div className="text-[#858585]">No static analyzer wired yet.</div>;
	}
	if (tab === "terminal") {
		return <EmbeddedTerminal />;
	}
	return (
		<div className="text-[#858585]">
			Host shell is not exposed here by design. Use approvals + Run (planned) for commands.
		</div>
	);
}
