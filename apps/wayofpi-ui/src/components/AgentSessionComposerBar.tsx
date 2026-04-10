import { MessageSquare, PanelRight, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

/** Minimal session composer when the technical agent panel is hidden (full-width editor). */
export function AgentSessionComposerBar({
	connected,
	streaming,
	queuePending,
	onSend,
	onRevealAgents,
}: {
	connected: boolean;
	streaming: boolean;
	queuePending: number;
	onSend: (text: string) => void;
	onRevealAgents: () => void;
}) {
	const [input, setInput] = useState("");

	const submit = (e: FormEvent) => {
		e.preventDefault();
		const t = input.trim();
		if (!t || !connected) return;
		onSend(t);
		setInput("");
	};

	return (
		<div
			className="flex shrink-0 items-stretch gap-1 border-t border-[#3c3c3c] bg-[#252526] px-2 py-1.5"
			data-wop-chat-root
		>
			<button
				type="button"
				title="Show agent panel"
				aria-label="Show agent panel"
				onClick={onRevealAgents}
				className="flex shrink-0 items-center gap-1 rounded border border-[#3c3c3c] bg-[#333333] px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
			>
				<PanelRight size={14} className="shrink-0" />
				<MessageSquare size={12} className="shrink-0 opacity-80" />
			</button>
			<form onSubmit={submit} className="flex min-w-0 flex-1 items-center gap-2">
				<input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={
						streaming
							? "Queue next message (runs when the assistant finishes)…"
							: "Message session…"
					}
					disabled={!connected}
					className="min-w-0 flex-1 rounded border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1.5 font-mono text-[12px] text-[#cccccc] outline-none placeholder:text-[#858585] focus:border-[#ea580c] disabled:opacity-50"
				/>
				{queuePending > 0 ? (
					<span className="shrink-0 font-mono text-[10px] text-[#858585]" title="Messages waiting after the current reply">
						{queuePending} queued
					</span>
				) : null}
				<button
					type="submit"
					disabled={!connected || !input.trim()}
					className="flex shrink-0 items-center gap-1 rounded bg-[#ea580c] px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-white hover:bg-[#c2410c] disabled:opacity-50"
				>
					<Send size={12} />
					Send
				</button>
			</form>
		</div>
	);
}
