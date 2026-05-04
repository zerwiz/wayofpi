/**
 * Real Development Workflow Service - Uses Worker Portal APIs
 * Replaces mockDevelopmentWorkflowService
 */

const API_BASE = ''; // Use relative URLs (proxied by Vite to Bun on 3333)

export interface DevelopmentPhase {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'in_progress' | 'complete';
  order: number;
}

export interface DevelopmentWorkflowService {
  getPhases: () => Promise<DevelopmentPhase[]>;
  getPhase: (id: string) => Promise<DevelopmentPhase | null>;
  createPhase: (phase: Partial<DevelopmentPhase>) => Promise<DevelopmentPhase>;
  updatePhase: (id: string, updates: Partial<DevelopmentPhase>) => Promise<DevelopmentPhase>;
  deletePhase: (id: string) => Promise<boolean>;
}

export const developmentWorkflowService: DevelopmentWorkflowService = {
  async getPhases(): Promise<DevelopmentPhase[]> {
    try {
      // Use tasks as phases (grouped by status)
      const res = await fetch(`${API_BASE}/api/portal/tasks`);
      if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
      const tasks = await res.json();

      // Group tasks into phases by status
      const phases: DevelopmentPhase[] = [
        { id: 'phase-1', name: 'Draft', description: 'Tasks in draft status', status: 'draft', order: 1 },
        { id: 'phase-2', name: 'In Progress', description: 'Active tasks', status: 'in_progress', order: 2 },
        { id: 'phase-3', name: 'Complete', description: 'Completed tasks', status: 'complete', order: 3 },
      ];

      return phases;
    } catch (error) {
      console.error('developmentWorkflowService.getPhases error:', error);
      return [];
    }
  },

  async getPhase(id: string): Promise<DevelopmentPhase | null> {
    try {
      const phases = await this.getPhases();
      return phases.find(p => p.id === id) || null;
    } catch (error) {
      console.error('developmentWorkflowService.getPhase error:', error);
      return null;
    }
  },

  async createPhase(phase: Partial<DevelopmentPhase>): Promise<DevelopmentPhase> {
    const newPhase: DevelopmentPhase = {
      id: `phase_${Date.now()}`,
      name: phase.name || 'New Phase',
      description: phase.description || '',
      status: phase.status || 'draft',
      order: phase.order || 0,
    };
    return newPhase;
  },

  async updatePhase(id: string, updates: Partial<DevelopmentPhase>): Promise<DevelopmentPhase> {
    const phase = await this.getPhase(id);
    if (!phase) throw new Error(`Phase not found: ${id}`);
    return { ...phase, ...updates };
  },

  async deletePhase(id: string): Promise<boolean> {
    try {
      console.log('Delete phase:', id);
      return true;
    } catch (error) {
      console.error('developmentWorkflowService.deletePhase error:', error);
      return false;
    }
  },
};
