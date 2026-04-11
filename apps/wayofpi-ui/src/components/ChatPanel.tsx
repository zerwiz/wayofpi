import {
	MessageSquarePlus,
	PanelBottom,
	PanelRight,
	Paperclip,
	Send,
	SidebarClose,
	Square,
	X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
	buildChatMessageWithAttachment,
	MAX_CHAT_ATTACHMENT_CHARS,
} from "../lib/chatAttachment";
import type { AgentMeta } from "../hooks/useAgents";
import {
	AgentTeamPulseGrid,
	buildPulseMembersFromRoster,
} from "./AgentTeamPulseGrid";
import type { ChatRow, ChatSessionMode, ChatSessionTab } from "../hooks/useWayOfPiSession";
import type { UiMode } from "../hooks/useUiMode";
import { examplePlanPathForToday } from "../utils/planModeArtifacts";
import type { ChatDockRegion } from "../utils/technicalLayoutStorage";

/** Technical UI: user-adjustable dock for the agent / session panel (Zed / Cursor–style). */
export type TechnicalAgentDock = {
	region: ChatDockRegion;
	sizePx: number;
	onSetRegion: (r: ChatDockRegion) => void;
	onHidePanel: () => void;
};

export function ChatPanel({
	uiMode,
	rows,
	chatTabs,
	activeChatTabId,
	onSelectChatTab,
	onCloseChatTab,
	streaming,
	connected,
	error,
	onSend,
	onStop,
	onClearError,
	onNewSession,
	technicalDock,
	chatMode,
	onChatModeChange,
	agents,
	agentsLoading,
	agentTeams,
	onOpenAgentTeamInPane,
	chatAgentName,
	onChatAgentChange,
	/** Server-side messages waiting after the current assistant turn. */
	chatQueuePending,
	/** When wrapped in TechnicalDockPanelFrame — omit outer border; frame provides the edge. */
	dockPanelFrame,
	/** Technical: chat fills a workspace editor pane tab (no fixed sidebar width). */
	embeddedInWorkspace,
}: {
	uiMode: UiMode;
	rows: ChatRow[];
	chatTabs: ChatSessionTab[];
	activeChatTabId: string;
	onSelectChatTab: (id: string) => void;
	/** Remove a session tab (at least one tab always remains). */
	onCloseChatTab?: (id: string) => void;
	streaming: boolean;
	connected: boolean;
	error: string | null;
	onSend: (text: string) => void;
	onStop: () => void;
	onClearError: () => void;
	onNewSession?: () => void;
	/** When set (technical shell), panel size/region are user-controlled. */
	technicalDock?: TechnicalAgentDock;
	/** Cursor-style Plan vs Build; technical shell only UI (server injects planner system prompt in Plan). */
	chatMode?: ChatSessionMode;
	onChatModeChange?: (m: ChatSessionMode) => void;
	/** Workspace Pi agents from `/api/agents` (`.pi/agents/*.md`). */
	agents?: AgentMeta[];
	agentsLoading?: boolean;
	/** `teams.yaml` rosters — same source Pi **agent-team** uses; drives the **Team** roster pane. */
	agentTeams?: Record<string, string[]>;
	/** Technical: open **Team pulse** in the main workspace tab stack (keeps chat messages visible). */
	onOpenAgentTeamInPane?: () => void;
	chatAgentName?: string | null;
	onChatAgentChange?: (name: string | null) => void;
	chatQueuePending?: number;
	dockPanelFrame?: boolean;
	embeddedInWorkspace?: boolean;
}) {
	const technical = uiMode === "technical";
	const chatTab = technical ? "Session Chat" : "Chat";
	const docked = technical && technicalDock != null;
	const embedPane = Boolean(embeddedInWorkspace);
	const widthClass = embedPane
		? ""
		: technical && !docked
			? "w-[min(440px,40vw)]"
			: !technical
				? "w-[min(560px,48vw)]"
				: "";
	const [input, setInput] = useState("");
	const [teamPaneOpen, setTeamPaneOpen] = useState(false);
	const [pulseTeam, setPulseTeam] = useState<string | null>(null);
	const [pulseStreamDetail, setPulseStreamDetail] = useState(true);
	const [attachment, setAttachment] = useState<{ name: string; text: string } | null>(null);
	const [attachErr, setAttachErr] = useState<string | null>(null);
	const endRef = useRef<HTMLDivElement>(null);
	const fileRef = useRef<HTMLInputElement>(null);

	const pending = chatQueuePending ?? 0;
	const assistantShort = chatAgentName?.trim() || "Assistant";

	const teamNames = useMemo(() => Object.keys(agentTeams ?? {}), [agentTeams]);
	useEffect(() => {
		if (!agentTeams || teamNames.length === 0) {
			setPulseTeam(null);
			return;
		}
		setPulseTeam((prev: string | null) =>
			prev && agentTeams[prev] ? prev : (teamNames[0] ?? null),
		);
	}, [agentTeams, teamNames]);

	const pulseRoster = pulseTeam && agentTeams?.[pulseTeam] ? agentTeams[pulseTeam] : [];
	const pulseMembers = useMemo(
		() => buildPulseMembersFromRoster(pulseRoster, agents ?? []),
		[pulseRoster, agents],
	);

	const submit = (e: FormEvent) => {
		e.preventDefault();
		if (!connected) return;
		const msg = buildChatMessageWithAttachment(input, attachment).trim();
		if (!msg) return;
		onSend(msg);
		setInput("");
		setAttachment(null);
		setAttachErr(null);
		setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
	};

	const onPickFile = async (list: FileList | null) => {
		setAttachErr(null);
		const f = list?.[0];
		if (!f) return;
		if (f.size > 512 * 1024) {
			setAttachErr("File too large (max 512 KiB for chat attachment).");
			return;
		}
		const text = await f.text();
		if (text.length > MAX_CHAT_ATTACHMENT_CHARS) {
			setAttachErr(`Attachment text too long (max ${MAX_CHAT_ATTACHMENT_CHARS} characters).`);
			return;
		}
		setAttachment({ name: f.name, text });
		if (fileRef.current) fileRef.current.value = "";
	};

	const outerStyle: CSSProperties | undefined = docked
		? technicalDock.region === "right"
			? { width: "100%", minHeight: 0, flex: "1 1 0%" }
			: dockPanelFrame
				? { minHeight: 0, flex: "1 1 0%", height: "100%" }
				: {
						height: technicalDock.sizePx,
						minHeight: 120,
						maxHeight: 720,
					}
		: embedPane
			? { minHeight: 0, minWidth: 0, flex: "1 1 0%" }
			: undefined;

	const framed = Boolean(dockPanelFrame && docked);
	const outerClass = docked
		? technicalDock.region === "right"
			? `flex min-h-0 min-w-0 flex-1 flex-col bg-[#1e1e1e]${framed ? "" : " border-l border-[#3c3c3c]"}`
			: `flex w-full min-h-0 shrink-0 flex-col bg-[#1e1e1e]${framed ? "" : " border-t border-[#3c3c3c]"}`
		: embedPane
			? "flex min-h-0 min-w-0 flex-1 flex-col bg-[#1e1e1e]"
			: `flex min-h-0 ${widthClass} shrink-0 flex-col border-l border-[#3c3c3c] bg-[#1e1e1e]`;

	return (
		<div className={outerClass} style={outerStyle} data-wop-chat-root>
			<div className="flex h-9 min-w-0 shrink-0 items-stretch overflow-hidden bg-[#252526]">
				{/* Tabs use full header width; dock + New sit on top so extra tabs scroll sideways underneath the fixed chrome. */}
				<div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
					<div
						className="scrollbar-hide absolute inset-0 overflow-x-auto overflow-y-hidden"
						role="tablist"
						aria-label="Chat sessions"
					>
						<div
							className={`flex h-full items-stretch ${
								docked ? "pr-[9.5rem]" : onNewSession && !teamPaneOpen ? "pr-24" : "pr-1"
							}`}
						>
							{chatTabs.map((tab) => {
								const active = activeChatTabId === tab.id && !teamPaneOpen;
								const canClose = Boolean(onCloseChatTab) && chatTabs.length > 1;
								const closeDisabled = streaming && activeChatTabId === tab.id;
								const label = technical
									? tab.label
									: tab.label.replace(/^(Session Chat|New chat)$/, "Chat");
								return (
									<div
										key={tab.id}
										role="presentation"
										className={`flex max-w-[min(240px,42vw)] shrink-0 items-stretch border-r border-t border-[#3c3c3c] text-[13px] ${
											active
												? "border-t-[#ea580c] border-r-[#2d2d2d] bg-[#1e1e1e] text-white"
												: "border-t-transparent border-b border-b-[#252526] text-[#858585]"
										}`}
									>
										<button
											type="button"
											role="tab"
											aria-selected={active}
											onClick={() => {
												setTeamPaneOpen(false);
												onSelectChatTab(tab.id);
											}}
											className={`flex min-w-0 flex-1 items-center px-2.5 text-left ${
												active ? "" : "hover:text-[#cccccc]"
											}`}
											title={tab.label}
										>
											<span className="truncate">{label}</span>
										</button>
										{canClose ? (
											<button
												type="button"
												aria-label={`Close ${tab.label}`}
												title={
													closeDisabled
														? "Wait for the current reply to finish before closing this tab"
														: `Close ${tab.label}`
												}
												disabled={closeDisabled}
												onClick={(e) => {
													e.stopPropagation();
													onCloseChatTab?.(tab.id);
												}}
												className={`flex w-7 shrink-0 items-center justify-center border-l border-transparent hover:border-[#3c3c3c] hover:bg-[#2a2d2e] disabled:cursor-not-allowed disabled:opacity-40 ${
													active ? "text-[#cccccc]" : "text-[#858585] hover:text-[#cccccc]"
												}`}
											>
												<X size={13} strokeWidth={2} />
											</button>
										) : null}
									</div>
								);
							})}
						</div>
					</div>
					<div
						className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-stretch"
						data-wop-chat-session-actions
					>
						<div className="pointer-events-auto flex h-full flex-nowrap items-center gap-0.5 border-l border-[#3c3c3c] bg-[#252526] pl-1 pr-1 shadow-[-12px_0_18px_6px_#252526]">
							{docked ? (
								<>
									<button
										type="button"
										title="Dock agents to the right"
										onClick={() => technicalDock.onSetRegion("right")}
										className={`rounded p-1.5 ${technicalDock.region === "right" ? "bg-[#37373d] text-white" : "text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"}`}
									>
										<PanelRight size={15} strokeWidth={1.75} />
									</button>
									<button
										type="button"
										title="Dock agents to the bottom"
										onClick={() => technicalDock.onSetRegion("bottom")}
										className={`rounded p-1.5 ${technicalDock.region === "bottom" ? "bg-[#37373d] text-white" : "text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"}`}
									>
										<PanelBottom size={15} strokeWidth={1.75} />
									</button>
									<button
										type="button"
										title="Hide agent panel (View menu or palette to show again)"
										onClick={() => technicalDock.onHidePanel()}
										className="rounded p-1.5 text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
									>
										<SidebarClose size={15} strokeWidth={1.75} />
									</button>
								</>
							) : null}
							{onNewSession && !teamPaneOpen ? (
								<button
									type="button"
									title={
										streaming
											? "Wait for the current reply to finish before starting a new session"
											: "New chat — add a tab and start a fresh session on the server for this connection"
									}
									disabled={!connected || streaming}
									onClick={() => onNewSession()}
									className="flex shrink-0 items-center gap-1 rounded px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-[#cccccc] hover:bg-[#3c3c3c] disabled:cursor-not-allowed disabled:opacity-40"
								>
									<MessageSquarePlus size={14} className="shrink-0" />
									<span className="hidden sm:inline">New</span>
								</button>
							) : null}
						</div>
					</div>
				</div>
			</div>

			<div
				className={`flex min-h-0 flex-1 flex-col overflow-y-auto text-[13px] ${technical ? "gap-4 p-4" : "gap-5 p-5"}`}
			>
				{teamPaneOpen ? (
					<div className="min-h-0 font-mono text-[12px] leading-relaxed text-[#858585]">
						{agentsLoading ? (
							<p className="text-[#a3a3a3]">Loading workspace agents…</p>
						) : teamNames.length === 0 ? (
							<div className="rounded border border-[#3c3c3c] bg-[#252526] p-4">
								<p className="mb-2 text-[#cccccc]">No teams in workspace</p>
								<p>
									Pi <strong className="text-[#d4d4d4]">agent-team</strong> reads{" "}
									<code className="text-[#fb923c]">.pi/agents/teams.yaml</code>. Add rosters there, refresh
									the tree or reload the app, then open this tab again.
								</p>
								<p className="mt-3">
									<button
										type="button"
										className="text-[#fb923c] underline"
										onClick={() => setTeamPaneOpen(false)}
									>
										{chatTab}
									</button>{" "}
									— message the main session (dispatcher) here in the web UI.
								</p>
							</div>
						) : (
							<>
								{teamNames.length > 1 ? (
									<label className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-[#cccccc]">
										<span className="text-[#858585]">Team</span>
										<select
											value={pulseTeam ?? ""}
											onChange={(e) => setPulseTeam(e.target.value || null)}
											className="max-w-full rounded border border-[#3c3c3c] bg-[#252526] px-2 py-1 font-mono text-[11px] text-[#d4d4d4]"
										>
											{teamNames.map((n: string) => (
												<option key={n} value={n}>
													{n}
												</option>
											))}
										</select>
									</label>
								) : null}
								{pulseTeam && pulseMembers.length > 0 ? (
									<AgentTeamPulseGrid
										activeTeamName={pulseTeam}
										members={pulseMembers}
										streamDetail={pulseStreamDetail}
										onStreamDetailChange={setPulseStreamDetail}
									/>
								) : (
									<p className="text-[#a3a3a3]">Selected team has no members in YAML.</p>
								)}
							</>
						)}
					</div>
				) : null}
				{!teamPaneOpen && !connected ? (
					<div
						className={`text-[#ce9178] ${technical ? "font-mono text-[12px]" : "text-[13px]"}`}
					>
						Connecting to server…
					</div>
				) : null}
				{!teamPaneOpen && error ? (
					<button
						type="button"
						onClick={onClearError}
						className="w-full rounded border border-[#f14c4c]/40 bg-[#f14c4c]/10 p-2 text-left font-mono text-[12px] text-[#f14c4c]"
					>
						{error}
						<span className="mt-1 block text-[#858585]">Click to dismiss</span>
					</button>
				) : null}
				{!teamPaneOpen
					? rows.map((msg) => (
							<div key={msg.id} className="flex w-full flex-col gap-1">
								<div className="flex items-center justify-between">
									<span
										className={
											technical
												? "font-mono text-[11px] uppercase text-[#858585]"
												: "text-[12px] font-medium text-[#858585]"
										}
									>
										{technical
											? msg.role === "user"
												? "USER"
												: assistantShort.toUpperCase()
											: msg.role === "user"
												? "You"
												: assistantShort}
									</span>
									<span className={`text-[#555555] ${technical ? "font-mono text-[10px]" : "text-[11px]"}`}>
										{msg.timestamp}
									</span>
								</div>
								<div
									className={`w-full leading-relaxed ${
										technical ? "p-3 font-mono" : "rounded-md p-4 font-sans text-[14px]"
									} ${
										msg.role === "user"
											? "border border-[#ea580c]/30 bg-[#ea580c]/10 text-[#d4d4d4]"
											: "border border-[#3c3c3c] bg-[#252526] text-[#cccccc]"
									}`}
								>
									<div className="whitespace-pre-wrap">{msg.content}</div>
								</div>
							</div>
						))
					: null}
				{!teamPaneOpen && streaming ? (
					<div className="flex flex-col gap-1">
						<span
							className={
								technical
									? "font-mono text-[11px] uppercase text-[#858585]"
									: "text-[12px] text-[#858585]"
							}
						>
							{technical ? `${assistantShort.toUpperCase()} (streaming)` : `${assistantShort} is replying…`}
						</span>
						<div className="flex items-center gap-2 border border-[#3c3c3c] bg-[#252526] p-3">
							<div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#858585]" />
							<div
								className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#858585]"
								style={{ animationDelay: "150ms" }}
							/>
							<div
								className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#858585]"
								style={{ animationDelay: "300ms" }}
							/>
						</div>
					</div>
				) : null}
				{!teamPaneOpen ? <div ref={endRef} /> : null}
			</div>

			<div className="shrink-0 border-t border-[#3c3c3c] bg-[#252526] p-3">
				{pending > 0 && !teamPaneOpen ? (
					<p className="mb-2 font-mono text-[10px] text-[#858585]">
						{pending} message{pending === 1 ? "" : "s"} queued — will run after the current reply.
					</p>
				) : null}
				{attachErr ? (
					<p className="mb-2 font-mono text-[11px] text-[#ce9178]">
						{attachErr}{" "}
						<button type="button" className="underline" onClick={() => setAttachErr(null)}>
							Dismiss
						</button>
					</p>
				) : null}
				{attachment ? (
					<div className="mb-2 flex items-center justify-between rounded border border-[#ea580c]/40 bg-[#ea580c]/10 px-2 py-1.5 font-mono text-[11px] text-[#fed7aa]">
						<span className="truncate">Attached: {attachment.name}</span>
						<button
							type="button"
							onClick={() => setAttachment(null)}
							className="shrink-0 rounded p-1 hover:bg-[#ea580c]/20"
							aria-label="Remove attachment"
						>
							<X size={14} />
						</button>
					</div>
				) : null}
				<form
					onSubmit={submit}
					className="flex flex-col border border-[#3c3c3c] bg-[#3c3c3c] transition-colors focus-within:border-[#ea580c]"
				>
					<input
						ref={fileRef}
						type="file"
						className="hidden"
						accept=".txt,.md,.ts,.tsx,.js,.jsx,.json,.yaml,.yml,.py,.rs,.go,.css,.html,.sh,.env.sample"
						onChange={(e) => void onPickFile(e.target.files)}
					/>
					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								submit(e);
							}
						}}
						placeholder={
							!connected
								? technical
									? "> Not connected — type here; Send when the server WebSocket is up"
									: "Not connected — type here; Send when the server is up"
								: technical && chatMode === "plan"
									? `> Plan: goal, constraints, files — save as ${examplePlanPathForToday()} — Enter to send`
									: technical
										? streaming
											? "> Queue next message (Enter) — runs when the assistant finishes"
											: "> Message (Enter to send, Shift+Enter newline)"
										: streaming
											? "Queue next message (Enter) — runs when the assistant finishes"
											: "Type a message… (Enter to send, Shift+Enter for new line)"
						}
						className="max-h-48 min-h-[60px] w-full resize-none bg-transparent p-3 font-mono text-[13px] text-[#cccccc] outline-none placeholder:text-[#858585]"
					/>
					<div className="flex items-center justify-between gap-2 border-t border-[#3c3c3c] bg-[#2d2d2d] p-1.5">
						<div className="flex min-w-0 flex-1 items-center gap-2">
							<button
								type="button"
								onClick={() => fileRef.current?.click()}
								disabled={!connected}
								className="shrink-0 p-1.5 text-[#858585] hover:text-[#cccccc] disabled:opacity-40"
								aria-label="Attach file"
								title="Attach a text file (appended to your message, same as Simple UI)"
							>
								<Paperclip size={14} />
							</button>
							{technical && onChatAgentChange ? (
								<select
									value={chatAgentName ?? ""}
									disabled={!connected || streaming || agentsLoading}
									title="Pi agent markdown (agents/, .claude/agents/, .pi/agents/, .cursor/agents/)"
									onChange={(e) => {
										const v = e.target.value;
										onChatAgentChange(v === "" ? null : v);
									}}
									className="min-w-0 max-w-[min(200px,50%)] shrink rounded border border-[#3c3c3c] bg-[#1e1e1e] px-1.5 py-1 font-mono text-[10px] text-[#cccccc] outline-none focus:border-[#ea580c] disabled:opacity-40"
								>
									<option value="">Default assistant</option>
									{(agents ?? []).map((a) => (
										<option key={a.name} value={a.name} title={a.description || a.relativePath}>
											{a.name}
										</option>
									))}
								</select>
							) : null}
							<button
								type="button"
								onClick={() => setTeamPaneOpen((o) => !o)}
								title="Workspace team roster (Pi agent-team / teams.yaml)"
								className={`shrink-0 rounded border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide transition-colors ${
									teamPaneOpen
										? "border-[#ea580c] bg-[#ea580c]/15 text-[#fed7aa]"
										: "border-[#3c3c3c] bg-[#1e1e1e] text-[#858585] hover:border-[#555555] hover:text-[#cccccc]"
								}`}
							>
								Team
							</button>
							{technical && onOpenAgentTeamInPane ? (
								<button
									type="button"
									onClick={() => {
										setTeamPaneOpen(false);
										onOpenAgentTeamInPane();
									}}
									title="Open agent team roster as a workspace tab (chat stays on messages)"
									className="shrink-0 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-[#858585] hover:border-[#555555] hover:text-[#cccccc]"
								>
									Pane team
								</button>
							) : null}
						</div>
						<div className="flex shrink-0 items-center gap-2">
							{technical && chatMode && onChatModeChange && !teamPaneOpen ? (
								<div
									className="flex shrink-0 rounded border border-[#3c3c3c] bg-[#1e1e1e] p-0.5"
									title="Build vs Plan — saved locally; the server applies it when the chat WebSocket is connected. Disabled only while a reply is streaming."
								>
									<button
										type="button"
										disabled={streaming}
										onClick={() => onChatModeChange("build")}
										className={`rounded px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${
											chatMode === "build" ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
										} disabled:opacity-40`}
									>
										Build
									</button>
									<button
										type="button"
										disabled={streaming}
										onClick={() => onChatModeChange("plan")}
										className={`rounded px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${
											chatMode === "plan" ? "bg-[#c586c0]/90 text-white" : "text-[#858585] hover:text-[#cccccc]"
										} disabled:opacity-40`}
									>
										Plan
									</button>
								</div>
							) : null}
							{streaming && !teamPaneOpen ? (
								<button
									type="button"
									onClick={onStop}
									className={`flex items-center gap-2 border border-[#ff0000]/30 bg-[#801010] px-3 py-1 text-[#ffcccc] hover:bg-[#a01010] ${technical ? "font-mono text-[11px] uppercase tracking-wider" : "text-[12px]"}`}
								>
									<Square size={10} fill="currentColor" /> Stop
								</button>
							) : null}
							<button
								type="submit"
								disabled={(!input.trim() && !attachment) || !connected}
								className={`flex items-center gap-2 bg-[#ea580c] px-4 py-1 text-white hover:bg-[#c2410c] disabled:opacity-50 ${technical ? "font-mono text-[11px] uppercase tracking-wider" : "text-[13px]"}`}
							>
								<Send size={12} /> Send
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
