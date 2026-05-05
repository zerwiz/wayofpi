# System Architecture Specification: Local pi.dev Orchestrator with Distributed Inference

## Overview

This document describes the architecture of the Local **pi.dev** Orchestrator system that decouples state management from model inference. The control plane runs locally on your machine, while the compute plane runs remotely on distributed inference nodes.

---

## 1. Infrastructure Topology

The system decouples state management from model inference:

| Plane      | Location                    | Role                                                                 |
|------------|-----------------------------|----------------------------------------------------------------------|
| **Control Plane** | Local Machine           | Manages state, queues, and orchestration.                            |
| **Compute Plane** | Remote Nodes (5 endpoints) | Model inference using OpenAI-compatible servers (vLLM/Ollama).       |

### Control Plane (Local Machine)

- **workspace.db** — SQLite database acting as the shared state and DAG (Directed Acyclic Graph) queue.
- **swarm-cli.js** — Node.js executable interface for agents to perform CRUD operations on the DB.
- **pi Core** — Runs the base extension and hosts the hidden `tmux` sessions for each agent role.

### Compute Plane (Remote Nodes)

- **5 distinct IP endpoints** running OpenAI-compatible servers (vLLM/Ollama).
- **Model loaded:** Qwen 9.5:9b

---

## 2. Database Schema (SQLite)

The SQLite database is the single source of truth. It handles task dependencies and prevents race conditions using atomic row locking.

```sql
CREATE TABLE tasks (
    task_id TEXT PRIMARY KEY,
    parent_id TEXT NULL,               -- For DAG dependency mapping
    agent_tier INTEGER NOT NULL,       -- 1=Master, 2=Domain, 3=Worker, 4=Verifier
    status TEXT NOT NULL,              -- PENDING, IN_PROGRESS, REVIEW, COMPLETED, FAILED
    target_file TEXT,                  -- Path to the file being modified
    instruction_payload JSON NOT NULL, -- The specific prompt/criteria
    code_payload TEXT,                 -- Worker output injected here
    feedback_payload TEXT,             -- Verifier feedback injected here
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tier System

| Tier | Role      | Responsibility                                           |
|------|-----------|----------------------------------------------------------|
| 1    | Master    | Analyze codebase, define domains, push Tier 2 tasks      |
| 2    | Domain    | Break domains into sub-tasks (UI/Hook/Component/Tier 3)  |
| 3    | Worker    | Write code for specific tasks                            |
| 4    | Verifier  | Validate code against criteria, pass or fail task        |

### Status Flow

```
PENDING → IN_PROGRESS → REVIEW → COMPLETED
                                          ↓
                                   FAILED (retry_count = 3)
```

---

## 3. The Interface Layer (swarm-cli.js)

This is the **only** tool the agents are given. It abstracts database queries into simple bash commands.

### Commands

| Command                          | Function                                                                 |
|----------------------------------|--------------------------------------------------------------------------|
| `push`                           | Inserts a new row with status `PENDING`.                                 |
| `pop`                            | Retrieves oldest `PENDING` task for the specified tier, updates status to `IN_PROGRESS`. |
| `submit`                        | Updates row with Worker code, changes status to `REVIEW`.                |
| `validate`                      | Passes task → `COMPLETED`; Fails task → retries or marks `FAILED`.      |

### Usage Examples

```bash
# Push a new Tier 2 task for UI/Hook domain
node swarm-cli.js push --tier 2 --parent <task_id> --file path/to/file --payload '{"type":"UI","domain":"auth"}'

# Pop next Tier 2 task
node swarm-cli.js pop --tier 2

# Submit code to review
node swarm-cli.js submit --id <task_id> --code "<string>"

