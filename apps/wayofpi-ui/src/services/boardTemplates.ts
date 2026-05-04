export interface BoardTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
}

export const BOARD_TEMPLATES: BoardTemplate[] = [
  { id: 'kanban', name: 'Kanban Board', category: 'Software Development', description: 'Classic kanban board' },
];

export const getTemplatesByCategory = (category: string) => {
  return BOARD_TEMPLATES.filter(t => t.category === category);
};
