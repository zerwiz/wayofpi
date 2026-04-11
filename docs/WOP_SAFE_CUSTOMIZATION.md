# Way of Pi — safe skills, extensions, packages, and Pi updates

Product rules for **adding capabilities** and **updating Pi** without bricking the install. Aligns with playground docs: **[EXTENSIONS.md](EXTENSIONS.md)**, **[SKILLS.md](SKILLS.md)**, **[TOOLS.md](TOOLS.md)**.

## Three kinds (do not confuse)

| Kind | User adds | Lives | Effect |
|------|-----------|-------|--------|
| **Skill** | Workflow (`SKILL.md`) | `.pi/skills/<name>/`, settings `skills`, packages | Context summaries; `/skill:name`; **does not** register new tools by itself. |
| **Tool** | Via **extension** or Pi built-ins | Extension code + `registerTool` | LLM-callable actions. **Duplicate tool names** across extensions → conflicts. |
| **Extension** | TypeScript module | `extensions/*.ts` + `.pi/extensions/` shim + `settings.json` `extensions` | Full in-process power — **trusted code only**. |

## Safe apply pipeline (recommended)

For any change to **`settings.json`**, **`agent/settings.json`**, **`packages`**, or skill folders:

1. **Backup** — timestamped copy under **`$WOP_HOME/backups/`** (last N retained).
2. **Preflight** — load in **throwaway** headless Pi subprocess; capture stderr before touching live session.
3. **Apply** — write files; show **diff preview** (Technical) or **plain summary** (Simple).
4. **Health check** — doctor-equivalent: JSON parse, extension paths exist, no junk under `.pi/extensions/`, optional Ollama reachability.
5. **Rollback** — restore previous snapshot + restart headless Pi on failure or user request.

## Pi binary updates

- Run **`pi update`** (or distro-specific) **only** via **`WOP_PI_BINARY`** — never the user’s global `pi` unless explicitly configured.
- On failure, **do not** corrupt **`WOP_HOME`**; require **server restart** after success.

## Collision and trust

- **Tool name** clashes — block enable or warn with list of conflicting tools.
- **Skill name** — folder name must match frontmatter `name` ([SKILLS.md](SKILLS.md)).
- **Trust copy** — extensions and some skills can drive **bash**; only install from sources you trust.

## Related

- **[extensions/pi-doctor.ts](../extensions/pi-doctor.ts)** — inspiration for Diagnostics checks.
- **[WOP_STANDALONE_SYSTEM_PLAN.md](WOP_STANDALONE_SYSTEM_PLAN.md)** — full backlog and UI surfaces.
