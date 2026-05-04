import type { Board, BoardCard } from '../types/kanban';

const demoBoard: Board = {
  id: 'board-1',
  name: 'Main Project Board',
  description: 'Manage main construction tasks',
  columns: [
    { id: 'col-1', boardId: 'board-1', name: 'To Do', order: 0 },
    { id: 'col-2', boardId: 'board-1', name: 'In Progress', order: 1 },
    { id: 'col-3', boardId: 'board-1', name: 'Done', order: 2 },
  ],
  members: ['user-1'],
  createdAt: Date.now(),
};

const demoCards: BoardCard[] = [
  {
    id: 'card-1',
    boardId: 'board-1',
    columnId: 'col-1',
    title: 'Pour Foundation',
    priority: 'high',
    assignees: [],
    labels: [],
    checklists: [],
    comments: [],
    attachments: [],
    order: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'card-2',
    boardId: 'board-1',
    columnId: 'col-2',
    title: 'Install Rebar',
    priority: 'medium',
    assignees: [],
    labels: [],
    checklists: [],
    comments: [],
    attachments: [],
    order: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const kanbanService = {
  getAllBoards: (): Board[] => [demoBoard],
  getBoard: (id: string): Board | null => id === 'board-1' ? demoBoard : null,
  getCard: (boardId: string, cardId: string): BoardCard | null => demoCards.find(c => c.id === cardId) || null,
  updateCard: async (boardId: string, cardId: string, data: Partial<BoardCard>): Promise<void> => {
    console.log('Update card:', cardId, data);
  },
  createBoard: async (data: Partial<Board>): Promise<Board> => ({ ...demoBoard, ...data, id: `board-${Date.now()}` }),
  createBoardFromTemplate: async (templateId: string, name: string): Promise<Board> => ({ ...demoBoard, name, id: `board-${Date.now()}` }),
  deleteBoard: async (id: string): Promise<void> => {},
  updateBoard: async (id: string, data: Partial<Board>): Promise<void> => {},
  addColumn: async (boardId: string, name: string): Promise<void> => {},
  updateColumn: async (boardId: string, columnId: string, name: string): Promise<void> => {},
  deleteColumn: async (boardId: string, columnId: string): Promise<void> => {},
  moveCard: async (boardId: string, cardId: string, targetColumnId: string, targetIndex: number): Promise<void> => {
    console.log('Move card:', cardId, 'to', targetColumnId);
  },
  deleteCard: async (boardId: string, cardId: string): Promise<void> => {},
  getBoardMembers: (boardId: string) => [],
  inviteBoardMember: async (boardId: string, email: string, role: string) => {},
};
