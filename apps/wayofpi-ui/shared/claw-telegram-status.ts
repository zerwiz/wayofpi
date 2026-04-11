/**
 * Claw Channels — Telegram integration snapshot (filesystem only).
 * Never includes secrets; Pi owns live polling after `/telegram-connect`.
 */
export const CLAW_TELEGRAM_STATUS_VERSION = 1 as const;

export type ClawTelegramTokenSource = "none" | "workspace" | "global" | "both";

export type ClawTelegramStatusV1 = {
	version: typeof CLAW_TELEGRAM_STATUS_VERSION;
	/** `~/.pi/agent/telegram.json` (pi-telegram default). */
	globalTokenConfigured: boolean;
	/** Workspace `.claw/telegram.json` (optional override / future T-3). */
	workspaceTokenConfigured: boolean;
	/** Any opened workspace `.pi/settings.json` lists pi-telegram. */
	piTelegramInSettings: boolean;
	tokenSource: ClawTelegramTokenSource;
};
