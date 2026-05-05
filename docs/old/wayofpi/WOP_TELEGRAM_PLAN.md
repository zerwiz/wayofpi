# Telegram bot agent — Way of Pi plan

**Last updated:** 2026-04-11  
**Status:** T-1 and T-2 (filesystem snapshot) shipped in Claw Channels; live bridge still Pi (`/telegram-connect`)  
**Decision: Extension — not a tool.** See §2 below.

---

## 1. What this enables

A running Claw/Pi session connected to a Telegram bot so the **user can talk to their agent from anywhere** — phone, desktop Telegram, voice messages — and the agent can reply, stream partial text, send files, and receive follow-ups while a long task is running.

Typical flows:

| You do | Agent does |
|--------|-----------|
| Send Telegram message | Pi receives it with `[telegram]` prefix; processes and replies |
| Send voice note | Transcribed locally (Parakeet / Whisper) → injected as text into Pi |
| Send a file / image | Downloaded to workspace, path injected into context |
| Type `stop` | Aborts current Pi turn |
| Queue multiple messages while Pi works | Processed in order after turn completes |

---

## 2. Extension, not a tool — why

| | Pi Extension | Pi Tool (`registerTool`) |
|--|------|------|
| **Lifetime** | Session-level: active for the whole Pi session | Per-call: agent explicitly invokes it |
| **Telegram fit** | ✅ Telegram is a **persistent bidirectional bridge**: always listening, streaming partials back, queueing incoming messages | ❌ A tool would be one-shot (`send_telegram_message`) with no listener |
| **Official precedent** | `badlogic/pi-telegram` — written by Pi's own author, ships as a Pi extension | N/A |
| **Session hand-off** | Extension can move a Pi session CLI ↔ Telegram (TelePi `/handoff`) | Not possible with a tool alone |

**Verdict:** Implement as a **Pi Extension** (TypeScript, `.ts` file). The extension registers slash commands (`/telegram-connect`, `/telegram-disconnect`, `/telegram-status`, `/telegram-setup`), polls the Telegram Bot API, and forwards messages into the Pi session event loop. Attach files via a `telegram_attach` tool registered inside the extension.

---

## 3. Two integration paths (choose one)

### Path A — Use `pi-telegram` (recommended, fastest)

Pi's author (`badlogic`) published `pi-telegram` on 2026-04-04. Install directly into a Pi workspace:

```bash
# install globally into this Pi installation
pi install git:github.com/badlogic/pi-telegram

# or run once without installing (dev/test)
pi -e git:github.com/badlogic/pi-telegram
```

Then in Pi:

```
/telegram-setup     → paste bot token from @BotFather
/telegram-connect   → start polling (session-local)
/telegram-status    → show current pairing and status
/telegram-disconnect → stop polling
```

The bot token is stored in `~/.pi/agent/telegram.json`.  
Files sent from Telegram are downloaded to `~/.pi/agent/tmp/telegram/`.

**Advantages:**
- Zero new code to write — Pi's own author built and maintains it
- Already handles streaming previews, voice transcription, file attach, stop/queue
- Session hand-off (`/handoff` / `/handback`) aligns with TelePi

**Next action:** Document setup in `.claw/workspace/TOOLS.md` and add a Claw UI status card (Phase UI-1 below).

---

### Path B — Custom Way of Pi extension

Build a first-party extension under `extensions/telegram-agent.ts` for deeper WOP integration:

- Store bot token in workspace `.claw/telegram.json` (not global `~/.pi/agent/`)
- Surface Telegram status in Claw Mission view (`/api/claw/telegram/status`)
- Allow multi-bot routing: different Telegram bots per workspace
- Tie into Claw's eventual HEARTBEAT scheduler

This is more work but gives better multi-project isolation. Build only if Path A proves insufficient.

---

## 4. Phase plan

