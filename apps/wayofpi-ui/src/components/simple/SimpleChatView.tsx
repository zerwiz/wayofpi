import { Brain, Cpu, FileCode2, Paperclip, Send, Square, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { AgentMeta } from "../../hooks/useAgents";
import type { ChatRow, ChatSessionMode } from "../../hooks/useWayOfPiSession";
import {
	buildChatMessageWithAttachment,
	MAX_CHAT_ATTACHMENT_CHARS,
} from "../../lib/chatAttachment";
import { languageLabel, parseMessageSegments } from "../../lib/parseMessageSegments";
import { chatErrorSuggestsModelFix } from "../../utils/chatErrorModelHint";
import {
	applySlashCompletion,
	slashMenuAtCursor,
	type SlashMenuState,
} from "../../utils/chatSlashAutocomplete";

/** Simple shell — **wired**: chat rows, agent picker, WebSocket send/stop (Pi tools in browser per server notes). */
export function SimpleChatView({
	rows,
	streaming,
	connected,
	error,
	modelLabel,
	onSend,
	onStop,
	onClearError,
	onReopenLlmFixModal,
	appearanceDark,
	agents,
	agentsLoading,
	chatAgentName,
	onChatAgentChange,
	chatMode,
	onChatModeChange,
	chatStreamUiEnabled,
	onChatStreamUiEnabledChange,
	chatQueuePending = 0,
}: {
	rows: ChatRow[];
	streaming: boolean;
	chatStreamUiEnabled: boolean;
	onChatStreamUiEnabledChange: (on: boolean) => void;
	connected: boolean;
	error: string | null;
	modelLabel: string;
	onSend: (text: string) => void;
	onStop: () => void;
	onClearError: () => void;
	/** Re-show the model/provider fix dialog (App-level). */
	onReopenLlmFixModal?: () => void;
	appearanceDark: boolean;
	agents: AgentMeta[];
	agentsLoading: boolean;
	chatAgentName: string | null;
	onChatAgentChange: (name: string | null) => void;
	chatMode: ChatSessionMode;
	onChatModeChange: (m: ChatSessionMode) => void;
	/** Server-side messages waiting after the current assistant turn. */
	chatQueuePending?: number;
}) {
	const [input, setInput] = useState("");
	const [attachment, setAttachment] = useState<{ name: string; text: string } | null>(null);
	const [attachErr, setAttachErr] = useState<string | null>(null);
	const [caretPos, setCaretPos] = useState(0);
	const [slashHighlight, setSlashHighlight] = useState(0);
	const endRef = useRef<HTMLDivElement>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [rows, streaming]);

	const buildMessage = (body: string) => buildChatMessageWithAttachment(body, attachment);

	const submit = (e: FormEvent) => {
		e.preventDefault();
		const msg = buildMessage(input);
		if (!msg || !connected) return;
		onSend(msg);
		setInput("");
		setAttachment(null);
		setAttachErr(null);
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

	const assistantTitle = chatAgentName ? chatAgentName : "Orchestrator";
	const assistantSubtitle =
		modelLabel && modelLabel !== "…" ? `Powered by ${modelLabel}` : "Ready when the server connects.";

	const borderHero = appearanceDark ? "border-[#3c3c3c]" : "border-[#e5e5e5]";
	const titleC = appearanceDark ? "text-[#cccccc]" : "text-[#333333]";
	const subC = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const composerBg = appearanceDark ? "border-[#3c3c3c] bg-[#252526]" : "border-[#e5e5e5] bg-white";
	const composerOuter = appearanceDark ? "bg-[#1e1e1e]" : "bg-[#f3f3f3]";
	const canSend = !!(input.trim() || attachment) && connected;

	const slashMenu = useMemo(() => slashMenuAtCursor(input, caretPos), [input, caretPos]);
	const slashMenuKey = slashMenu ? slashMenu.filtered.map((c) => c.id).join("|") : "";
	useEffect(() => {
		setSlashHighlight(0);
	}, [slashMenuKey]);

	const applySlashPick = (commandId: string, menuState: SlashMenuState | null = slashMenu) => {
		if (!menuState) return;
		const { value: next, caret } = applySlashCompletion(
			input,
			menuState.lineStart,
			menuState.replaceTo,
			commandId,
		);
		setInput(next);
		setCaretPos(caret);
		queueMicrotask(() => {
			const el = textareaRef.current;
			if (!el) return;
			el.focus();
			el.setSelectionRange(caret, caret);
		});
	};

	const slashListBorder = appearanceDark ? "border-[#ea580c]/35 bg-[#1e1e1e]" : "border-[#ea580c]/40 bg-white";
	const slashItemHi = appearanceDark
		? "bg-[#ea580c]/20 text-[#fed7aa]"
		: "bg-[#ea580c]/15 text-[#9a3412]";
	const slashItem = appearanceDark
		? "text-[#cccccc] hover:bg-[#2d2d2d]"
		: "text-[#333333] hover:bg-[#f5f5f5]";
	const slashMuted = appearanceDark ? "text-[#858585]" : "text-[#616161]";
	const slashAccent = appearanceDark ? "text-[#ea580c]" : "text-[#c2410c]";

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden" data-wop-chat-root>
			<div className={`flex flex-1 justify-center overflow-y-auto p-4 md:p-8 ${appearanceDark ? "" : "bg-[#f3f3f3]"}`}>
				<div className="flex w-full max-w-3xl flex-col gap-6 pb-4">
					<div className={`mb-2 flex flex-col gap-4 border-b pb-4 ${borderHero}`}>
						<div className="flex items-center gap-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ea580c]/30 bg-[#ea580c]/20 shadow-sm">
								<Brain className="text-[#fb923c]" size={28} />
							</div>
							<div>
								<h1 className={`text-2xl font-extrabold tracking-tight ${titleC}`}>
									Chat with {assistantTitle}
								</h1>
								<p className={`text-sm font-medium ${subC}`}>{assistantSubtitle}</p>
							</div>
						</div>
					</div>

					{!connected ? (
						<div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
							Connecting to server…
						</div>
					) : null}
					{error ? (
						<div className="w-full rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-left text-sm text-red-300">
							<p className="whitespace-pre-wrap">{error}</p>
							<div className={`mt-3 flex flex-wrap items-center gap-2 ${subC}`}>
								{onReopenLlmFixModal && chatErrorSuggestsModelFix(error) ? (
									<button
										type="button"
										onClick={onReopenLlmFixModal}
										className="rounded-lg border border-[#ea580c]/50 bg-[#ea580c]/20 px-3 py-1.5 text-xs font-semibold text-[#fdba74] hover:bg-[#ea580c]/30"
									>
										Fix model / provider…
									</button>
								) : null}
								<button
									type="button"
									onClick={onClearError}
									className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs hover:bg-red-500/15"
								>
									Dismiss
								</button>
							</div>
						</div>
					) : null}
					{attachErr ? (
						<div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
							{attachErr}
							<button type="button" className="ml-2 underline" onClick={() => setAttachErr(null)}>
								Dismiss
							</button>
						</div>
					) : null}

					{rows.map((msg) => (
						<div
							key={msg.id}
							className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
						>
							<div
								className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm ${
									msg.role === "user"
										? "border-[#ea580c]/30 bg-[#ea580c]/20 text-[#fb923c]"
										: appearanceDark
											? "border-[#3c3c3c] bg-[#3c3c3c] text-[#cccccc]"
											: "border-[#e5e5e5] bg-[#e8e8e8] text-[#616161]"
								}`}
							>
								{msg.role === "user" ? <Users size={18} /> : <Cpu size={18} />}
							</div>
							<div
								className={`flex max-w-[85%] flex-col gap-1.5 md:max-w-[80%] ${
									msg.role === "user" ? "items-end" : "items-start"
								}`}
							>
								<span className={`px-1 text-[13px] font-bold ${subC}`}>
									{msg.role === "user" ? "You" : assistantTitle}
								</span>
								<div
									className={`rounded-2xl p-5 shadow-sm ${
										msg.role === "user"
											? appearanceDark
												? "rounded-tr-sm border border-[#ea580c]/30 bg-[#ea580c]/10 text-[#d4d4d4]"
												: "rounded-tr-sm border border-[#ea580c]/40 bg-[#ea580c]/12 text-[#333333]"
											: appearanceDark
												? "rounded-tl-sm border border-[#3c3c3c] bg-[#252526] text-[#cccccc]"
												: "rounded-tl-sm border border-[#e5e5e5] bg-white text-[#333333]"
									}`}
								>
									{msg.role === "assistant" ? (
										<div className="flex flex-col gap-2">
											{parseMessageSegments(msg.content).map((seg, i) =>
												seg.type === "text" ? (
													<p key={i} className="whitespace-pre-wrap text-[15px] leading-relaxed">
														{seg.text}
													</p>
												) : (
													<div
														key={i}
														className={`mt-2 overflow-hidden rounded-xl border shadow-inner first:mt-0 ${
															appearanceDark
																? "border-[#3c3c3c] bg-[#1e1e1e]"
																: "border-[#e5e5e5] bg-[#f3f3f3]"
														}`}
													>
														<div
															className={`flex items-center justify-between border-b px-4 py-3 ${
																appearanceDark
																	? "border-[#3c3c3c] bg-[#252526]"
																	: "border-[#e5e5e5] bg-[#ececec]"
															}`}
														>
															<span
																className={`flex items-center gap-2 font-mono text-sm ${appearanceDark ? "text-[#cccccc]" : "text-[#333333]"}`}
															>
																<FileCode2 size={16} className="text-[#fb923c]" />
																{seg.filename}
															</span>
															<span
																className={`rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wider ${appearanceDark ? "bg-[#3c3c3c] text-[#858585]" : "bg-[#e8e8e8] text-[#616161]"}`}
															>
																{languageLabel(seg.language)} code
															</span>
														</div>
														<pre
															className={`overflow-x-auto whitespace-pre p-4 font-mono text-[14px] leading-relaxed ${appearanceDark ? "text-[#cccccc]" : "text-[#333333]"}`}
														>
															{seg.body}
														</pre>
													</div>
												),
											)}
										</div>
									) : (
										<p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</p>
									)}
								</div>
								<span className={`px-1 text-[11px] ${appearanceDark ? "text-[#858585]" : "text-[#616161]"}`}>
									{msg.timestamp}
								</span>
							</div>
						</div>
					))}

					{streaming ? (
						chatStreamUiEnabled ? (
							<div className="flex gap-4">
								<div
									className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm ${appearanceDark ? "border-[#3c3c3c] bg-[#3c3c3c] text-[#cccccc]" : "border-[#e5e5e5] bg-[#e8e8e8] text-[#616161]"}`}
								>
									<Cpu size={18} />
								</div>
								<div className="flex max-w-[80%] flex-col items-start gap-1.5">
									<span className={`px-1 text-[13px] font-bold ${subC}`}>{assistantTitle}</span>
									<div
										className={`flex h-14 items-center gap-1.5 rounded-2xl rounded-tl-sm border px-5 shadow-sm ${appearanceDark ? "border-[#3c3c3c] bg-[#252526]" : "border-[#e5e5e5] bg-white"}`}
									>
										<div className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#858585]" />
										<div
											className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#858585]"
											style={{ animationDelay: "150ms" }}
										/>
										<div
											className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#858585]"
											style={{ animationDelay: "300ms" }}
										/>
									</div>
								</div>
							</div>
						) : (
							<div className="flex gap-4">
								<div
									className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm ${appearanceDark ? "border-[#3c3c3c] bg-[#3c3c3c] text-[#cccccc]" : "border-[#e5e5e5] bg-[#e8e8e8] text-[#616161]"}`}
								>
									<Cpu size={18} />
								</div>
								<div className="flex max-w-[80%] flex-col items-start gap-1.5">
									<span className={`px-1 text-[13px] font-bold ${subC}`}>{assistantTitle}</span>
									<p
										className={`rounded-2xl rounded-tl-sm border px-4 py-3 text-sm leading-relaxed shadow-sm ${appearanceDark ? "border-[#3c3c3c] bg-[#252526] text-[#858585]" : "border-[#e5e5e5] bg-white text-[#616161]"}`}
									>
										Generating reply…
									</p>
								</div>
							</div>
						)
					) : null}
					<div ref={endRef} />
				</div>
			</div>

			<div className={`z-20 p-4 md:p-6 ${composerOuter}`}>
				<div
					className={`mx-auto mb-3 flex w-full max-w-3xl flex-wrap items-end gap-3 border-t pt-4 md:pt-5 ${appearanceDark ? "border-[#3c3c3c]" : "border-[#e5e5e5]"}`}
				>
					<label className={`flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide ${subC}`}>
						Workspace agent
						<select
							value={chatAgentName ?? ""}
							disabled={!connected || streaming || agentsLoading}
							onChange={(e) => {
								const v = e.target.value;
								onChatAgentChange(v === "" ? null : v);
							}}
							className={`rounded-lg border px-3 py-2 text-sm font-normal normal-case ${appearanceDark ? "border-[#3c3c3c] bg-[#252526] text-[#cccccc]" : "border-[#d4d4d4] bg-white text-[#333333]"}`}
						>
							<option value="">Orchestrator</option>
							{agents.map((a) => (
								<option key={a.name} value={a.name} title={a.description}>
									{a.name}
								</option>
							))}
						</select>
					</label>
					<div className="flex flex-col gap-1">
						<span className={`text-xs font-semibold uppercase tracking-wide ${subC}`}>Mode</span>
						<div
							className={`flex rounded-lg border p-0.5 ${appearanceDark ? "border-[#3c3c3c] bg-[#252526]" : "border-[#d4d4d4] bg-[#ececec]"}`}
						>
							<button
								type="button"
								disabled={streaming}
								onClick={() => onChatModeChange("build")}
								className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase ${
									chatMode === "build"
										? "bg-[#ea580c] text-white"
										: appearanceDark
											? "text-[#858585]"
											: "text-[#616161]"
								} disabled:opacity-40`}
							>
								Build
							</button>
							<button
								type="button"
								disabled={streaming}
								onClick={() => onChatModeChange("plan")}
								className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase ${
									chatMode === "plan"
										? "bg-[#c586c0]/90 text-white"
										: appearanceDark
											? "text-[#858585]"
											: "text-[#616161]"
								} disabled:opacity-40`}
							>
								Plan
							</button>
						</div>
					</div>
					<div className="flex flex-col gap-1">
						<span
							className={`text-xs font-semibold uppercase tracking-wide ${subC}`}
							title="Live stream shows tokens as they arrive; off waits for the full reply"
						>
							Stream
						</span>
						<div
							className={`flex rounded-lg border p-0.5 ${appearanceDark ? "border-[#3c3c3c] bg-[#252526]" : "border-[#d4d4d4] bg-[#ececec]"}`}
						>
							<button
								type="button"
								disabled={streaming}
								aria-pressed={chatStreamUiEnabled}
								onClick={() => onChatStreamUiEnabledChange(true)}
								className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase ${
									chatStreamUiEnabled
										? "bg-[#ea580c] text-white"
										: appearanceDark
											? "text-[#858585]"
											: "text-[#616161]"
								} disabled:opacity-40`}
								title="Show the reply as it streams (token by token)"
							>
								On
							</button>
							<button
								type="button"
								disabled={streaming}
								aria-pressed={!chatStreamUiEnabled}
								onClick={() => onChatStreamUiEnabledChange(false)}
								className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase ${
									!chatStreamUiEnabled
										? "bg-[#ea580c] text-white"
										: appearanceDark
											? "text-[#858585]"
											: "text-[#616161]"
								} disabled:opacity-40`}
								title="Hide streaming; show the full message when the model finishes"
							>
								Off
							</button>
						</div>
					</div>
				</div>
				{attachment ? (
					<div className="mx-auto mb-2 flex max-w-3xl items-center justify-between rounded-xl border border-[#ea580c]/40 bg-[#ea580c]/10 px-3 py-2 text-sm text-[#fed7aa]">
						<span className="truncate font-mono text-xs">Attached: {attachment.name}</span>
						<button
							type="button"
							onClick={() => setAttachment(null)}
							className="shrink-0 rounded p-1 hover:bg-[#ea580c]/20"
							aria-label="Remove attachment"
						>
							<X size={16} />
						</button>
					</div>
				) : null}
				{chatQueuePending > 0 ? (
					<p
						className={`mx-auto mb-2 max-w-3xl text-center text-xs ${appearanceDark ? "text-[#858585]" : "text-[#616161]"}`}
					>
						{chatQueuePending} message{chatQueuePending === 1 ? "" : "s"} queued — will run after the current reply.
					</p>
				) : null}
				<form
					onSubmit={submit}
					className={`relative mx-auto flex max-w-3xl flex-col gap-0 rounded-2xl border p-2.5 shadow-md transition-all focus-within:border-[#ea580c] focus-within:ring-1 focus-within:ring-[#ea580c]/40 ${composerBg}`}
				>
					<input
						ref={fileRef}
						type="file"
						className="hidden"
						accept=".txt,.md,.ts,.tsx,.js,.jsx,.json,.yaml,.yml,.py,.rs,.go,.css,.html,.sh,.env.sample"
						onChange={(e) => void onPickFile(e.target.files)}
					/>
					<div className="flex w-full items-end gap-2">
					<button
						type="button"
						onClick={() => fileRef.current?.click()}
						disabled={!connected}
						className={`rounded-xl p-3 transition-colors disabled:opacity-40 ${appearanceDark ? "text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]" : "text-[#616161] hover:bg-[#e5e5e5] hover:text-[#333333]"}`}
						title="Attach a text file (appended to your message)"
					>
						<Paperclip size={22} />
					</button>
					<div className="relative min-w-0 flex-1">
						{slashMenu && slashMenu.filtered.length > 0 ? (
							<ul
								className={`absolute bottom-full left-0 right-0 z-20 mb-1 max-h-52 overflow-auto rounded-lg border py-1 shadow-lg ${slashListBorder}`}
								role="listbox"
								aria-label="Slash commands"
							>
								{slashMenu.filtered.map((c, i) => (
									<li key={c.id}>
										<button
											type="button"
											role="option"
											aria-selected={i === slashHighlight}
											className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left font-mono text-[11px] leading-snug ${
												i === slashHighlight ? slashItemHi : slashItem
											}`}
											onMouseEnter={() => setSlashHighlight(i)}
											onMouseDown={(ev) => {
												ev.preventDefault();
												applySlashPick(c.id, slashMenu);
											}}
										>
											<span className={`font-bold ${slashAccent}`}>/{c.id}</span>
											<span className={`text-[10px] font-normal ${slashMuted}`}>{c.detail}</span>
										</button>
									</li>
								))}
							</ul>
						) : null}
						<textarea
							ref={textareaRef}
							value={input}
							onChange={(e) => {
								setInput(e.target.value);
								setCaretPos(e.target.selectionStart);
							}}
							onSelect={(e) => setCaretPos(e.currentTarget.selectionStart)}
							onClick={(e) => setCaretPos(e.currentTarget.selectionStart)}
							onKeyUp={(e) => setCaretPos(e.currentTarget.selectionStart)}
							onKeyDown={(e) => {
								const menu = slashMenuAtCursor(input, e.currentTarget.selectionStart);
								if (menu && menu.filtered.length > 0) {
									if (e.key === "ArrowDown") {
										e.preventDefault();
										setSlashHighlight((h) => Math.min(h + 1, menu.filtered.length - 1));
										return;
									}
									if (e.key === "ArrowUp") {
										e.preventDefault();
										setSlashHighlight((h) => Math.max(h - 1, 0));
										return;
									}
									if (e.key === "Tab") {
										e.preventDefault();
										const pick = menu.filtered[slashHighlight];
										if (pick) applySlashPick(pick.id, menu);
										return;
									}
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										const pick = menu.filtered[slashHighlight];
										if (pick) applySlashPick(pick.id, menu);
										return;
									}
								}
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									submit(e);
								}
							}}
							placeholder={
								!connected
									? `Tell ${assistantTitle} what to do next… (Send when connected)`
									: `Tell ${assistantTitle} what to do next…`
							}
							rows={1}
							className={`max-h-40 min-h-[48px] w-full resize-none border-none bg-transparent py-3 pl-2 pr-2 text-[15px] font-medium outline-none ring-0 placeholder:text-[#858585] ${appearanceDark ? "text-[#cccccc]" : "text-[#333333]"}`}
						/>
					</div>
					<div className="flex gap-2 p-1">
						{streaming ? (
							<button
								type="button"
								onClick={onStop}
								className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-600 active:scale-95"
							>
								<Square size={16} fill="currentColor" />
								<span className="hidden sm:inline">Stop</span>
							</button>
						) : null}
						<button
							type="submit"
							disabled={!canSend}
							className="flex items-center gap-2 rounded-xl bg-[#ea580c] px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#c2410c] disabled:bg-[#3c3c3c] disabled:text-[#858585] active:scale-95"
						>
							<Send size={18} />
							<span className="hidden sm:inline">Send</span>
						</button>
					</div>
					</div>
				</form>
			</div>
		</div>
	);
}
