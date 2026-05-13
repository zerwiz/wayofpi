# 🧠 Way of Pi - Project Context & Guidelines

This directory contains project-specific context, custom skills, and agent configuration for the Way of Pi project.

## 📋 Project Overview

**Way of Pi** is a powerful AI-assisted development environment that combines:
- **Technical Editor Mode**: Full IDE-like capabilities with file exploration, editing, and debugging
- **Simple Mode**: Chat-based workflow for quick tasks and lightweight projects
- **Claw Mode**: Mission-specific workflows for complex, goal-oriented tasks

## 🗂️ Directory Structure

```
.gemini/
├── gemini.md              # This context file
└── skills/
    ├── gemini/            # Core, project-specific skills
    ├── cli/               # Tool creation & management
    ├── filemanager/       # Local file operations
    ├── agent-memory/      # Memory management skills
    └── workflows/         # Complex task workflows
```

## 🎯 Core Capabilities

### File Operations
- **Read/Write**: Full read/write access to project files
- **Search**: Grep, find, advanced pattern matching
- **Image Processing**: Edit and analyze images directly
- **Terminal Access**: Execute shell commands with approval

### Agent Skills
- **Technical Analysis**: Code review, refactoring, debugging
- **File Management**: Create, delete, rename, organize files
- **Documentation**: Auto-generate, update, and maintain docs
- **Testing**: Write and execute test cases
- **MCP Integration**: Connect to external services via Model Context Protocol

### Memory Management
- Persistent memory across sessions
- Session tracking and history
- Context preservation for long-running tasks

## 🛠️ Custom Tools & Skills

### Available Skills
1. **gemini/** - Core agent skills for project-specific tasks
2. **cli/** - Custom command-line tools and utilities
3. **filemanager/** - Advanced file system operations
4. **agent-memory/** - Memory management and session tracking
5. **workflows/** - Multi-step task automation

### MCP Servers
Configure MCP servers in `.pi/settings.json` or in project-specific config:
- Database connections
- API integrations
- External service adapters
- Custom tool providers

## 📝 Usage with Gemini CLI

### Direct Directory Access
```bash
cd /home/zerwiz/CodeP/Way\ of\ pi
gemini
```

### Include External Directories
```bash
gemini --include-directories ../lib,../docs
```

### Create Custom Skills

Use the `skill-creator` tool to scaffold new skills:
```bash
gemini skills create --name my-custom-skill
```

Install in:
- **Project-scoped**: `.gemini/skills/` (shared with team)
- **User-scoped**: `~/.gemini/skills/` (personal)

### Extensions
Manage bundled packages:
```bash
gemini extensions install <repository-url>
```

## 🔐 Privacy & Permissions

- All operations require explicit approval or `--approval-mode` flag
- No data sent to external services without consent
- Local-only mode available for privacy-sensitive work

## 🎨 Project Features

### Multi-Root Workspaces
- Manage multiple project roots seamlessly
- Cross-project file operations
- Shared library integration

### Debugging
- Breakpoint support
- Session execution
- Error analysis

### Themes & Customization
- Built-in themes (`./theme-lib/`)
- Custom color schemes
- Editor preferences

### Agent Teams
- Collaborative agent orchestration
- Role-based task distribution
- Team communication (`.pi/teams.yaml`)

## 📚 Documentation

- **README.md**: Project overview and getting started
- **CHANGELOG.md**: Version history and updates
- **.pi/docs/**: Technical documentation
- **TEMPLATES/**: Code generation templates

## 💡 Quick Tips

1. **File Operations**: Describe what you want done; the agent handles it with approval
2. **Code Generation**: "Create a React component with X features" - agent scaffolds and implements
3. **Debugging**: "Fix the bug in X" - agent analyzes, proposes, and applies fixes
4. **Documentation**: "Document all public API methods" - agent reviews code and writes docs
5. **Testing**: "Write tests for X function" - agent generates comprehensive test suite

## 🚀 Next Steps

1. Explore `.gemini/skills/` for core skills
2. Review `.pi/docs/` for technical documentation
3. Check `.pi/teams.yaml` for agent team configuration
4. Customize `.pi/settings.json` for your workflow

---

**Remember**: This context file provides persistent instructions for agents working in this project. Modify it to tailor agent behavior to your specific needs!
