# WhatsApp Integration Specification — Way of Pi Plan

## 📋 Overview

This document specifies the direct integration of **WhatsApp** (via [RaphaCastelloes/whatsapp-pi](https://github.com/RaphaCastelloes/whatsapp-pi)) with the **Way of Pi claw agent**. This integration allows users to interact with their Way of Pi agents directly via WhatsApp Business API, utilizing the full suite of Pi coding tools and autonomous capabilities.

| Field | Value |
|-------|-------|
| **Version** | 1.1.0 |
| **Status** | Planning |
| **Author** | zerwiz |
| **Target** | wayofpi.org |

---

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      WhatsApp Pi Bot                              │
│                    (RaphaCastelloes/whatsapp-pi)                 │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Way of Pi Claw Agent                            │
│                    (Way of Pi / .claw/)                         │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              Botium WIA Test Framework                            │
│                 (eroppe/botium-wia)                              │
└─────────────────────────────────────────────────────────────────┘
```

### Integration Flow

1. **User** sends message to WhatsApp Business account.
2. **WhatsApp Pi** receives via webhook and forwards to the Way of Pi agent loop.
3. **Claw Agent** executes tools (read/bash/edit/write) based on the request.
4. **Result** streamed back to the user via WhatsApp.
5. **Botium WIA** validates the end-to-end message flow and tool correctness.

---

## 🧩 Components

### 1. WhatsApp Pi Bot

**Source:** [`RaphaCastelloes/whatsapp-pi`](https://github.com/RaphaCastelloes/whatsapp-pi)

**Purpose:**
- Direct WhatsApp Business API integration.
- Message listener and responder.
- Handles media (voice notes, images) via direct API calls.

**Installation:**
```bash
pi install git:github.com/RaphaCastelloes/whatsapp-pi
```

**Configuration:**
- Business API credentials (stored in `.pi/agent/whatsapp.json`)
- Webhook URL (provisioned via ngrok or public IP)
- Allowed User List (paired phone numbers)

### 2. Way of Pi Claw Agent

**Directory:** `.claw/`

**Purpose:**
- Main logic controller for messaging turns.
- Manages persistent memory across WhatsApp sessions.
- Orchestrates tools (bash, read, edit, etc.) on behalf of the remote user.

**Key Files:**
- `AGENTS.md` — Agent definitions for WhatsApp personas.
- `TOOLS.md` — Allowlist of tools reachable via WhatsApp.
- `MEMORY.md` — Context sync between CLI and WhatsApp.

### 3. Botium WIA Test Framework

**Source:** [`eroppe/botium-wia`](https://github.com/eroppe/botium-wia)

**Purpose:**
- Automated regression testing for WhatsApp message handling.
- Validates that tool outputs are correctly formatted for the mobile view.

---

## 🔐 Security Requirements

### Secret Management
- **WhatsApp Tokens:** MUST be stored in `~/.pi/agent/whatsapp.json` (gitignored).
- **Webhook Security:** Webhooks must verify the WhatsApp signature to prevent spoofing.
- **User Gating:** Only authorized phone numbers can trigger tool execution.

---

## 🎯 Goals

- ✅ **Standalone Service:** WhatsApp operates independently of any other bridge (e.g., Telegram).
- ✅ **Mobile Autonomy:** Users can run complex `bash` tasks and `git` workflows from their phone.
- ✅ **Unified Memory:** The agent remembers the conversation whether the user is on CLI or WhatsApp.

---

## 📁 Project Structure

```bash
Way of pi/
├── .pi/
│   ├── agent/
│   │   ├── whatsapp.json          # WhatsApp specific config
│   │   └── sessions/
│   ├── agents/
│   │   └── whatsapp-bot.md
│   └── extensions/
│       └── whatsapp-pi.ts         # Direct extension
│
├── .claw/
│   ├── AGENTS.md
│   ├── CRON.md
│   └── MEMORY.md
│
├── docs/
│   └── WOP_WHATSAPP_PLAN.md       # This document (canonical)
│
└── plans/claw/
    └── whatsapp-pi-claw-integration-spec.md # Legacy spec (refers to doc)
```

---

## 🚧 Milestones

1. **Phase W-1:** Establish direct WhatsApp ↔ Pi connection via `whatsapp-pi` extension.
2. **Phase W-2:** Implement secure webhook handling with signature verification.
3. **Phase W-3:** Integrate Botium WIA for automated WhatsApp flow testing.
4. **Phase W-4:** Sync `.claw/MEMORY.md` between local CLI sessions and WhatsApp turns.

---

## 📖 Related Documentation

- [Telegram Integration Plan](WOP_TELEGRAM_PLAN.md) — For the separate Telegram system.
- [Claw Autonomy Phases](../WOP_CLAW_MODE_PLAN.md)
- [Botium WIA Guide](https://botium.wia.works/)
