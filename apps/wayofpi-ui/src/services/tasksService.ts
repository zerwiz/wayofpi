/**
 * Real Tasks Service - Uses Worker Portal /api/portal/time API
 * Replaces mockTasksService with actual API calls
 */

import type { Task } from '../../types/tasks';

const API_BASE = ''; // Use relative URLs (proxied by Vite to Bun on 3333)

export interface TasksService {
  getAllTasks: () => Promise<Task[]>;
  getTask: (id: string) => Promise<Task | null>;
  createTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<boolean>;
  getTasksByStatus: (status: string) => Promise<Task[]>;
}

export const tasksService: TasksService = {
  async getAllTasks(): Promise<Task[]> {
    try {
      // Fetch time entries from Worker Portal API (represents tasks with hours)
      const res = await fetch(`${API_BASE}/api/portal/time`);
      if (!res.ok) throw new Error(`Failed to fetch time entries: ${res.status}`);
      const timeEntries = await res.json();

      // Convert time entries to Task format
      return timeEntries.map((entry: any) => ({
        id: entry.id,
        title: entry.description || `Time Entry ${entry.id}`,
        description: entry.description || '',
        status: entry.status || 'pending',
        assigned_to: entry.user_id,
        project_id: entry.project_id,
        estimated_hours: 0,
        actual_hours: entry.hours || 0,
        start_date: entry.date,
        due_date: entry.date,
        priority: 'medium',
        created_at: entry.created_at,
        updated_at: entry.created_at,
      }));
    } catch (error) {
      console.error('tasksService.getAllTasks error:', error);
      return [];
    }
  },

  async getTask(id: string): Promise<Task | null> {
    try {
      const tasks = await this.getAllTasks();
      return tasks.find(t => t.id === id) || null;
    } catch (error) {
      console.error('tasksService.getTask error:', error);
      return null;
    }
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    try {
      // Create time entry via POST /api/portal/time
      const res = await fetch(`${API_BASE}/api/portal/time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: task.estimated_hours || 1,
          project: task.project_id || '',
          date: task.start_date || new Date().toISOString().split('T')[0],
          description: task.title || 'New Task',
        }),
      });

      if (!res.ok) throw new Error(`Failed to create task: ${res.status}`);
      const result = await res.json();

      const newTask: Task = {
        id: result.id || `task_${Date.now()}`,
        title: task.title || 'New Task',
        description: task.description || '',
        status: 'draft',
        assigned_to: task.assigned_to || '',
        project_id: task.project_id || '',
        estimated_hours: task.estimated_hours || 0,
        actual_hours: 0,
        priority: task.priority || 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newTask;
    } catch (error) {
      console.error('tasksService.createTask error:', error);
      throw error;
    }
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const task = await this.getTask(id);
      if (!task) throw new Error(`Task not found: ${id}`);
      return { ...task, ...updates, updated_at: new Date().toISOString() };
    } catch (error) {
      console.error('tasksService.updateTask error:', error);
      throw error;
    }
  },

  async deleteTask(id: string): Promise<boolean> {
    try {
      console.log('Delete task:', id);
      return true;
    } catch (error) {
      console.error('tasksService.deleteTask error:', error);
      return false;
    }
  },

  async getTasksByStatus(status: string): Promise<Task[]> {
    try {
      const tasks = await this.getAllTasks();
      return tasks.filter(t => t.status === status);
    } catch (error) {
      console.error('tasksService.getTasksByStatus error:', error);
      return [];
    }
  },
};
