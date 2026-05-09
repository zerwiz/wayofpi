import type { KanbanBoard } from './mockKanbanService';

export interface BoardTemplate { id: string; name: string; category: string; columns: string[] }

export const BOARD_TEMPLATES: BoardTemplate[] = [];

export const getTemplatesByCategory = (category: string): BoardTemplate[] => {
  return BOARD_TEMPLATES.filter(t => t.category === category);
};
