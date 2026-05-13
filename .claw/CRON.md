# CRON.md — Scheduled Job Management

> This file tracks all scheduled agents and cron-style jobs within Way of Pi.
> Use the pi-schedule-prompt integration for job definition and management.
> Never commit secrets, credentials, or API keys in this file.

## pi-schedule-prompt Integration

We integrate **tintinweb/pi-schedule-prompt** for:
- Prompt-based job scheduling
- Job status tracking and logging
- Failure recovery and retry logic
- State persistence across agent sessions

### Quick Start

```bash
# 1. Install pi-schedule-prompt
pi install git:https://github.com/tintinweb/pi-schedule-prompt.git

# 2. Define a new scheduled job
$ prompt schedule name=weekly-crypto-news
  Agent: biz-business-analyst
  Schedule: 9:00 on the first Sunday of each month
  Job: Search latest crypto news from multiple sources

# 3. View scheduled jobs
pi schedule --list

# 4. Modify a job
pi schedule edit weekly-crypto-news
```

## Schedule Manifest Location

All schedule definitions live in **`.claw/schedule/`**:

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

## Current Schedules

```json
{
  "schedules": [
    {
      "id": "sched-1776808229297-qx0k0",
      "name": "weekly news on crypto",
      "agent": "biz-business-analyst",
      "cron": "0 9 1 * *",
      "description": "Search latest crypto news from multiple sources",
      "status": "enabled"
    }
  ]
}
```

## Adding a New Scheduled Job

```bash
# Navigate to project root
cd Way of pi

# Define new schedule
$ prompt schedule <<'JOB'
name: daily-security-scan
agent: security
cron: "0 2 * * *"
description: Run security vulnerability scan on all monitored repos
JOB

# Verify the schedule is registered
pi schedule --view daily-security-scan

# Check schedule status
pi schedule --status
```

## Schedule Status Command

```bash
pi schedule --status --format json
```

## Troubleshooting

```bash
# View failed job logs
cat .claw/schedule/logs/<job-id>-2024.json

# Retry failed job
pi schedule retry <job-id>

# Disable a problematic job
pi schedule --disable <job-id>
```

## Security Notes

- **NEVER** commit API keys or credentials in schedule manifests
- Use `.pi/agent/` for storing secrets (see SECURITY.md)
- Audit all schedule changes with `git log .claw/schedule/`
- Follow **`.cursor/rules/pi-projects-docs.mdc`** for documentation

## Related Files

- `README.md` — Way of Pi project documentation
- `SECURITY.md` — Security and credential handling
- `SOUL.md` — Agent ethics and conduct
- `TOOLS.md` — Tool configuration and notes
- `/plans/pi-schedule-prompt-integration-spec.yml` — Full integration spec
