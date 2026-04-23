// --- pi.dev - Core Agent Orchestration System ---
// * This file contains the pure TypeScript logic for the Orchestrator and Sub-agents.
// * It is designed with an "Observable" pattern so that any UI can subscribe to 
// * state changes and render the "gogglable" boxes in real-time.
// *
// * NOTE: This is pure TypeScript logic for the pi.dev orchestration system.
// * The actual subagents are managed by the pi CLI using team management.
//

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'completed' | 'error';

export interface LogEntry {
  timestamp: number;
  message: string;
}

export interface SubAgentState {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  currentTask: string | null;
  logs: LogEntry[];
}

export interface OrchestratorState {
  status: AgentStatus;
  mainGoal: string | null;
  logs: LogEntry[];
  agents: Record<string, SubAgentState>;
}

export type StateObserver = (state: OrchestratorState) => void;

export class SubAgent {
  private state: SubAgentState;
  private onStateUpdate: () => void;

  constructor(id: string, name: string, role: string, onStateUpdate: () => void) {
    this.state = {
      id,
      name,
      role,
      status: 'idle' as AgentStatus,
      currentTask: null,
      logs: []
    };
    this.onStateUpdate = onStateUpdate;
  }

  public getState(): SubAgentState {
    return this.state;
  }

  private updateState(updates: Partial<SubAgentState>) {
    this.state = { ...this.state, ...updates };
    this.onStateUpdate();
  }

  public log(message: string) {
    this.state.logs.push({ timestamp: Date.now(), message });
    this.updateState({});
  }

  public async executeTask(taskDescription: string): Promise<void> {
    this.updateState({ currentTask: taskDescription, status: 'thinking' });
    this.log(`Received task: "${taskDescription}"`);

    this.updateState({ status: 'executing' });
    this.log("Analyzing requirements...");
    
    await this.sleep(1000);
    this.log("Writing code/executing logic...");
    
    await this.sleep(1500);
    this.log("Task completed successfully."); // For demo - actual pi agents do real work!

    this.updateState({ status: 'completed' });
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class Orchestrator {
  private state: OrchestratorState;
  private observers: StateObserver[] = [];
  private agents: Map<string, SubAgent> = new Map();

  constructor() {
    this.state = {
      status: 'idle' as AgentStatus,
      mainGoal: null,
      logs: [],
      agents: {} as Record<string, SubAgentState>
    };
  }

  public subscribe(observer: StateObserver): () => void {
    this.observers.push(observer);
    observer(this.state);
    return () => {
      this.observers = this.observers.filter(obs => obs !== observer);
    };
  }

  private notifyObservers() {
    const agentsState: Record<string, SubAgentState> = {};
    for (const [id, agent] of this.agents.entries()) {
      agentsState[id] = agent.getState();
    }
    this.state.agents = agentsState;
    const stateSnapshot = JSON.parse(JSON.stringify(this.state));
    this.observers.forEach(obs => obs(stateSnapshot));
  }

  private updateState(updates: Partial<OrchestratorState>) {
    this.state = { ...this.state, ...updates };
    this.notifyObservers();
  }

  public log(message: string) {
    this.state.logs.push({ timestamp: Date.now(), message });
    this.updateState({});
  }

  public createAgent(id: string, name: string, role: string): SubAgent {
    const agent = new SubAgent(id, name, role, () => this.notifyObservers());
    this.agents.set(id, agent);
    this.notifyObservers();
    return agent;
  }

  public async processGoal(goal: string): Promise<void> {
    this.updateState({ mainGoal: goal, status: 'thinking' });
    this.log(`Orchestrator received main goal: "${goal}"`);

    this.log("Decomposing goal into sub-tasks and provisioning agents...");
    await this.sleep(1000);

    const dbAgent = this.createAgent('db-1', 'DB-Architect', 'Database Specialist');
    const apiAgent = this.createAgent('api-1', 'API-Weaver', 'Backend Engineer');

    this.updateState({ status: 'executing' });
    this.log("Agents provisioned. Dispatching tasks in parallel...");

    await Promise.all([
      dbAgent.executeTask("Design Postgres schema for User Auth"),
      apiAgent.executeTask("Implement JWT Auth endpoints in Express")
    ]);

    this.log("All sub-agents have reported completion.");
    this.updateState({ status: 'completed' });
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// --- Demo: How to use subagents ---
async function demoSubagents() {
  console.log("\n=== pi.SubAgent Demo ===\n");

  const orchestrator = new Orchestrator();

  orchestrator.subscribe((state) => {
    console.log(`\n--- STATE UPDATE [Status: ${state.status}] ---`);
    console.log(`Main Goal: ${state.mainGoal || 'None'}`);
    for (const agent of Object.values(state.agents)) {
      console.log(`  [${agent.name}]: ${agent.status}`);
      if (agent.currentTask) {
        console.log(`    Task: ${agent.currentTask}`);
        const latestLog = agent.logs[agent.logs.length - 1];
        if (latestLog) console.log(`    Thought: ${latestLog.message}`);
      }
    }
  });

  await orchestrator.processGoal("Build authentication system");
  
  console.log("\n=== Demo Complete ===\n");
}

demoSubagents();
