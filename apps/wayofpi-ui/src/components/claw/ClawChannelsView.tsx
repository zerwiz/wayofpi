/**
 * Claw UI — Channels tab (Phase E).
 *
 * Telegram: setup guide plus read-only integration snapshot from
 * `GET /api/claw/telegram/status` (filesystem + extensions[] scan — no secrets).
 * Webhook URL generation and email remain planned.
 */
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	ExternalLink,
	Info,
	Loader,
	Mail,
	MessageSquare,
	Radio,
	RefreshCw,
	Webhook,
} from "lucide-react";

import { useClawTelegramStatus } from "../../hooks/useClawTelegramStatus";
import type { ClawTelegramStatusV1 } from "../../../shared/claw-telegram-status";

// ──────────────────────────────────────────────
// Shared design tokens (matching ClawMissionView)
// ──────────────────────────────────────────────

function Card({
	children,
	className = "",
	dark,
}: {
	children: React.ReactNode;
	className?: string;
	dark: boolean;
}) {
	return (
		<div
			className={`rounded-xl border ${
				dark ? "border-[#2a2a2a] bg-[#1e1e1e]" : "border-[#e5e5e5] bg-white shadow-sm"
			} ${className}`}
		>
			{children}
		</div>
	);
}

type ChannelState =
	| "connected"
	| "not_configured"
	| "planned"
	| "token_saved"
	| "pi_ready"
	| "checking";

function StatusBadge({
	state,
	dark,
}: {
	state: ChannelState;
	dark: boolean;
}) {
	if (state === "checking") {
		return (
			<span
				className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
					dark ? "bg-[#3c3c3c] text-[#858585]" : "bg-[#f0f0f0] text-[#888888]"
				}`}
			>
				<Loader size={10} className="animate-spin" />
				Checking…
			</span>
		);
	}
	if (state === "connected") {
		return (
			<span
				className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
					dark ? "bg-[#4ec9b0]/15 text-[#4ec9b0]" : "bg-[#4ec9b0]/20 text-[#0a7a68]"
				}`}
			>
				<span className="h-1.5 w-1.5 rounded-full bg-[#4ec9b0]" />
				Connected
			</span>
		);
	}
	if (state === "token_saved") {
		return (
			<span
				className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
					dark ? "bg-[#fb923c]/15 text-[#fb923c]" : "bg-[#ea580c]/12 text-[#c2410c]"
				}`}
			>
				<span className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-[#fb923c]" : "bg-[#ea580c]"}`} />
				Token on disk
			</span>
		);
	}
	if (state === "pi_ready") {
		return (
			<span
				className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
					dark ? "bg-[#4ec9b0]/15 text-[#4ec9b0]" : "bg-[#4ec9b0]/20 text-[#0a7a68]"
				}`}
			>
				<span className="h-1.5 w-1.5 rounded-full bg-[#4ec9b0]" />
				Pi checklist OK
			</span>
		);
	}
	if (state === "planned") {
		return (
			<span
				className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
					dark ? "bg-[#3c3c3c] text-[#585858]" : "bg-[#f0f0f0] text-[#aaaaaa]"
				}`}
			>
				<span className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-[#585858]" : "bg-[#aaaaaa]"}`} />
				Planned later
			</span>
		);
	}
	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
				dark
					? "bg-[#fb923c]/15 text-[#fb923c]"
					: "bg-[#ea580c]/10 text-[#ea580c]"
			}`}
		>
			<span className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-[#fb923c]" : "bg-[#ea580c]"}`} />
			Not configured
		</span>
	);
}

