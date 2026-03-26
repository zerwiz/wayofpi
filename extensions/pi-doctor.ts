/**
 * Pi doctor — Playground health checks (`/doctor`)
 *
 * Checks toolchain, config files, extension paths, skills layout, and optional Ollama.
 * Usage: pi -e extensions/pi-doctor.ts — then /doctor
 */

import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

type Severity = "ok" | "warn" | "bad";

interface CheckLine {
	severity: Severity;
	message: string;
}

function tryExec(cmd: string): { ok: boolean; out: string } {
	try {
		const out = execSync(cmd, {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
			timeout: 5000,
		}).trim();
		return { ok: true, out };
	} catch {
		return { ok: false, out: "" };
	}
}

function prefix(s: Severity): string {
	switch (s) {
		case "ok":
			return "[ok]";
		case "warn":
			return "[!]";
		default:
			return "[x]";
	}
}

function formatReport(lines: CheckLine[]): string {
	return lines.map((l) => `${prefix(l.severity)} ${l.message}`).join("\n");
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("doctor", {
		description: "Run Pi playground health checks (/doctor)",
		handler: async (_args: string, ctx: ExtensionCommandContext) => {
			const cwd = ctx.cwd;
			const lines: CheckLine[] = [];

			lines.push({ severity: "ok", message: `cwd: ${cwd}` });

			const bun = tryExec('command -v bun >/dev/null 2>&1 && bun --version');
			lines.push(
				bun.ok
					? { severity: "ok", message: `bun ${bun.out}` }
					: { severity: "warn", message: "bun not on PATH (repo uses bun for deps)" },
			);

			const justV = tryExec('command -v just >/dev/null 2>&1 && just --version');
			lines.push(
				justV.ok
					? { severity: "ok", message: `just ${justV.out.split("\n")[0]}` }
					: { severity: "warn", message: "just not on PATH (justfile recipes unavailable)" },
			);

			const piBin = tryExec("command -v pi");
			lines.push(
				piBin.ok
					? { severity: "ok", message: `pi: ${piBin.out}` }
					: { severity: "bad", message: "pi CLI not on PATH" },
			);

			const envFile = join(cwd, ".env");
			lines.push(
				existsSync(envFile)
					? { severity: "ok", message: ".env present (Pi still needs keys exported unless you use just/ppi)" }
					: {
							severity: "warn",
							message: ".env missing — copy .env.sample; use `source .env` or just/ppi so providers get keys",
						},
			);

			const mustJson = [
				["agent/settings.json", join(cwd, "agent/settings.json"), "bad" as const],
				["agent/models.json", join(cwd, "agent/models.json"), "bad" as const],
				[".pi/settings.json", join(cwd, ".pi/settings.json"), "warn" as const],
			] as const;

			for (const [label, abs, sev] of mustJson) {
				if (!existsSync(abs)) {
					lines.push({ severity: sev, message: `${label} missing` });
					continue;
				}
				try {
					JSON.parse(readFileSync(abs, "utf8"));
					lines.push({ severity: "ok", message: `${label} parses as JSON` });
				} catch {
					lines.push({ severity: "bad", message: `${label} is not valid JSON` });
				}
			}

			const teamsYaml = join(cwd, ".pi/agents/teams.yaml");
			lines.push(
				existsSync(teamsYaml)
					? { severity: "ok", message: ".pi/agents/teams.yaml present" }
					: { severity: "warn", message: ".pi/agents/teams.yaml missing (agent-team needs it)" },
			);

			const settingsPath = join(cwd, ".pi/settings.json");
			if (existsSync(settingsPath)) {
				try {
					const s = JSON.parse(readFileSync(settingsPath, "utf8")) as { extensions?: string[] };
					const exts = Array.isArray(s.extensions) ? s.extensions : [];
					if (exts.length === 0) {
						lines.push({ severity: "warn", message: ".pi/settings.json has empty extensions[]" });
					} else {
						let missing = 0;
						for (const rel of exts) {
							const abs = join(cwd, rel);
							if (!existsSync(abs)) missing++;
						}
						if (missing > 0) {
							lines.push({
								severity: "bad",
								message: `${missing}/${exts.length} paths in .pi/settings.json extensions[] missing on disk`,
							});
						} else {
							lines.push({
								severity: "ok",
								message: `all ${exts.length} extension files from .pi/settings.json exist`,
							});
						}
					}
				} catch {
					lines.push({ severity: "bad", message: ".pi/settings.json: parse error" });
				}
			}

			const skillsRoot = join(cwd, ".pi/skills");
			if (!existsSync(skillsRoot)) {
				lines.push({ severity: "warn", message: ".pi/skills/ missing" });
			} else {
				const dirs = readdirSync(skillsRoot).filter((n) => {
					try {
						return statSync(join(skillsRoot, n)).isDirectory();
					} catch {
						return false;
					}
				});
				let noSkillMd = 0;
				for (const d of dirs) {
					if (!existsSync(join(skillsRoot, d, "SKILL.md"))) noSkillMd++;
				}
				if (noSkillMd > 0) {
					lines.push({
						severity: "warn",
						message: `${noSkillMd} folder(s) under .pi/skills/ have no SKILL.md`,
					});
				} else {
					lines.push({ severity: "ok", message: `.pi/skills/: ${dirs.length} packages` });
				}
			}

			const modelsPath = join(cwd, "agent/models.json");
			if (existsSync(modelsPath)) {
				const raw = readFileSync(modelsPath, "utf8");
				if (/ollama/i.test(raw)) {
					try {
						const ac = new AbortController();
						const to = setTimeout(() => ac.abort(), 2000);
						const r = await fetch("http://127.0.0.1:11434/api/tags", { signal: ac.signal });
						clearTimeout(to);
						lines.push(
							r.ok
								? { severity: "ok", message: "Ollama API reachable at http://127.0.0.1:11434" }
								: {
										severity: "warn",
										message: `Ollama returned HTTP ${r.status} (models.json lists ollama)`,
									},
						);
					} catch {
						lines.push({
							severity: "warn",
							message: "Ollama not reachable on :11434 within 2s (skip if you use cloud-only models)",
						});
					}
				}
			}

			const dc = join(cwd, ".pi/damage-control-rules.yaml");
			lines.push(
				existsSync(dc)
					? { severity: "ok", message: ".pi/damage-control-rules.yaml present" }
					: {
							severity: "warn",
							message: ".pi/damage-control-rules.yaml missing (optional unless using damage-control ext)",
						},
			);

			const report = "**Pi doctor**\n\n" + formatReport(lines);
			ctx.ui.notify(report, "info");

			const bad = lines.filter((l) => l.severity === "bad").length;
			const warn = lines.filter((l) => l.severity === "warn").length;
			if (bad > 0) {
				ctx.ui.notify(`Summary: ${bad} error(s), ${warn} warning(s). Fix [x] lines first.`, "warning");
			} else if (warn > 0) {
				ctx.ui.notify(`Summary: ${warn} warning(s); Pi may still run.`, "info");
			} else {
				ctx.ui.notify("Summary: all checks passed.", "success");
			}
		},
	});
}
