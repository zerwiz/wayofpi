import { existsSync } from "node:fs";

/** Resolve Pi CLI for headless `--mode json` / RPC (see `docs/WOP_NAMESPACE.md`). */
export function resolvePiBinaryPath(): string | null {
	const configured = process.env.WOP_PI_BINARY?.trim();
	if (configured && existsSync(configured)) return configured;
	return Bun.which("pi") ?? null;
}