function SetupStep({
	n,
	children,
	dark,
}: {
	n: number;
	children: React.ReactNode;
	dark: boolean;
}) {
	return (
		<li className="flex items-start gap-2.5">
			<span
				className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
					dark ? "bg-[#ea580c]/20 text-[#fb923c]" : "bg-[#ea580c]/12 text-[#ea580c]"
				}`}
			>
				{n}
			</span>
			<span className={`text-[12px] leading-relaxed ${dark ? "text-[#aaaaaa]" : "text-[#555555]"}`}>
				{children}
			</span>
		</li>
	);
}

// ──────────────────────────────────────────────
// Channel cards
// ──────────────────────────────────────────────

function telegramIntegrationBadge(
	tg: ClawTelegramStatusV1 | null,
	loading: boolean,
	hasError: boolean,
): ChannelState {
	if (hasError && !tg) return "not_configured";
	if (loading && !tg) return "checking";
	if (!tg) return "not_configured";
	const tokenOk = tg.globalTokenConfigured || tg.workspaceTokenConfigured;
	if (!tokenOk) return "not_configured";
	if (tg.piTelegramInSettings) return "pi_ready";
	return "token_saved";
}

function tokenSourceHint(tg: ClawTelegramStatusV1): string {
	if (tg.tokenSource === "both") return "Token files: ~/.pi/agent/telegram.json and .claw/telegram.json";
	if (tg.tokenSource === "workspace") return "Token file: .claw/telegram.json";
	if (tg.tokenSource === "global") return "Token file: ~/.pi/agent/telegram.json";
	return "";
}

function TelegramCard({
	dark,
	onOpenFile,
	telegram,
	loading,
	error,
	onRefresh,
}: {
	dark: boolean;
	onOpenFile: (path: string) => void;
	telegram: ClawTelegramStatusV1 | null;
	loading: boolean;
	error: string | null;
	onRefresh: (mode?: "full" | "silent") => void;
}) {
	const border = dark ? "border-[#2a2a2a]" : "border-[#f0f0f0]";
	const headText = dark ? "text-[#cccccc]" : "text-[#333333]";
	const muted = dark ? "text-[#858585]" : "text-[#888888]";
	const codeC = `rounded px-1 py-0.5 font-mono text-[10px] ${
		dark ? "bg-[#252526] text-[#cccccc]" : "bg-[#f5f5f5] text-[#444444]"
	}`;
	const linkBtn = `flex items-center gap-1 text-[11px] font-medium transition-colors ${
		dark ? "text-[#fb923c] hover:text-[#fed7aa]" : "text-[#ea580c] hover:text-[#9a3412]"
	}`;

	const badge = telegramIntegrationBadge(telegram, loading, !!error);

	return (
		<Card dark={dark} className="flex flex-col">
			{/* Header */}
			<div className={`flex items-center justify-between border-b px-4 py-3 ${border}`}>
				<div className="flex items-center gap-2.5">
					<div
						className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
							dark ? "bg-[#229ED9]/15" : "bg-[#229ED9]/10"
						}`}
					>
						<MessageSquare size={15} className="text-[#229ED9]" />
					</div>
					<div>
						<div className={`text-[13px] font-semibold ${headText}`}>Telegram</div>
						<div className={`text-[10px] ${muted}`}>Talk to Claw from your phone</div>
					</div>
				</div>
				<StatusBadge state={badge} dark={dark} />
			</div>

			{telegram && (telegram.globalTokenConfigured || telegram.workspaceTokenConfigured) ? (
				<div
					className={`border-b px-4 py-2.5 text-[10px] leading-relaxed ${border} ${
						dark ? "bg-[#252526]/60 text-[#aaaaaa]" : "bg-[#fafafa] text-[#555555]"
					}`}
				>
					{tokenSourceHint(telegram)}
					{" · "}
					Live polling and pairing still run inside Pi after{" "}
					<span className={codeC}>/telegram-connect</span> (this UI never receives your token).
				</div>
			) : null}

			{error ? (
				<div
					className={`flex items-start gap-2 border-b px-4 py-2.5 text-[10px] ${border} ${
						dark ? "text-[#f14c4c]/90" : "text-[#dc2626]"
					}`}
				>
					<AlertTriangle size={12} className="mt-0.5 shrink-0" />
					<span>Could not load status: {error}</span>
				</div>
			) : null}

			{/* Description */}
			<div className={`border-b px-4 py-3 text-[11px] leading-relaxed ${border} ${muted}`}>
				Connect a Telegram bot so you can send instructions to Claw and receive replies on any device. Powered by the{" "}
				<span className={codeC}>pi-telegram</span> Pi extension.
			</div>

			{/* Setup steps */}
			<div className="flex-1 px-4 py-3">
				<p className={`mb-3 text-[10px] font-bold uppercase tracking-wider ${muted}`}>
					Setup guide
				</p>
				<ol className="flex flex-col gap-2.5">
					<SetupStep n={1} dark={dark}>
						Open Telegram and message{" "}
						<span className={codeC}>@BotFather</span> → send{" "}
						<span className={codeC}>/newbot</span> → copy the token.
					</SetupStep>
					<SetupStep n={2} dark={dark}>
						In Pi, run <span className={codeC}>/telegram-setup</span> and paste the token (writes{" "}
						<span className={codeC}>~/.pi/agent/telegram.json</span> or your workspace secret file — never
						commit it). Optionally note in{" "}
						<button type="button" className={linkBtn} onClick={() => onOpenFile(".claw/TOOLS.md")}>
							<span className={codeC}>.claw/TOOLS.md</span>
							<ExternalLink size={10} />
						</button>{" "}
						that Telegram is enabled.
					</SetupStep>
					<SetupStep n={3} dark={dark}>
						Install <span className={codeC}>pi-telegram</span> and add it to{" "}
						<span className={codeC}>.pi/settings.json</span> <span className={codeC}>extensions[]</span>{" "}
						<button type="button" className={linkBtn} onClick={() => onOpenFile(".pi/settings.json")}>
							Open settings
							<ExternalLink size={10} />
						</button>
						.
					</SetupStep>
					<SetupStep n={4} dark={dark}>
						Run <span className={codeC}>/reload</span> in Pi or restart Way of Pi.
					</SetupStep>
					<SetupStep n={5} dark={dark}>
						Run <span className={codeC}>/telegram-connect</span> then{" "}
						<span className={codeC}>/telegram-status</span> in Pi. In Telegram, DM your bot and send{" "}
						<span className={codeC}>/start</span> to pair.
					</SetupStep>
					<SetupStep n={6} dark={dark}>
						Send a message to the bot — Pi handles the turn with full tools.
					</SetupStep>
				</ol>
			</div>

			{/* Actions */}
			<div className={`flex flex-wrap items-center gap-3 border-t px-4 py-3 ${border}`}>
				<button
					type="button"
					onClick={() => onOpenFile(".claw/TOOLS.md")}
					className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors ${
						dark
							? "bg-[#2a2a2a] text-[#cccccc] hover:bg-[#3c3c3c]"
							: "bg-[#f5f5f5] text-[#444444] hover:bg-[#ebebeb]"
					}`}
				>
					Open TOOLS.md
					<ArrowRight size={11} />
				</button>
				<button
					type="button"
					onClick={() => void onRefresh("full")}
					disabled={loading}
					title="Refresh integration snapshot"
					className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors disabled:opacity-40 ${
						dark
							? "border border-[#3c3c3c] text-[#cccccc] hover:bg-[#252526]"
							: "border border-[#e5e5e5] text-[#444444] hover:bg-[#fafafa]"
					}`}
				>
					<RefreshCw size={12} className={loading ? "animate-spin" : ""} />
					Refresh status
				</button>
				<span className={`min-w-0 flex-1 text-[10px] ${muted}`}>
					See <span className="font-mono">docs/WOP_TELEGRAM_PLAN.md</span> for the full plan.
				</span>
			</div>
		</Card>
	);
}

