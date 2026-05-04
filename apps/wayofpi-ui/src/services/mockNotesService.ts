import type { Note } from '../types/notes';

export const notesService = {
  getAllNotes: (): Note[] => [],
  getNote: (id: string): Note | null => null,
  updateNote: async (id: string, data: Partial<Note>): Promise<void> => {},
};
