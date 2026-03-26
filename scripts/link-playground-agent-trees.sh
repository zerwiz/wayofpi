# Source from bash: symlink playground agents / commands / damage-control into a project.
# Usage: source this file then link_playground_agent_trees <playground_root> <project_root>
link_playground_agent_trees() {
	local PLAYGROUND="$1"
	local TARGET="$2"
	local a_cmds="$PLAYGROUND/.claude/commands"
	local t_agents="$TARGET/.pi/agents"
	local t_cmds="$TARGET/.claude/commands"
	local t_dc="$TARGET/.pi/damage-control-rules.yaml"
	local s_dc="$PLAYGROUND/.pi/damage-control-rules.yaml"

	if [[ ! -e "$t_agents" ]]; then
		ln -snf "$PLAYGROUND/.pi/agents" "$t_agents"
		echo "Linked: $t_agents → $PLAYGROUND/.pi/agents"
	else
		echo "Left unchanged: $t_agents (already exists — remove to use playground roster)"
	fi

	if [[ -d "$a_cmds" ]]; then
		mkdir -p "$TARGET/.claude"
		if [[ ! -e "$t_cmds" ]]; then
			ln -snf "$a_cmds" "$t_cmds"
			echo "Linked: $t_cmds → $a_cmds"
		fi
	fi

	if [[ -f "$s_dc" ]]; then
		if [[ ! -e "$t_dc" ]]; then
			ln -snf "$s_dc" "$t_dc"
			echo "Linked: $t_dc → $s_dc"
		fi
	fi
}