function WebhookCard({ dark }: { dark: boolean }) {
	const border = dark ? "border-[#2a2a2a]" : "border-[#f0f0f0]";
	const headText = dark ? "text-[#cccccc]" : "text-[#333333]";
	const muted = dark ? "text-[#858585]" : "text-[#888888]";

	return (
		<Card dark={dark}>
			<div className={`flex items-center justify-between border-b px-4 py-3 ${border}`}>
				<div className="flex items-center gap-2.5">
					<div
						className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
							dark ? "bg-[#7c3aed]/15" : "bg-[#7c3aed]/10"
						}`}
					>
						<Webhook size={15} className={dark ? "text-[#a78bfa]" : "text-[#7c3aed]"} />
					</div>
					<div>
						<div className={`text-[13px] font-semibold ${headText}`}>Webhook</div>
						<div className={`text-[10px] ${muted}`}>Inbound HTTP events</div>
					</div>
				</div>
				<StatusBadge state="not_configured" dark={dark} />
			</div>
			<div className="flex flex-col gap-3 px-4 py-4">
				<p className={`text-[11px] leading-relaxed ${muted}`}>
					Receive HTTP POST events from external services (CI/CD, monitoring alerts,
					GitHub webhooks…) and route them to a Claw agent turn.
				</p>
				<div
					className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[11px] ${
						dark ? "border-[#3c3c3c] bg-[#252526]" : "border-[#e5e5e5] bg-[#fafafa]"
					}`}
				>
					<AlertTriangle
						size={12}
						className={`mt-0.5 shrink-0 ${dark ? "text-[#585858]" : "text-[#aaaaaa]"}`}
					/>
					<span className={muted}>
						Webhook URL generation and routing logic is planned for Phase E.
						Requires server-side support in <span className="font-mono text-[10px]">apps/wayofpi-ui/server/</span>.
					</span>
				</div>
				<button
					type="button"
					disabled
					className={`flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border py-2 text-[11px] font-medium opacity-40 ${
						dark ? "border-[#3c3c3c] text-[#858585]" : "border-[#d5d5d5] text-[#888888]"
					}`}
				>
					Generate webhook URL
					<span className={`rounded px-1 py-0.5 text-[9px] font-bold ${
						dark ? "bg-[#3c3c3c] text-[#585858]" : "bg-[#e5e5e5] text-[#aaaaaa]"
					}`}>Phase E</span>
				</button>
			</div>
		</Card>
	);
}

