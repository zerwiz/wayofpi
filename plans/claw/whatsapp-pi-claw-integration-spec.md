# WhatsApp Pi + Botium WIA Integration Specification

## 📋 Overview

This document specifies the integration of **WhatsApp Pi** (via [RaphaCastelloes/whatsapp-pi](https://github.com/RaphaCastelloes/whatsapp-pi)) with the **Way of Pi claw agent**, using **Telegram bridge** and **Botium WIA** test framework.

| Field | Value |
|-------|-------|
| **Version** | 1.0.0 |
| **Status** | Planning |
| **Author** | zerwiz |
| **Generated** | $(date) |
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
│                 Telegram Bridge (pi-telegram)                     │
│                    (BadLogic/pi-telegram)                        │
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

1. **User** sends message to WhatsApp Pi bot
2. **Telegram Bridge** relays to Way of Pi agent
3. **Claw Agent** executes tools (read/bash/edit/write)
4. **Result** relayed back through Telegram → WhatsApp
5. **Botium WIA** validates message flow

---

## 🧩 Components

### 1. WhatsApp Pi Bot

**Source:** [`RaphaCastelloes/whatsapp-pi`](https://github.com/RaphaCastelloes/whatsapp-pi)

**Purpose:**
- WhatsApp business API integration
- Pi coding capabilities injection
- Message flow management

**Installation:**
```bash
pi install git:github.com/RaphaCastelloes/whatsapp-pi
```

**Configuration:**
- Business API credentials (stored in `.pi/agent/`)
- Webhook URL setup
- Message filtering rules

### 2. Telegram Bridge

**Source:** [`BadLogic/pi-telegram`](https://github.com/BadLogic/pi-telegram)

**Purpose:**
- Relay between WhatsApp and Way of Pi
- Tool execution sandboxing
- Multi-platform communication

**Setup Commands:**
```bash
/telegram-setup       # Paste bot token from @BotFather
/telegram-connect     # Start polling (session-local)
/telegram-status      # Show pairing and status
```

**Security:**
- Token stored in `.pi/agent/telegram.json` (gitignored)
- First `/start` DM becomes the only allowed user
- See [`docs/WOP_TELEGRAM_PLAN.md`](docs/WOP_TELEGRAM_PLAN.md) for full plan

### 3. Botium WIA Test Framework

**Source:** [`eroppe/botium-wia`](https://github.com/eroppe/botium-wia)

**Purpose:**
- Automated chatbot testing
- Message flow validation
- Integration testing with real APIs
- User journey simulation

**Test Categories:**
- Basic message flow
- Tool execution tests
- Error handling scenarios
- Security validation
- Performance benchmarks

### 4. Way of Pi Claw Agent

**Directory:** `.claw/`

**Purpose:**
- Agent supervision and coordination
- Schedule management
- Memory and state management
- Tool orchestration

**Key Files:**
- `AGENTS.md` — Agent management
- `MEMORY.md` — Long-term memory index
- `TOOLS.md` — Tool configuration
- `SECURITY.md` — Security guidelines
- `SOUL.md` — Agent conduct
- `CRON.md` — Scheduled job management

---

## 🔐 Security Requirements

### Secret Management

| **NEVER Commit** | **DO** |
|------------------|--------|
| WhatsApp API keys | Store in `.pi/agent/` (gitignored) |
| Telegram bot tokens | Use `.pi/agent/telegram.json` |
| Webhook credentials | Environment variables |
| User data/PII | Hash or anonymize |

### Access Control

```
┌────────────────────────────────────────────────────────────┐
│              Access Control Hierarchy                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  📌 Admin (Way of Pi owner) → Full access                  │
│                                                             │
│  🔒 Hermes Team (botium integration) → Deploy access       │
│                                                             │
│  🌱 ZeroWiz (contributor) → Read/write test access         │
│                                                             │
│  📱 End User → Chat only → No system access                │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Audit Logging

```bash
# Log all API access attempts
pi audit --log whatsapp-api-access.json

# Log schedule changes
pi audit --log schedule-changes.json

# Log tool executions
pi audit --log <date>.json
```

---

## 🎯 Goals

### Primary Objectives

- ✅ Provide WhatsApp access to Way of Pi agents (claw)
- ✅ Enable WhatsApp Pi to use Pi tools (bash, read, write, shell)
- ✅ Integrate Botium WIA testing for WhatsApp flows
- ✅ Build unified chatbot framework (WhatsApp + Telegram + GitHub)
- ✅ Track scheduled jobs with pi-schedule-prompt integration

### Success Criteria

| Metric | Target |
|--------|--------|
| Message response time | < 5 seconds |
| Tool execution reliability | > 99% |
| Test coverage | 90%+ |
| Failure recovery | < 1 retry |
| Security audit pass | 100% |

---

## ⚙️ Integration Workflow

### Message Flow

```
User WhatsApp
     │
     ▼
WhatsApp Business API
     │
     ▼
WhatsApp Pi Bot
     │
     ▼
Telegram Bridge (pi-telegram)
     │
     ▼
Way of Pi Agent (.claw/)
     │
     └──► Executes tools (bash/read/edit/write/grep)
     │
     ▼
Botium WIA Test Framework (validation)
     │
     ▼
Result → Telegram Bridge → WhatsApp Pi → User
```

### Tool Execution Pattern

```bash
# 1. User requests action via WhatsApp
#    "Search latest crypto news"

# 2. Telegram bridge forwards to Way of Pi agent
#    Via .pi/agent-sessions/<agent-name>.json

# 3. Agent validates request
#    - Check permissions
#    - Sanitize input
#    - Load tools configuration

# 4. Agent executes tools
#    pi write /way of pi/plans/...
#    pi read /way of pi/...
#    pi grep ...

# 5. Agent logs execution
#    To .pi/agent-sessions/<date>.json

# 6. Result sent back to user
#    Via Telegram → WhatsApp
```

---

## 🧪 Testing Strategy

### Botium WIA Test Flows

```yaml
test_flows:
  - basic: search-crypto-news
    steps:
      - send: "search latest crypto news"
      - expect: tool execution
      - verify: results returned
  
  - advanced: multi-step-research
    steps:
      - send: "analyze market trends"
      - expect: bash execution
      - verify: analysis report
  
  - edge: tool-failure-handling
    steps:
      - send: "run invalid tool"
      - expect: error handling
      - verify: user notification
  
  - security: unauthorized-request
    steps:
      - send: "access secret file"
      - expect: permission denied
      - verify: secure response
```

### Test Execution

```bash
# Run all tests
pi test run --suite botium-whatsapp

# Run specific tests
pi test run search-crypto-news

# Generate report
pi test report --format json > test-results.json
```

### CI/CD Pipeline

```yaml
# GitHub Actions workflow
name: WhatsApp Botium Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: |
          pi install git:eroppe/botium-wia
          pi test run --suite whatsapp
      - run: |
          pi audit --log ci-test-results.json
```

---

## 📁 Project Structure

```bash
Way of pi/
├── .pi/
│   ├── agent/
│   │   ├── telegram.json          # Telegram config
│   │   └── sessions/
│   ├── agents/
│   │   ├── whatsapp-bot.md
│   │   └── security-agent.md
│   ├── extensions/
│   └── settings.json
│
├── .claw/
│   ├── AGENTS.md
│   ├── CRON.md
│   ├── MEMORY.md
│   └── schedule/
│       ├── claw-schedules.v1.json
│       └── logs/
│
├── docs/
│   └── WOP_TELEGRAM_PLAN.md
│
├── plans/claw/
│   ├── whatsapp-pi-claw-integration-spec.md
│   └── pi-schedule-prompt-integration-spec.md
│
└── memory/
    └── session logs
```

---

## 🚧 Milestones

### Phase 1: Setup (Week 1)

- [ ] Install WhatsApp Business API
- [ ] Setup Telegram bridge
- [ ] Configure initial permissions
- [ ] Document setup procedures

### Phase 2: Integration (Week 2-3)

- [ ] Connect WhatsApp Pi to Way of Pi agent
- [ ] Implement tool execution pipeline
- [ ] Add Botium WIA tests
- [ ] Build schedule management

### Phase 3: Testing (Week 4)

- [ ] Complete test suite coverage
- [ ] Security audit pass
- [ ] Performance benchmarks
- [ ] Documentation finalization

### Phase 4: QA (Week 5-6)

- [ ] User acceptance testing
- [ ] Failover testing
- [ ] Load testing
- [ ] Documentation update

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| WhatsApp API rate limits | High | Queue system, retry logic |
| Telegram bridge security | Medium | Token rotation, audit logging |
| Tool execution sandboxing | High | Permission checks, input validation |
| State management across platforms | Medium | Persist manifests, git-backed |
| Unauthorized modifications | Medium | Permission checks, audit logs |

---

## 📖 Related Documentation

- [WhatsApp Pi GitHub](https://github.com/RaphaCastelloes/whatsapp-pi)
- [Botium WIA](https://github.com/eroppe/botium-wia)
- [pi-telegram](https://github.com/BadLogic/pi-telegram)
- [Way of Pi Docs](https://wayofpi.org/docs/)
- [Botium WIA Tutorial](https://botium.wia.works/)

---

## 📝 Notes

- Follow Way of Pi patterns for documentation
- Use `.claw/` directory for all integration files
- Keep manifests versioned and auditable
- Review integration monthly for optimization
- Document all prompt changes in `docs/`
- Adhere to `.cursor/rules/pi-projects-docs.mdc`

---

*Generated: $(date)*  
*Author: zerwiz*  
*Intended for: Way of Pi development team*
