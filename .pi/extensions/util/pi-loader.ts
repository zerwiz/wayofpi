import { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as path from "path";
import * as fs from "fs";
import { EXTENSION_MANIFEST } from "./manifest.ts";

/**
 * Way of Pi: Unified Smart Loader
 * Resolves the "stacking" issue in pi 0.70.5+ by programmatically
 * importing and initializing extensions from the PI_STACK env var.
 *
 * Support for Protected vs. Fluent tiers.
 */
export default async function (pi: ExtensionAPI) {
  const stackEnv = process.env.PI_STACK || "";
  if (!stackEnv) {
    // If PI_STACK is empty, we might still want to load some default extensions
    // or just return if we want full manual control via PI_STACK.
    return;
  }

  const extensionNames = stackEnv.split(",").map((ext) => ext.trim());
  const projectRoot = process.cwd();
  
  // PIP root for fluent extensions (fallback)
  const PIP_ROOT = path.join(projectRoot, "pip");

  // 1. Categorize extensions for prioritized loading
  const categories = {
    utility: [] as string[],
    function: [] as string[],
    "ui-core": [] as string[],
    "ui-widget": [] as string[],
    unknown: [] as string[],
  };

  for (const name of extensionNames) {
    const meta = EXTENSION_MANIFEST[name];
    const cat = meta ? meta.category : "unknown";
    categories[cat].push(name);
  }

  // 2. Resolve UI Core Conflicts (Keep only the LAST one specified)
  if (categories["ui-core"].length > 1) {
    const winner = categories["ui-core"].pop()!;
    console.warn(
      `[PI Loader] ⚠️  UI Conflict: Multiple UI Cores detected. Keeping only "${winner}". (Discarded: ${categories["ui-core"].join(", ")})`,
    );
    categories["ui-core"] = [winner];
  }

  // 3. Define flattened load order: Utility -> Function -> UI Core -> Widgets -> Unknown
  const orderedStack = [
    ...categories["utility"],
    ...categories["function"],
    ...categories["ui-core"],
    ...categories["ui-widget"],
    ...categories["unknown"],
  ];

  console.log(`[PI Loader] 🚀 Loading Stack: ${orderedStack.join(" -> ")}`);

  for (const extName of orderedStack) {
    const possiblePaths = [
      // 1. Way of Pi Protected (High Priority)
      path.join(projectRoot, ".pi", "extensions", "protected", `${extName}.ts`),
      path.join(projectRoot, ".pi", "extensions", "protected", `${extName}.js`),
      
      // 2. PIP Upstream Fluent (pip/extensions)
      path.join(PIP_ROOT, "extensions", `${extName}.ts`),
      path.join(PIP_ROOT, "extensions", `${extName}.js`),
      
      // 3. PIP Upstream internal (.pi/extensions)
      path.join(PIP_ROOT, ".pi", "extensions", `${extName}.ts`),
      path.join(PIP_ROOT, ".pi", "extensions", "protected", `${extName}.ts`),
      path.join(PIP_ROOT, ".pi", "extensions", "fluent", `${extName}.ts`),
      path.join(PIP_ROOT, ".pi", "extensions", "ui", `${extName}.ts`),
      path.join(PIP_ROOT, ".pi", "extensions", "util", `${extName}.ts`),
      
      // 4. Way of Pi Local/Fluent/Util
      path.join(projectRoot, ".pi", "extensions", "local", `${extName}.ts`),
      path.join(projectRoot, ".pi", "extensions", "fluent", `${extName}.ts`),
      path.join(projectRoot, ".pi", "extensions", "util", `${extName}.ts`),
      
      // 5. Legacy root extensions (fallback)
      path.join(projectRoot, "extensions", `${extName}.ts`),
      path.join(projectRoot, "extensions", `${extName}.js`),
    ];

    let foundPath = "";
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) {
      console.error(`[PI Loader] ❌ Could not find extension: ${extName}`);
      continue;
    }

    try {
      // Use absolute path for import to satisfy 0.70.5 resolution rules
      const module = await import(`file://${foundPath}`);
      const factory = module.default;

      if (typeof factory === "function") {
        await factory(pi);
        console.log(`[PI Loader] ✅ Loaded: ${extName}`);
      } else {
        console.warn(
          `[PI Loader] ⚠️  ${extName} does not export a default factory function.`,
        );
      }
    } catch (err) {
      console.error(`[PI Loader] 💥 Error loading ${extName}:`, err);
    }
  }
}
