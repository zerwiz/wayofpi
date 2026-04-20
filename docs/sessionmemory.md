Session Memory: Core Architecture

link to file /home/zerwiz/CodeP/Way of pi/extensions/session-memory.ts

The session-memory.ts extension acts as the long-term context manager for the Pi coding agent. It reinjects conversation history from the session JSONL file into the agent's system prompt while using strict XML role tracking to prevent attribution errors.

Core functions:
- `extractMessageText()`: Extracts plain text from message entries, handling tool call invocations
- `formatTurn()`: Wraps turns in XML tags with role attributes (user/assistant/system)
- `buildRecapFromTurns()`: Builds session recap with smart truncation (opening anchors + recent tail)
- `collectTurnsFromFile()`: Reads and parses session JSONL with dual-format support (JSON/JSONL)
- `collectTurnsFromBranch()`: Collects unsaved memory from live branch for real-time context
- `buildFullDigest()`: Assembles complete session context for system prompt injection
- Tool definitions: `read_current_session_history` and `search_past_sessions`

Session Memory: Core Architecture

The session-memory.ts extension acts as the long-term context manager for the Pi coding agent. Its primary purpose is to safely reinject conversation history into the agent's system prompt while explicitly preventing hallucinations and "attribution drift."

Here is a breakdown of the core mechanisms that power this extension.

1. Strict Attribution & XML Role Tracking

One of the most critical jobs of this extension is making sure the agent knows who said what—specifically, distinguishing between an answer from a tool, a message from itself, and an instruction from the user.
By default, LLMs can get confused when reading raw chat logs—especially when tools are involved. They might hallucinate that the user pasted a terminal log, or that the agent itself typed out the contents of a massive file.

Session Memory solves this by wrapping all history in strict XML tags:

<session_turn role="user">: Explicitly tags user commands.

<session_turn role="assistant">: Tags the agent's previous outputs.

<session_turn role="system">: Crucially tags tool outputs. This prevents the agent from thinking it authored the result of a bash command or script execution.

2. Initial Goal Preservation

On long tasks, agents frequently experience "goal drift" where they forget the user's original request after focusing on minor debugging steps for too long.

The extension scans the history for the first substantial user message (length > 2 characters, so it ignores quick "hi"s).

It locks this message inside an <initial_session_goal> tag.

This tag is pinned to the top of the system prompt for the entire duration of the chat, anchoring the agent to its original mission.

3. Smart Truncation (The "Recap")

To prevent the agent from crashing due to exceeding token limits on long chats, the extension uses a smart truncation strategy:

The Opening Anchors: It preserves the first ~3 turns of the conversation so the context is established.

The Recent Tail: It preserves the most recent conversation up to a strict budget (4,200 characters).

The Middle Drop: It intentionally truncates and drops the middle of long conversations to save memory.

4. The Dual-Format Parser

Because the underlying saving mechanism can sometimes be inconsistent, the extension includes a highly resilient parsing engine. It reads the chat history file off the disk and can dynamically handle:

Strict JSONL: Line-by-line parsing (.jsonl).

Standard JSON: Full JSON array parsing (.json), just in case the saving module formats it differently.

Live Branch Sync: It also pulls unsaved live memory directly from the session manager and merges it with the disk file so the agent never misses its most recent action.

5. Active Recall Toolsse the "Smart Truncation" drops the middle of the chat, the agent might occasionally need to look up a tool output or instruction that got truncated. The extension provides two dedicated tools for the agent to fix its own memory gaps:

read_current_session_history: An "active recall" tool that allows the agent to fetch up to the last 100 un-truncated turns of the current chat if it feels lost.

search_past_sessions: Allows the agent to search through older, closed chat sessions for specific keywords.