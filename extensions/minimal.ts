/**
 * Minimal — Model name + context meter in a compact footer
 *
 * Shows model ID and a 10-block context usage bar: [###-------] 30% · 12k/128k ctx · ↓4k ↑1k
 *
 * Usage: pi -e extensions/minimal.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { footerContextStats } from "./footer-context-stats.ts";
import { applyExtensionDefaults } from "./themeMap.ts";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		ctx.ui.setFooter((_tui, theme, _footerData) => ({
			dispose: () => {},
			invalidate() {},
			render(width: number): string[] {
				const model = ctx.model?.id || "no-model";
				const usage = ctx.getContextUsage();
				const pct = (usage && usage.percent !== null) ? usage.percent : 0;
				const filled = Math.round(pct / 10);
				const bar = "#".repeat(filled) + "-".repeat(10 - filled);

				const left = theme.fg("dim", ` ${model}`);
				const stats = footerContextStats(ctx);
				const right = theme.fg("dim", `[${bar}] ${Math.round(pct)}%${stats} `);
				const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));

				return [truncateToWidth(left + pad + right, width)];
			},
		}));
	});
}