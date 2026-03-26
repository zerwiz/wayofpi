#!/usr/bin/env node

/**
 * Import all domain specialist agents from the reference .toml library
 * into Pi's `.pi/agents/` as fully standalone agent markdown files.
 *
 * This script copies all instruction text into the generated `.md` files
 * so the `ref/` folder can be deleted afterwards.
 */

const fs = require("fs");
const path = require("path");

function parseSimpleToml(input) {
  const result = {};
  const lines = input.split(/\r?\n/);
  let currentKey = null;
  let inMultiline = false;
  let multilineBuffer = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    if (inMultiline) {
      if (line.endsWith('"""')) {
        result[currentKey] = multilineBuffer.join("\n");
        inMultiline = false;
        multilineBuffer = [];
        currentKey = null;
      } else {
        multilineBuffer.push(rawLine.replace(/\r?$/, ""));
      }
      continue;
    }

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (value.startsWith('"""')) {
      inMultiline = true;
      currentKey = key;
      value = value.slice(3);
      if (value.endsWith('"""')) {
        result[key] = value.slice(0, -3);
        inMultiline = false;
        currentKey = null;
      } else if (value.length > 0) {
        multilineBuffer.push(value);
      }
      continue;
    }

    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    result[key] = value;
  }

  return result;
}

function sandboxModeToTools(mode) {
  if (mode === "workspace-write") return "read,write,edit,grep,find,ls,bash";
  return "read,grep,find,ls";
}

function toKebabCase(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "agent";
}

function splitCategory(categoryDirName) {
  const m = /^(\d{2})-(.+)$/.exec(categoryDirName);
  if (!m) return { nn: "00", slug: categoryDirName };
  return { nn: m[1], slug: m[2] };
}

function categoryPrefix(nn) {
  // Stable, short prefixes to avoid collisions with existing agents like `planner`, `reviewer`, etc.
  switch (nn) {
    case "01":
      return "core";
    case "02":
      return "lang";
    case "03":
      return "infra";
    case "04":
      return "quality";
    case "05":
      return "data";
    case "06":
      return "dx";
    case "07":
      return "domain";
    case "08":
      return "biz";
    case "09":
      return "meta";
    case "10":
      return "research";
    default:
      return "agent";
  }
}

function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const sourceRoot = path.resolve(
    repoRoot,
    "ref/awesome-codex-subagents-main(1)/awesome-codex-subagents-main/categories"
  );

  // Keep these agents isolated and browsable, but still under `.pi/agents/`.
  const targetRoot = path.resolve(repoRoot, ".pi/agents/domain-specialists");

  if (!fs.existsSync(sourceRoot)) {
    console.error("Source categories directory not found:", sourceRoot);
    process.exit(1);
  }

  fs.mkdirSync(targetRoot, { recursive: true });

  const categoryDirs = fs
    .readdirSync(sourceRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const allNames = new Set();
  let total = 0;

  for (const category of categoryDirs) {
    const { nn, slug } = splitCategory(category);
    const prefix = categoryPrefix(nn);

    const categoryPath = path.join(sourceRoot, category);
    const outCategoryDir = path.join(targetRoot, category);
    fs.mkdirSync(outCategoryDir, { recursive: true });

    const tomlFiles = fs
      .readdirSync(categoryPath, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.endsWith(".toml"))
      .map((d) => d.name)
      .sort();

    for (const file of tomlFiles) {
      const fullPath = path.join(categoryPath, file);
      const tomlText = fs.readFileSync(fullPath, "utf8");
      const parsed = parseSimpleToml(tomlText);

      const upstreamName = parsed.name || path.basename(file, ".toml");
      const agentBase = toKebabCase(upstreamName);
      let finalName = `${prefix}-${agentBase}`;
      if (allNames.has(finalName)) {
        // deterministic-ish disambiguation using category slug
        finalName = `${prefix}-${slug}-${agentBase}`;
      }
      if (allNames.has(finalName)) {
        console.error("Name collision could not be resolved for:", finalName);
        process.exit(1);
      }
      allNames.add(finalName);

      const description =
        parsed.description || `Domain specialist for ${upstreamName}.`;
      const sandboxMode = parsed.sandbox_mode || "read-only";
      const tools = sandboxModeToTools(sandboxMode);

      // Upstream uses `developer_instructions` in this ref dump.
      const body = parsed.developer_instructions || "";
      if (!body.trim()) {
        console.error("Missing developer_instructions for:", fullPath);
        process.exit(1);
      }

      const mdPath = path.join(outCategoryDir, `${finalName}.md`);
      const md = [
        "---",
        `name: ${finalName}`,
        `description: ${description}`,
        `tools: ${tools}`,
        "---",
        "",
        // Do not mention the upstream library name in the agent prompt.
        "You are a domain specialist agent.",
        "",
        `**Specialty:** \`${upstreamName}\``,
        `**Category:** \`${category}\``,
        "",
        body,
        "",
      ].join("\n");

      fs.writeFileSync(mdPath, md, "utf8");
      total += 1;
    }
  }

  console.log(`Imported ${total} domain specialist agents into ${targetRoot}`);
}

if (require.main === module) {
  main();
}

