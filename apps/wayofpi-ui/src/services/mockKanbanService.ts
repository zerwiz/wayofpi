export interface KanbanBoard { id: string; name: string; columns: KanbanColumn[] }
export interface KanbanColumn { id: string; name: string; cards: KanbanCard[] }
export interface KanbanCard { id: string; title: string; description?: string; status?: string }

export const kanbanService = {
  getBoards: async (): Promise<KanbanBoard[]> => [],
  getBoard: async (id: string): Promise<KanbanBoard | null> => null,
};
