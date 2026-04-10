import { Activity, Brain, CheckCircle2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { ProviderConfigEditor } from "../ProviderConfigEditor";
import type { PiModelConfigPath } from "../../constants/piModelConfigPaths";
import type { ServerConfig } from "../../hooks/useServerConfig";
import { useLlmModels } from "../../hooks/useLlmModels";

function formatBytes(n: number | undefined): string {
	if (n == null || !Number.isFinite(n)) return "—";
	const u = ["B", "KB", "MB", "GB", "TB"];
	let v = n;
	let i = 0;
	while (v >= 1024 && i < u.length - 1) {
		v /= 1024;
		i++;
	}
	return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${u[i]}`;
}

export function SimpleModelsView({
	config,
	appearanceDark,
	effectiveModel,
	onSelectModel,
	providerConfigInitialPath,
	providerConfigInitialNonce,
	onConsumeProviderConfigFocus,
}: {
	config: ServerConfig | null;
	appearanceDark: boolean;
	effectiveModel: string | null;
	onSelectModel: (modelId: string) => void;
	providerConfigInitialPath?: PiModelConfigPath | null;
	providerConfigInitialNonce?: number;
	onConsumeProviderConfigFocus?: () => void;
}) {
	const { data, loading, error, reload } = useLlmModels();
	const [openRouterDraft, setOpenRouterDraft] = useState("");
	const [section, setSection] = useState<"session" | "providers">("session");

	useEffect(() => {
		if (providerConfigInitialPath) setSection("providers");
	}, [providerConfigInitialPath, providerConfigInitialNonce]);

	const pageBg = appearanceDark ? "" : "bg-[#f3f3f3]";
	const heading = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const sub = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const table = appearanceDark
		? "border-[#3c3c3c] bg-[#252526]"
		: "border-[#e5e5e5] bg-white shadow-sm";
	const thead = appearanceDark
		? "border-[#3c3c3c] bg-[#1e1e1e]/80 text-[#858585]"
		: "border-[#e5e5e5] bg-[#ececec] text-[#616161]";
	const rowBorder = appearanceDark
		? "border-[#3c3c3c]/50 hover:bg-[#3c3c3c]/50"
		: "border-[#e5e5e5] hover:bg-[#f3f3f3]";
	const nameC = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const mono = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const prov = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const brain = appearanceDark ? "text-[#858585]" : "text-[#858585]";
	const btnBase =
		appearanceDark
			? "rounded border border-[#3c3c3c] bg-[#3c3c3c] px-2 py-1 text-xs font-semibold text-[#cccccc] hover:bg-[#4a4a4a]"
			: "rounded border border-[#d4d4d4] bg-white px-2 py-1 text-xs font-semibold text-[#333333] hover:bg-[#e5e5e5]";
	const btnActive =
		appearanceDark
			? "rounded border border-green-700/60 bg-green-950/40 px-2 py-1 text-xs font-semibold text-green-400"
			: "rounded border border-green-300 bg-green-50 px-2 py-1 text-xs font-semibold text-green-900";
	const tabBase =
		appearanceDark
			? "rounded-t-lg border border-b-0 border-[#3c3c3c] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#858585]"
			: "rounded-t-lg border border-b-0 border-[#e5e5e5] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#616161]";
	const tabOn =
		appearanceDark
			? "border-[#3c3c3c] bg-[#252526] text-[#cccccc]"
			: "border-[#d4d4d4] bg-white text-[#333333]";

	const providerKey = (config?.provider || data?.provider || "ollama").toLowerCase();
	const ollamaHost = config?.ollamaHost ?? data?.ollamaHost ?? "—";
	const envDefault = providerKey === "openrouter" ? config?.openrouterModel ?? data?.envDefaultOpenrouter : config?.ollamaModel ?? data?.envDefaultOllama;

	const rows: Array<{
		key: string;
		displayName: string;
		fullId: string;
		providerLabel: string;
		type: "local" | "cloud";
		sizeLabel?: string;
	}> = [];

	if (providerKey === "openrouter") {
		const cur = effectiveModel ?? envDefault ?? "—";
		rows.push({
			key: `or-${cur}`,
			displayName: cur,
			fullId: `openrouter/${cur}`,
			providerLabel: "OpenRouter (api.openrouter.ai)",
			type: "cloud",
		});
	} else {
		const seen = new Set<string>();
		for (const m of data?.models ?? []) {
			if (!m.name || seen.has(m.name)) continue;
			seen.add(m.name);
			rows.push({
				key: m.name,
				displayName: m.name,
				fullId: `ollama/${m.name}`,
				providerLabel: `Ollama (${ollamaHost})`,
				type: "local",
				sizeLabel: formatBytes(m.size),
			});
		}
		const def = envDefault;
		if (def && !seen.has(def)) {
			rows.unshift({
				key: `env-${def}`,
				displayName: def,
				fullId: `ollama/${def}`,
				providerLabel: `Ollama (${ollamaHost})`,
				type: "local",
				sizeLabel: "env default",
			});
		}
	}

	const activeId = effectiveModel ?? envDefault ?? null;

	return (
		<div className={`flex-1 overflow-y-auto p-8 ${pageBg}`}>
			<div className="mx-auto max-w-5xl">
				<div className="mb-2 flex flex-wrap items-center justify-between gap-3">
					<h1 className={`text-2xl font-extrabold ${heading}`}>AI Brains</h1>
					<button
						type="button"
						onClick={() => void reload()}
						disabled={loading}
						className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
							appearanceDark
								? "border-[#3c3c3c] text-[#cccccc] hover:bg-[#3c3c3c] disabled:opacity-50"
								: "border-[#d4d4d4] text-[#616161] hover:bg-[#e5e5e5] disabled:opacity-50"
						}`}
					>
						<RefreshCw size={14} className={loading ? "animate-spin" : ""} />
						Refresh list
					</button>
				</div>
				<div className="mb-4 flex flex-wrap gap-1">
					<button
						type="button"
						onClick={() => setSection("session")}
						className={`${tabBase} ${section === "session" ? tabOn : "border-transparent bg-transparent opacity-80 hover:opacity-100"}`}
					>
						Session model
					</button>
					<button
						type="button"
						onClick={() => setSection("providers")}
						className={`${tabBase} ${section === "providers" ? tabOn : "border-transparent bg-transparent opacity-80 hover:opacity-100"}`}
					>
						Provider files
					</button>
				</div>

				{section === "providers" ? (
					<div className="mb-6">
						<p className={`mb-3 text-sm font-medium ${sub}`}>
							Edit the same JSON Pi uses for <span className="font-mono">/models</span>, workspace routing, and defaults.
							Invalid JSON cannot be saved.
						</p>
						<ProviderConfigEditor
							appearanceDark={appearanceDark}
							initialPath={providerConfigInitialPath ?? undefined}
							initialPathNonce={providerConfigInitialNonce ?? 0}
							onInitialPathConsumed={onConsumeProviderConfigFocus}
							onAfterSave={() => void reload()}
						/>
					</div>
				) : null}

				{section === "session" ? (
					<>
				<p className={`mb-6 font-medium ${sub}`}>
					Choose the model for this browser session. The server uses{" "}
					<span className="font-mono">{providerKey === "openrouter" ? "OpenRouter" : "Ollama"}</span> from
					host env; your pick is sent over the WebSocket and remembered in this browser.
				</p>

				{providerKey === "openrouter" ? (
					<div
						className={`mb-6 rounded-2xl border p-4 ${appearanceDark ? "border-[#3c3c3c] bg-[#252526]" : "border-[#e5e5e5] bg-white shadow-sm"}`}
					>
						<div className={`mb-2 text-xs font-bold uppercase tracking-wider ${mono}`}>Custom model id</div>
						<div className="flex flex-wrap gap-2">
							<input
								type="text"
								value={openRouterDraft}
								onChange={(e) => setOpenRouterDraft(e.target.value)}
								placeholder={envDefault || "e.g. anthropic/claude-3.5-sonnet"}
								className={`min-w-[240px] flex-1 rounded border px-3 py-2 font-mono text-sm outline-none ${
									appearanceDark
										? "border-[#3c3c3c] bg-[#1e1e1e] text-[#cccccc] placeholder:text-[#858585] focus:border-[#ea580c]"
										: "border-[#d4d4d4] bg-white text-[#333333] placeholder:text-[#858585] focus:border-[#ea580c]"
								}`}
							/>
							<button
								type="button"
								className={btnBase}
								onClick={() => onSelectModel(openRouterDraft.trim() || (envDefault ?? ""))}
							>
								Use model
							</button>
						</div>
						{data?.catalogNote ? <p className={`mt-2 text-xs ${sub}`}>{data.catalogNote}</p> : null}
					</div>
				) : null}

				{error ? (
					<div
						className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
							appearanceDark ? "border-red-900/60 bg-red-950/40 text-red-200" : "border-red-200 bg-red-50 text-red-900"
						}`}
					>
						{error}
					</div>
				) : null}
				{data?.error && providerKey !== "openrouter" ? (
					<div
						className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
							appearanceDark ? "border-amber-900/50 bg-amber-950/30 text-amber-100" : "border-amber-200 bg-amber-50 text-amber-950"
						}`}
					>
						Could not reach Ollama tags API: {data.error}
					</div>
				) : null}

				<div className={`overflow-hidden rounded-2xl border shadow-sm ${table}`}>
					<div className={`grid grid-cols-12 gap-4 border-b p-4 text-xs font-bold uppercase tracking-wider ${thead}`}>
						<div className="col-span-4 sm:col-span-5">Model Name / ID</div>
						<div className="col-span-3">Provider</div>
						<div className="col-span-2">Type</div>
						<div className="col-span-3 text-right sm:col-span-2">Status</div>
					</div>
					<div className="flex flex-col">
						{loading && !rows.length ? (
							<div className={`p-6 text-sm ${sub}`}>Loading models…</div>
						) : null}
						{!loading && !rows.length && providerKey !== "openrouter" ? (
							<div className={`p-6 text-sm ${sub}`}>
								No models returned from Ollama. Pull a model on the host (e.g.{" "}
								<span className="font-mono">ollama pull llama3</span>) and refresh.
							</div>
						) : null}
						{rows.map((model) => {
							const isActive = activeId != null && model.displayName === activeId;
							return (
								<div
									key={model.key}
									className={`grid grid-cols-12 items-center gap-4 border-b p-4 transition-colors last:border-0 ${rowBorder}`}
								>
									<div className="col-span-4 flex flex-col sm:col-span-5">
										<span className={`font-bold ${nameC}`}>{model.displayName}</span>
										<span className={`mt-0.5 font-mono text-xs ${mono}`}>{model.fullId}</span>
										{model.sizeLabel && model.sizeLabel !== "env default" ? (
											<span className={`mt-0.5 font-mono text-[10px] ${mono}`}>{model.sizeLabel}</span>
										) : null}
									</div>
									<div className={`col-span-3 flex items-center gap-2 text-sm ${prov}`}>
										<Brain size={14} className={brain} /> {model.providerLabel}
									</div>
									<div className="col-span-2">
										<span
											className={`rounded px-2 py-1 text-xs font-medium ${
												model.type === "local"
													? appearanceDark
														? "bg-orange-500/10 text-orange-400"
														: "bg-orange-100 text-orange-800"
													: appearanceDark
														? "bg-[#ea580c]/10 text-[#fb923c]"
														: "bg-[#ea580c]/12 text-[#c2410c]"
											}`}
										>
											{model.type}
										</span>
									</div>
									<div className="col-span-3 flex flex-wrap items-center justify-end gap-2 text-right sm:col-span-2">
										{isActive ? (
											<span className={`inline-flex items-center gap-1 ${btnActive}`}>
												<CheckCircle2 size={14} /> Active
											</span>
										) : (
											<>
												<button type="button" className={btnBase} onClick={() => onSelectModel(model.displayName)}>
													Select
												</button>
												<span
													className={`inline-flex items-center gap-1 text-xs font-bold ${appearanceDark ? "text-[#858585]" : "text-[#616161]"}`}
												>
													<Activity size={12} /> {model.type === "cloud" ? "Connected" : "Ready"}
												</span>
											</>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
					</>
				) : null}
			</div>
		</div>
	);
}
