# Way of Pi — multi-agent real-time WebSocket contract

Contract for **orchestration** (agent-team style): per-specialist **assistant**, **thinking**, **tool**, and **skill** events so the UI can show **live** cards and a **Focus** transcript without TUI-only state.

## Transport

- **WebSocket** (same origin as web UI), path e.g. **`/ws`**.
- Multiplex **multiple specialists** on **one** browser connection using **`agentId`** / **`sessionId`** on every event.

## Event envelope (conceptual)

```json
{
  "type": "tool_start",
  "agentId": "reviewer",
  "sessionId": "sub-uuid",
  "ts": 1710000000000,
  "payload": { }
}
```

## Event types (minimum)

| `type` | Purpose |
|--------|---------|
| `assistant_delta` | Streaming assistant text chunk for that specialist. |
| `message_complete` | Assistant message finished for that turn. |
| `thinking_delta` | Reasoning / thinking stream when model exposes it. |
| `tool_start` | Tool id, summary args, status `running`. |
| `tool_end` | Result summary, duration, success/fail. |
| `tool_error` | Error message + optional stack id for support. |
| `status_change` | `idle` \| `running` \| `done` \| `error` for card header. |
| `token_usage_update` | Context %, ↓in / ↑out tokens (mirror Pi footer stats). |
| `skill_start` / `skill_end` | When runtime exposes skill boundaries; optional. |

## UI mapping

- **Orchestration grid** — one card per `agentId`; append to in-card log; **virtualize** long logs; **throttle** high-frequency deltas.
- **Focus** — full-height transcript + tabs: **Transcript**, **Thinking**, **Tools** (table), **Skills**.
- **Technical mode** — bottom **Tool log** panel with **filter by agent** dropdown.
- **Simple mode** — short live lines + **Expand** / **Focus**; show **“Not available for this model”** when edges missing (no fake data).

## Fallback

If a Pi build hides thinking or skill edges, emit **no** `thinking_*` / `skill_*` events; UI shows neutral empty states.

## Related

- **[docs/AGENT_TEAMS.md](AGENT_TEAMS.md)** — current TUI orchestration behavior.
- **[PLAN_WEB_STANDALONE_SYSTEM.md](PLAN_WEB_STANDALONE_SYSTEM.md)** — orchestration screen spec.
