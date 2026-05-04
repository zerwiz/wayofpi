import type { Task } from '../types/tasks';

export const tasksService = {
  getAllTasks: (): Task[] => [],
  getTask: (id: string): Task | null => null,
  updateTask: async (id: string, data: Partial<Task>): Promise<void> => {},
};
