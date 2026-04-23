# Memory & Context Management System for AI Coding Assistants

## Overview

Together, these three scripts form a complete, robust Memory and Context Management System for an AI coding assistant.

If you are using an AI for a long, complex coding session, you run into a major physical limitation: AI models have a limited "context window" (a maximum amount of text they can remember at one time). If a chat gets too long, the AI will start forgetting your original instructions, hallucinate, or crash.

Here is how these three plugins work together to solve that exact problem.

### The Big Picture: Managing the "Brain" of the AI

Think of this system as managing the AI's short‑term and long‑term memory while keeping you (the human) in the loop.

1. **The "Logbook" (Session Replay)**
   - **File Location:** `ref/session-replay.ts`
   - **Who it's for:** You (the user).
   - **What it does:** It gives you a highly visual, scrollable timeline of the entire conversation. If the AI suddenly gets confused, you can open `/replay` to see exactly what tools it ran, what code it read, and how long everything took. It is your diagnostic tool.

2. **The "Executive Summary" (Session Memory)**
   - **File Location:** `ref/session-memory.ts`
   - **Who it's for:** The AI (the logic engine).
   - **What it does:** Instead of forcing the AI to read the entire massive "Logbook" every single time you ask a question (which wastes tokens and space), this script constantly compresses the history. It keeps the very first thing you asked, keeps the most recent things you asked, and drops the messy middle. It ensures the AI stays on‑task without overloading its brain.

3. **The "Fuel Gauge" (Context Local Hints)**
   - **File Location:** `ref/context-local-hints.ts`
   - **Who it's for:** Local AI Models (like Ollama running on your own hardware).
   - **What it does:** Local models are notoriously bad at knowing when their memory is full. This script looks at the size of the "Logbook", calculates the math, and acts as a warning system. It constantly whispers to the AI: *"Hey, your memory is 75% full. Start summarizing, save your work to a file, and ask the user to start a new chat soon."*

## Summary

If you use these three together, you transform a basic AI chatbot into a professional coding agent.

- **Replay tool** – lets you see what is happening.
- **Memory tool** – ensures the AI remembers your goals efficiently.
- **Hints tool** – prevents local models from crashing when the conversation gets too deep.

## Integration

To integrate this Memory & Context Management System into your Way of Pi configuration, copy the three TypeScript files into your `.pi/extensions` directory:

```bash
# These three files form a complete, robust Memory and Context Management System
/home/zerwiz/CodeP/Way of pi/ref/context-local-hints.ts
/home/zerwiz/CodeP/Way of pi/ref/session-replay.ts
/home/zerwiz/CodeP/Way of pi/ref/session-memory.ts

# Copy them to .pi/extensions:
cp /home/zerwiz/CodeP/Way of pi/ref/context-local-hints.ts /home/zerwiz/CodeP/Way of pi/.pi/extensions/
cp /home/zerwiz/CodeP/Way of pi/ref/session-replay.ts /home/zerwiz/CodeP/Way of pi/.pi/extensions/
cp /home/zerwiz/CodeP/Way of pi/ref/session-memory.ts /home/zerwiz/CodeP/Way of pi/.pi/extensions/
```

Once copied, the AI will automatically pick them up as extensions, activating:

- **Session Replay** (`session-replay.ts`) – visible timeline via `/replay` command
- **Session Memory** (`session-memory.ts`) – keeps history concise and relevant
- **Context Local Hints** (`context-local-hints.ts`) – warns you before context fills up

---

*Document generated on `2026-04-23` for the Way of Pi project.*