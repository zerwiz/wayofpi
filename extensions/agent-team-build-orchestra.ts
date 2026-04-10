/**
 * Agent team — **build-orchestra** default roster (thin wrapper)
 *
 * Identical to **`agent-team.ts`** but sets **`PI_AGENT_TEAM_DEFAULT=build-orchestra`**
 * before registering hooks so the dispatcher starts on the builder-orchestrator team
 * (planner, reviewer, documenter, builder, domain lang/infra specialists in **`teams.yaml`**).
 *
 * For the **standard** dispatcher (initial team = first key in **`teams.yaml`**, usually **`full`**),
 * load **`extensions/agent-team.ts`** only.
 *
 * Usage: `pi -e extensions/agent-team-build-orchestra.ts` — see **`just ext-builder-team`**, **`pi-e` menu**.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import agentTeam from "./agent-team.ts";

export default function (pi: ExtensionAPI) {
	process.env.PI_AGENT_TEAM_DEFAULT = "build-orchestra";
	agentTeam(pi);
}
