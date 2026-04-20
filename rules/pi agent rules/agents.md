# Agent Creation Rules

## Overview

This document describes how to create and register custom agents within the PI (Personified Intelligence) agent system. Agents are autonomous entities with specialized capabilities, personalities, and operational boundaries.

## Directory Structure

Custom agents should be stored in: `/home/zerwiz/.pi/agent/rules/`

## Agent Definition Format

Each agent is defined using a YAML configuration file following this schema:

```yaml
agent:
  name: "agent_name"
  version: "1.0.0"
  description: "Brief description of the agent's purpose"
  personality:
    traits:
      - trait1
      - trait2
    tone: "tone_style"
    preferences:
      - pref1
      - pref2
    knowledge_base:
      - knowledge_item
  capabilities:
    - capability_name
  restrictions:
    - restriction1
    - restriction2
  commands:
    - command: "trigger_command"
      action_type: "action1"
      fallback: "fallback_message"
  tools:
    - tool1
    - tool2
  environment:
    working_dir: "/path/to/working/dir"
    memory_file: "memory.dat"
    session_timeout: 3600
  health_checks:
    enabled: true
    interval: 300
```

## Creation Guidelines

### 1. Agent Naming

- Use descriptive, lowercase names with hyphens (e.g., `research-assistant`, `security-analyst`)
- Avoid spaces and special characters
- Keep names unique within the system

### 2. Versioning

- Follow semantic versioning (MAJOR.MINOR.PATCH)
- MAJOR: Significant functional changes
- MINOR: New features, backwards compatible
- PATCH: Bug fixes, minor improvements

### 3. Personality Design

**Traits** (3-5 recommended):
- Be honest and direct
- Think like a professional
- Be empathetic and helpful
- Prioritize user safety

**Tone**:
- Professional, friendly, or casual
- Match the agent's purpose

**Knowledge Base** (optional):
- Define specific knowledge areas
- Use bullet points for clarity

### 4. Capabilities

List up to 10 focused capabilities:

```yaml
capabilities:
  - code-generation
  - web-search
  - data-analysis
  - file-management
  - content-creation
  - security-scanning
  - scheduling
  - memory-retrieval
```

### 5. Restrictions

Define what the agent cannot do:

```yaml
restrictions:
  - "do not access private files without permission"
  - "do not execute system commands unless explicitly authorized"
  - "always confirm before deploying changes"
  - "maintain data privacy at all times"
```

### 6. Commands & Actions

Map user commands to system actions:

```yaml
commands:
  - command: "status"
    action_type: "report_health"
    fallback: "I'm functioning normally"
  - command: "restart"
    action_type: "reinitialize"
    fallback: "I need to restart myself"
  - command: "help"
    action_type: "display_capabilities"
```

### 7. Tools

Specify available tools:

```yaml
tools:
  - bash
  - python
  - grep
  - file-manager
  - browser (optional)
```

### 8. Environment Configuration

Define runtime environment:

```yaml
environment:
  working_dir: "/home/zerwiz/.pi/agent/work"
  memory_file: "agent_memory.sqlite"
  session_timeout: 7200   # seconds (2 hours)
```

## Example: Full Agent Definition

```yaml
agent:
  name: "research-specialist"
  version: "2.1.0"
  description: "Specialized agent for academic and technical research assistance"
  
  personality:
    traits:
      - "thorough"
      - "analytical"
      - "evidence-based"
      - "humble about limitations"
    tone: "professional but approachable"
    preferences:
      - "prioritize accuracy"
      - "cite sources"
      - "avoid speculation"
    knowledge_base:
      - "machine learning fundamentals"
      - "statistical analysis"
      - "scientific method"
  
  capabilities:
    - web-search
    - academic-research
    - data-interpretation
    - literature-review
    - hypothesis-generation
  
  restrictions:
    - "do not fabricate citations"
    - "always verify sources"
    - "avoid making unverified medical claims"
    - "maintain research integrity"
    - "respect copyright and licensing"
  
  commands:
    - command: "review-papers"
      action_type: "search_and_summarize"
      fallback: "Please provide search terms or paper topics"
    - command: "find-references"
      action_type: "citation_lookup"
      fallback: "I can help with citations on related topics"
    - command: "explain-concept"
      action_type: "knowledge_explanation"
      fallback: "Let me explain that in more detail"
  
  tools:
    - bash
    - python
    - web-search
    - browser
  
  environment:
    working_dir: "/home/zerwiz/.pi/agent/work/research"
    memory_file: "research_agent_memory.sqlite"
    session_timeout: 5400
  
  health_checks:
    enabled: true
    interval: 3600
```

## Agent Validation

Before deploying an agent:

1. **Syntax Check**: Validate YAML structure
   ```bash
   python -c "import yaml; yaml.safe_load(open('agent.yaml'))"
   ```

2. **Capability Verification**: Ensure tools exist
   ```bash
   agent validate-tools --agent-name <name>
   ```

3. **Security Scan**: Review restrictions thoroughly
   ```bash
   agent security-check --agent-name <name>
   ```

## Registration Process

To register a new agent:

1. Save YAML file to `/home/zerwiz/.pi/agent/rules/`
2. Register with the agent manager:
   ```bash
   agent register --file <agent.yaml>
   ```
3. Verify registration:
   ```bash
   agent list
   ```
4. Test basic commands:
   ```bash
   agent chat --agent-name <name> --message "hello"
   ```

## Best Practices

✅ DO:
- Keep agents focused on specific domains
- Document dependencies clearly
- Include appropriate error handling
- Set reasonable timeouts
- Version control all agent changes
- Test in staging before production

❌ DON'T:
- Create overly broad/general agents
- Hardcode secrets or API keys
- Bypass restriction systems
- Use deprecated tool versions
- Skip version control

## Maintenance

### Updates

- Increment patch version for bugs
- Increment minor version for new features
- Increment major version for breaking changes
- Deprecate old agents in major versions

### Archiving

- Mark inactive agents as `DEPRECATED` in manifest.yaml
- Move outdated agents to `/archive/`
- Document deprecation dates

### Monitoring

```yaml
health_checks:
  enabled: true
  interval: 300  # Check every 5 minutes
  metrics:
    - response_time
    - error_rate
    - memory_usage
    - active_sessions
```

## Security Guidelines

- Never store API keys in agent configs
- Use environment variables for secrets
- Implement principle of least privilege
- Review permissions monthly
- Audit log all agent actions

## Testing

All new agents must pass:

1. Unit tests for command parsing
2. Integration tests for tool usage
3. Security tests for restriction enforcement
4. Load tests for memory/timeout handling

```bash
agent test --agent-name <name>
agent test --suite <suite-name>
```

## Common Errors

| Error | Solution |
|-------|----------|
| YAML syntax error | Validate file with yaml.parser |
| Tool not found | Check available tools list |
| Permission denied | Review restrictions config |
| Agent timeout | Increase session_timeout |
| Memory overflow | Reduce working_dir size |

## Appendix: YAML Schema Reference

For detailed schema documentation, see: `/home/zerwiz/.pi/agent/rules/skills.md`

---

*Last Updated: $(date +%Y-%m-%d)*
*Author: Agent Administrator*
*Version: 1.0.0*