function EmailCard({ dark }: { dark: boolean }) {
	const border = dark ? "border-[#2a2a2a]" : "border-[#f0f0f0]";
	const headText = dark ? "text-[#cccccc]" : "text-[#333333]";
	const muted = dark ? "text-[#858585]" : "text-[#888888]";

	return (
		<Card dark={dark}>
			<div className={`flex items-center justify-between border-b px-4 py-3 ${border}`}>
				<div className="flex items-center gap-2.5">
					<div
						className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
							dark ? "bg-[#059669]/15" : "bg-[#059669]/10"
						}`}
					>
						<Mail size={15} className={dark ? "text-[#34d399]" : "text-[#059669]"} />
					</div>
					<div>
						<div className={`text-[13px] font-semibold ${headText}`}>Email</div>
						<div className={`text-[10px] ${muted}`}>SMTP / IMAP digest</div>
					</div>
				</div>
				<StatusBadge state="planned" dark={dark} />
			</div>
			<div className="px-4 py-4">
				<p className={`text-[11px] leading-relaxed ${muted}`}>
					Send email digests or receive email commands. Planned as a Pi extension
					or Bun mail adapter in a later phase — not yet scoped.
				</p>
				<div className={`mt-3 flex items-center gap-1.5 text-[10px] ${muted}`}>
					<CheckCircle2 size={11} className="opacity-40" />
					<span>Suggest this feature in your workspace planning docs.</span>
				</div>
			</div>
		</Card>
	);
}

// ──────────────────────────────────────────────
// Main view
// ──────────────────────────────────────────────

export function ClawChannelsView({
	dark,
	onOpenFile,
}: {
	dark: boolean;
	/** Navigate to a workspace file (switches to Files tab and opens it). */
	onOpenFile: (path: string) => void;
}) {
	const bg = dark ? "bg-[#161616]" : "bg-[#f5f5f5]";
	const text = dark ? "text-[#cccccc]" : "text-[#333333]";
	const muted = dark ? "text-[#858585]" : "text-[#888888]";
	const { status: telegramStatus, loading: telegramLoading, error: telegramError, refresh: refreshTelegram } =
		useClawTelegramStatus();

	return (
		<div className={`flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4 ${bg} ${text}`}>
			{/* ── Header ── */}
			<div className="flex items-center gap-2.5">
				<Radio size={18} className={dark ? "text-[#fb923c]" : "text-[#ea580c]"} />
				<h1 className={`text-[16px] font-bold ${text}`}>Channels</h1>
			</div>

			{/* ── Phase notice ── */}
			<div
				className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[11px] leading-relaxed ${
					dark
						? "border-[#2a3f4a] bg-[#229ED9]/8 text-[#858585]"
						: "border-[#bae6fd] bg-[#f0f9ff] text-[#64748b]"
				}`}
			>
				<Info size={13} className={`mt-0.5 shrink-0 ${dark ? "text-[#38bdf8]" : "text-[#0284c7]"}`} />
				<span>
					<span className={`font-semibold ${dark ? "text-[#7dd3fc]" : "text-[#0369a1]"}`}>
						Phase E (production snapshot)
					</span>{" "}
					Telegram status is refreshed automatically from disk and{" "}
					<span className="font-mono text-[10px]">.pi/settings.json</span> (no token content is ever sent to the
					browser). Inbound webhooks and email adapters are still planned; live Telegram traffic is owned by Pi
					after <span className="font-mono text-[10px]">/telegram-connect</span>.
				</span>
			</div>

			{/* ── Channel cards ── */}
			<div className="grid gap-4 lg:grid-cols-3">
				<TelegramCard
					dark={dark}
					onOpenFile={onOpenFile}
					telegram={telegramStatus}
					loading={telegramLoading}
					error={telegramError}
					onRefresh={refreshTelegram}
				/>
				<WebhookCard dark={dark} />
				<EmailCard dark={dark} />
			</div>

			{/* ── Roadmap note ── */}
			<div
				className={`flex items-start gap-2 rounded-xl border border-dashed px-4 py-3 text-[11px] ${
					dark
						? "border-[#2a2a2a] text-[#585858]"
						: "border-[#d5d5d5] text-[#aaaaaa]"
				}`}
			>
				<Info size={12} className="mt-0.5 shrink-0" />
				<span>
					Next for Phase E: inbound webhook routing (Pi turn on HTTP event), outbound notification wiring, and
					per-channel audit log. Telegram live bridge details:{" "}
					<span className="font-mono text-[10px]">docs/WOP_TELEGRAM_PLAN.md</span> (T-3/T-4). Claw roadmap:{" "}
					<span className="font-mono text-[10px]">docs/WOP_CLAW_MODE_PLAN.md</span> (Phase E).
				</span>
			</div>

			<div className={`flex items-start gap-2 text-[11px] ${muted}`}>
				<Info size={12} className="mt-0.5 shrink-0 opacity-70" />
				<span>
					Want a channel not listed here? Add it to{" "}
					<span className="font-mono text-[10px]">.claw/TOOLS.md</span> as a note, or capture it in your workspace
					planning docs.
				</span>
			</div>

			{/* Spacer */}
			<div className="h-6 shrink-0" />
		</div>
	);
}