| Phase | What ships | Blocked on |
|-------|-----------|------------|
| **T-0** (now) | This plan doc; `.claw/workspace/TOOLS.md` template mentions `pi-telegram`; Claw UI shows a "Telegram not connected" placeholder card | Nothing — UI stub only |
| **T-1** | Claw **Channels** tab: full setup guide; Help section matches; token **never** exposed in the UI | Done |
| **T-2** | **`GET /api/claw/telegram/status`** (and **`GET /api/config`** → **`clawTelegramStatus`**) — read-only snapshot: token file present (`~/.pi/agent/telegram.json` and/or `.claw/telegram.json`), `pi-telegram` listed in **opened workspace(s)** or the **Way of Pi host checkout** `.pi/settings.json` `extensions[]`. Claw UI polls every 30s. **Not included:** connected/last-message/bot-name (requires Pi session or Bot API call from a trusted process — still T-4 / Pi wiring) | Done (snapshot); live status → T-4 |
| **T-3** | Workspace-scoped bot config (`.claw/telegram.json`) instead of global `~/.pi/agent/telegram.json`; multi-workspace support | Way of Pi namespacing + Pi extension config override |
| **T-4** | Full Claw Mission "Telegram" panel: chat preview, voice-note status, file transfers, queue size | Pi WS event forwarding (see `WOP_MULTI_AGENT_WEBSOCKET.md`) |

---

## 5. Security notes (non-negotiable before T-1)

- Bot token is a **secret**. Never log it, never send to client in API responses, never commit to git.
- The first `/start` DM to the bot becomes the **only allowed user** (allowlist of one Telegram user ID).
- Document in `.claw/workspace/SECURITY.md` template: token location, rotation steps, revoke with @BotFather.
- Inform users: local Telegram bot = anyone who gets the token can send messages to your agent.

---

## 6. Telegram Bot setup (reference steps)

1. Open [@BotFather](https://t.me/botfather) in Telegram
2. Send `/newbot` — choose a name + username (e.g. `MyClawBot`)
3. Copy the **bot token** (format: `123456789:ABCdef...`)
4. In Pi: run `/telegram-setup` and paste the token
5. Run `/telegram-connect` — Pi starts polling
6. Open your bot DM in Telegram → send `/start` → you are now the paired user
7. Send a message → Pi receives it, processes, replies

---

## 7. Files created / updated

| File | Role |
|------|------|
| `docs/WOP_TELEGRAM_PLAN.md` (this file) | Plan and decision record |
| `.claw/workspace/TOOLS.md` template | Documents `pi-telegram` setup for the agent |
| `.claw/workspace/HEARTBEAT.md` template | Placeholder for future Telegram heartbeat checks |
| `apps/wayofpi-ui/src/components/claw/ClawWorkspaceCard.tsx` | UI card showing `.claw/workspace/` bundle status |
| `apps/wayofpi-ui/src/hooks/useClawWorkspace.ts` | Hook: check which `.claw/workspace/` files exist + scaffold |
| `apps/wayofpi-ui/server/claw-telegram-status.ts` | Server-only scan for Telegram integration hints (no secrets) |
| `apps/wayofpi-ui/shared/claw-telegram-status.ts` | Shared **`ClawTelegramStatusV1`** type |
| `apps/wayofpi-ui/src/hooks/useClawTelegramStatus.ts` | Client poll + refresh: **`GET /api/config`** → **`clawTelegramStatus`**, fallback **`GET /api/claw/telegram/status`** |
| `apps/wayofpi-ui/src/components/claw/ClawChannelsView.tsx` | Channels tab: Telegram card wired to status API |

---

## 8. Related docs

| Doc | Role |
|-----|------|
| `docs/WOP_CLAW_MODE_PLAN.md` | Claw autonomy phases (channels = Phase E) |
| `docs/WOP_CLAW_UI_PLAN.md` | Claw UI research and layout |
| `docs/WOP_PI_BACKEND_WIRING_PLAN.md` | Pi backend ownership rules |
| `extensions/` | Where a custom `telegram-agent.ts` would live |
| `pi-telegram` (external) | `github.com/badlogic/pi-telegram` — the recommended extension |
