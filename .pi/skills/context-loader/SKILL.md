---
name: context-loader
description: Automatically loads AGENTS.md project layout as runtime context on startup
allowed-tools: read bash
---

# Tiny Context Loader

This skill **automatically injects** the project layout from `AGENTS.md` into agent context on startup.

## What it does

When Pi loads this skill, it:
1. Reads `/home/zerwiz/CodeP/Way of pi/AGENTS.md`
2. Injects the content as `context` into all loaded agents

## When it runs

The context-load hook activates automatically when agents start or reload. The AGENTS.md content becomes available to every agent through the Pi context injection system.

## Tools

- `bash` - for direct file operations
- `read` - provided by Pi framework
