# Skill Creation Rules

## Overview

This document describes how to create and manage skills for the agent. Skills are defined as modular units of behavior and knowledge that can be dynamically loaded into the agent.

## Directory Structure

All skills should be stored in: `/home/zerwiz/.pi/agent/rules/`

## Skill Format

Each skill file should follow this structure:

```yaml
skill:
  name: "skill_name"
  version: "1.0.0"
  description: "Brief description of what the skill does"
  trigger: "trigger_condition"
  actions:
    - action_type: "action1"
      parameters:
        - param1: value1
        - param2: value2
    - action_type: "action2"
```

## Requirements for Skills

### 1. Naming Convention
- Use kebab-case for skill names (e.g., `research-capability`)
- Avoid special characters except hyphens and underscores
- Keep names descriptive and concise

### 2. Versioning
- Always include a version number
- Follow semantic versioning (MAJOR.MINOR.PATCH)
- Increment PATCH for bug fixes
- Increment MINOR for new functionality
- Increment MAJOR for breaking changes

### 3. Description
- Keep descriptions under 500 characters
- Use clear, action-oriented language
- Include intended use cases

### 4. Trigger Conditions
Specify when the skill activates:
- `on_keyword`: Keywords that trigger the skill
- `on_command`: Specific commands/queries
- `on_context`: Context-based triggers

Examples:
```yaml
trigger:
  on_keyword: ["research", "information", "lookup"]
  on_command: "find info on"
  on_context: "research"
```

### 5. Actions
Define what the skill does:
- Use atomic actions
- Keep actions focused on a single purpose
- Specify parameters clearly

## Examples

### Example 1: Web Search Skill

```yaml
skill:
  name: "web-search"
  version: "1.2.0"
  description: "Searches the web for current information on any topic"
  trigger:
    on_keyword: ["find", "search", "look up", "what is"]
  actions:
    - type: "search_engine"
      parameters:
        query: "{{input.query}}"
        count: 5
        safe_search: true
    - type: "display_results"
      parameters:
        format: "markdown"
```

### Example 2: Code Writing Skill

```yaml
skill:
  name: "code-generation"
  version: "1.0.0"
  description: "Generates code in any programming language"
  trigger:
    on_keyword: ["write code", "generate", "code for"]
  actions:
    - type: "parse_request"
    - type: "generate_code"
      parameters:
        language: "python"
        requirements: []
    - type: "format_code"
```

## Skill Registration

To make a skill available to the agent:

1. Save the skill YAML file to the rules directory
2. Restart the agent service or reload rules
3. Verify skill registration using:
   ```bash
   agent list-skills
   ```

## Testing Skills

Before deploying skills:

1. Test in sandbox environment
2. Verify trigger conditions work
3. Check parameter values
4. Validate action outputs
5. Review for security implications

## Security Guidelines

- Never include hardcoded API keys
- Use environment variables for secrets
- Validate all user inputs
- Rate limit potentially harmful actions
- Log skill usage for audit trails

## Best Practices

✅ DO:
- Keep skills modular and focused
- Include clear version numbers
- Document dependencies
- Test thoroughly before release
- Update for security patches

❌ DON'T:
- Mix multiple responsibilities in one skill
- Hardcode sensitive values
- Create overly broad triggers
- Bypass security controls
- Neglect version tracking

## Maintenance

### Updating Skills
- Update version numbers
- Add changelog comments
- Test new functionality
- Deprecate old skills in changelog

### Removing Skills
1. Copy files to `/home/zerwiz/.pi/agent/rules/archive/`
2. Update version notes
3. Verify agent no longer references them
4. Clean up after 30-day retention

## Contact

For questions or issues:
- File a GitHub issue
- Check existing documentation
- Review community examples