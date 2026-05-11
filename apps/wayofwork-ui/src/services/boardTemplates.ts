import type { KanbanBoard } from './mockKanbanService';

export type TemplateCategory = 'software_development' | 'sales' | 'marketing' | 'project_management' | 'personal';

export interface BoardTemplate { id: string; name: string; category: string; description: string; icon?: string; featured?: boolean; tags?: string[]; columns: string[] }

export const BOARD_TEMPLATES: BoardTemplate[] = [];

export const getTemplatesByCategory = (category: TemplateCategory): BoardTemplate[] => {
  return BOARD_TEMPLATES.filter(t => t.category === category);
};
