# pi-schedule-prompt Integration Specification

## 📋 Overview

This document specifies the integration of **tintinweb/pi-schedule-prompt** (cron job scheduling and management) into the **Way of Pi** project. The integration enables:

- Prompt-based job scheduling via natural language
- Job status tracking and logging
- Failure recovery and retry logic
- State persistence across agent sessions

| Field | Value |
|-------|-------|
| **Version** | 1.0.0 |
| **Status** | Planning |
| **Source** | [tintinweb/pi-schedule-prompt](https://github.com/tintinweb/pi-schedule-prompt) |
| **Author** | zerwiz |
| **Generated** | $(date) |

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       pi-schedule-prompt System                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Way of Pi Agent Sessions                       │
│                    (Agent execution and results)                   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│               Schedule Logging & Persistence                      │
│                  (memory/YYYY-MM-DD.md)                           │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Way of Pi Memory System                        │
│                   (MEMORY.md / .claw/ directory)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Prompt System** — Natural language job definition (`prompt schedule`)
2. **Manifest Files** — Versioned schedules in `.claw/schedule/`
3. **Status Tracking** — Execution logs in `memory/YYYY-MM-DD.json`
4. **Audit Logging** — All changes to `.claw/CRON.md`

---

## 🧩 Components

### 1. Prompt System

**Location:** `pi schedule` (Pi shell command)

**Features:**
- Natural language job definition
- Cron expression parsing
- Job status tracking
- Failure detection and retry prompts

**Usage Pattern:**
```bash
# Define a new scheduled job
$ prompt schedule <<'JOB'
name: weekly-crypto-news
agent: biz-business-analyst
schedule: 9:00 on first Sunday of month
job: Search latest crypto news from multiple sources
JOB

# View scheduled jobs
pi schedule --list

# Modify existing job
pi schedule edit weekly-crypto-news

# View schedule status
pi schedule --status
```

### 2. Manifest Files

**Location:** `.claw/schedule/claw-schedules.v1.json`

**Current Schedule:**
```json
{
  "version": 1,
  "schedules": [
    {
      "id": "sched-1776808229297-qx0k0",
      "name": "weekly news on crypto",
      "description": "Search latest crypto news",
      "cron": "0 9 1 * *",
      "triggerMode": "cron",
      "agentName": "biz-business-analyst",
      "prompt": "Search latest crypto news",
      "status": "enabled",
      "createdAt": "2026-04-21T21:50:29.297Z"
    }
  ]
}
```

### 3. Log Files

**Location:** `memory/YYYY-MM-DD.md`

**Fields:**
- Job execution timestamps
- Success/failure status
- Tool outputs
- Error messages
- Retry counts

---

## 🎯 Goals

### Primary Objectives

- ✅ Enable cron job management via prompts
- ✅ Track scheduled agent tasks across sessions
- ✅ Log job execution with full context
- ✅ Provide failure recovery and retry logic
- ✅ Build unified scheduler with Telegram/WhatsApp
- ✅ Integrate with pi-schedule-prompt prompt system

### Success Metrics

| Metric | Target |
|--------|--------|
| Job creation time | < 1 prompt |
| Execution reliability | > 99% |
| Failure recovery | < 1 retry |
| State persistence | 100% across restarts |

---

## ⚙️ Workflow

### Defining a New Schedule

```bash
# Navigate to Way of Pi project root
cd /home/zerwiz/CodeP/Way\ of\ pi

# Define schedule via prompt
$ prompt schedule <<'JOB'
name: daily-security-scan
agent: security-agent
schedule: "0 2 * * *"
description: Run security vulnerability scan
job: pi grep --files pi-security/...
JOB

# Verify schedule is registered
pi schedule --status
```

### Modifying an Existing Schedule

```bash
# Edit existing schedule
pi schedule edit daily-security-scan

# View current configuration
pi schedule view daily-security-scan

# Disable schedule temporarily
pi schedule disable daily-security-scan
```

### View Schedule Status

```bash
# JSON format (for automation)
pi schedule --status --format json

# Human-readable format
pi schedule --status
```

---

## 🔐 Security Notes

### **NEVER** Commit

| **NEVER Commit** | **DO Instead** |
|------------------|----------------|
| API keys or credentials | Store in `.pi/agent/` |
| Telegram bot tokens | Use `.pi/agent/telegram.json` |
| User data or PII | Anonymize or hash |
| Schedule prompts with secrets | Use prompt variables |

### **DO**

- Use `.gitignore` for `.pi/agent/`
- Audit all schedule changes with `git log .claw/schedule/`
- Follow **`.cursor/rules/pi-projects-docs.mdc`** for documentation
- Document all prompt templates in `docs/`

---

## 📁 Storage Location

```
.claw/schedule/
├── claw-schedules.v1.json    # Main schedule manifest
├── schedules/                # Versioned schedule files
│   ├── 2024-01-01.yml
│   ├── 2024-02-01.yml
│   └── ...
├── logs/                    # Job execution logs
│   ├── weekly-crypto-news-2024.json
│   └── ...
└── manifests/               # Git-backed schedule states
```

### Memory Files

| File | Purpose |
|------|---------|
| `memory/YYYY-MM-DD.md` | Daily session logs (auto-created) |
| `.claw/MEMORY.md` | Long-term index |
| `.claw/CRON.md` | Schedule management |
| `.pi/agent/sessions/*.json` | Agent execution state |

---

## 🧪 Testing

### Manual Testing

```bash
# 1. Create test schedule
$ prompt schedule <<'JOB'
name: test-schedule
agent: test-agent
schedule: "0 * * * *"
description: Test minute-triggered schedule
job: echo "Test schedule ran" > memory/test.log
JOB

# 2. Verify schedule is active
pi schedule --status

# 3. Check logs after execution
cat memory/test.log
```

### Automated Testing

```bash
# Create test script
cat > test-schedule.sh <<'SCRIPT'
#!/bin/bash
# Test schedule creation and activation
cd Way of pi
pi schedule --status

# Test failed schedule
echo "Schedule created: $? "
SCRIPT

# Run test
pi test schedule
```

---

## 🚧 Milestones

### Phase 1: Setup (Week 1)

- [ ] Install pi-schedule-prompt
- [ ] Define initial cron manifests
- [ ] Configure prompt templates
- [ ] Document setup procedures

### Phase 2: Integration (Week 2-3)

- [ ] Integrate with Way of Pi agent system
- [ ] Add schedule tracking to agent sessions
- [ ] Build job execution logging
- [ ] Add error handling and retry

### Phase 3: Testing (Week 4)

- [ ] Complete test suite
- [ ] Security audit
- [ ] Performance benchmarks
- [ ] Documentation finalization

### Phase 4: Production (Week 5-6)

- [ ] User acceptance testing
- [ ] Failover testing
- [ ] Load testing
- [ ] Deploy to production

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Job conflicts (multiple agents) | High | Name collision detection, job locking |
| Prompt injection attacks | Medium | Prompt sanitization, input validation |
| State loss on restart | Medium | Persistent manifests in `.claw/` |
| Unauthorized modifications | Medium | Permission checks, audit logs |

---

## 📖 Related Documentation

- [pi-schedule-prompt GitHub](https://github.com/tintinweb/pi-schedule-prompt)
- [CRON.md](.claw/CRON.md) — Schedule management guide
- [MEMORY.md](.claw/MEMORY.md) — Memory documentation
- [SECURITY.md](.claw/SECURITY.md) — Security guidelines
- [WOP_TELEGRAM_PLAN.md](docs/WOP_TELEGRAM_PLAN.md) — Telegram integration

---

## 📝 Notes

- Follow Way of Pi patterns for schedule management
- Use `.claw/` directory for all schedule files
- Keep manifests versioned and auditable
- Review schedules monthly for optimization

---

*Generated: $(date)*  
*Author: zerwiz*  
*For: Way of Pi development team*
