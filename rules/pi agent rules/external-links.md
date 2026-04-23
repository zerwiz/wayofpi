# 🔗 Pi Coding Agent External Links Index

This file documents all external resources, documentation sources, tools, and standards for the **Pi Coding Agent (`pi.dev`)** ecosystem. Use this as your quick reference when building extensions, skills, or integrating external services.

---

## 🌐 Official Pi Links

### Pi Development Platform

| URL | Description | Link Type |
|-----|-----|
| https://www.pi.dev | Official Pi development platform | **Official Product** |

**Purpose:** Access Pi tools, documentation, release notes, and official resources.

**Use:** Navigate to [pi.dev](https://www.pi.dev) for the latest documentation and announcements.

---

### NPM Package Registry

| Package | URL | Description | Link Type |
|---------|-----|------|
| `@mariozechner/pi-coding-agent` | https://www.npmjs.com/package/@mariozechner/pi-coding-agent | Package documentation and installation options | **Documentation** |

**Purpose:** Install, configure, and set up Pi Coding Agent via npm.

**Use:** Run `pi install npm:@mariozechner/pi-coding-agent` for latest version.

---

## 📦 GitHub Resources

### Pi-Mono Monorepo

| URL | Organization | Description | Link Type |
|-----|------|------|
| https://github.com/badlogic/pi-mono | `badlogic` | Main Pi monorepo containing CLI, core logic, and documentation | **Main Repository** |

**Purpose:** Core Pi repository with CLI binary, extensions, skills, and agent logic.

---

### Pi Tools Repository

| URL | Description | Link Type |
|-----|------|----|
| https://github.com/badlogic/tools | Collection of utility scripts for file management and automation | **Utility Scripts** |

**Purpose:** Utility tools for the Pi ecosystem (git hooks, automation, helpers).

---

### Pi-AI Tools Repository

| URL | Description | Link Type |
|-----|------|----|
| https://github.com/pi-ai/tools.git | Community-contributed AI/ML tools and integrations | **Community Tools** |

**Purpose:** Third-party tools and utilities for the Pi AI ecosystem.

---

## 🤝 Community & Socials

### YouTube - "I Hated Every Coding Agent..."

| URL | Channel | Description | Link Type |
|-----|------|------|----|
| https://www.youtube.com/watch?v=Dli5slNaJu0 | Mario Zechner | The "Manifesto" video explaining Pi's philosophy and why Extensions over built-in features | **Philosophy** |

**Purpose:** Understand the design decisions behind Pi's architecture.

**Use:** Watch to learn why Pi uses Extensions instead of monolithic features.

---

### BlueSky / X (Mario Zechner)

| URL | Platform | Description | Link Type |
|-----|------|------|----|
| https://bsky.app/profile/badlogic.bsky.social | BlueSky | Official updates from creator | **Official Updates** |
| https://twitter.com/badlogic101 (legacy) | X/Twitter | Alternative platform | **Social Media** |

**Purpose:** Official dev logs, announcements, and behind-the-scenes content.

---

### Community Discussions

#### Discord

| URL | Description | Link Type |
|-----|------|----|
| https://discord.gg/pi-dev | Pi Dev Community Discord | **Community** |

**Purpose:** Real-time discussion, support, and feature requests.

---

#### Stack Overflow

| URL | Description | Link Type |
|-----|------|----|
| https://stackoverflow.com/questions/tagged/pi-coding-agent | Pi Coding Agent tag | **Q&A** |

**Purpose:** Ask questions and find answers from the developer community.

---

## 🛠️ Related Technologies & Standards

### Model Context Protocol (MCP)

| URL | Description | Link Type |
|-----|------|----|
| https://modelcontextprotocol.io/ | MCP open standard for connecting to third-party tools | **Open Standard** |

**Purpose:** Learn how to build MCP servers that Pi can consume via `mcp-servers.json`.

**Use:** Reference when creating custom tools via MCP protocol.

---

### JSON Schema Reference

| URL | Description | Link Type |
|-----|------|----|
| https://json-schema.org/ | JSON Schema specification | **Reference** |

**Purpose:** The format required for `api.registerTool()` schemas.

**Use:** Validate arguments passed from LLM to your TypeScript extensions.

**Example:**
```json
{
  "type": "object",
  "properties": {
    "command": {"type": "string"},
    "args": {"type": "string"}
  },
  "required": ["command"]
}
```

---

### TypeScript

| URL | Description | Link Type |
|-----|------|----|
| https://www.typescriptlang.org/ | TypeScript homepage | **Language** |

**Purpose:** Primary language for Pi extensions.

**Use:** Build type-safe extension code.

---

### Node.js

| URL | Description | Link Type |
|-----|------|----|
| https://nodejs.org/ | Node.js runtime | **Runtime** |

**Purpose:** Runtime environment for extensions.

**Use:** `node` >= 18 recommended for extensions.

---

### Git

| URL | Description | Link Type |
|-----|------|----|
| https://git-scm.com/ | Git distribution and documentation | **Version Control** |

**Purpose:** Version control for Pi repositories.

**Use:** Install Pi from Git or manage dependencies.

---

## 📚 Documentation Files (Pi Rules)

All documentation is located in `~/.pi/rules/` directory:

| File | Description | Location |
|------|-----|----|
| `README.md` | Master documentation with extensions overview | `rules/` |
| `agents.md` | Defines 3 core extension mechanisms | `rules/` |
| `extensions.md` | Extension creation rules | `rules/` |
| `skills.md` | Skill creation guidelines | `rules/` |
| `architecture.md` | Filesystem maps and directory structure | `rules/` |
| `external-links.md` | This file | `rules/` |
| `bestpractices.md` | Best practices for all extensions/skills | `rules/` |

---

## 🔄 Updates & Change History

### Latest Update

- **Date:** 2025
- **Version:** 1.0
- **Status:** Production Ready

### External Links Added

- [ ] Community socials (BlueSky, X, Discord, Stack Overflow)
- [ ] MCP official documentation
- [ ] Philosophy videos (YouTube manifesto)
- [ ] TypeScript runtime documentation
- [ ] JSON Schema reference

---

## 📝 Quick Reference: Installation Commands

### Install Pi from Git

```bash
pi install git:https://github.com/badlogic/pi-mono.git
```

### Install Tools from Git

```bash
pi install git:https://github.com/badlogic/tools.git
```

### Install from NPM

```bash
pi install npm:@mariozechner/pi-coding-agent@>=1.0.0
```

### Install Local Package

```bash
pi install -l ../../tools
```

### Enable Extension

```bash
pi install -e <extension-name>
```

---

## 🔍 Common Links Summary

| Resource | URL | Purpose |
|----------|-----|----|
| **Pi Website** | https://www.pi.dev | Official platform |
| **NPM Package** | https://www.npmjs.com/package/@mariozechner/pi-coding-agent | Package docs |
| **Pi-Mono** | https://github.com/badlogic/pi-mono | Main repo |
| **Pi Tools** | https://github.com/badlogic/tools | Utility scripts |
| **MCP Standards** | https://modelcontextprotocol.io/ | Open standard |
| **TypeScript** | https://www.typescriptlang.org/ | Language |
| **Node.js** | https://nodejs.org/ | Runtime |
| **Git** | https://git-scm.com/ | Version control |
| **Discord** | https://discord.gg/pi-dev | Community |
| **BlueSky** | https://bsky.app/profile/badlogic.bsky.social | Creator updates |
| **Stack Overflow** | https://stackoverflow.com/questions/tagged/pi-coding-agent | Q&A |

---

## ⚠️ Important Notes

1. **Always use official sources** for Pi installations
2. **Verify external tool links** before integrating into extensions
3. **Check MCP compatibility** before third-party tool integration
4. **Follow license requirements** for all external dependencies
5. **Pin versions** to avoid breaking changes in production

---

## 🔗 Related Documents

- **Pi Dev Docs**: https://www.pi.dev
- **Pi Coding Agent Docs**: `~/.pi/rules/README.md`
- **Architecture Map**: `~/.pi/rules/architecture.md`
- **Best Practices**: `~/.pi/rules/bestpractices.md`

---

## 📝 License

MIT License - See `~/.pi/LICENSE` for details

---

## 📝 Last Updated

2025
