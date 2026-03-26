#!/usr/bin/env node

/**
 * Lightweight CLI shim for the Pi github-management extension.
 *
 * This file is discovered by the Pi runner when using tool-based flows,
 * but it can also be invoked directly as `node .pi/tools/github-management.js`.
 *
 * For now, this shim only prints a help message and defers real logic
 * to the Pi extension (loaded via `.pi/extensions/github-management.ts`).
 *
 * A future iteration can wire this into a standalone `ghm` binary that
 * talks to the same command handlers over a thin RPC or by spawning Pi.
 */

const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");

function printLocalHelp() {
	console.log(
		[
			"GitHub Management CLI (ghm) — Pi shim",
			"",
			"This shim is intended to be used together with the Pi github-management extension.",
			"",
			"Inside Pi:",
			"  - Use the /ghm command, or the ghm_exec tool.",
			"",
			"From the shell (experimental):",
			"  - This script will try to invoke `pi -e extensions/github-management.ts`",
			"    with the remaining arguments, if `pi` is on your PATH.",
			"",
			"Examples:",
			"  pi -e extensions/github-management.ts --cmd \"status\"",
			"",
		].join("\n"),
	);
}

function main() {
	const [, , ...argv] = process.argv;

	if (argv.includes("--help") || argv.includes("-h") || argv.length === 0) {
		printLocalHelp();
		return;
	}

	// Attempt to delegate to `pi` if available.
	const cmd = "pi";
	const args = ["-e", resolve(__dirname, "../../extensions/github-management.ts"), "--cmd", argv.join(" ")];

	const res = spawnSync(cmd, args, {
		stdio: "inherit",
	});

	if (typeof res.status === "number") {
		process.exit(res.status);
	}
}

main();

