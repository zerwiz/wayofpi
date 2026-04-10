import { Clock, Columns2, FileCode2, FileJson, File as FileIcon, Folder, PanelTop, Play } from "lucide-react";
import type { SimpleChatWorkspaceLayout } from "../../utils/simpleWorkspaceLayoutStorage";
import type { LogRow } from "../../hooks/useWayOfPiSession";
import type { TreeNode } from "../../types/tree";
import { flattenTreeFiles } from "./flattenTreeFiles";

function fileRowIcon(name: string, appearanceDark: boolean) {
	const lower = name.toLowerCase();
	const code = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const json = appearanceDark ? "text-amber-400/90" : "text-amber-700";
	if (lower.endsWith(".json")) return <FileJson size={18} className={`shrink-0 ${json}`} />;
	if (
		lower.endsWith(".py") ||
		lower.endsWith(".ts") ||
		lower.endsWith(".tsx") ||
		lower.endsWith(".js") ||
		lower.endsWith(".jsx") ||
		lower.endsWith(".md")
	) {
		return <FileCode2 size={18} className={`shrink-0 ${code}`} />;
	}
	return <FileIcon size={18} className={`shrink-0 ${code}`} />;
}

export function SimpleRightPanel({
	nodes,
	selectedPath,
	onSelectFile,
	loading,
	error,
	logs,
	streaming,
	onQuickRun,
	appearanceDark,
	chatWorkspaceLayout,
	onToggleChatWorkspaceLayout,
}: {
	nodes: TreeNode[];
	selectedPath: string | null;
	onSelectFile: (path: string) => void;
	loading: boolean;
	error: string | null;
	logs: LogRow[];
	streaming: boolean;
	onQuickRun?: () => void;
	appearanceDark: boolean;
	/** Chat tab: editor above chat vs chat left / editor right. */
	chatWorkspaceLayout?: SimpleChatWorkspaceLayout;
	onToggleChatWorkspaceLayout?: () => void;
}) {
	const files = flattenTreeFiles(nodes, 120);
	const timeline =
		logs.length > 0
			? logs.slice(-20).map((log, i, arr) => ({
					time: log.time || "—",
					text: `${log.source}: ${log.msg}`,
					active: streaming && i === arr.length - 1,
				}))
			: [{ time: "—", text: "Connect to the server to see live activity here.", active: false }];

	const aside = appearanceDark
		? "border-[#3c3c3c] bg-[#252526]"
		: "border-[#e5e5e5] bg-white shadow-sm";
	const topBar = appearanceDark ? "border-[#3c3c3c] bg-[#1e1e1e]" : "border-[#e5e5e5] bg-[#ececec]";
	const title = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const sectionBorder = appearanceDark ? "border-[#3c3c3c]" : "border-[#e5e5e5]";
	const muted = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const fileName = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const hoverRow = appearanceDark ? "hover:bg-[#3c3c3c]" : "hover:bg-[#e5e5e5]";
	const timelineLine = appearanceDark ? "border-[#3c3c3c]" : "border-[#e5e5e5]";
	const timelineBorder = appearanceDark ? "border-[#1e1e1e]" : "border-white";
	const dotIdle = appearanceDark
		? "bg-[#6f6f6f] group-hover:bg-[#858585]"
		: "bg-[#c8c8c8] group-hover:bg-[#a0a0a0]";
	const timeC = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const textActive = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const textIdle = appearanceDark
		? "text-[#858585] group-hover:text-[#cccccc]"
		: "text-[#616161] group-hover:text-[#333333]";

	return (
		<aside className={`z-10 flex w-80 shrink-0 flex-col border-l shadow-sm ${aside}`}>
			<div className={`flex items-center justify-between border-b p-5 ${topBar}`}>
				<span className={`text-sm font-extrabold ${title}`}>Quick Actions</span>
				<button
					type="button"
					onClick={onQuickRun}
					className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-green-400"
				>
					<Play size={16} fill="currentColor" />
					Run
				</button>
			</div>

			<div className={`flex min-h-[40%] flex-1 flex-col border-b p-5 ${sectionBorder}`}>
				<div className="mb-4 flex items-center justify-between gap-2">
					<h2 className={`flex min-w-0 items-center gap-2 text-[13px] font-extrabold uppercase tracking-wider ${title}`}>
						<Folder size={16} className="shrink-0 text-[#fb923c]" />
						<span className="truncate">Project Files</span>
					</h2>
					{onToggleChatWorkspaceLayout != null && chatWorkspaceLayout != null ? (
						<button
							type="button"
							title={
								chatWorkspaceLayout === "side_by_side"
									? "Layout: chat left, editor right — click for editor above chat"
									: "Layout: editor above chat — click for chat left, editor right"
							}
							onClick={onToggleChatWorkspaceLayout}
							className={`shrink-0 rounded-md border p-1.5 transition-colors ${
								chatWorkspaceLayout === "side_by_side"
									? appearanceDark
										? "border-[#ea580c]/50 bg-[#ea580c]/15 text-[#fb923c]"
										: "border-[#ea580c]/40 bg-[#ea580c]/10 text-[#ea580c]"
									: appearanceDark
										? "border-[#3c3c3c] text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
										: "border-[#d4d4d4] text-[#616161] hover:bg-[#e5e5e5]"
							}`}
							aria-pressed={chatWorkspaceLayout === "side_by_side"}
						>
							{chatWorkspaceLayout === "side_by_side" ? <Columns2 size={16} aria-hidden /> : <PanelTop size={16} aria-hidden />}
						</button>
					) : null}
				</div>
				<div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-2">
					{loading ? (
						<p className={`text-sm ${muted}`}>Loading tree…</p>
					) : error ? (
						<p className="text-sm text-red-500">{error}</p>
					) : files.length === 0 ? (
						<p className={`text-sm ${muted}`}>No files in workspace yet.</p>
					) : (
						files.map((file) => {
							const modified =
								file.gitStatus != null && file.gitStatus !== "" && file.gitStatus !== " ";
							const selected = selectedPath === file.path;
							return (
								<button
									key={file.path}
									type="button"
									onClick={() => onSelectFile(file.path)}
									className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-[14px] font-medium transition-colors ${
										selected
											? appearanceDark
												? "border-[#ea580c]/40 bg-[#ea580c]/10"
												: "border-[#ea580c]/50 bg-[#ea580c]/10"
											: modified
												? "border-amber-500/20 bg-amber-500/10 shadow-sm"
												: `border-transparent ${hoverRow}`
									}`}
								>
									<div className="flex min-w-0 items-center gap-3">
										{fileRowIcon(file.name, appearanceDark)}
										<div className="flex min-w-0 flex-col truncate">
											<span
												className={`truncate ${modified ? "font-bold text-amber-500" : fileName}`}
											>
												{file.name}
											</span>
											{file.parentDir ? (
												<span className={`truncate text-[11px] ${muted}`}>{file.parentDir}</span>
											) : null}
										</div>
									</div>
									{modified ? (
										<span className="ml-2 shrink-0 rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-400">
											{file.gitStatus}
										</span>
									) : null}
								</button>
							);
						})
					)}
				</div>
			</div>

			<div className={`flex min-h-[35%] flex-1 flex-col p-5 ${appearanceDark ? "bg-[#1e1e1e]" : "bg-[#f3f3f3]"}`}>
				<h2 className={`mb-5 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-wider ${title}`}>
					<Clock size={16} className="text-[#fb923c]" />
					What&apos;s Happening
				</h2>
				<div className={`relative ml-2.5 flex-1 space-y-6 overflow-y-auto border-l-2 pb-4 pl-6 pt-1 ${timelineLine}`}>
					{timeline.map((event, idx) => (
						<div key={`${event.time}-${idx}`} className="group relative">
							<div
								className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full border-[3px] transition-all ${timelineBorder} ${
									event.active ? "bg-[#ea580c] shadow-[0_0_0_4px_rgba(0,122,204,0.25)]" : dotIdle
								}`}
							/>
							<div className="flex flex-col">
								<span className={`mb-0.5 text-xs font-bold ${timeC}`}>{event.time}</span>
								<span
									className={`text-[14px] leading-snug ${event.active ? `font-bold ${textActive}` : `font-medium ${textIdle}`}`}
								>
									{event.text}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</aside>
	);
}
