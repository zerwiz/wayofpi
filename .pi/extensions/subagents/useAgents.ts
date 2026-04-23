/**
 * useAgents Hook
 *
 * @description Manages agent API connections, catalog operations, and team state
 * @returns Object containing agentsApi, reloadAgentsCatalog, and session data
 *
 * @example
 * ```tsx
 * const { agentsApi, reloadAgentsCatalog } = useAgents();
 * const data = agentsApi.data;
 * if (data) renderAgentsCatalog(data);
 * reloadAgentsCatalog();
 * ```
 */

import { useState, useCallback, useEffect, useMemo } from "react";

const STORAGE_KEY = "wop-agents-api";

export interface Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  capabilities: string[];
  isActive: boolean;
  lastUsed?: Date;
  plan?: PlanArtifact;
}

export interface PlanArtifact {
  slug: string;
  title: string;
  status: "bootstrapping" | "running" | "completed" | "failed";
  progress: number;
}

export interface AgentAPI {
  data: {
    teamsPath?: string;
    agents: Agent[];
    plan?: PlanArtifact;
  } | null;
  reload: () => Promise<void>;
  addAgent: (agent: Omit<Agent, "id" | "lastUsed">) => Promise<Agent>;
  updateAgent: (id: string, agent: Partial<Agent>) => Promise<Agent>;
  removeAgent: (id: string) => Promise<void>;
}

export interface UseAgentsReturn {
  agentsApi: AgentAPI;
  reloadAgentsCatalog: () => Promise<void>;
  agentCount: number;
  isRefreshing: boolean;
}

// Default agent data structure
const DEFAULT_AGENTS: Agent[] = [];

// Create agent API instance
export function useAgents(): UseAgentsReturn {
  const [agentsData, setAgentsData] = useState<
    { teamsPath?: string; agents: Agent[]; plan?: PlanArtifact } | null
  >(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const agentsApi: AgentAPI = useMemo(() => {
    const loadFromStorage = (): { teamsPath?: string; agents: Agent[]; plan?: PlanArtifact } | null => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored) as { teamsPath?: string; agents: Agent[]; plan?: PlanArtifact };
        }
      } catch {
        // Storage not available or parse error
      }
      return null;
    };

    const saveToStorage = (data: { teamsPath?: string; agents: Agent[]; plan?: PlanArtifact } | null) => {
      try {
        if (data) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // Storage might not be available
      }
    };

    const fetchAgents = useCallback(async () => {
      // Simulate async agent fetch - in production this would call actual API
      await new Promise((resolve) => setTimeout(resolve, 100));
      const stored = loadFromStorage();
      saveToStorage(stored);
      return stored || DEFAULT_AGENTS;
    }, []);

    return {
      get data() {
        return agentsData;
      },
      reload: async () => {
        setIsRefreshing(true);
        try {
          const agents = await fetchAgents();
          setAgentsData(agents);
          saveToStorage(agents);
        } catch (error) {
          console.warn("Failed to reload agents:", error);
        } finally {
          setIsRefreshing(false);
        }
      },
      addAgent: async (newAgent: Omit<Agent, "id" | "lastUsed">) => {
        try {
          const agent: Agent = {
            ...newAgent,
            id: Date.now().toString(),
            isActive: true,
            lastUsed: new Date(),
          };
          const updatedAgents = [...(agentsData?.agents || []), agent];
          const updatedData = {
            ...agentsData,
            agents: updatedAgents,
          };
          setAgentsData(updatedData);
          saveToStorage(updatedData);
          return agent;
        } catch (error) {
          console.warn("Failed to add agent:", error);
          throw error;
        }
      },
      updateAgent: async (id: string, updates: Partial<Agent>) => {
        try {
          const updatedAgents = (agentsData?.agents || []).map((agent) =>
            agent.id === id ? { ...agent, ...updates } : agent,
          );
          const updatedData = {
            ...agentsData,
            agents: updatedAgents,
          };
          setAgentsData(updatedData);
          saveToStorage(updatedData);
          return updatedAgents.find((a) => a.id === id) || null;
        } catch (error) {
          console.warn("Failed to update agent:", error);
          throw error;
        }
      },
      removeAgent: async (id: string) => {
        try {
          const updatedAgents = (agentsData?.agents || []).filter((a) => a.id !== id);
          const updatedData = {
            ...agentsData,
            agents: updatedAgents,
          };
          setAgentsData(updatedData);
          saveToStorage(updatedData);
        } catch (error) {
          console.warn("Failed to remove agent:", error);
          throw error;
        }
      },
    };
  }, [agentsData]);

  const reloadAgentsCatalog = useCallback(async () => {
    await agentsApi.reload();
  }, [agentsApi.reload]);

  const agentCount = useMemo(() => agentsData?.agents.length || 0, [agentsData]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        try {
          const stored = event.newValue;
          if (stored) {
            const parsed = JSON.parse(stored) as
              | { teamsPath?: string; agents: Agent[]; plan?: PlanArtifact }
              | null;
            if (parsed) {
              setAgentsData(parsed);
            } else {
              setAgentsData(null);
            }
          }
        } catch {
          // Ignore invalid JSON
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return {
    agentsApi,
    reloadAgentsCatalog,
    agentCount,
    isRefreshing,
  };
}
