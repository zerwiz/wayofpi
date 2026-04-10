#!/usr/bin/env node

/**
 * Lightweight CLI shim for the Pi github-management extension.
 * Lives under scripts/ (not .pi/tools/) so Pi does not scan legacy project tools/.
 *
 * Invoke: `node scripts/github-management-cli.js` or `ghm` after ghm-install.
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

	const cmd = "pi";
	const args = ["-e", resolve(__dirname, "../extensions/github-management.ts"), "--cmd", argv.join(" ")];

	const res = spawnSync(cmd, args, {
		stdio: "inherit",
	});

	if (typeof res.status === "number") {
		process.exit(res.status);
	}
}

main();