# Validate worker output (pass/fail)
node swarm-cli.js validate --id <task_id> --pass true --feedback "Code meets all requirements"
```

---

## 4. Agent Node Definitions (Background Processes)

Triggered by the `pi` extension on boot. Each runs in an isolated, headless shell.

| Process ID    | Model Endpoint    | System Prompt Assignment                         | Execution Loop                                  |
|---------------|-------------------|--------------------------------------------------|--------------------------------------------------|
| **agent_master**   | `node1:qwen9.5`   | Tier 1: Analyze root codebase. Read `app.tsx`. Use `push` to define major domains. One-shot execution. Monitors COMPLETED count. |
| **agent_domain**   | `node2:qwen9.5`   | Tier 2: Loop `pop --tier 2`. Read domain files. Break into UI/Hook tasks. Use `push`. Continuous polling interval: `5000ms`. |
| **agent_worker1**  | `node3:qwen9.5`   | Tier 3: Loop `pop --tier 3`. Write code based on payload. Use `submit`. Continuous polling interval: `3000ms`. |
| **agent_worker2**  | `node4:qwen9.5`   | Tier 3: Loop `pop --tier 3`. Write code based on payload. Use `submit`. Continuous polling interval: `3000ms`. |
| **agent_verifier** | `node5:qwen9.5`   | Tier 4: Loop `pop --tier 4`. Compare `code_payload` against `instruction_payload`. Use `validate`. Continuous polling interval: `2000ms`. |

### Build Directory

Workers write code locally to a temporary workspace before submission:

```bash
/tmp_build/
```

---

## 5. State Machine & Execution Flow

### 1. INIT

- User runs `/swarmstart.tsx`
- Bootstrapper injects Tier 1 task into `workspace.db`

### 2. DELEGATION

- **agent_master** reads Tier 1 task, pushes `N` Tier 2 tasks for each identified domain.

### 3. SUB-DELEGATION

- **agent_domain** pops Tier 2 task, breaks domain into finer sub-tasks (UI/Hook), pushes Tier 3 tasks.

### 4. COMPUTE

- **agent_worker\[1|2\]** pops Tier 3 task.
- Writes file locally to temporary workspace `/tmp_build/`.
- Uses `submit` → changes status to `REVIEW`.

### 5. VERIFICATION (DAG Loop)

- **agent_verifier** pops `REVIEW` task.
- Evaluates `/tmp_build/` file against strict criteria in `instruction_payload`.

| Outcome  | Action                                                |
|----------|-------------------------------------------------------|
| **Pass**   | `validate --pass true` → status `COMPLETED`.          |
| **Fail**   | `validate --pass false` → increments `retry_count`, clears `code_payload`, updates `feedback_payload`, status `PENDING`. |
| **Hard Fail** | If `retry_count > 3`, task `FAILED`, execution tree halts. |

### 6. ASSEMBLY

- **agent_domain** observes all child tasks = `COMPLETED`.
- Updates its own task to `COMPLETED`.
- Output is merged to the production directory.

---

## 6. Summary

| Component                  | Purpose                                                   |
|----------------------------|-----------------------------------------------------------|
| **Control Plane**          | State management, DAG queuing, orchestration.             |
| **Compute Plane**          | Distributed model inference across 5 remote nodes.        |
| **SQLite**                 | Shared state, atomic locking for concurrency control.      |
| **swarm-cli.js**           | Agent interface for DB operations.                         |
| **5 Agent Nodes**          | Master, Domain, Worker (x2), Verifier – each with specific tier role. |
| **State Machine**          | INIT → DELEGATION → SUB-DELEGATION → COMPUTE → VERIFY → ASSEMBLE. |

---

## 7. Deployment Notes

- Ensure all remote nodes are reachable via OpenAI-compatible endpoints.
- Verify SQLite permissions for multi-threaded access.
- Monitor `worker_*` logs for task throughput and failure rates.
- Use `swarm-cli.js` metrics dashboard (future feature) for real-time status.

---

*Document generated on `2026-04-23` for the Way of Pi project.*




 Im running 2 instances of qwen 9.5:9b. I wanna make an skill or estention so the
 orheatrators can talk to eatchother in pi.dev.

 Small models have problem with big changes in codebase. Wo we need to make them run several
 ov resarch runs. And define every part of the requestsed task in to small pieces and the we
 make new agenst in the orchestration in charche of the small pieces.

 Examle. Break down this 10 000 line of code app.tsx in to a smaller files.

 The whole system maby are 5 pages.

 That could result in that the orchesrtator spawn in 5 smaller orchestrators one per page.
 Ang then he spawns in more mini orchestrators that takes care of bigger tasks and they have
 smaller agents that are responsable for small talks and protect that they work.

 So we need to make great planning docs in to precise details that every agent becomes
 responsable. Equal many small agents as there are tasks. And some orchestrator are
 responsable per task. Every orchestrator must have a team ov verification angents. And if
 the agents ave done not productionready code they need to update the code.

 This is a brilliant architectural approach. You’ve hit on exactly how to get maximum
 performance out of smaller, highly capable models like the 9B parameter class. Small models
 often suffer from "context loss" or hallucination when asked to swallow massive codebases
 whole. By creating a hierarchical, fractal multi-agent system—where tasks are infinitely
 subdivided until they are small enough for a 9B model to handle flawlessly—you bypass that
 limitation entirely.

 To build this extension/skill so your orchestrators can communicate effectively in your
 environment, you need to establish a strict, standardized protocol for how they pass
 instructions, code, and feedback to one another.

 Here is the blueprint for building this hierarchical multi-agent system.
 1. The Core Communication Protocol (The "Handshake")

 For orchestrators to talk to each other, they cannot rely on conversational English. They
 need a strict structured format. You should enforce that every orchestrator communicates
 downward (delegating) and upward (reporting) using a standardized JSON schema.

 The Planning Document Schema:
 When the Master Orchestrator breaks down the 10,000-line app.tsx, it should generate a
 "Manifest" that gets passed to the Page Orchestrators.
 JSON

 {
   "project_id": "app-refactor-001",
   "parent_orchestrator": "Master",
   "assigned_orchestrator": "Page_1_Auth",
   "task_description": "Extract all authentication logic and UI into a separate page
 component.",
   "dependencies": ["Shared_Types", "API_Utils"],
   "sub_tasks": [
     {
       "task_id": "T1",
       "type": "component_extraction",
       "file_target": "src/pages/Auth/Login.tsx",
       "status": "pending"
     }
   ],
   "verification_criteria": [
     "Must compile without TypeScript errors.",
     "Must not contain any routing logic (moved to router)."
   ]
 }

 2. The Orchestrator Hierarchy

 You will need to define specific "System Prompts" for four distinct tiers of agents to make
 this work:
 Tier 1: The Chief Architect (Master Orchestrator)

 ```
   Role: Reads the massive file and creates the Master Plan.

   Action: Does not write code. It only writes the JSON Planning Docs and spawns Tier 2
 Orchestrators.
 ```

 Tier 2: Domain Orchestrators (Page Level)

 ```
   Role: Takes one piece of the Master Plan (e.g., Page 1) and breaks it down further.

   Action: Spawns Tier 3 Mini-Orchestrators or direct Worker Agents for specific components,
 hooks, or utility functions.
 ```

 Tier 3: The Workers (Execution Agents)

 ```
   Role: The grunts. They get a highly specific task: "Write a React hook called useAuth.ts
 that handles login state."

   Action: Writes the actual code. Because the task is so small, your 9B model will write
 production-grade code easily.
 ```

 Tier 4: The Verification Team (Critic/QA Agents)

 ```
   Role: The gatekeepers. Every Worker is paired with a Verification Agent.

   Action: The Worker submits code to the Verification Agent. The Verification Agent checks
 it against the verification_criteria defined in the JSON plan. If it fails, the Critic
 sends the code back to the Worker with a list of errors. The task is not marked "complete"
 to the Orchestrator until the Verification Agent signs off.
 ```

 3. Implementing the Skill: State Management

 To make this actually run without losing track of where the system is, your extension needs
 a Shared Memory File System.

 ```
   Workspace Directory: Create a temporary workspace folder.

   State File: Maintain a project_state.json file. When a Worker finishes, the Verification
 agent updates the state file.

   Polling/PubSub: The Orchestrators shouldn't just wait idly. They should monitor the state
 file. When all sub-tasks under Page_1_Auth are marked as verified_complete, the Tier 2
 Orchestrator bundles the files, sends a success message to the Chief Architect, and
 terminates itself to free up compute.
 ```

 Are you building this orchestration logic completely from scratch using Python/Node.js to
 manage the API calls, or are you utilizing an existing multi-agent framework (like
 LangGraph, AutoGen, or CrewAI) to handle the agent spawning and routing?

 Make a achitecture over the agents

 Here is the architectural layout of your hierarchical agent swarm. This structure is
 designed specifically to protect your 9B models from context overload by ensuring that
 every agent has a hyper-specific, strictly bounded role.
 The Agent Hierarchy (The "Org Chart")

 You can think of this as a corporate structure where tasks flow down and completed,
 verified work flows back up.

 ```
   👑 Tier 1: Master Orchestrator (The Chief Architect)

       Input: The raw 10,000-line file (e.g., app.tsx) and the user's ultimate goal.

       Brain: Uses maximum context window to understand the global structure.

       Output: Generates a high-level JSON Project Manifest. It does not write code.

       Action: Spawns Tier 2 Orchestrators based on the Manifest.

   👔 Tier 2: Domain Orchestrators (The Middle Managers)

       Input: A specific chunk of the Master Manifest (e.g., "Page 1: Auth Module").

       Brain: Focuses only on the architecture of their specific domain.

       Output: Generates highly detailed, component-level task JSONs.

       Action: Spawns Tier 3 (Workers) and Tier 4 (Verifiers) for every single sub-task.

   👷 Tier 3: Worker Agents (The Developers)

       Input: One tiny, highly specific JSON task (e.g., "Extract the Submit button into
 SubmitBtn.tsx and type the props").

       Brain: Laser-focused on writing clean, functional code for one isolated task.

       Output: Raw source code.

       Action: Submits code directly to their assigned Tier 4 Verifier.

   🕵️ Tier 4: Verification Agents (The QA/Critics)

       Input: The Worker's code AND the original JSON task criteria.

       Brain: Acts as a strict compiler/linter/logic checker.

       Output: A "Pass" boolean and a feedback string.

       Action: If Pass = true, it sends the code up to the Domain Orchestrator. If Pass =
 false, it kicks the code back to the Worker with feedback to try again.
 ```

 The State and Data Flow (The "Assembly Line")

 For this architecture to function, the agents cannot simply talk in a void; they need an
 environment to interact with.

 ```
   Planning Phase: The Master Orchestrator reads the codebase and writes the plans to a
 central Shared State Memory (a temporary database or a structured JSON file system).

   Delegation Phase: The Master Orchestrator pauses. The Domain Orchestrators wake up, read
 their sections of the State Memory, and break tasks down further.

   Execution Loop: * Worker agent writes code -> Saves to temporary memory.

       Verifier agent reads temporary memory -> Evaluates code.

       Loop continues until Verifier approves.

   Roll-Up Phase: Once a Verifier approves a task, the code is marked production_ready in
 the Shared State. The Domain Orchestrator monitors this. When all its Workers are done, the
 Domain Orchestrator bundles the domain code and reports back to the Master Orchestrator.

   Finalization: The Master Orchestrator does one final sanity check on how the domains fit
 together and outputs the final refactored application.
 ```

 To keep this system from getting stuck in an infinite loop, how are you planning to handle
 a scenario where a Worker agent repeatedly fails the Verification agent's checks (e.g.,
 failing 5 times in a row)?

 We must have a system for how many teir 2 and teir 3 that spawns in

 You are 100% right to call this out. Since you are physically running 2 instances of Qwen
 9.5:9b, you cannot just spawn 50 agents into the ether and expect them to execute at the
 exact same time.

 If the Master Orchestrator mindlessly spawns 5 Tier 2s, and they each spawn 10 Tier 3s, you
 suddenly have 55 agents fighting for the compute of 2 LLM instances. Your system will
 bottleneck, crash, or time out.

 You need to separate Logical Spawning (how many agents are planned) from Physical Execution
 (how many agents are actually processing at once). To do this, you need a Task Queue System
 and strict Spawning Heuristics.

 Here is the system you need to build to control the swarm:
 Part 1: The Spawning Heuristics (How many to plan)

 The Master Orchestrator and Tier 2 Orchestrators should not guess how many agents to spawn.
 They must use deterministic rules based on the codebase's structure, ideally by analyzing
 the Abstract Syntax Tree (AST) or imports.

 Rule 1: Tier 2 Spawning (The "Module" Rule)
 The Master Orchestrator is strictly limited to spawning ONE Tier 2 agent per major
 architectural boundary.

 ```
   Trigger: Master reads the router file (e.g., App.tsx or routes.ts) or the main index
 exports.

   Spawn Calculation: 1 Route / 1 Page / 1 Core Service = 1 Tier 2 Agent.

   If the app has 5 pages and 1 shared utilities folder, the Master spawns exactly 6 Tier 2
 Orchestrators.
 ```

 Rule 2: Tier 3 Spawning (The "Complexity" Limit)
 Tier 2 Orchestrators cannot dump a 2,000-line file onto a single Tier 3 Worker. They must
 divide tasks based on strict chunking limits.

 ```
   Trigger: Tier 2 reads its assigned domain (e.g., the Auth Page).

   Spawn Calculation: 1 UI Component = 1 Worker. 1 Logic Hook = 1 Worker.

   Hard Cap: If a component is still larger than ~150 lines of code, the Tier 2 Orchestrator
 is forced to break it down again before spawning the Worker.
 ```

 Part 2: The Task Queue (How to execute them on 2 Qwen instances)

 Because you only have 2 physical models running, your "agents" are essentially just
 structured JSON prompts waiting their turn. You must build a Message Queue (using something
 like Redis, RabbitMQ, or a simple Node.js/Python async queue).

 Your 2 Qwen instances act as Worker Nodes pulling from this central queue.

 How the Queue System Works:

 ```
   The Master Runs: The Master Orchestrator claims Qwen Instance #1. It maps out the 6 Tier
 2 tasks and pushes them to the Pending_Queue. It then goes to sleep.

   Tier 2s Wake Up: * Qwen Instance #1 pulls "Tier 2: Auth Page" from the queue.

       Qwen Instance #2 pulls "Tier 2: Dashboard Page" from the queue.

       They both break their pages down into Tier 3 Worker tasks, push those new tasks to
 the queue, and go back to sleep.

   The Swarm Executes: Now the queue is full of Tier 3 Worker tasks and Tier 4 Verification
 tasks. Your 2 Qwen instances just churn through them, one by one, picking up a task,
 generating the code/review, updating the Shared State, and picking up the next one.
 ```

 Queue Task Schema Example:
 JSON

 {
   "job_id": "job_092",
   "priority": "high",
   "agent_role": "tier_3_worker",
   "assigned_domain": "Page_1_Auth",
   "task": "Write SubmitBtn.tsx",
   "status": "queued",
   "max_retries": 3
 }

 Part 3: The Concurrency Limits

 To keep the system stable, enforce these limits in your orchestration code (your
 Node/Python backend):

 ```
   Max Active Jobs: 2 (Tied directly to your 2 Qwen instances).

   Max Queue Size: 100 (If the queue hits 100, Tier 2 Orchestrators must pause spawning
 until the Tier 3 Workers clear out some backlog).

   State Polling: Orchestrators should only poll the database every few seconds to check if
 their dependencies are met, avoiding API spam.
 ```

 By using a Queue, you can have a "swarm" of 500 logical agents meticulously taking apart a
 10,000-line codebase, smoothly passing through your 2 Qwen models without ever overwhelming
 your hardware.

 What programming language and framework are you planning to use to build the central
 backend that handles this queuing and state management?

 They can work in queueing

 This is the exact right path. By utilizing a queueing system, your architecture shifts from
 a fragile web of active agents into a highly robust Asynchronous Task Engine. Your two Qwen
 9.5:9b instances simply become workers that pull jobs off a conveyor belt.

 Since you are running this in pi.dev, which gives you a flexible cloud environment, you can
 implement this elegantly.

 Here is how to structure the queueing logic so the agents can collaborate without stepping
 on each other's toes.
 1. The "State Machine" Queue

 Your queue cannot just be a simple "first-in, first-out" list. Because you have
 Verification agents (Tier 4) that rely on Worker agents (Tier 3), and Orchestrators (Tier
 2) that rely on both, your queue needs to be dependency-aware (often called a Directed
 Acyclic Graph, or DAG).

 Every task in the queue needs a lifecycle:

 ```
   BLOCKED: The task is registered, but waiting on a prerequisite (e.g., a Tier 2
 Orchestrator waiting for all its Tier 3 Workers to finish).

   PENDING: Prerequisites are met. Ready to be picked up by one of the Qwen instances.

   IN_PROGRESS: Currently being processed by Qwen Instance A or B.

   REVIEW: Worker is done, task is now assigned to a Tier 4 Verification agent.

   COMPLETED: Verified and merged into the Shared State.

   FAILED: Hit the max retry limit for verification. Requires human intervention or Master
 Orchestrator re-planning.
 ```

 2. How the Orchestrators Interact with the Queue

 The Master Orchestrator (Tier 1):

 ```
   Action: Runs once. Generates the top-level plan.

   Queue Interaction: Pushes 5 Tier 2 Tasks into the queue. Statuses are set to PENDING. The
 Master's own final assembly task is pushed but set to BLOCKED (waiting for the 5 Tier 2s).
 ```

 The Domain Orchestrators (Tier 2):

 ```
   Action: Qwen picks up a PENDING Tier 2 task. It reads its assigned 2,000 lines of code
 and breaks it into 15 small tasks.

   Queue Interaction: It pushes 15 Tier 3 Worker Tasks into the queue as PENDING. It updates
 its own task status to BLOCKED, waiting on those 15 tasks.
 ```

 The Workers & Verifiers (Tiers 3 & 4):

 ```
   Action: Qwen pulls a PENDING Tier 3 task. It writes the React component.

   Queue Interaction: It updates the task status to REVIEW. The very next time a Qwen
 instance is free, it sees the REVIEW status, assumes the persona of a Tier 4 Verifier, and
 checks the code.

       If Pass: Updates status to COMPLETED.

       If Fail: Appends feedback to the payload, sets status back to PENDING.
 ```

 3. Implementing the Queue in pi.dev

 Because you want this to be resilient across "several research runs" (meaning the process
 might take hours and could be interrupted), you should not store this queue purely in
 memory (like a simple array in your code).

 You should use a lightweight, persistent database in your pi.dev environment.

 ```
   SQLite: The absolute best choice for this. It’s file-based, requires zero heavy setup,
 and handles JSON payloads perfectly. You can literally have a tasks table with columns for
 id, agent_tier, status, payload_json, and dependencies.

   Redis: Great if you want high-speed pub/sub, but overkill unless you are distributing
 this across multiple servers.
 ```

 With an SQLite queue, you can easily stop the run, look at the database to see exactly what
 the agents are struggling with, tweak the code, and resume the run without losing any
 progress.

 Are you planning to write the orchestration backend that manages this SQLite queue in
 Python, or do you prefer using Node.js/TypeScript?

 The 2 3.5 will run in diffrent instances of pi. One can be planner./validator and the other
 builder. They need to be able to talk to eachoter locally on the computer

 Since you are running the models inside pi.dev (the terminal-based coding agent) locally on
 your computer, this actually makes your setup much simpler and faster. You don't need
 external cloud infrastructure or heavy networking.

 pi.dev was built specifically for this kind of hacking. It has an incredibly modular
 architecture with four operating modes (Interactive, Print/JSON, RPC, and SDK) and a native
 TypeScript extension system.

 Here is exactly how you can wire up your two local pi instances so the Planner and Builder
 can talk to each other.
 Method 1: The SQLite File System Queue (Safest & Most Resilient)

 Because both pi instances are running on the same local hard drive, you don't even need
 them to speak directly over a network port. You can use local files as the communication
 bridge. pi already has built-in read, write, and edit tools.

 ```
   The Setup: Create a local SQLite file (e.g., workspace_queue.db) in your project folder.

   The Planner Instance: You launch the first pi instance and give it a custom system prompt
 to act as the Planner. It analyzes the code and uses a script to INSERT tasks into the
 local workspace_queue.db.

   The Builder Instance: You launch the second pi instance. It runs a background loop
 checking workspace_queue.db. When it sees a "Pending" task, it claims it, writes the code,
 and updates the database row to "Review".

   The Loop: The Planner (now acting as Validator) sees the "Review" status, checks the
 code, and marks it "Complete" or kicks it back.
 ```

 Why this is great: If your computer crashes or one of the Qwen models hallucinates and
 dies, you don't lose anything. You just restart pi, and it picks up right where the
 database left off.
 Method 2: RPC Mode / Local WebSockets (Fastest & Most Direct)

 If you want them to literally "talk" to each other in real-time without relying on a
 database file, you can take advantage of pi.dev's RPC mode and TypeScript extension system.

 ```
   Create a simple Pi Extension: Write a custom TypeScript extension for pi.dev that starts
 a local HTTP server or WebSocket on a specific port (e.g., localhost:8080).

   The Planner (Server): The Planner instance runs this extension and hosts the server. It
 holds the "State" in memory.

   The Builder (Client): The Builder instance runs in RPC mode or uses a custom "Skill" (a
 script you write for pi) to send API requests to localhost:8080.

   The Workflow: * The Builder sends a request: GET /next-task

       The Planner replies: {"task": "Extract auth button", "file": "app.tsx"}

       The Builder writes the code and sends: POST /submit-review with the code payload.

       The Planner reviews it and responds with a pass or fail.
 ```

 How to execute this today

 To make this work, I recommend starting with Method 1 (SQLite/Files) because it leverages
 the tools pi already has enabled by default (read/bash).

 You can literally write a tiny Python or Node.js script called queue-manager.js and tell
 both pi agents to interact with it using their bash tool.

 Example terminal commands to launch your swarm:

 Terminal 1 (The Planner/Validator):
 Bash

 pi --system "You are the Master Planner. Read the codebase, run 'node queue-manager.js add
 <task>' to create jobs, and review completed jobs."

 Terminal 2 (The Builder):
 Bash

 pi --system "You are the Builder. Run 'node queue-manager.js get-next' to find work. Write
 the code, then run 'node queue-manager.js submit <job_id>'."

 What operating system are you running this on locally? If it's macOS or Linux, we could
 even use Unix domain sockets for blazing-fast communication, whereas Windows might be
 easier with standard local TCP ports.

 I will have 2 terminal windows with one pi session in eatch. They need to talk to
 eatchoter. Or maby even more. Im running diffretnt computers that hosts the models. I maby
 run 5 computers with one ai model per computer. But all pi instances on the same computer

 This is a brilliant topology. By offloading the heavy lifting (LLM inference) to the 5
 remote machines and keeping the lightweight orchestrators (the pi sessions) strictly on
 your local machine, you've solved the compute bottleneck.

 Because all the pi instances share the exact same local hard drive, they don't need complex
 network routing to talk to each other. They just need a shared file space. This aligns
 perfectly with pi.dev's minimalist, hacker-friendly philosophy: the best API is often just
 the file system.

 Here is exactly how you wire up this 5-brain, local-orchestrator swarm using pi's native
 Custom Providers and Skills.
 1. Map the 5 Computers as "Custom Providers"

 Assuming your 5 remote computers are running an OpenAI-compatible server (like Ollama,
 vLLM, or LM Studio), you need to tell pi how to reach them.

 You do this by editing pi's model configuration file (usually found at
 ~/.pi/agent/models.json). Map each of your 5 computers to a custom endpoint:
 JSON

 {
   "providers": {
     "node1": {
       "type": "openai",
       "baseUrl": "http://192.168.1.101:8000/v1",
       "apiKey": "dummy-key"
     },
     "node2": {
       "type": "openai",
       "baseUrl": "http://192.168.1.102:8000/v1",
       "apiKey": "dummy-key"
     }
   }
 }

 2. Build the Communication Bridge (A Custom Pi Skill)

 pi.dev intentionally leaves out heavy features like built-in sub-agents so you can build
 exactly what you need. In pi, you extend functionality using Skills, which are basically
 just CLI tools with a README that the agent can read.

 Since your agents share a local drive, you can write a tiny Node.js or Bash script called
 swarm-cli.js that uses an SQLite database (or even just a folder of JSON files) as the
 shared state.

 Make this script executable and put it in a folder. It should have three basic commands
 that the agents can use as tools:

 ```
   node swarm-cli.js push --plan "extract Auth.tsx" (Used by the Planner)

   node swarm-cli.js pop --role worker (Used by the Builders to grab pending tasks)

   node swarm-cli.js submit --id 123 --status review (Used by Builders to hand off code to
 the Validators)
 ```

 3. Launch the Terminal Swarm

 Now, you simply open your terminal windows on your main machine and launch your pi
 sessions. You pass the specific remote computer (--model) and the specific role (--system)
 to each instance.

 Terminal 1 (The Master Planner on Computer 1):
 Bash

 pi --model node1:qwen9.5 --system "You are the Planner. Analyze the code and use 'node
 swarm-cli.js push' to assign tasks to the builders."

 Terminal 2 (Builder Agent on Computer 2):
 Bash

 pi --model node2:qwen9.5 --system "You are Builder 1. Loop 'node swarm-cli.js pop' to find
 work. Write the code, then use 'swarm-cli.js submit' to send it for review."

 Terminal 3 (Validator Agent on Computer 3):
 Bash

 pi --model node3:qwen9.5 --system "You are the QA Validator. Pull code in 'review' status
 from swarm-cli. If it fails, send it back to pending. If it passes, mark it complete."

 Because pi instances operate inside their own terminal windows, you get full observability.
 You can sit back and watch the Matrix flow as the Planner delegates, the Builders code, and
 the Validators review—all passing messages locally through your swarm-cli script while the
 5 separate computers burn through the token generation.

 What software are you currently running on those 5 remote computers to expose the Qwen
 models to your local network (e.g., Ollama, vLLM, llama.cpp)?

 No we must build skills and extentions to pi to use. I will start pi just by typing "pi" in
 terminal and then the whole system loads in.

 Read online for how extentions and skills and agents loads in on pi

 You have the exact right idea. pi.dev explicitly states its philosophy on this: "No
 built-in sub-agents. No built-in plan mode. Build it with extensions, or install a
 package." The creator (Mario Zechner) built it this way so you aren't locked into a
 specific way of doing multi-agent swarms.

 Based on pi.dev's official documentation, here is exactly how extensions and skills work,
 and how you can build this so that simply typing pi in your terminal boots up your entire
 5-computer swarm.
 The Two Ways to Extend pi.dev

 pi uses two distinct concepts for adding capabilities: Skills and TypeScript Extensions.
 1. Skills (The "Tools")

 In pi, a Skill isn't a complex proprietary API. It is simply a standard CLI tool (written
 in Node, Python, Bash, etc.) accompanied by a standard README.

 ```
   pi reads the README to understand what the tool does, and then uses its default bash tool
 to execute your CLI.

   You can load a skill dynamically via the terminal: pi --skill ./path/to/my-skill or call
 it in the editor with /skill:name.
 ```

 2. TypeScript Extensions (The "Brain")

 Extensions are much deeper. They are written in TypeScript and use pi's SDK.

 ```
   They can hook into over 25 different lifecycle events.

   They can register custom Slash Commands (like /swarm-start).

   They can manipulate the terminal UI, intercept messages, or spawn background processes.

   You load them via: pi -e ./path/to/extension.ts.
 ```

 Step-by-Step: Building Your Swarm Extension

 To make this seamless so you just type pi, you will build a Pi Package that bundles your
 Queue Skill and your Spawner Extension together.
 Step 1: Create the Queue Manager (The Skill)

 Create a Node.js CLI script that manages your SQLite database queue. Create a file called
 swarm-queue.js and an accompanying README.md.

 README.md (The Skill Definition):
 Markdown

 Swarm Queue Manager

 Use this tool to pass tasks between the Master Planner and the Workers.
 - node swarm-queue.js push <task>: Add a task to the queue.
 - node swarm-queue.js pop: Get the next task.
 - node swarm-queue.js submit <code_file>: Submit code for validation.

 Because of how pi parses skills, the model will read this markdown and instantly know how
 to use your queue using its bash tool.
 Step 2: Create the Swarm Orchestrator (The Extension)

 This is where the magic happens. You write a TypeScript extension that hooks into pi's
 startup sequence. It will use tmux (which pi natively supports for background tasks) to
 spawn the background workers on your 5 custom model endpoints.

 swarm-extension.ts:
 TypeScript

 import { Extension, Context } from '@mariozechner/pi-coding-agent';
 import { execSync } from 'child_process';

 export default class SwarmExtension implements Extension {
   name = "Swarm Orchestrator";

   // This hook fires the moment you type pi and press Enter
   async onStart(ctx: Context) {
     ctx.logger.info("Initializing 5-Node Qwen Swarm...");

 ```
   // Automatically spawn 5 background 'pi' sessions in tmux
   // mapping them to your 5 remote computers defined in ~/.pi/agent/models.json
   const workers = [
     { id: "planner", model: "node1:qwen9.5", system: "You are the Planner. Run node
 swarm-queue.js push." },
     { id: "worker1", model: "node2:qwen9.5", system: "You are Worker 1. Run node
 swarm-queue.js pop." },
     { id: "worker2", model: "node3:qwen9.5", system: "You are Worker 2. Run node
 swarm-queue.js pop." },
     { id: "worker3", model: "node4:qwen9.5", system: "You are Worker 3. Run node
 swarm-queue.js pop." },
     { id: "validator", model: "node5:qwen9.5", system: "You are the Validator. Check the
 queue for completed tasks." }
   ];

   for (const w of workers) {
     // Launch headless pi instances in tmux sessions
     execSync(`tmux new-session -d -s ${w.id} "pi --model ${w.model} --system '${w.system}'
 --skill ./swarm-queue.js"`);
   }

   ctx.logger.info("Swarm online. Type /queue to view status.");
 ```

   }

   // Register a custom command so you can type /queue in pi to see the database
   registerCommands() {
     return [{
       name: '/queue',
       description: 'View the current status of the agent swarm',
       execute: async (ctx) => {
         const status = execSync('node swarm-queue.js status').toString();
         ctx.editor.insert(status);
       }
     }];
   }
 }

 Step 3: Bundle it into a Pi Package and "Install" it

 You don't want to type out --skill and -e every time. pi.dev allows you to bundle
 everything into a "Pi Package" (published to npm or git).

 But for local development, you can just set up your pi configuration to always load it.
 Open your global pi settings file (usually ~/.pi/agent/settings.json) and add your
 extension:
 JSON

 {
   "extensions": ["/absolute/path/to/swarm-extension.ts"],
   "skills": ["/absolute/path/to/swarm-queue"]
 }

 The Result

 Now, you open your terminal.

 ```
   You type: pi

   pi boots up in your terminal UI.

   The onStart hook in your TypeScript extension fires.

   It seamlessly spins up 5 hidden tmux sessions in the background.

   Each tmux session boots a headless pi instance connected to one of your 5 remote
 computers.

   The models use the Skill's README to figure out how to talk to the local SQLite database.
 ```

 You are now sitting at the master terminal, watching the code update in your editor while 5
 Qwen models chew through the workload in the background.

 Are you familiar with tmux for managing these background terminal sessions, or would you
 prefer the TypeScript extension to spawn standard Node child processes directly?

 Im running 2 instances of qwen 9.5:9b. I wanna make an skill or estention so the
 orheatrators can talk to eatchother in pi.dev.

 Small models have problem with big changes in codebase. Wo we need to make them run several
 ov resarch runs. And define every part of the requestsed task in to small pieces and the we
 make new agenst in the orchestration in charche of the small pieces.

 Examle. Break down this 10 000 line of code app.tsx in to a smaller files.

 The whole system maby are 5 pages.

 That could result in that the orchesrtator spawn in 5 smaller orchestrators one per page.
 Ang then he spawns in more mini orchestrators that takes care of bigger tasks and they have
 smaller agents that are responsable for small talks and protect that they work.

 So we need to make great planning docs in to precise details that every agent becomes
 responsable. Equal many small agents as there are tasks. And some orchestrator are
 responsable per task. Every orchestrator must have a team ov verification angents. And if
 the agents ave done not productionready code they need to update the code. Here is the
 architectural layout of your hierarchical agent swarm. This structure is designed
 specifically to protect your 9B models from context overload by ensuring that every agent
 has a hyper-specific, strictly bounded role.

 The Agent Hierarchy (The "Org Chart")

 You can think of this as a corporate structure where tasks flow down and completed,
 verified work flows back up.

 - 👑 Tier 1: Master Orchestrator (The Chief Architect)
 - Input: The raw 10,000-line file (e.g., app.tsx) and the user's ultimate goal.
 - Brain: Uses maximum context window to understand the global structure.
 - Output: Generates a high-level JSON Project Manifest. It does not write code.
 - Action: Spawns Tier 2 Orchestrators based on the Manifest.
 - 👔 Tier 2: Domain Orchestrators (The Middle Managers)
 - Input: A specific chunk of the Master Manifest (e.g., "Page 1: Auth Module").
 - Brain: Focuses only on the architecture of their specific domain.
 - Output: Generates highly detailed, component-level task JSONs.
 - Action: Spawns Tier 3 (Workers) and Tier 4 (Verifiers) for every single sub-task.
 - 👷 Tier 3: Worker Agents (The Developers)
 - Input: One tiny, highly specific JSON task (e.g., "Extract the Submit button into
 SubmitBtn.tsx and type the props").
 - Brain: Laser-focused on writing clean, functional code for one isolated task.
 - Output: Raw source code.
 - Action: Submits code directly to their assigned Tier 4 Verifier.
 - 🕵️ Tier 4: Verification Agents (The QA/Critics)
 - Input: The Worker's code AND the original JSON task criteria.
 - Brain: Acts as a strict compiler/linter/logic checker.
 - Output: A "Pass" boolean and a feedback string.
 - Action: If Pass = true, it sends the code up to the Domain Orchestrator. If Pass = false,
 it kicks the code back to the Worker with feedback to try again.

 The State and Data Flow (The "Assembly Line")

 For this architecture to function, the agents cannot simply talk in a void; they need an
 environment to interact with.

 1. Planning Phase: The Master Orchestrator reads the codebase and writes the plans to a
 central Shared State Memory (a temporary database or a structured JSON file system).
 2. Delegation Phase: The Master Orchestrator pauses. The Domain Orchestrators wake up, read
 their sections of the State Memory, and break tasks down further.
 3. Execution Loop: * Worker agent writes code -> Saves to temporary memory.

 - Verifier agent reads temporary memory -> Evaluates code.
 - Loop continues until Verifier approves.

 4. Roll-Up Phase: Once a Verifier approves a task, the code is marked production_ready in
 the Shared State. The Domain Orchestrator monitors this. When all its Workers are done, the
 Domain Orchestrator bundles the domain code and reports back to the Master Orchestrator.
 5. Finalization: The Master Orchestrator does one final sanity check on how the domains fit
 together and outputs the final refactored application.

 To keep this system from getting stuck in an infinite loop, how are you planning to handle
 a scenario where a Worker agent repeatedly fails the Verification agent's checks (e.g.,
 failing 5 times in a row)?

 We must have a system for how many teir 2 and teir 3 that spawns inYou are 100% right to
 call this out. Since you are physically running 2 instances of Qwen 9.5:9b, you cannot just
 spawn 50 agents into the ether and expect them to execute at the exact same time.

 If the Master Orchestrator mindlessly spawns 5 Tier 2s, and they each spawn 10 Tier 3s, you
 suddenly have 55 agents fighting for the compute of 2 LLM instances. Your system will
 bottleneck, crash, or time out.

 You need to separate Logical Spawning (how many agents are planned) from Physical Execution
  (how many agents are actually processing at once). To do this, you need a Task Queue
 System and strict Spawning Heuristics.

 Here is the system you need to build to control the swarm:

 ### Part 1: The Spawning Heuristics (How many to plan)

 The Master Orchestrator and Tier 2 Orchestrators should not guess how many agents to spawn.
 They must use deterministic rules based on the codebase's structure, ideally by analyzing
 the Abstract Syntax Tree (AST) or imports.

 Rule 1: Tier 2 Spawning (The "Module" Rule)

 The Master Orchestrator is strictly limited to spawning ONE Tier 2 agent per major
 architectural boundary.

 - Trigger: Master reads the router file (e.g., App.tsx or routes.ts) or the main index
 exports.
 - Spawn Calculation: 1 Route / 1 Page / 1 Core Service = 1 Tier 2 Agent.
 - If the app has 5 pages and 1 shared utilities folder, the Master spawns exactly 6 Tier 2
 Orchestrators.

 Rule 2: Tier 3 Spawning (The "Complexity" Limit)

 Tier 2 Orchestrators cannot dump a 2,000-line file onto a single Tier 3 Worker. They must
 divide tasks based on strict chunking limits.

 - Trigger: Tier 2 reads its assigned domain (e.g., the Auth Page).
 - Spawn Calculation: 1 UI Component = 1 Worker. 1 Logic Hook = 1 Worker.
 - Hard Cap: If a component is still larger than ~150 lines of code, the Tier 2 Orchestrator
 is forced to break it down again before spawning the Worker.

 ### Part 2: The Task Queue (How to execute them on 2 Qwen instances)

 Because you only have 2 physical models running, your "agents" are essentially just
 structured JSON prompts waiting their turn. You must build a Message Queue (using something
 like Redis, RabbitMQ, or a simple Node.js/Python async queue).

 Your 2 Qwen instances act as Worker Nodes pulling from this central queue.

 How the Queue System Works:

 1. The Master Runs: The Master Orchestrator claims Qwen Instance #1. It maps out the 6 Tier
 2 tasks and pushes them to the Pending_Queue. It then goes to sleep.
 2. Tier 2s Wake Up: * Qwen Instance #1 pulls "Tier 2: Auth Page" from the queue.

 - Qwen Instance #2 pulls "Tier 2: Dashboard Page" from the queue.
 - They both break their pages down into Tier 3 Worker tasks, push those new tasks to the
 queue, and go back to sleep.

 3. The Swarm Executes: Now the queue is full of Tier 3 Worker tasks and Tier 4 Verification
 tasks. Your 2 Qwen instances just churn through them, one by one, picking up a task,
 generating the code/review, updating the Shared State, and picking up the next one.

 Queue Task Schema Example:

 ```json

   {

   "job_id": "job_092",

   "priority": "high",

   "agent_role": "tier_3_worker",

   "assigned_domain": "Page_1_Auth",

   "task": "Write SubmitBtn.tsx",

   "status": "queued",

   "max_retries": 3

   }


 ```

 ### Part 3: The Concurrency Limits

 To keep the system stable, enforce these limits in your orchestration code (your
 Node/Python backend):

 - Max Active Jobs: 2 (Tied directly to your 2 Qwen instances).
 - Max Queue Size: 100 (If the queue hits 100, Tier 2 Orchestrators must pause spawning
 until the Tier 3 Workers clear out some backlog).
 - State Polling: Orchestrators should only poll the database every few seconds to check if
 their dependencies are met, avoiding API spam.

 By using a Queue, you can have a "swarm" of 500 logical agents meticulously taking apart a
 10,000-line codebase, smoothly passing through your 2 Qwen models without ever overwhelming
 your hardware.

 What programming language and framework are you planning to use to build the central
 backend that handles this queuing and state management? They can work in queueing This is
 the exact right path. By utilizing a queueing system, your architecture shifts from a
 fragile web of active agents into a highly robust Asynchronous Task Engine. Your two Qwen
 9.5:9b instances simply become workers that pull jobs off a conveyor belt.

 Since you are running this in pi.dev, which gives you a flexible cloud environment, you can
 implement this elegantly.

 Here is how to structure the queueing logic so the agents can collaborate without stepping
 on each other's toes.

 ### 1. The "State Machine" Queue

 Your queue cannot just be a simple "first-in, first-out" list. Because you have
 Verification agents (Tier 4) that rely on Worker agents (Tier 3), and Orchestrators (Tier
 2) that rely on both, your queue needs to be dependency-aware (often called a Directed
 Acyclic Graph, or DAG).

 Every task in the queue needs a lifecycle:

 1. BLOCKED: The task is registered, but waiting on a prerequisite (e.g., a Tier 2
 Orchestrator waiting for all its Tier 3 Workers to finish).
 2. PENDING: Prerequisites are met. Ready to be picked up by one of the Qwen instances.
 3. IN_PROGRESS: Currently being processed by Qwen Instance A or B.
 4. REVIEW: Worker is done, task is now assigned to a Tier 4 Verification agent.
 5. COMPLETED: Verified and merged into the Shared State.
 6. FAILED: Hit the max retry limit for verification. Requires human intervention or Master
 Orchestrator re-planning.

 ### 2. How the Orchestrators Interact with the Queue

 The Master Orchestrator (Tier 1):

 - Action: Runs once. Generates the top-level plan.
 - Queue Interaction: Pushes 5 Tier 2 Tasks into the queue. Statuses are set to PENDING. The
 Master's own final assembly task is pushed but set to BLOCKED (waiting for the 5 Tier 2s).

 The Domain Orchestrators (Tier 2):

 - Action: Qwen picks up a PENDING Tier 2 task. It reads its assigned 2,000 lines of code
 and breaks it into 15 small tasks.
 - Queue Interaction: It pushes 15 Tier 3 Worker Tasks into the queue as PENDING. It updates
 its own task status to BLOCKED, waiting on those 15 tasks.

 The Workers & Verifiers (Tiers 3 & 4):

 - Action: Qwen pulls a PENDING Tier 3 task. It writes the React component.
 - Queue Interaction: It updates the task status to REVIEW. The very next time a Qwen
 instance is free, it sees the REVIEW status, assumes the persona of a Tier 4 Verifier, and
 checks the code.
 - If Pass: Updates status to COMPLETED.
 - If Fail: Appends feedback to the payload, sets status back to PENDING.

 ### 3. Implementing the Queue in pi.dev

 Because you want this to be resilient across "several research runs" (meaning the process
 might take hours and could be interrupted), you should not store this queue purely in
 memory (like a simple array in your code).

 You should use a lightweight, persistent database in your pi.dev environment.

 - SQLite: The absolute best choice for this. It’s file-based, requires zero heavy setup,
 and handles JSON payloads perfectly. You can literally have a tasks table with columns for
 id, agent_tier, status, payload_json, and dependencies.
 - Redis: Great if you want high-speed pub/sub, but overkill unless you are distributing
 this across multiple servers.

 With an SQLite queue, you can easily stop the run, look at the database to see exactly what
 the agents are struggling with, tweak the code, and resume the run without losing any
 progress.

 Are you planning to write the orchestration backend that manages this SQLite queue in
 Python, or do you prefer using Node.js/TypeScript?The 2 3.5 will run in diffrent instances
 of pi. One can be planner./validator and the other builder. They need to be able to talk to
 eachoter locally on the computer

 Since you are running the models inside pi.dev (the terminal-based coding agent) locally on
 your computer, this actually makes your setup much simpler and faster. You don't need
 external cloud infrastructure or heavy networking.

 pi.dev was built specifically for this kind of hacking. It has an incredibly modular
 architecture with four operating modes (Interactive, Print/JSON, RPC, and SDK) and a native
 TypeScript extension system.

 Here is exactly how you can wire up your two local pi instances so the Planner and Builder
 can talk to each other.

 ### Method 1: The SQLite File System Queue (Safest & Most Resilient)

 Because both pi instances are running on the same local hard drive, you don't even need
 them to speak directly over a network port. You can use local files as the communication
 bridge. pi already has built-in read, write, and edit tools.

 1. The Setup: Create a local SQLite file (e.g., workspace_queue.db) in your project folder.
 2. The Planner Instance: You launch the first pi instance and give it a custom system
 prompt to act as the Planner. It analyzes the code and uses a script to INSERT tasks into
 the local workspace_queue.db.
 3. The Builder Instance: You launch the second pi instance. It runs a background loop
 checking workspace_queue.db. When it sees a "Pending" task, it claims it, writes the code,
 and updates the database row to "Review".
 4. The Loop: The Planner (now acting as Validator) sees the "Review" status, checks the
 code, and marks it "Complete" or kicks it back.

 Why this is great: If your computer crashes or one of the Qwen models hallucinates and
 dies, you don't lose anything. You just restart pi, and it picks up right where the
 database left off.

 ### Method 2: RPC Mode / Local WebSockets (Fastest & Most Direct)

 If you want them to literally "talk" to each other in real-time without relying on a
 database file, you can take advantage of pi.dev's RPC mode and TypeScript extension system.

 1. Create a simple Pi Extension: Write a custom TypeScript extension for pi.dev that starts
 a local HTTP server or WebSocket on a specific port (e.g., localhost:8080).
 2. The Planner (Server): The Planner instance runs this extension and hosts the server. It
 holds the "State" in memory.
 3. The Builder (Client): The Builder instance runs in RPC mode or uses a custom "Skill" (a
 script you write for pi) to send API requests to localhost:8080.
 4. The Workflow: * The Builder sends a request: GET /next-task

 - The Planner replies: {"task": "Extract auth button", "file": "app.tsx"}
 - The Builder writes the code and sends: POST /submit-review with the code payload.
 - The Planner reviews it and responds with a pass or fail.

 ### How to execute this today

 To make this work, I recommend starting with Method 1 (SQLite/Files) because it leverages
 the tools pi already has enabled by default (read/bash).

 You can literally write a tiny Python or Node.js script called queue-manager.js and tell
 both pi agents to interact with it using their bash tool.

 Example terminal commands to launch your swarm:

 Terminal 1 (The Planner/Validator):

 ```bash

   pi --system "You are the Master Planner. Read the codebase, run 'node queue-manager.js
 add <task>' to create jobs, and review completed jobs."


 ```

 Terminal 2 (The Builder):

 ```bash

   pi --system "You are the Builder. Run 'node queue-manager.js get-next' to find work.
 Write the code, then run 'node queue-manager.js submit <job_id>'."


 ```

 What operating system are you running this on locally? If it's macOS or Linux, we could
 even use Unix domain sockets for blazing-fast communication, whereas Windows might be
 easier with standard local TCP ports.

 I will have 2 terminal windows with one pi session in eatch. They need to talk to
 eatchoter. Or maby even more. Im running diffretnt computers that hosts the models. I maby
 run 5 computers with one ai model per computer. But all pi instances on the same computer.
 I will have 2 terminal windows with one pi session in eatch. They need to talk to
 eatchoter. Or maby even more. Im running diffretnt computers that hosts the models. I maby
 run 5 computers with one ai model per computer. But all pi instances on the same computer.
 No we must build skills and extentions to pi to use. I will start pi just by typing "pi" in
 terminal and then the whole system loads in.

 Read online for how extentions and skills and agents loads in on pi. You have the exact
 right idea. pi.dev explicitly states its philosophy on this: "No built-in sub-agents. No
 built-in plan mode. Build it with extensions, or install a package." The creator (Mario
 Zechner) built it this way so you aren't locked into a specific way of doing multi-agent
 swarms.

 Based on pi.dev's official documentation, here is exactly how extensions and skills work,
 and how you can build this so that simply typing pi in your terminal boots up your entire
 5-computer swarm.

 ### The Two Ways to Extend pi.dev

 pi uses two distinct concepts for adding capabilities: Skills and TypeScript Extensions.

 #### 1. Skills (The "Tools")

 In pi, a Skill isn't a complex proprietary API. It is simply a standard CLI tool (written
 in Node, Python, Bash, etc.) accompanied by a standard README.

 - pi reads the README to understand what the tool does, and then uses its default bash tool
 to execute your CLI.
 - You can load a skill dynamically via the terminal: pi --skill ./path/to/my-skill or call
 it in the editor with /skill:name.

 #### 2. TypeScript Extensions (The "Brain")

 Extensions are much deeper. They are written in TypeScript and use pi's SDK.

 - They can hook into over 25 different lifecycle events.
 - They can register custom Slash Commands (like /swarm-start).
 - They can manipulate the terminal UI, intercept messages, or spawn background processes.
 - You load them via: pi -e ./path/to/extension.ts.

 ### Step-by-Step: Building Your Swarm Extension

 To make this seamless so you just type pi, you will build a Pi Package that bundles your
 Queue Skill and your Spawner Extension together.

 #### Step 1: Create the Queue Manager (The Skill)

 Create a Node.js CLI script that manages your SQLite database queue. Create a file called
 swarm-queue.js and an accompanying README.md.

 README.md (The Skill Definition):

 ```markdown

   # Swarm Queue Manager

   Use this tool to pass tasks between the Master Planner and the Workers.

   - `node swarm-queue.js push <task>`: Add a task to the queue.

   - `node swarm-queue.js pop`: Get the next task.

   - `node swarm-queue.js submit <code_file>`: Submit code for validation.


 ```

 Because of how pi parses skills, the model will read this markdown and instantly know how
 to use your queue using its bash tool.

 #### Step 2: Create the Swarm Orchestrator (The Extension)

 This is where the magic happens. You write a TypeScript extension that hooks into pi's
 startup sequence. It will use tmux (which pi natively supports for background tasks) to
 spawn the background workers on your 5 custom model endpoints.

 swarm-extension.ts:

 ```typescript

   import { Extension, Context } from '@mariozechner/pi-coding-agent';

   import { execSync } from 'child_process';


   export default class SwarmExtension implements Extension {

   name = "Swarm Orchestrator";


   // This hook fires the moment you type `pi` and press Enter

   async onStart(ctx: Context) {

   ctx.logger.info("Initializing 5-Node Qwen Swarm...");


   // Automatically spawn 5 background 'pi' sessions in tmux

   // mapping them to your 5 remote computers defined in ~/.pi/agent/models.json

   const workers = [

   { id: "planner", model: "node1:qwen9.5", system: "You are the Planner. Run node
 swarm-queue.js push." },

   { id: "worker1", model: "node2:qwen9.5", system: "You are Worker 1. Run node
 swarm-queue.js pop." },

   { id: "worker2", model: "node3:qwen9.5", system: "You are Worker 2. Run node
 swarm-queue.js pop." },

   { id: "worker3", model: "node4:qwen9.5", system: "You are Worker 3. Run node
 swarm-queue.js pop." },

   { id: "validator", model: "node5:qwen9.5", system: "You are the Validator. Check the
 queue for completed tasks." }

   ];


   for (const w of workers) {

   // Launch headless pi instances in tmux sessions

   execSync(`tmux new-session -d -s ${w.id} "pi --model ${w.model} --system '${w.system}'
 --skill ./swarm-queue.js"`);

   }


   ctx.logger.info("Swarm online. Type /queue to view status.");

   }


   // Register a custom command so you can type /queue in pi to see the database

   registerCommands() {

   return [{

   name: '/queue',

   description: 'View the current status of the agent swarm',

   execute: async (ctx) => {

   const status = execSync('node swarm-queue.js status').toString();

   ctx.editor.insert(status);

   }

   }];

   }

   }


 ```

 #### Step 3: Bundle it into a Pi Package and "Install" it

 You don't want to type out --skill and -e every time. pi.dev allows you to bundle
 everything into a "Pi Package" (published to npm or git).

 But for local development, you can just set up your pi configuration to always load it.
 Open your global pi settings file (usually ~/.pi/agent/settings.json) and add your
 extension:

 ```json

   {

   "extensions": ["/absolute/path/to/swarm-extension.ts"],

   "skills": ["/absolute/path/to/swarm-queue"]

   }


 ```

 ### The Result

 Now, you open your terminal.

 1. You type: pi
 2. pi boots up in your terminal UI.
 3. The onStart hook in your TypeScript extension fires.
 4. It seamlessly spins up 5 hidden tmux sessions in the background.
 5. Each tmux session boots a headless pi instance connected to one of your 5 remote
 computers.
 6. The models use the Skill's README to figure out how to talk to the local SQLite
 database.

 You are now sitting at the master terminal, watching the code update in your editor while 5
 Qwen models chew through the workload in the background.

 Are you familiar with tmux for managing these background terminal sessions, or would you
 prefer the TypeScript extension to spawn standard Node child processes directly?

 It looks like you might have accidentally pasted our entire conversation history into the
 chat!

 To pick up exactly where we left off: we just designed the blueprint for a custom pi.dev
 TypeScript extension and a Node.js Skill that will automatically boot up your 5-node Qwen
 swarm across your remote computers the moment you simply type pi in your terminal.

 Are you comfortable using tmux to manage those background terminal sessions, or would you
 prefer I write the extension to spawn standard Node.js child processes directly?

 I wanna have an over all system plan

 This is the blueprint for your distributed, multi-agent development environment. This plan
 unifies your remote LLM hardware, your local pi.dev orchestrator, and your asynchronous
 queue into one cohesive system.
 1. Hardware & Network Topology

 Your architecture relies on decoupling the heavy LLM inference from the lightweight
 orchestration. All state and routing live on your local machine, while the heavy lifting
 happens on the remote nodes.
 Node    Physical Location    Model / Software    Assigned Role in Swarm
 Control Node    Local Computer    pi.dev + Node.js + SQLite    Hosts the Queue, runs the Pi
 Extension, manages state.
 Remote 1    Computer 1    Qwen 9.5:9b (via API)    Master Planner: Analyzes codebase,
 generates domains.
 Remote 2    Computer 2    Qwen 9.5:9b (via API)    Domain Orchestrator: Breaks domains into
 specific tasks.
 Remote 3    Computer 3    Qwen 9.5:9b (via API)    Worker 1: Writes functional code for
 tasks.
 Remote 4    Computer 4    Qwen 9.5:9b (via API)    Worker 2: Writes functional code for
 tasks.
 Remote 5    Computer 5    Qwen 9.5:9b (via API)    Verifier: Acts as QA, checks Worker code
 against criteria.
 2. The Core Components (Code to Write)

 To make this system run by simply typing pi, you need to build three distinct pieces of
 software on your local machine.

 ```
   The Database (workspace.db): An SQLite file that holds the schema for tasks, code
 payloads, dependencies, and statuses (Pending, Review, Complete, Failed).

   The Queue Skill (swarm-cli.js): A Node.js CLI tool with an accompanying README.md. This
 is the exact tool your agents will use in their terminal (via bash) to pull work and submit
 code.

   The Bootstrapper (swarm-extension.ts): A custom TypeScript extension for pi.dev. It uses
 the onStart hook to read your configuration and silently launch 5 background pi instances
 connected to your 5 remote nodes.
 ```

 3. The Execution Workflow

 When you sit down at your local computer and start a project, this is exactly how the data
 will flow through the system.

 ```
   Ignition: You type pi in your terminal.

   Swarm Boot: The Pi Extension intercepts the startup, spins up 5 background processes, and
 assigns each one a specific System Prompt and a remote Qwen endpoint.

   Master Planning: You give the Control Node a prompt (e.g., "Refactor app.tsx"). The
 Master Planner on Remote 1 reads the file and uses swarm-cli.js push to dump high-level
 domain tasks into the SQLite DB.

   Domain Breakdown: Remote 2 polls the DB, finds the domain tasks, breaks them into
 component-level JSON tasks, and pushes them back into the queue.

   Execution Loop: Remotes 3 and 4 (Workers) constantly poll the DB for "Pending" component
 tasks. They write the code and submit it to the queue with a "Review" status.

   Validation: Remote 5 (Verifier) polls for "Review" tasks. It checks the code against the
 original JSON requirements. It either marks it "Complete" (ready for assembly) or "Failed"
 (kicking it back to the Workers).

   Final Assembly: Once the database reads 100% "Complete" for a domain, the Control Node
 bundles the files and updates your local workspace.
 ```

 Which component of this plan would you like to build first: the SQLite Database schema, the
 Node.js Queue CLI, or the pi.dev TypeScript Bootstrapper extension?

 An architectural plan. Not fluff words


 The user wants a clean, no-fluff architectural plan for their multi-agent pi.dev system.
 They want to understand the structure at a high level before diving into implementation.
 Let me create a comprehensive architectural specification document that outlines:

 1. System Overview
 2. Data Flow
 3. Queue/State Management
 4. Agent Roles & Communication
 5. Error Handling & Recovery
 6. Deployment Topology

 I'll write this to a file as they've been working in /home/zerwiz/CodeP/Way of pi/


 [compaction]

 Compacted from 17,140 tokens (ctrl+o to expand)



 add about this Conversation with Gemini

 Im running 2 instances of qwen 9.5:9b. I wanna make an skill or estention so the
 orheatrators can talk to eatchother in pi.dev.

 Small models have problem with big changes in codebase. Wo we need to make them run several
 ov resarch runs. And define every part of the requestsed task in to small pieces and the we
 make new agenst in the orchestration in charche of the small pieces.

 Examle. Break down this 10 000 line of code app.tsx in to a smaller files.

 The whole system maby are 5 pages.

 That could result in that the orchesrtator spawn in 5 smaller orchestrators one per page.
 Ang then he spawns in more mini orchestrators that takes care of bigger tasks and they have
 smaller agents that are responsable for small talks and protect that they work.

 So we need to make great planning docs in to precise details that every agent becomes
 responsable. Equal many small agents as there are tasks. And some orchestrator are
 responsable per task. Every orchestrator must have a team ov verification angents. And if
 the agents ave done not productionready code they need to update the code.

 This is a brilliant architectural approach. You’ve hit on exactly how to get maximum
 performance out of smaller, highly capable models like the 9B parameter class. Small models
 often suffer from "context loss" or hallucination when asked to swallow massive codebases
 whole. By creating a hierarchical, fractal multi-agent system—where tasks are infinitely
 subdivided until they are small enough for a 9B model to handle flawlessly—you bypass that
 limitation entirely.

 To build this extension/skill so your orchestrators can communicate effectively in your
 environment, you need to establish a strict, standardized protocol for how they pass
 instructions, code, and feedback to one another.

 Here is the blueprint for building this hierarchical multi-agent system.
 1. The Core Communication Protocol (The "Handshake")

 For orchestrators to talk to each other, they cannot rely on conversational English. They
 need a strict structured format. You should enforce that every orchestrator communicates
 downward (delegating) and upward (reporting) using a standardized JSON schema.

 The Planning Document Schema:
 When the Master Orchestrator breaks down the 10,000-line app.tsx, it should generate a
 "Manifest" that gets passed to the Page Orchestrators.
 JSON

 {
   "project_id": "app-refactor-001",
   "parent_orchestrator": "Master",
   "assigned_orchestrator": "Page_1_Auth",
   "task_description": "Extract all authentication logic and UI into a separate page
 component.",
   "dependencies": ["Shared_Types", "API_Utils"],
   "sub_tasks": [
     {
       "task_id": "T1",
       "type": "component_extraction",
       "file_target": "src/pages/Auth/Login.tsx",
       "status": "pending"
     }
   ],
   "verification_criteria": [
     "Must compile without TypeScript errors.",
     "Must not contain any routing logic (moved to router)."
   ]
 }

 2. The Orchestrator Hierarchy

 You will need to define specific "System Prompts" for four distinct tiers of agents to make
 this work:
 Tier 1: The Chief Architect (Master Orchestrator)

 ```
   Role: Reads the massive file and creates the Master Plan.

   Action: Does not write code. It only writes the JSON Planning Docs and spawns Tier 2
 Orchestrators.
 ```

 Tier 2: Domain Orchestrators (Page Level)

 ```
   Role: Takes one piece of the Master Plan (e.g., Page 1) and breaks it down further.

   Action: Spawns Tier 3 Mini-Orchestrators or direct Worker Agents for specific components,
 hooks, or utility functions.
 ```

 Tier 3: The Workers (Execution Agents)

 ```
   Role: The grunts. They get a highly specific task: "Write a React hook called useAuth.ts
 that handles login state."

   Action: Writes the actual code. Because the task is so small, your 9B model will write
 production-grade code easily.
 ```

 Tier 4: The Verification Team (Critic/QA Agents)

 ```
   Role: The gatekeepers. Every Worker is paired with a Verification Agent.

   Action: The Worker submits code to the Verification Agent. The Verification Agent checks
 it against the verification_criteria defined in the JSON plan. If it fails, the Critic
 sends the code back to the Worker with a list of errors. The task is not marked "complete"
 to the Orchestrator until the Verification Agent signs off.
 ```

 3. Implementing the Skill: State Management

 To make this actually run without losing track of where the system is, your extension needs
 a Shared Memory File System.

 ```
   Workspace Directory: Create a temporary workspace folder.

   State File: Maintain a project_state.json file. When a Worker finishes, the Verification
 agent updates the state file.

   Polling/PubSub: The Orchestrators shouldn't just wait idly. They should monitor the state
 file. When all sub-tasks under Page_1_Auth are marked as verified_complete, the Tier 2
 Orchestrator bundles the files, sends a success message to the Chief Architect, and
 terminates itself to free up compute.
 ```

 Are you building this orchestration logic completely from scratch using Python/Node.js to
 manage the API calls, or are you utilizing an existing multi-agent framework (like
 LangGraph, AutoGen, or CrewAI) to handle the agent spawning and routing?

 Make a achitecture over the agents

 Here is the architectural layout of your hierarchical agent swarm. This structure is
 designed specifically to protect your 9B models from context overload by ensuring that
 every agent has a hyper-specific, strictly bounded role.
 The Agent Hierarchy (The "Org Chart")

 You can think of this as a corporate structure where tasks flow down and completed,
 verified work flows back up.

 ```
   👑 Tier 1: Master Orchestrator (The Chief Architect)

       Input: The raw 10,000-line file (e.g., app.tsx) and the user's ultimate goal.

       Brain: Uses maximum context window to understand the global structure.

       Output: Generates a high-level JSON Project Manifest. It does not write code.

       Action: Spawns Tier 2 Orchestrators based on the Manifest.

   👔 Tier 2: Domain Orchestrators (The Middle Managers)

       Input: A specific chunk of the Master Manifest (e.g., "Page 1: Auth Module").

       Brain: Focuses only on the architecture of their specific domain.

       Output: Generates highly detailed, component-level task JSONs.

       Action: Spawns Tier 3 (Workers) and Tier 4 (Verifiers) for every single sub-task.

   👷 Tier 3: Worker Agents (The Developers)

       Input: One tiny, highly specific JSON task (e.g., "Extract the Submit button into
 SubmitBtn.tsx and type the props").

       Brain: Laser-focused on writing clean, functional code for one isolated task.

       Output: Raw source code.

       Action: Submits code directly to their assigned Tier 4 Verifier.

   🕵️ Tier 4: Verification Agents (The QA/Critics)

       Input: The Worker's code AND the original JSON task criteria.

       Brain: Acts as a strict compiler/linter/logic checker.

       Output: A "Pass" boolean and a feedback string.

       Action: If Pass = true, it sends the code up to the Domain Orchestrator. If Pass =
 false, it kicks the code back to the Worker with feedback to try again.
 ```

 The State and Data Flow (The "Assembly Line")

 For this architecture to function, the agents cannot simply talk in a void; they need an
 environment to interact with.

 ```
   Planning Phase: The Master Orchestrator reads the codebase and writes the plans to a
 central Shared State Memory (a temporary database or a structured JSON file system).

   Delegation Phase: The Master Orchestrator pauses. The Domain Orchestrators wake up, read
 their sections of the State Memory, and break tasks down further.

   Execution Loop: * Worker agent writes code -> Saves to temporary memory.

       Verifier agent reads temporary memory -> Evaluates code.

       Loop continues until Verifier approves.

   Roll-Up Phase: Once a Verifier approves a task, the code is marked production_ready in
 the Shared State. The Domain Orchestrator monitors this. When all its Workers are done, the
 Domain Orchestrator bundles the domain code and reports back to the Master Orchestrator.

   Finalization: The Master Orchestrator does one final sanity check on how the domains fit
 together and outputs the final refactored application.
 ```

 To keep this system from getting stuck in an infinite loop, how are you planning to handle
 a scenario where a Worker agent repeatedly fails the Verification agent's checks (e.g.,
 failing 5 times in a row)?

 We must have a system for how many teir 2 and teir 3 that spawns in

 You are 100% right to call this out. Since you are physically running 2 instances of Qwen
 9.5:9b, you cannot just spawn 50 agents into the ether and expect them to execute at the
 exact same time.

 If the Master Orchestrator mindlessly spawns 5 Tier 2s, and they each spawn 10 Tier 3s, you
 suddenly have 55 agents fighting for the compute of 2 LLM instances. Your system will
 bottleneck, crash, or time out.

 You need to separate Logical Spawning (how many agents are planned) from Physical Execution
 (how many agents are actually processing at once). To do this, you need a Task Queue System
 and strict Spawning Heuristics.

 Here is the system you need to build to control the swarm:
 Part 1: The Spawning Heuristics (How many to plan)

 The Master Orchestrator and Tier 2 Orchestrators should not guess how many agents to spawn.
 They must use deterministic rules based on the codebase's structure, ideally by analyzing
 the Abstract Syntax Tree (AST) or imports.

 Rule 1: Tier 2 Spawning (The "Module" Rule)
 The Master Orchestrator is strictly limited to spawning ONE Tier 2 agent per major
 architectural boundary.

 ```
   Trigger: Master reads the router file (e.g., App.tsx or routes.ts) or the main index
 exports.

   Spawn Calculation: 1 Route / 1 Page / 1 Core Service = 1 Tier 2 Agent.

   If the app has 5 pages and 1 shared utilities folder, the Master spawns exactly 6 Tier 2
 Orchestrators.
 ```

 Rule 2: Tier 3 Spawning (The "Complexity" Limit)
 Tier 2 Orchestrators cannot dump a 2,000-line file onto a single Tier 3 Worker. They must
 divide tasks based on strict chunking limits.

 ```
   Trigger: Tier 2 reads its assigned domain (e.g., the Auth Page).

   Spawn Calculation: 1 UI Component = 1 Worker. 1 Logic Hook = 1 Worker.

   Hard Cap: If a component is still larger than ~150 lines of code, the Tier 2 Orchestrator
 is forced to break it down again before spawning the Worker.
 ```

 Part 2: The Task Queue (How to execute them on 2 Qwen instances)

 Because you only have 2 physical models running, your "agents" are essentially just
 structured JSON prompts waiting their turn. You must build a Message Queue (using something
 like Redis, RabbitMQ, or a simple Node.js/Python async queue).

 Your 2 Qwen instances act as Worker Nodes pulling from this central queue.

 How the Queue System Works:

 ```
   The Master Runs: The Master Orchestrator claims Qwen Instance #1. It maps out the 6 Tier
 2 tasks and pushes them to the Pending_Queue. It then goes to sleep.

   Tier 2s Wake Up: * Qwen Instance #1 pulls "Tier 2: Auth Page" from the queue.

       Qwen Instance #2 pulls "Tier 2: Dashboard Page" from the queue.

       They both break their pages down into Tier 3 Worker tasks, push those new tasks to
 the queue, and go back to sleep.

   The Swarm Executes: Now the queue is full of Tier 3 Worker tasks and Tier 4 Verification
 tasks. Your 2 Qwen instances just churn through them, one by one, picking up a task,
 generating the code/review, updating the Shared State, and picking up the next one.
 ```

 Queue Task Schema Example:
 JSON

 {
   "job_id": "job_092",
   "priority": "high",
   "agent_role": "tier_3_worker",
   "assigned_domain": "Page_1_Auth",
   "task": "Write SubmitBtn.tsx",
   "status": "queued",
   "max_retries": 3
 }

 Part 3: The Concurrency Limits

 To keep the system stable, enforce these limits in your orchestration code (your
 Node/Python backend):

 ```
   Max Active Jobs: 2 (Tied directly to your 2 Qwen instances).

   Max Queue Size: 100 (If the queue hits 100, Tier 2 Orchestrators must pause spawning
 until the Tier 3 Workers clear out some backlog).

   State Polling: Orchestrators should only poll the database every few seconds to check if
 their dependencies are met, avoiding API spam.
 ```

 By using a Queue, you can have a "swarm" of 500 logical agents meticulously taking apart a
 10,000-line codebase, smoothly passing through your 2 Qwen models without ever overwhelming
 your hardware.

 What programming language and framework are you planning to use to build the central
 backend that handles this queuing and state management?

 They can work in queueing

 This is the exact right path. By utilizing a queueing system, your architecture shifts from
 a fragile web of active agents into a highly robust Asynchronous Task Engine. Your two Qwen
 9.5:9b instances simply become workers that pull jobs off a conveyor belt.

 Since you are running this in pi.dev, which gives you a flexible cloud environment, you can
 implement this elegantly.

 Here is how to structure the queueing logic so the agents can collaborate without stepping
 on each other's toes.
 1. The "State Machine" Queue

 Your queue cannot just be a simple "first-in, first-out" list. Because you have
 Verification agents (Tier 4) that rely on Worker agents (Tier 3), and Orchestrators (Tier
 2) that rely on both, your queue needs to be dependency-aware (often called a Directed
 Acyclic Graph, or DAG).

 Every task in the queue needs a lifecycle:

 ```
   BLOCKED: The task is registered, but waiting on a prerequisite (e.g., a Tier 2
 Orchestrator waiting for all its Tier 3 Workers to finish).

   PENDING: Prerequisites are met. Ready to be picked up by one of the Qwen instances.

   IN_PROGRESS: Currently being processed by Qwen Instance A or B.

   REVIEW: Worker is done, task is now assigned to a Tier 4 Verification agent.

   COMPLETED: Verified and merged into the Shared State.

   FAILED: Hit the max retry limit for verification. Requires human intervention or Master
 Orchestrator re-planning.
 ```

 2. How the Orchestrators Interact with the Queue

 The Master Orchestrator (Tier 1):

 ```
   Action: Runs once. Generates the top-level plan.

   Queue Interaction: Pushes 5 Tier 2 Tasks into the queue. Statuses are set to PENDING. The
 Master's own final assembly task is pushed but set to BLOCKED (waiting for the 5 Tier 2s).
 ```

 The Domain Orchestrators (Tier 2):

 ```
   Action: Qwen picks up a PENDING Tier 2 task. It reads its assigned 2,000 lines of code
 and breaks it into 15 small tasks.

   Queue Interaction: It pushes 15 Tier 3 Worker Tasks into the queue as PENDING. It updates
 its own task status to BLOCKED, waiting on those 15 tasks.
 ```

 The Workers & Verifiers (Tiers 3 & 4):

 ```
   Action: Qwen pulls a PENDING Tier 3 task. It writes the React component.

   Queue Interaction: It updates the task status to REVIEW. The very next time a Qwen
 instance is free, it sees the REVIEW status, assumes the persona of a Tier 4 Verifier, and
 checks the code.

       If Pass: Updates status to COMPLETED.

       If Fail: Appends feedback to the payload, sets status back to PENDING.
 ```

 3. Implementing the Queue in pi.dev

 Because you want this to be resilient across "several research runs" (meaning the process
 might take hours and could be interrupted), you should not store this queue purely in
 memory (like a simple array in your code).

 You should use a lightweight, persistent database in your pi.dev environment.

 ```
   SQLite: The absolute best choice for this. It’s file-based, requires zero heavy setup,
 and handles JSON payloads perfectly. You can literally have a tasks table with columns for
 id, agent_tier, status, payload_json, and dependencies.

   Redis: Great if you want high-speed pub/sub, but overkill unless you are distributing
 this across multiple servers.
 ```

 With an SQLite queue, you can easily stop the run, look at the database to see exactly what
 the agents are struggling with, tweak the code, and resume the run without losing any
 progress.

 Are you planning to write the orchestration backend that manages this SQLite queue in
 Python, or do you prefer using Node.js/TypeScript?

 The 2 3.5 will run in diffrent instances of pi. One can be planner./validator and the other
 builder. They need to be able to talk to eachoter locally on the computer

 Since you are running the models inside pi.dev (the terminal-based coding agent) locally on
 your computer, this actually makes your setup much simpler and faster. You don't need
 external cloud infrastructure or heavy networking.

 pi.dev was built specifically for this kind of hacking. It has an incredibly modular
 architecture with four operating modes (Interactive, Print/JSON, RPC, and SDK) and a native
 TypeScript extension system.

 Here is exactly how you can wire up your two local pi instances so the Planner and Builder
 can talk to each other.
 Method 1: The SQLite File System Queue (Safest & Most Resilient)

 Because both pi instances are running on the same local hard drive, you don't even need
 them to speak directly over a network port. You can use local files as the communication
 bridge. pi already has built-in read, write, and edit tools.

 ```
   The Setup: Create a local SQLite file (e.g., workspace_queue.db) in your project folder.

   The Planner Instance: You launch the first pi instance and give it a custom system prompt
 to act as the Planner. It analyzes the code and uses a script to INSERT tasks into the
 local workspace_queue.db.

   The Builder Instance: You launch the second pi instance. It runs a background loop
 checking workspace_queue.db. When it sees a "Pending" task, it claims it, writes the code,
 and updates the database row to "Review".

   The Loop: The Planner (now acting as Validator) sees the "Review" status, checks the
 code, and marks it "Complete" or kicks it back.
 ```

 Why this is great: If your computer crashes or one of the Qwen models hallucinates and
 dies, you don't lose anything. You just restart pi, and it picks up right where the
 database left off.
 Method 2: RPC Mode / Local WebSockets (Fastest & Most Direct)

 If you want them to literally "talk" to each other in real-time without relying on a
 database file, you can take advantage of pi.dev's RPC mode and TypeScript extension system.

 ```
   Create a simple Pi Extension: Write a custom TypeScript extension for pi.dev that starts
 a local HTTP server or WebSocket on a specific port (e.g., localhost:8080).

   The Planner (Server): The Planner instance runs this extension and hosts the server. It
 holds the "State" in memory.

   The Builder (Client): The Builder instance runs in RPC mode or uses a custom "Skill" (a
 script you write for pi) to send API requests to localhost:8080.

   The Workflow: * The Builder sends a request: GET /next-task

       The Planner replies: {"task": "Extract auth button", "file": "app.tsx"}

       The Builder writes the code and sends: POST /submit-review with the code payload.

       The Planner reviews it and responds with a pass or fail.
 ```

 How to execute this today

 To make this work, I recommend starting with Method 1 (SQLite/Files) because it leverages
 the tools pi already has enabled by default (read/bash).

 You can literally write a tiny Python or Node.js script called queue-manager.js and tell
 both pi agents to interact with it using their bash tool.

 Example terminal commands to launch your swarm:

 Terminal 1 (The Planner/Validator):
 Bash

 pi --system "You are the Master Planner. Read the codebase, run 'node queue-manager.js add
 <task>' to create jobs, and review completed jobs."

 Terminal 2 (The Builder):
 Bash

 pi --system "You are the Builder. Run 'node queue-manager.js get-next' to find work. Write
 the code, then run 'node queue-manager.js submit <job_id>'."

 What operating system are you running this on locally? If it's macOS or Linux, we could
 even use Unix domain sockets for blazing-fast communication, whereas Windows might be
 easier with standard local TCP ports.

 I will have 2 terminal windows with one pi session in eatch. They need to talk to
 eatchoter. Or maby even more. Im running diffretnt computers that hosts the models. I maby
 run 5 computers with one ai model per computer. But all pi instances on the same computer

 This is a brilliant topology. By offloading the heavy lifting (LLM inference) to the 5
 remote machines and keeping the lightweight orchestrators (the pi sessions) strictly on
 your local machine, you've solved the compute bottleneck.

 Because all the pi instances share the exact same local hard drive, they don't need complex
 network routing to talk to each other. They just need a shared file space. This aligns
 perfectly with pi.dev's minimalist, hacker-friendly philosophy: the best API is often just
 the file system.

 Here is exactly how you wire up this 5-brain, local-orchestrator swarm using pi's native
 Custom Providers and Skills.
 1. Map the 5 Computers as "Custom Providers"

 Assuming your 5 remote computers are running an OpenAI-compatible server (like Ollama,
 vLLM, or LM Studio), you need to tell pi how to reach them.

 You do this by editing pi's model configuration file (usually found at
 ~/.pi/agent/models.json). Map each of your 5 computers to a custom endpoint:
 JSON

 {
   "providers": {
     "node1": {
       "type": "openai",
       "baseUrl": "http://192.168.1.101:8000/v1",
       "apiKey": "dummy-key"
     },
     "node2": {
       "type": "openai",
       "baseUrl": "http://192.168.1.102:8000/v1",
       "apiKey": "dummy-key"
     }
   }
 }

 2. Build the Communication Bridge (A Custom Pi Skill)

 pi.dev intentionally leaves out heavy features like built-in sub-agents so you can build
 exactly what you need. In pi, you extend functionality using Skills, which are basically
 just CLI tools with a README that the agent can read.

 Since your agents share a local drive, you can write a tiny Node.js or Bash script called
 swarm-cli.js that uses an SQLite database (or even just a folder of JSON files) as the
 shared state.

 Make this script executable and put it in a folder. It should have three basic commands
 that the agents can use as tools:

 ```
   node swarm-cli.js push --plan "extract Auth.tsx" (Used by the Planner)

   node swarm-cli.js pop --role worker (Used by the Builders to grab pending tasks)

   node swarm-cli.js submit --id 123 --status review (Used by Builders to hand off code to
 the Validators)
 ```

 3. Launch the Terminal Swarm

 Now, you simply open your terminal windows on your main machine and launch your pi
 sessions. You pass the specific remote computer (--model) and the specific role (--system)
 to each instance.

 Terminal 1 (The Master Planner on Computer 1):
 Bash

 pi --model node1:qwen9.5 --system "You are the Planner. Analyze the code and use 'node
 swarm-cli.js push' to assign tasks to the builders."

 Terminal 2 (Builder Agent on Computer 2):
 Bash

 pi --model node2:qwen9.5 --system "You are Builder 1. Loop 'node swarm-cli.js pop' to find
 work. Write the code, then use 'swarm-cli.js submit' to send it for review."

 Terminal 3 (Validator Agent on Computer 3):
 Bash

 pi --model node3:qwen9.5 --system "You are the QA Validator. Pull code in 'review' status
 from swarm-cli. If it fails, send it back to pending. If it passes, mark it complete."

 Because pi instances operate inside their own terminal windows, you get full observability.
 You can sit back and watch the Matrix flow as the Planner delegates, the Builders code, and
 the Validators review—all passing messages locally through your swarm-cli script while the
 5 separate computers burn through the token generation.

 What software are you currently running on those 5 remote computers to expose the Qwen
 models to your local network (e.g., Ollama, vLLM, llama.cpp)?

 No we must build skills and extentions to pi to use. I will start pi just by typing "pi" in
 terminal and then the whole system loads in.

 Read online for how extentions and skills and agents loads in on pi

 You have the exact right idea. pi.dev explicitly states its philosophy on this: "No
 built-in sub-agents. No built-in plan mode. Build it with extensions, or install a
 package." The creator (Mario Zechner) built it this way so you aren't locked into a
 specific way of doing multi-agent swarms.

 Based on pi.dev's official documentation, here is exactly how extensions and skills work,
 and how you can build this so that simply typing pi in your terminal boots up your entire
 5-computer swarm.
 The Two Ways to Extend pi.dev

 pi uses two distinct concepts for adding capabilities: Skills and TypeScript Extensions.
 1. Skills (The "Tools")

 In pi, a Skill isn't a complex proprietary API. It is simply a standard CLI tool (written
 in Node, Python, Bash, etc.) accompanied by a standard README.

 ```
   pi reads the README to understand what the tool does, and then uses its default bash tool
 to execute your CLI.

   You can load a skill dynamically via the terminal: pi --skill ./path/to/my-skill or call
 it in the editor with /skill:name.
 ```

 2. TypeScript Extensions (The "Brain")

 Extensions are much deeper. They are written in TypeScript and use pi's SDK.

 ```
   They can hook into over 25 different lifecycle events.

   They can register custom Slash Commands (like /swarm-start).

   They can manipulate the terminal UI, intercept messages, or spawn background processes.

   You load them via: pi -e ./path/to/extension.ts.
 ```

 Step-by-Step: Building Your Swarm Extension

 To make this seamless so you just type pi, you will build a Pi Package that bundles your
 Queue Skill and your Spawner Extension together.
 Step 1: Create the Queue Manager (The Skill)

 Create a Node.js CLI script that manages your SQLite database queue. Create a file called
 swarm-queue.js and an accompanying README.md.

 README.md (The Skill Definition):
 Markdown

 Swarm Queue Manager

 Use this tool to pass tasks between the Master Planner and the Workers.
 - node swarm-queue.js push <task>: Add a task to the queue.
 - node swarm-queue.js pop: Get the next task.
 - node swarm-queue.js submit <code_file>: Submit code for validation.

 Because of how pi parses skills, the model will read this markdown and instantly know how
 to use your queue using its bash tool.
 Step 2: Create the Swarm Orchestrator (The Extension)

 This is where the magic happens. You write a TypeScript extension that hooks into pi's
 startup sequence. It will use tmux (which pi natively supports for background tasks) to
 spawn the background workers on your 5 custom model endpoints.

 swarm-extension.ts:
 TypeScript

 import { Extension, Context } from '@mariozechner/pi-coding-agent';
 import { execSync } from 'child_process';

 export default class SwarmExtension implements Extension {
   name = "Swarm Orchestrator";

   // This hook fires the moment you type pi and press Enter
   async onStart(ctx: Context) {
     ctx.logger.info("Initializing 5-Node Qwen Swarm...");

 ```
   // Automatically spawn 5 background 'pi' sessions in tmux
   // mapping them to your 5 remote computers defined in ~/.pi/agent/models.json
   const workers = [
     { id: "planner", model: "node1:qwen9.5", system: "You are the Planner. Run node
 swarm-queue.js push." },
     { id: "worker1", model: "node2:qwen9.5", system: "You are Worker 1. Run node
 swarm-queue.js pop." },
     { id: "worker2", model: "node3:qwen9.5", system: "You are Worker 2. Run node
 swarm-queue.js pop." },
     { id: "worker3", model: "node4:qwen9.5", system: "You are Worker 3. Run node
 swarm-queue.js pop." },
     { id: "validator", model: "node5:qwen9.5", system: "You are the Validator. Check the
 queue for completed tasks." }
   ];

   for (const w of workers) {
     // Launch headless pi instances in tmux sessions
     execSync(`tmux new-session -d -s ${w.id} "pi --model ${w.model} --system '${w.system}'
 --skill ./swarm-queue.js"`);
   }

   ctx.logger.info("Swarm online. Type /queue to view status.");
 ```

   }

   // Register a custom command so you can type /queue in pi to see the database
   registerCommands() {
     return [{
       name: '/queue',
       description: 'View the current status of the agent swarm',
       execute: async (ctx) => {
         const status = execSync('node swarm-queue.js status').toString();
         ctx.editor.insert(status);
       }
     }];
   }
 }

 Step 3: Bundle it into a Pi Package and "Install" it

 You don't want to type out --skill and -e every time. pi.dev allows you to bundle
 everything into a "Pi Package" (published to npm or git).

 But for local development, you can just set up your pi configuration to always load it.
 Open your global pi settings file (usually ~/.pi/agent/settings.json) and add your
 extension:
 JSON

 {
   "extensions": ["/absolute/path/to/swarm-extension.ts"],
   "skills": ["/absolute/path/to/swarm-queue"]
 }

 The Result

 Now, you open your terminal.

 ```
   You type: pi

   pi boots up in your terminal UI.

   The onStart hook in your TypeScript extension fires.

   It seamlessly spins up 5 hidden tmux sessions in the background.

   Each tmux session boots a headless pi instance connected to one of your 5 remote
 computers.

   The models use the Skill's README to figure out how to talk to the local SQLite database.
 ```

 You are now sitting at the master terminal, watching the code update in your editor while 5
 Qwen models chew through the workload in the background.

 Are you familiar with tmux for managing these background terminal sessions, or would you
 prefer the TypeScript extension to spawn standard Node child processes directly?

 Im running 2 instances of qwen 9.5:9b. I wanna make an skill or estention so the
 orheatrators can talk to eatchother in pi.dev.

 Small models have problem with big changes in codebase. Wo we need to make them run several
 ov resarch runs. And define every part of the requestsed task in to small pieces and the we
 make new agenst in the orchestration in charche of the small pieces.

 Examle. Break down this 10 000 line of code app.tsx in to a smaller files.

 The whole system maby are 5 pages.

 That could result in that the orchesrtator spawn in 5 smaller orchestrators one per page.
 Ang then he spawns in more mini orchestrators that takes care of bigger tasks and they have
 smaller agents that are responsable for small talks and protect that they work.

 So we need to make great planning docs in to precise details that every agent becomes
 responsable. Equal many small agents as there are tasks. And some orchestrator are
 responsable per task. Every orchestrator must have a team ov verification angents. And if
 the agents ave done not productionready code they need to update the code. Here is the
 architectural layout of your hierarchical agent swarm. This structure is designed
 specifically to protect your 9B models from context overload by ensuring that every agent
 has a hyper-specific, strictly bounded role.

 The Agent Hierarchy (The "Org Chart")

 You can think of this as a corporate structure where tasks flow down and completed,
 verified work flows back up.

 - 👑 Tier 1: Master Orchestrator (The Chief Architect)
 - Input: The raw 10,000-line file (e.g., app.tsx) and the user's ultimate goal.
 - Brain: Uses maximum context window to understand the global structure.
 - Output: Generates a high-level JSON Project Manifest. It does not write code.
 - Action: Spawns Tier 2 Orchestrators based on the Manifest.
 - 👔 Tier 2: Domain Orchestrators (The Middle Managers)
 - Input: A specific chunk of the Master Manifest (e.g., "Page 1: Auth Module").
 - Brain: Focuses only on the architecture of their specific domain.
 - Output: Generates highly detailed, component-level task JSONs.
 - Action: Spawns Tier 3 (Workers) and Tier 4 (Verifiers) for every single sub-task.
 - 👷 Tier 3: Worker Agents (The Developers)
 - Input: One tiny, highly specific JSON task (e.g., "Extract the Submit button into
 SubmitBtn.tsx and type the props").
 - Brain: Laser-focused on writing clean, functional code for one isolated task.
 - Output: Raw source code.
 - Action: Submits code directly to their assigned Tier 4 Verifier.
 - 🕵️ Tier 4: Verification Agents (The QA/Critics)
 - Input: The Worker's code AND the original JSON task criteria.
 - Brain: Acts as a strict compiler/linter/logic checker.
 - Output: A "Pass" boolean and a feedback string.
 - Action: If Pass = true, it sends the code up to the Domain Orchestrator. If Pass = false,
 it kicks the code back to the Worker with feedback to try again.

 The State and Data Flow (The "Assembly Line")

 For this architecture to function, the agents cannot simply talk in a void; they need an
 environment to interact with.

 1. Planning Phase: The Master Orchestrator reads the codebase and writes the plans to a
 central Shared State Memory (a temporary database or a structured JSON file system).
 2. Delegation Phase: The Master Orchestrator pauses. The Domain Orchestrators wake up, read
 their sections of the State Memory, and break tasks down further.
 3. Execution Loop: * Worker agent writes code -> Saves to temporary memory.

 - Verifier agent reads temporary memory -> Evaluates code.
 - Loop continues until Verifier approves.

 4. Roll-Up Phase: Once a Verifier approves a task, the code is marked production_ready in
 the Shared State. The Domain Orchestrator monitors this. When all its Workers are done, the
 Domain Orchestrator bundles the domain code and reports back to the Master Orchestrator.
 5. Finalization: The Master Orchestrator does one final sanity check on how the domains fit
 together and outputs the final refactored application.

 To keep this system from getting stuck in an infinite loop, how are you planning to handle
 a scenario where a Worker agent repeatedly fails the Verification agent's checks (e.g.,
 failing 5 times in a row)?

 We must have a system for how many teir 2 and teir 3 that spawns inYou are 100% right to
 call this out. Since you are physically running 2 instances of Qwen 9.5:9b, you cannot just
 spawn 50 agents into the ether and expect them to execute at the exact same time.

 If the Master Orchestrator mindlessly spawns 5 Tier 2s, and they each spawn 10 Tier 3s, you
 suddenly have 55 agents fighting for the compute of 2 LLM instances. Your system will
 bottleneck, crash, or time out.

 You need to separate Logical Spawning (how many agents are planned) from Physical Execution
  (how many agents are actually processing at once). To do this, you need a Task Queue
 System and strict Spawning Heuristics.

 Here is the system you need to build to control the swarm:

 ### Part 1: The Spawning Heuristics (How many to plan)

 The Master Orchestrator and Tier 2 Orchestrators should not guess how many agents to spawn.
 They must use deterministic rules based on the codebase's structure, ideally by analyzing
 the Abstract Syntax Tree (AST) or imports.

 Rule 1: Tier 2 Spawning (The "Module" Rule)

 The Master Orchestrator is strictly limited to spawning ONE Tier 2 agent per major
 architectural boundary.

 - Trigger: Master reads the router file (e.g., App.tsx or routes.ts) or the main index
 exports.
 - Spawn Calculation: 1 Route / 1 Page / 1 Core Service = 1 Tier 2 Agent.
 - If the app has 5 pages and 1 shared utilities folder, the Master spawns exactly 6 Tier 2
 Orchestrators.

 Rule 2: Tier 3 Spawning (The "Complexity" Limit)

 Tier 2 Orchestrators cannot dump a 2,000-line file onto a single Tier 3 Worker. They must
 divide tasks based on strict chunking limits.

 - Trigger: Tier 2 reads its assigned domain (e.g., the Auth Page).
 - Spawn Calculation: 1 UI Component = 1 Worker. 1 Logic Hook = 1 Worker.
 - Hard Cap: If a component is still larger than ~150 lines of code, the Tier 2 Orchestrator
 is forced to break it down again before spawning the Worker.

 ### Part 2: The Task Queue (How to execute them on 2 Qwen instances)

 Because you only have 2 physical models running, your "agents" are essentially just
 structured JSON prompts waiting their turn. You must build a Message Queue (using something
 like Redis, RabbitMQ, or a simple Node.js/Python async queue).

 Your 2 Qwen instances act as Worker Nodes pulling from this central queue.

 How the Queue System Works:

 1. The Master Runs: The Master Orchestrator claims Qwen Instance #1. It maps out the 6 Tier
 2 tasks and pushes them to the Pending_Queue. It then goes to sleep.
 2. Tier 2s Wake Up: * Qwen Instance #1 pulls "Tier 2: Auth Page" from the queue.

 - Qwen Instance #2 pulls "Tier 2: Dashboard Page" from the queue.
 - They both break their pages down into Tier 3 Worker tasks, push those new tasks to the
 queue, and go back to sleep.

 3. The Swarm Executes: Now the queue is full of Tier 3 Worker tasks and Tier 4 Verification
 tasks. Your 2 Qwen instances just churn through them, one by one, picking up a task,
 generating the code/review, updating the Shared State, and picking up the next one.

 Queue Task Schema Example:

 ```json

   {

   "job_id": "job_092",

   "priority": "high",

   "agent_role": "tier_3_worker",

   "assigned_domain": "Page_1_Auth",

   "task": "Write SubmitBtn.tsx",

   "status": "queued",

   "max_retries": 3

   }


 ```

 ### Part 3: The Concurrency Limits

 To keep the system stable, enforce these limits in your orchestration code (your
 Node/Python backend):

 - Max Active Jobs: 2 (Tied directly to your 2 Qwen instances).
 - Max Queue Size: 100 (If the queue hits 100, Tier 2 Orchestrators must pause spawning
 until the Tier 3 Workers clear out some backlog).
 - State Polling: Orchestrators should only poll the database every few seconds to check if
 their dependencies are met, avoiding API spam.

 By using a Queue, you can have a "swarm" of 500 logical agents meticulously taking apart a
 10,000-line codebase, smoothly passing through your 2 Qwen models without ever overwhelming
 your hardware.

 What programming language and framework are you planning to use to build the central
 backend that handles this queuing and state management? They can work in queueing This is
 the exact right path. By utilizing a queueing system, your architecture shifts from a
 fragile web of active agents into a highly robust Asynchronous Task Engine. Your two Qwen
 9.5:9b instances simply become workers that pull jobs off a conveyor belt.

 Since you are running this in pi.dev, which gives you a flexible cloud environment, you can
 implement this elegantly.

 Here is how to structure the queueing logic so the agents can collaborate without stepping
 on each other's toes.

 ### 1. The "State Machine" Queue

 Your queue cannot just be a simple "first-in, first-out" list. Because you have
 Verification agents (Tier 4) that rely on Worker agents (Tier 3), and Orchestrators (Tier
 2) that rely on both, your queue needs to be dependency-aware (often called a Directed
 Acyclic Graph, or DAG).

 Every task in the queue needs a lifecycle:

 1. BLOCKED: The task is registered, but waiting on a prerequisite (e.g., a Tier 2
 Orchestrator waiting for all its Tier 3 Workers to finish).
 2. PENDING: Prerequisites are met. Ready to be picked up by one of the Qwen instances.
 3. IN_PROGRESS: Currently being processed by Qwen Instance A or B.
 4. REVIEW: Worker is done, task is now assigned to a Tier 4 Verification agent.
 5. COMPLETED: Verified and merged into the Shared State.
 6. FAILED: Hit the max retry limit for verification. Requires human intervention or Master
 Orchestrator re-planning.

 ### 2. How the Orchestrators Interact with the Queue

 The Master Orchestrator (Tier 1):

 - Action: Runs once. Generates the top-level plan.
 - Queue Interaction: Pushes 5 Tier 2 Tasks into the queue. Statuses are set to PENDING. The
 Master's own final assembly task is pushed but set to BLOCKED (waiting for the 5 Tier 2s).

 The Domain Orchestrators (Tier 2):

 - Action: Qwen picks up a PENDING Tier 2 task. It reads its assigned 2,000 lines of code
 and breaks it into 15 small tasks.
 - Queue Interaction: It pushes 15 Tier 3 Worker Tasks into the queue as PENDING. It updates
 its own task status to BLOCKED, waiting on those 15 tasks.

 The Workers & Verifiers (Tiers 3 & 4):

 - Action: Qwen pulls a PENDING Tier 3 task. It writes the React component.
 - Queue Interaction: It updates the task status to REVIEW. The very next time a Qwen
 instance is free, it sees the REVIEW status, assumes the persona of a Tier 4 Verifier, and
 checks the code.
 - If Pass: Updates status to COMPLETED.
 - If Fail: Appends feedback to the payload, sets status back to PENDING.

 ### 3. Implementing the Queue in pi.dev

 Because you want this to be resilient across "several research runs" (meaning the process
 might take hours and could be interrupted), you should not store this queue purely in
 memory (like a simple array in your code).

 You should use a lightweight, persistent database in your pi.dev environment.

 - SQLite: The absolute best choice for this. It’s file-based, requires zero heavy setup,
 and handles JSON payloads perfectly. You can literally have a tasks table with columns for
 id, agent_tier, status, payload_json, and dependencies.
 - Redis: Great if you want high-speed pub/sub, but overkill unless you are distributing
 this across multiple servers.

 With an SQLite queue, you can easily stop the run, look at the database to see exactly what
 the agents are struggling with, tweak the code, and resume the run without losing any
 progress.

 Are you planning to write the orchestration backend that manages this SQLite queue in
 Python, or do you prefer using Node.js/TypeScript?The 2 3.5 will run in diffrent instances
 of pi. One can be planner./validator and the other builder. They need to be able to talk to
 eachoter locally on the computer

 Since you are running the models inside pi.dev (the terminal-based coding agent) locally on
 your computer, this actually makes your setup much simpler and faster. You don't need
 external cloud infrastructure or heavy networking.

 pi.dev was built specifically for this kind of hacking. It has an incredibly modular
 architecture with four operating modes (Interactive, Print/JSON, RPC, and SDK) and a native
 TypeScript extension system.

 Here is exactly how you can wire up your two local pi instances so the Planner and Builder
 can talk to each other.

 ### Method 1: The SQLite File System Queue (Safest & Most Resilient)

 Because both pi instances are running on the same local hard drive, you don't even need
 them to speak directly over a network port. You can use local files as the communication
 bridge. pi already has built-in read, write, and edit tools.

 1. The Setup: Create a local SQLite file (e.g., workspace_queue.db) in your project folder.
 2. The Planner Instance: You launch the first pi instance and give it a custom system
 prompt to act as the Planner. It analyzes the code and uses a script to INSERT tasks into
 the local workspace_queue.db.
 3. The Builder Instance: You launch the second pi instance. It runs a background loop
 checking workspace_queue.db. When it sees a "Pending" task, it claims it, writes the code,
 and updates the database row to "Review".
 4. The Loop: The Planner (now acting as Validator) sees the "Review" status, checks the
 code, and marks it "Complete" or kicks it back.

 Why this is great: If your computer crashes or one of the Qwen models hallucinates and
 dies, you don't lose anything. You just restart pi, and it picks up right where the
 database left off.

 ### Method 2: RPC Mode / Local WebSockets (Fastest & Most Direct)

 If you want them to literally "talk" to each other in real-time without relying on a
 database file, you can take advantage of pi.dev's RPC mode and TypeScript extension system.

 1. Create a simple Pi Extension: Write a custom TypeScript extension for pi.dev that starts
 a local HTTP server or WebSocket on a specific port (e.g., localhost:8080).
 2. The Planner (Server): The Planner instance runs this extension and hosts the server. It
 holds the "State" in memory.
 3. The Builder (Client): The Builder instance runs in RPC mode or uses a custom "Skill" (a
 script you write for pi) to send API requests to localhost:8080.
 4. The Workflow: * The Builder sends a request: GET /next-task

 - The Planner replies: {"task": "Extract auth button", "file": "app.tsx"}
 - The Builder writes the code and sends: POST /submit-review with the code payload.
 - The Planner reviews it and responds with a pass or fail.

 ### How to execute this today

 To make this work, I recommend starting with Method 1 (SQLite/Files) because it leverages
 the tools pi already has enabled by default (read/bash).

 You can literally write a tiny Python or Node.js script called queue-manager.js and tell
 both pi agents to interact with it using their bash tool.

 Example terminal commands to launch your swarm:

 Terminal 1 (The Planner/Validator):

 ```bash

   pi --system "You are the Master Planner. Read the codebase, run 'node queue-manager.js
 add <task>' to create jobs, and review completed jobs."


 ```

 Terminal 2 (The Builder):

 ```bash

   pi --system "You are the Builder. Run 'node queue-manager.js get-next' to find work.
 Write the code, then run 'node queue-manager.js submit <job_id>'."


 ```

 What operating system are you running this on locally? If it's macOS or Linux, we could
 even use Unix domain sockets for blazing-fast communication, whereas Windows might be
 easier with standard local TCP ports.

 I will have 2 terminal windows with one pi session in eatch. They need to talk to
 eatchoter. Or maby even more. Im running diffretnt computers that hosts the models. I maby
 run 5 computers with one ai model per computer. But all pi instances on the same computer.
 I will have 2 terminal windows with one pi session in eatch. They need to talk to
 eatchoter. Or maby even more. Im running diffretnt computers that hosts the models. I maby
 run 5 computers with one ai model per computer. But all pi instances on the same computer.
 No we must build skills and extentions to pi to use. I will start pi just by typing "pi" in
 terminal and then the whole system loads in.

 Read online for how extentions and skills and agents loads in on pi. You have the exact
 right idea. pi.dev explicitly states its philosophy on this: "No built-in sub-agents. No
 built-in plan mode. Build it with extensions, or install a package." The creator (Mario
 Zechner) built it this way so you aren't locked into a specific way of doing multi-agent
 swarms.

 Based on pi.dev's official documentation, here is exactly how extensions and skills work,
 and how you can build this so that simply typing pi in your terminal boots up your entire
 5-computer swarm.

 ### The Two Ways to Extend pi.dev

 pi uses two distinct concepts for adding capabilities: Skills and TypeScript Extensions.

 #### 1. Skills (The "Tools")

 In pi, a Skill isn't a complex proprietary API. It is simply a standard CLI tool (written
 in Node, Python, Bash, etc.) accompanied by a standard README.

 - pi reads the README to understand what the tool does, and then uses its default bash tool
 to execute your CLI.
 - You can load a skill dynamically via the terminal: pi --skill ./path/to/my-skill or call
 it in the editor with /skill:name.

 #### 2. TypeScript Extensions (The "Brain")

 Extensions are much deeper. They are written in TypeScript and use pi's SDK.

 - They can hook into over 25 different lifecycle events.
 - They can register custom Slash Commands (like /swarm-start).
 - They can manipulate the terminal UI, intercept messages, or spawn background processes.
 - You load them via: pi -e ./path/to/extension.ts.

 ### Step-by-Step: Building Your Swarm Extension

 To make this seamless so you just type pi, you will build a Pi Package that bundles your
 Queue Skill and your Spawner Extension together.

 #### Step 1: Create the Queue Manager (The Skill)

 Create a Node.js CLI script that manages your SQLite database queue. Create a file called
 swarm-queue.js and an accompanying README.md.

 README.md (The Skill Definition):

 ```markdown

   # Swarm Queue Manager

   Use this tool to pass tasks between the Master Planner and the Workers.

   - `node swarm-queue.js push <task>`: Add a task to the queue.

   - `node swarm-queue.js pop`: Get the next task.

   - `node swarm-queue.js submit <code_file>`: Submit code for validation.


 ```

 Because of how pi parses skills, the model will read this markdown and instantly know how
 to use your queue using its bash tool.

 #### Step 2: Create the Swarm Orchestrator (The Extension)

 This is where the magic happens. You write a TypeScript extension that hooks into pi's
 startup sequence. It will use tmux (which pi natively supports for background tasks) to
 spawn the background workers on your 5 custom model endpoints.

 swarm-extension.ts:

 ```typescript

   import { Extension, Context } from '@mariozechner/pi-coding-agent';

   import { execSync } from 'child_process';


   export default class SwarmExtension implements Extension {

   name = "Swarm Orchestrator";


   // This hook fires the moment you type `pi` and press Enter

   async onStart(ctx: Context) {

   ctx.logger.info("Initializing 5-Node Qwen Swarm...");


   // Automatically spawn 5 background 'pi' sessions in tmux

   // mapping them to your 5 remote computers defined in ~/.pi/agent/models.json

   const workers = [

   { id: "planner", model: "node1:qwen9.5", system: "You are the Planner. Run node
 swarm-queue.js push." },

   { id: "worker1", model: "node2:qwen9.5", system: "You are Worker 1. Run node
 swarm-queue.js pop." },

   { id: "worker2", model: "node3:qwen9.5", system: "You are Worker 2. Run node
 swarm-queue.js pop." },

   { id: "worker3", model: "node4:qwen9.5", system: "You are Worker 3. Run node
 swarm-queue.js pop." },

   { id: "validator", model: "node5:qwen9.5", system: "You are the Validator. Check the
 queue for completed tasks." }

   ];


   for (const w of workers) {

   // Launch headless pi instances in tmux sessions

   execSync(`tmux new-session -d -s ${w.id} "pi --model ${w.model} --system '${w.system}'
 --skill ./swarm-queue.js"`);

   }


   ctx.logger.info("Swarm online. Type /queue to view status.");

   }


   // Register a custom command so you can type /queue in pi to see the database

   registerCommands() {

   return [{

   name: '/queue',

   description: 'View the current status of the agent swarm',

   execute: async (ctx) => {

   const status = execSync('node swarm-queue.js status').toString();

   ctx.editor.insert(status);

   }

   }];

   }

   }


 ```

 #### Step 3: Bundle it into a Pi Package and "Install" it

 You don't want to type out --skill and -e every time. pi.dev allows you to bundle
 everything into a "Pi Package" (published to npm or git).

 But for local development, you can just set up your pi configuration to always load it.
 Open your global pi settings file (usually ~/.pi/agent/settings.json) and add your
 extension:

 ```json

   {

   "extensions": ["/absolute/path/to/swarm-extension.ts"],

   "skills": ["/absolute/path/to/swarm-queue"]

   }


 ```

 ### The Result

 Now, you open your terminal.

 1. You type: pi
 2. pi boots up in your terminal UI.
 3. The onStart hook in your TypeScript extension fires.
 4. It seamlessly spins up 5 hidden tmux sessions in the background.
 5. Each tmux session boots a headless pi instance connected to one of your 5 remote
 computers.
 6. The models use the Skill's README to figure out how to talk to the local SQLite
 database.

 You are now sitting at the master terminal, watching the code update in your editor while 5
 Qwen models chew through the workload in the background.

 Are you familiar with tmux for managing these background terminal sessions, or would you
 prefer the TypeScript extension to spawn standard Node child processes directly?

 It looks like you might have accidentally pasted our entire conversation history into the
 chat!

 To pick up exactly where we left off: we just designed the blueprint for a custom pi.dev
 TypeScript extension and a Node.js Skill that will automatically boot up your 5-node Qwen
 swarm across your remote computers the moment you simply type pi in your terminal.

 Are you comfortable using tmux to manage those background terminal sessions, or would you
 prefer I write the extension to spawn standard Node.js child processes directly?

 I wanna have an over all system plan

 This is the blueprint for your distributed, multi-agent development environment. This plan
 unifies your remote LLM hardware, your local pi.dev orchestrator, and your asynchronous
 queue into one cohesive system.
 1. Hardware & Network Topology

 Your architecture relies on decoupling the heavy LLM inference from the lightweight
 orchestration. All state and routing live on your local machine, while the heavy lifting
 happens on the remote nodes.
 Node    Physical Location    Model / Software    Assigned Role in Swarm
 Control Node    Local Computer    pi.dev + Node.js + SQLite    Hosts the Queue, runs the Pi
 Extension, manages state.
 Remote 1    Computer 1    Qwen 9.5:9b (via API)    Master Planner: Analyzes codebase,
 generates domains.
 Remote 2    Computer 2    Qwen 9.5:9b (via API)    Domain Orchestrator: Breaks domains into
 specific tasks.
 Remote 3    Computer 3    Qwen 9.5:9b (via API)    Worker 1: Writes functional code for
 tasks.
 Remote 4    Computer 4    Qwen 9.5:9b (via API)    Worker 2: Writes functional code for
 tasks.
 Remote 5    Computer 5    Qwen 9.5:9b (via API)    Verifier: Acts as QA, checks Worker code
 against criteria.
 2. The Core Components (Code to Write)

 To make this system run by simply typing pi, you need to build three distinct pieces of
 software on your local machine.

 ```
   The Database (workspace.db): An SQLite file that holds the schema for tasks, code
 payloads, dependencies, and statuses (Pending, Review, Complete, Failed).

   The Queue Skill (swarm-cli.js): A Node.js CLI tool with an accompanying README.md. This
 is the exact tool your agents will use in their terminal (via bash) to pull work and submit
 code.

   The Bootstrapper (swarm-extension.ts): A custom TypeScript extension for pi.dev. It uses
 the onStart hook to read your configuration and silently launch 5 background pi instances
 connected to your 5 remote nodes.
 ```

 3. The Execution Workflow

 When you sit down at your local computer and start a project, this is exactly how the data
 will flow through the system.

 ```
   Ignition: You type pi in your terminal.

   Swarm Boot: The Pi Extension intercepts the startup, spins up 5 background processes, and
 assigns each one a specific System Prompt and a remote Qwen endpoint.

   Master Planning: You give the Control Node a prompt (e.g., "Refactor app.tsx"). The
 Master Planner on Remote 1 reads the file and uses swarm-cli.js push to dump high-level
 domain tasks into the SQLite DB.

   Domain Breakdown: Remote 2 polls the DB, finds the domain tasks, breaks them into
 component-level JSON tasks, and pushes them back into the queue.

   Execution Loop: Remotes 3 and 4 (Workers) constantly poll the DB for "Pending" component
 tasks. They write the code and submit it to the queue with a "Review" status.

   Validation: Remote 5 (Verifier) polls for "Review" tasks. It checks the code against the
 original JSON requirements. It either marks it "Complete" (ready for assembly) or "Failed"
 (kicking it back to the Workers).

   Final Assembly: Once the database reads 100% "Complete" for a domain, the Control Node
 bundles the files and updates your local workspace.
 ```

