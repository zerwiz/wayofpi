# PIP: Pi Infrastructure & Playground

## Overview
PIP (located at `/home/zerwiz/pip`) is a high-performance, stable extension management layer for Pi (v0.70.5+). It solves the "multiple -e flag" instability issue by introducing a **Single-Entry Dynamic Loader**.

## Key Features
- **Dynamic Loader**: Uses `pi-loader.ts` to programmatically load a "stack" of extensions from a single `-e` flag.
- **Conflict Resolution**: Prevents multiple UI cores (like `minimal` and `pure-focus`) from fighting over the terminal footer.
- **Prioritized Loading**: Ensures utilities and core functions load before UI widgets.
- **Large Skill & Agent Library**: Contains a massive collection of specialized agents (located in `.pi/agents/`) and skills (located in `.pi/skills/`).

## Relationship with Way of Pi
Way of Pi will utilize PIP as a core dependency for extension management and agent orchestration. PIP will provide the "Fluent" tier of extensions, while Way of Pi maintains its "Protected" tier for critical UI stability.
