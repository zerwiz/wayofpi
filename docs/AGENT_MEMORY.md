# How agent memory works in this Pi setup

This document explains **what “memory” means** when you use [Pi Coding Agent](https://github.com/mariozechner/pi-coding-agent) with **this repository**: which parts are automatic, which are files on disk, and how they combine before the model sees a prompt.

For project layout and agent *behavior* rules (tools vs invented output), see **[SYSTEM.md](SYSTEM.md)**. For authoring extensions, see **[EXTENSIONS.md](EXTENSIONS.md)**.

---

## 1. Memory is several layers (not one database)

| Layer | What it is | Survives new chat? | Typical location / trigger |
|-------|------------|-------------------|----------------------------|
| **Chat transcript** | Pi’s append-only log for *this* conversation | Per session file | `agent/sessions/**/*.jsonl` (under your agent dir) |
| **Session memory (extension)** | Extra system prompt: path, recap, compaction hints | Same session only (injected each turn) | `extensions/session-memory.ts` → `before_agent_start` |
| **Session saver** | JSON *snapshots* you can list/load | Until you delete files | `.pi/storage/sessions/` (see `extensions/sessions/`) |
| **Cross-session memory (picker)** | Freeform markdown you append | Across Pi runs (global storage) | `~/.pi/storage/agent-memory.md` via `/remember`, `/memory` |
| **AGENTS.md** | Static instructions in **[Context]** | Until you edit the file | `agent/AGENTS.md` next to your Pi agent |
| **Skills** | Markdown workflows the model can open | Repo / package | e.g. `.pi/skills/<name>/SKILL.md` |

Nothing here is a hidden vector database: it is **files**, **prompt text**, and **Pi’s session model**.

---

## 2. Pi’s native session file (JSONL)

For each chat, Pi writes a **JSONL** session file: one JSON object per line.

Common line types include:

- **`session`** — metadata (e.g. id, cwd)  
- **`message`** — user / assistant / tool-related entries  
- **`compaction`** / **`branch_summary`** — summaries when the session is compacted or branched  

Extensions such as **session-memory** read this file (when `getSessionFile()` is available) so the recap matches **what is on disk** for *this* thread. If you branch or compact, new summary lines can appear; the extension tries to surface them in the injected block.

---

## 3. Session Memory extension (`session-memory`)

**Sources:** `extensions/session-memory.ts`, labels in `extensions/chatLabels.ts`, shim `.pi/extensions/session-memory.ts`.

### When it runs

On **`before_agent_start`** (once per model turn), it **extends the system prompt** with a block similar to:

```text
<session_memory>
… follow-up rules …
Session JSONL (this chat): …
Session id: …
Prior summaries from compaction/branch: …
Dialogue recap: …
</session_memory>
```

### Recap labeling

Turns in the recap are shown as **`zerwis:`** (user) and **`pi:`** (assistant) by default—edit **`extensions/chatLabels.ts`** to rename.

### Follow-up shorthand

The injected rules ask the model to treat bare replies like **`1`** or **`yes`** as selecting an option from the **previous assistant** message when that message offered a numbered list.

### What it does *not* do

- It does **not** run tools, subagents, or searches.  
- It does **not** replace reading the repo: the recap is **truncated** and can be **stale** if the file changed unexpectedly—re-read files when precision matters.  
- Toggle: **`/sessionmemory`** (`on` | `off` | `status`).

---

## 4. Session Saver (`session-saver`)

**Source:** `extensions/sessions/index.ts`, config `extensions/sessions/config.json`, **[sessions README](../extensions/sessions/README.md)**.

Purpose: **durable snapshots** (auto-save per message optional, plus `/save`), **listing**, **preview** (`/show`), and **resuming** a Pi session from a **`.jsonl`** path (`/load` → `switchSession`).

This is **backup / portability**, not the same mechanism as session-memory’s prompt injection. You can use both: memory for “what the model sees each turn”; saver for files you keep or share.

---

## 5. Cross-session memory (`extension-picker`)

**Commands:** `/remember <text>`, `/memory`.

**File:** `~/.pi/storage/agent-memory.md` (created on first `/remember`).

On **first message of a session**, the extension can **inject a tail** of that file into the system prompt under a “Cross-session memory” header so preferences or notes survive **new chats**.

Use this for stable preferences (e.g. “always use `bun`”). Use **session JSONL** + **session-memory** for “what we already said *in this chat*”.

---

## 6. `agent/AGENTS.md` (static agent context)

Pi can surface **`agent/AGENTS.md`** in **[Context]** for sessions tied to that agent directory. This repo includes a short **`agent/AGENTS.md`** that points at **`docs/SYSTEM.md`** and stresses **honest tool use**.

It does **not** auto-update from chat—it is **hand-edited** policy and onboarding for the model.

---

## 7. Skills (not transcript memory)

**Skills** are `SKILL.md` files (with frontmatter) Pi may offer when tasks match. They are **instructions and checklists**, not a log of past messages. Folder name must match the skill `name` in frontmatter (this repo uses `.pi/skills/...`). How discovery and `/skill:name` work: **[SKILLS.md](SKILLS.md)**.

---

## 8. Privacy and git

- **Session JSONL** paths often live under **`agent/sessions/`**; this repo **gitignores** that tree so chat logs are not committed by default.  
- **Session saver** output may live under **`.pi/storage/sessions/`** (also gitignored here in typical setup).  
- **`~/.pi/storage/agent-memory.md`** is **global** to your user—do not put secrets you would commit elsewhere.  

---

## 9. Quick troubleshooting

| Symptom | Check |
|--------|--------|
| Model “forgets” earlier in *this* chat | Session-memory off? `/sessionmemory status`. Very long thread? Recap is **capped**—earlier detail may be only in JSONL or compaction lines. |
| Model forgets *between* chats | Use `/remember` + extension-picker injection, or paste context, or open the previous `.jsonl` with **`/load`** (session-saver) if applicable. |
| Recap shows wrong names | Edit **`extensions/chatLabels.ts`**, then **`/reload`**. |
| “Memory” confused with saved JSON files | **Session-memory** = prompt; **session-saver** = files under `.pi/storage/sessions/`. |

---

## 10. Related files

| File | Role |
|------|------|
| `extensions/session-memory.ts` | Prompt injection / recap |
| `extensions/chatLabels.ts` | `zerwis` / `pi` labels |
| `extensions/sessions/index.ts` | Snapshots + `/load` `.jsonl` |
| `extensions/extension-picker.ts` | `/remember`, `/memory`, global md |
| `agent/AGENTS.md` | Static agent instructions |
| `docs/SYSTEM.md` | Broader system + agent conduct |
