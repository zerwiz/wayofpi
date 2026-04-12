import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { getClawHostRepoRoot } from "./claw-workspace-root";

/** Expand a leading `~/` (or lone `~`) so **`existsSync`** and spawns see a real path. */
export function expandUserPathInPiBinary(p: string): string {
	const t = p.trim();
	if (t.startsWith("~/")) return join(homedir(), t.slice(2));
	if (t === "~") return homedir();
	return t;
}

/** Raw **`WOP_PI_BINARY`** after trim + home expansion, or **`null`** if unset. */
export function expandedWopPiBinaryFromEnv(): string | null {
	const raw = process.env.WOP_PI_BINARY?.trim();
	return raw ? expandUserPathInPiBinary(raw) : null;
}

/**
 * Extra locations after **`Bun.which("pi")`** — GUI/Electron and minimal PATH often omit
 * `~/.local/bin`, Homebrew Apple Silicon, etc. Only paths that **`existsSync`** wins.
 */
function commonPiExecutableCandidates(): string[] {
	const win = process.platform === "win32";
	const home = homedir();
	const out: string[] = [];
	if (win) {
		if (home) {
			out.push(join(home, ".local", "bin", "pi.exe"));
			out.push(join(home, ".cargo", "bin", "pi.exe"));
		}
		return out;
	}
	if (home) {
		out.push(
			join(home, ".local", "bin", "pi"),
			join(home, ".cargo", "bin", "pi"),
			join(home, ".nix-profile", "bin", "pi"),
			join(home, ".asdf", "shims", "pi"),
			join(home, ".local", "share", "mise", "shims", "pi"),
		);
	}
	if (process.platform === "darwin") {
		out.push("/opt/homebrew/bin/pi", "/usr/local/bin/pi");
	}
	out.push("/usr/local/bin/pi");
	return out;
}

let pathHintsPrepended = false;

/** Once per process: prepend the same PATH extras as **`start-wayofpi-ui.sh`** so **`Bun.which("pi")`** sees dev shims. */
function prependPathHintsForPiLookup(): void {
	if (pathHintsPrepended) return;
	pathHintsPrepended = true;
	const sep = process.platform === "win32" ? ";" : ":";
	const home = homedir();
	const parts: string[] = [];
	if (home) {
		parts.push(
			join(home, ".bun", "bin"),
			join(home, ".local", "bin"),
			join(home, ".cargo", "bin"),
			join(home, ".asdf", "shims"),
			join(home, ".local", "share", "mise", "shims"),
			join(home, ".nix-profile", "bin"),
		);
	}
	if (process.platform === "darwin") {
		parts.push("/opt/homebrew/bin", "/usr/local/bin");
	}
	parts.push("/usr/local/bin", "/usr/bin", "/bin");
	const head = parts.join(sep);
	const tail = process.env.PATH ?? "";
	process.env.PATH = `${head}${sep}${tail}`;
}

/** Resolve Pi CLI for headless `--mode json` / RPC (see `docs/WOP_NAMESPACE.md`). */
export function resolvePiBinaryPath(): string | null {
	prependPathHintsForPiLookup();
	const expanded = expandedWopPiBinaryFromEnv();
	if (expanded && existsSync(expanded)) return expanded;
	const which = Bun.which("pi");
	if (which) return which;
	/** Same **`.env`** loading pattern as **`ppi` → `just pi`**, but cwd stays the workspace (headless JSON). */
	if (process.platform !== "win32") {
		const bridge = join(getClawHostRepoRoot(), "scripts", "wop-headless-pi");
		if (existsSync(bridge)) return bridge;
	}
	for (const p of commonPiExecutableCandidates()) {
		if (existsSync(p)) return p;
	}
	return null;
}
