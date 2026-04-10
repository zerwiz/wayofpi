import type { ChatMessage } from "./chat";

export type ChatSessionMode = "build" | "plan";

/**
 * Fallback when `planner.md` is missing from the workspace (still Pi-shaped planning rules).
 */
export const PLAN_SESSION_SYSTEM_FALLBACK = `You are the **planner** persona for this workspace (Way of Pi web shell).

**Behavior:** focus on design, trade-offs, and sequencing — not shipping large pasted code dumps unless the user asks for a small illustrative snippet.

**Output shape** in your replies (use clear headings):
- **Goal** — what "done" means
- **Assumptions & constraints** — unknowns explicit
- **Current state** — only what the user or prior messages established
- **Files to touch** — table: path | create/modify/delete | notes
- **Implementation steps** — ordered, concrete
- **Risks & mitigations**
- **Verification** — tests/commands/checks
- **Handoff** — what a builder should do next

**Artifact:** when it helps, tell the user to save your plan as \`plans/PLAN-YYYYMMDD-<short-slug>.md\` and paste the relative path in your final paragraph.`;

const WEB_SHELL_AGENT_NOTE = `

---

**Way of Pi web session:** You do not have Pi's automatic tools (read/write/bash, etc.) in this chat unless the user pastes context. The \`tools\` line in your agent frontmatter does not grant capabilities here — describe steps and paths for the human or for a full Pi TUI session.`;

/** Appended when Plan mode injects \`planner.md\` (or fallback) on top of another agent persona. */
const WEB_SHELL_PLAN_MODE_NOTE = `

---

**Way of Pi web session (Plan mode):** You cannot run \`read\`/\`grep\`/\`bash\` here. Ground plans in pasted context or prior messages; ask the user to write \`plans/PLAN-…\` locally. For full Pi planner behavior with repo tools, use the Pi TUI with the **planner** agent.`;

export interface LeadSystemInput {
	mode: ChatSessionMode;
	envSystemPrompt?: string;
	/** Body from workspace agent \`.md\` (after frontmatter), or null. */
	agentBody: string | null;
	/** Lowercase \`name:\` from frontmatter — avoids duplicating \`planner.md\` when Plan mode + planner agent. */
	agentNameLower: string | null;
	/**
	 * Body from \`planner.md\` (Pi scan order), when Plan mode applies and the active agent is not already \`planner\`.
	 * Pass \`null\` to use {@link PLAN_SESSION_SYSTEM_FALLBACK}.
	 */
	plannerAgentBody: string | null;
}

export function composeLeadSystem(input: LeadSystemInput): string | null {
	const env = input.envSystemPrompt?.trim() ?? "";
	const parts: string[] = [];
	if (env) parts.push(env);
	const agent = input.agentBody?.trim();
	if (agent) parts.push(agent + WEB_SHELL_AGENT_NOTE);
	if (input.mode === "plan") {
		if (input.agentNameLower === "planner") {
			/* \`planner.md\` is already the active agent body — do not stack a second copy. */
		} else {
			const planCore = input.plannerAgentBody?.trim() || PLAN_SESSION_SYSTEM_FALLBACK;
			parts.push(planCore + WEB_SHELL_PLAN_MODE_NOTE);
		}
	}
	if (parts.length === 0) return null;
	return parts.join("\n\n---\n\n");
}

export function applyLeadSystem(messages: ChatMessage[], input: LeadSystemInput): void {
	const composed = composeLeadSystem(input);
	const hasLeadSystem = messages.length > 0 && messages[0].role === "system";
	if (!composed) {
		if (hasLeadSystem) messages.shift();
		return;
	}
	if (hasLeadSystem) {
		messages[0] = { role: "system", content: composed };
	} else {
		messages.unshift({ role: "system", content: composed });
	}
}
