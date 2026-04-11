import { X } from "lucide-react";

const VSC_DEBUGGING_DOC = "https://code.visualstudio.com/docs/editor/debugging";
const DAP_OVERVIEW = "https://microsoft.github.io/debug-adapter-protocol/overview";

const MP_BASE = "https://marketplace.visualstudio.com";
const MARKETPLACE_DEBUGGERS_SEARCH = `${MP_BASE}/search?target=Microsoft.VisualStudio.Code&category=Debuggers&sortBy=Installs`;

function marketplaceItem(itemName: string): string {
	return `${MP_BASE}/items?itemName=${encodeURIComponent(itemName)}`;
}

/** Curated extensions (VS Code marketplace; Cursor installs the same extensions). */
const CURATED_DEBUG_EXTENSIONS: { itemName: string; label: string; hint: string }[] = [
	{ itemName: "ms-python.debugpy", label: "Python Debugger (debugpy)", hint: "Microsoft — pairs with Run → Add Configuration (Python)." },
	{ itemName: "vadimcn.vscode-lldb", label: "CodeLLDB", hint: "C++, Rust, and other native targets via LLDB." },
	{ itemName: "golang.go", label: "Go", hint: "Delve-based debugging for Go modules." },
	{ itemName: "oven.bun-vscode", label: "Bun for VS Code", hint: "Official Oven extension; Bun launch type in launch.json (see bun.sh VS Code debugger guide)." },
	{ itemName: "vscjava.vscode-java-debug", label: "Debugger for Java", hint: "Red Hat / Java extension pack workflow." },
	{ itemName: "xdebug.php-debug", label: "PHP Debug", hint: "Xdebug adapter for PHP." },
	{ itemName: "ms-dotnettools.csdevkit", label: "C# Dev Kit", hint: ".NET debugging in VS Code / Cursor." },
	{ itemName: "Shopify.ruby-lsp", label: "Ruby LSP", hint: "Ruby language server + debugging path in modern setups." },
];

async function openLearnUrl(href: string): Promise<void> {
	try {
		if (typeof window !== "undefined" && window.wopShell?.openExternalUrl) {
			await window.wopShell.openExternalUrl(href);
			return;
		}
	} catch {
		/* fall through */
	}
	window.open(href, "_blank", "noopener,noreferrer");
}

/**
 * Same idea as VS Code / Cursor **Run → Install Additional Debuggers…**:
 * full breakpoint debugging for most languages uses **DAP** extensions in the desktop editor;
 * Way of Pi can still edit `launch.json` and use the integrated terminal for quick runs.
 */
export function InstallDebuggersModal({ open, onDismiss }: { open: boolean; onDismiss: () => void }) {
	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/60 p-4"
			role="presentation"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onDismiss();
			}}
		>
			<div
				className="flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[#454545] bg-[#252526] text-[#cccccc] shadow-2xl"
				role="dialog"
				aria-labelledby="install-dbg-title"
				aria-modal="true"
				onMouseDown={(e) => e.stopPropagation()}
			>
				<div className="flex shrink-0 items-center justify-between border-b border-[#3c3c3c] px-4 py-3">
					<h2 id="install-dbg-title" className="text-[15px] font-semibold text-white">
						Install additional debuggers
					</h2>
					<button
						type="button"
						onClick={onDismiss}
						className="rounded p-1 text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
						aria-label="Close"
					>
						<X size={20} />
					</button>
				</div>
				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
					<p className="mb-3 text-[12px] leading-relaxed text-[#858585]">
						In <strong className="text-[#cccccc]">Cursor</strong> and <strong className="text-[#cccccc]">VS Code</strong>,{" "}
						<em>Install Additional Debuggers</em> points you at the{" "}
						<a
							href={MARKETPLACE_DEBUGGERS_SEARCH}
							className="text-[#3794ff] underline"
							target="_blank"
							rel="noreferrer"
							onClick={(e) => {
								e.preventDefault();
								void openLearnUrl(MARKETPLACE_DEBUGGERS_SEARCH);
							}}
						>
							Marketplace “Debuggers” category
						</a>
						. Extensions implement the{" "}
						<a
							href={DAP_OVERVIEW}
							className="text-[#3794ff] underline"
							target="_blank"
							rel="noreferrer"
							onClick={(e) => {
								e.preventDefault();
								void openLearnUrl(DAP_OVERVIEW);
							}}
						>
							Debug Adapter Protocol (DAP)
						</a>{" "}
						so the editor gets breakpoints, stacks, and variables. Way of Pi focuses on the workspace shell and terminal;
						install the extensions <strong className="text-[#cccccc]">in Cursor</strong> for this repo, then use{" "}
						<strong className="text-[#cccccc]">Run → Open Configurations</strong> here to edit the same{" "}
						<code className="text-[#9cdcfe]">launch.json</code>.
					</p>
					<div className="mb-3 flex flex-wrap gap-2">
						<button
							type="button"
							className="rounded bg-[#007acc] px-3 py-1.5 text-[12px] text-white hover:bg-[#006bb3]"
							onClick={() => void openLearnUrl(MARKETPLACE_DEBUGGERS_SEARCH)}
						>
							Browse all debugger extensions
						</button>
						<button
							type="button"
							className="rounded border border-[#454545] px-3 py-1.5 text-[12px] text-[#cccccc] hover:bg-[#2a2d2e]"
							onClick={() => void openLearnUrl(VSC_DEBUGGING_DOC)}
						>
							VS Code debugging overview
						</button>
					</div>
					<p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#858585]">Popular extensions</p>
					<ul className="m-0 list-none space-y-1 p-0">
						{CURATED_DEBUG_EXTENSIONS.map((row) => (
							<li key={row.itemName}>
								<button
									type="button"
									className="flex w-full flex-col items-start rounded border border-transparent px-2 py-2 text-left hover:border-[#007acc]/40 hover:bg-[#2a2d2e]"
									onClick={() => void openLearnUrl(marketplaceItem(row.itemName))}
								>
									<span className="text-[13px] font-medium text-[#e0e0e0]">{row.label}</span>
									<span className="mt-0.5 text-[11px] text-[#858585]">{row.hint}</span>
									<span className="mt-0.5 font-mono text-[10px] text-[#6a9955]">{row.itemName}</span>
								</button>
							</li>
						))}
					</ul>
				</div>
				<div className="shrink-0 border-t border-[#3c3c3c] px-4 py-3">
					<button
						type="button"
						onClick={onDismiss}
						className="rounded bg-[#3c3c3c] px-4 py-2 text-[13px] text-[#cccccc] hover:bg-[#505050]"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
