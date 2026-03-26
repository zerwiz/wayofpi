#!/usr/bin/env node

/**
 * Simple installer to make `ghm` available on PATH by symlinking
 * the .pi/tools/github-management.js shim into ~/.local/bin.
 */

const { mkdirSync, symlinkSync, existsSync } = require("node:fs");
const { resolve } = require("node:path");
const os = require("node:os");

function main() {
	const home = os.homedir();
	const binDir = resolve(home, ".local", "bin");
	const target = resolve(__dirname, "../.pi/tools/github-management.js");
	const link = resolve(binDir, "ghm");

	mkdirSync(binDir, { recursive: true });

	if (existsSync(link)) {
		console.log(`[ghm-install] Symlink already exists at ${link}`);
		console.log("If you need to update it, remove it and re-run this script.");
		return;
	}

	symlinkSync(target, link);
	console.log(`[ghm-install] Created symlink: ${link} -> ${target}`);
	console.log("Ensure ~/.local/bin is on your PATH, then run `ghm --help`.");
}

main();

