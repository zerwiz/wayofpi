export interface KanbanBoard { id: string; name: string; columns: KanbanColumn[]; starred?: boolean; archived?: boolean }
export interface KanbanColumn { id: string; name: string; cards: KanbanCard[] }
export interface KanbanCard { id: string; title: string; description?: string; status?: string }

export const kanbanService = {
  getBoards: async (): Promise<KanbanBoard[]> => [],
  getBoard: async (id: string): Promise<KanbanBoard | null> => null,
  getAllBoards: async (): Promise<KanbanBoard[]> => [],
  getAllCardsForBoard: async (_boardId: string): Promise<any[]> => [],
  createBoardFromTemplate: async (_template: any): Promise<KanbanBoard> => ({ id: 'new-board', name: 'New Board', columns: [] }),
  updateBoard: async (_id: string, _data: Partial<KanbanBoard>): Promise<void> => {},
  deleteBoard: async (_id: string): Promise<void> => {},
  createColumn: async (_boardId: string, _column: Partial<KanbanColumn>): Promise<void> => {},
  deleteColumn: async (_boardId: string, _columnId: string): Promise<void> => {},
  createCard: async (_boardId: string, _card: any): Promise<any> => ({ id: 'new-card', title: '' }),
  updateCard: async (_boardId: string, _cardId: string, _data: any): Promise<void> => {},
  deleteCard: async (_cardId: string): Promise<void> => {},
  moveCard: async (_boardId: string, _cardId: string, _targetColumnId: string, _index: number): Promise<void> => {},
};
