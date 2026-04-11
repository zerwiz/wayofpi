import { Folder } from "lucide-react";

/** Simple shell — **stub / shallow**: current workspace path + refresh tree only; no project list, roots picker, or tasks. */
export function SimpleProjectsView({
	rootLabel,
	rootPath,
	onRefresh,
	appearanceDark,
}: {
	rootLabel: string;
	rootPath: string;
	onRefresh: () => void;
	appearanceDark: boolean;
}) {
	const pageBg = appearanceDark ? "" : "bg-[#f3f3f3]";
	const heading = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const sub = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const card = appearanceDark
		? "border-[#3c3c3c] bg-[#252526]"
		: "border-[#e5e5e5] bg-white shadow-sm";
	const inner = appearanceDark
		? "border-[#3c3c3c] bg-[#1e1e1e]"
		: "border-[#e5e5e5] bg-[#ececec]";
	const label = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const pathC = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const h2 = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const btn = appearanceDark
		? "bg-[#3c3c3c] text-[#cccccc] hover:bg-[#4a4a4a]"
		: "bg-[#e5e5e5] text-[#333333] hover:bg-[#d0d0d0]";

	return (
		<div className={`flex-1 overflow-y-auto p-8 ${pageBg}`}>
			<div className="mx-auto max-w-4xl">
				<h1 className={`mb-2 text-2xl font-extrabold ${heading}`}>Projects &amp; Workspace</h1>
				<p className={`mb-8 font-medium ${sub}`}>
					This UI uses the workspace the server was started with. Change the server cwd to point elsewhere.
				</p>

				<div className={`mb-6 rounded-2xl border p-6 shadow-sm ${card}`}>
					<h2 className={`mb-4 flex items-center gap-2 text-lg font-bold ${h2}`}>
						<Folder className="text-[#fb923c]" size={20} /> Current Workspace
					</h2>
					<div className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${inner}`}>
						<div className="flex min-w-0 flex-col">
							<span className={`font-bold ${label}`}>{rootLabel || "Workspace"}</span>
							<span className={`mt-1 truncate font-mono text-sm ${pathC}`} title={rootPath}>
								{rootPath || "—"}
							</span>
						</div>
						<button
							type="button"
							onClick={onRefresh}
							className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${btn}`}
						>
							Refresh tree
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
