import type { Board, BoardColumn } from '../types/kanban';

export type KanbanBoard = Board;
export type KanbanColumn = BoardColumn;

export const kanbanService = {
  getBoards: async (): Promise<Board[]> => [],
  getBoard: async (_id: string): Promise<Board | null> => null,
  getAllBoards: async (): Promise<Board[]> => [],
  getAllCardsForBoard: async (_boardId: string): Promise<any[]> => [],
  getCard: async (_boardId: string, _cardId: string): Promise<any> => null,
  getBoardMembers: async (_boardId: string): Promise<any[]> => [],
  inviteBoardMember: async (_boardId: string, _email: string, _role: string): Promise<void> => {},
  removeBoardMember: async (_boardId: string, _memberId: string): Promise<void> => {},
  updateBoardMemberRole: async (_boardId: string, _memberId: string, _role: string): Promise<void> => {},
  createBoardFromTemplate: async (_template: any, _name?: string): Promise<Board> => ({ id: 'new-board', name: _name || 'New Board', columns: [], members: [], createdAt: Date.now() } as Board),
  createBoard: async (_data: any, _templateId?: string): Promise<Board> => ({ id: 'new-board', name: _data?.name || 'New Board', columns: [], members: [], createdAt: Date.now() } as Board),
  updateBoard: async (_id: string, _data: Partial<Board>): Promise<void> => {},
  deleteBoard: async (_id: string): Promise<void> => {},
  createColumn: async (_boardId: string, _column: Partial<BoardColumn>): Promise<void> => {},
  deleteColumn: async (_boardId: string, _columnId: string): Promise<void> => {},
  createCard: async (_boardId: string, _card: any): Promise<any> => ({ id: 'new-card', title: '' }),
  updateCard: async (_boardId: string, _cardId: string, _data: any): Promise<void> => {},
  deleteCard: async (_cardId: string): Promise<void> => {},
  moveCard: async (_boardId: string, _cardId: string, _targetColumnId: string, _index: number): Promise<void> => {},
};
