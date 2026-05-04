export type DevelopmentPhase = 'discovery' | 'design' | 'development' | 'testing' | 'deployment';

export interface DevelopmentStep {
  id: string;
  name: string;
  phase: DevelopmentPhase;
  kanbanCardIds?: string[];
}

export interface DevelopmentWorkflow {
  id: string;
  name: string;
  steps: DevelopmentStep[];
}
