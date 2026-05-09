import { existsSync } from "node:fs";
import { join } from "node:path";

import { expandUserPathInPiBinary } from "./pi-binary";

export type NgrokBinarySource = "WOP_NGROK_BINARY" | "PATH" | "bundled" | null;

/**
 * Resolve the ngrok **CLI** to execute (config + http tunnel).
 *
 * Order: **`WOP_NGROK_BINARY`** (file must exist) → **`Bun.which`** → **`node_modules/ngrok/bin`** from the
 * **`ngrok`** optional npm package (postinstall downloads the platform agent when that dependency is installed).
 */
export function resolveNgrokExecutable(): { path: string | null; source: NgrokBinarySource } {
	const fromEnv = process.env.WOP_NGROK_BINARY?.trim();
	if (fromEnv) {
		const p = expandUserPathInPiBinary(fromEnv);
		if (existsSync(p)) return { path: p, source: "WOP_NGROK_BINARY" };
	}

	const win = process.platform === "win32";
	const onPath = Bun.which(win ? "ngrok.exe" : "ngrok") ?? (win ? Bun.which("ngrok") : null);
	if (onPath) return { path: onPath, source: "PATH" };

	const pkgRoot = join(import.meta.dir, "..");
	const binDir = join(pkgRoot, "node_modules", "ngrok", "bin");
	const candidates = win
		? [join(binDir, "ngrok.exe"), join(binDir, "ngrok")]
		: [join(binDir, "ngrok")];
	for (const c of candidates) {
		if (existsSync(c)) return { path: c, source: "bundled" };
	}

	return { path: null, source: null };
}
