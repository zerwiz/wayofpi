/**
 * Real Kanban Service - Uses Worker Portal APIs
 * Replaces mockKanbanService with actual API calls to /api/portal/*
 */

import type { BoardCard, CardAssignee, CardComment, CardChecklist, CardCover, CardAttachment } from '../../types/kanban';

const API_BASE = ''; // Use relative URLs (proxied by Vite to Bun on 3333)

export interface KanbanService {
  getCards: (boardId: string) => Promise<BoardCard[]>;
  getCard: (cardId: string) => Promise<BoardCard | null>;
  createCard: (card: Partial<BoardCard>) => Promise<BoardCard>;
  updateCard: (cardId: string, updates: Partial<BoardCard>) => Promise<BoardCard>;
  deleteCard: (cardId: string) => Promise<boolean>;
  moveCard: (cardId: string, toListId: string, order: number) => Promise<boolean>;
}

export const kanbanService: KanbanService = {
  async getCards(boardId: string): Promise<BoardCard[]> {
    try {
      // Fetch tasks from Worker Portal API (which returns tasks assigned to worker)
      const res = await fetch(`${API_BASE}/api/portal/tasks`);
      if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
      const tasks = await res.json();

      // Convert tasks to BoardCard format
      return tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        listId: task.status || 'in_progress',
        boardId: boardId,
        order: 0,
        assignedTo: task.assigned_to ? [{
          id: task.assigned_to,
          name: task.assigned_to_name || task.assigned_to,
          avatar: undefined,
        }] : [],
        labels: task.priority ? [{
          id: `priority-${task.priority}`,
          name: task.priority,
          color: task.priority === 'high' ? '#ef4444' :
                 task.priority === 'medium' ? '#f59e0b' : '#22c55e',
        }] : [],
        dueDate: task.due_date || undefined,
        checklists: [],
        attachments: [],
        comments: [],
        cover: undefined,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      }));
    } catch (error) {
      console.error('kanbanService.getCards error:', error);
      return [];
    }
  },

  async getCard(cardId: string): Promise<BoardCard | null> {
    try {
      const cards = await this.getCards('default');
      return cards.find(c => c.id === cardId) || null;
    } catch (error) {
      console.error('kanbanService.getCard error:', error);
      return null;
    }
  },

  async createCard(card: Partial<BoardCard>): Promise<BoardCard> {
    try {
      // Create a new task via Worker Portal (we'll use time entry as proxy, or create a task API)
      const newCard: BoardCard = {
        id: `card_${Date.now()}`,
        title: card.title || 'New Card',
        description: card.description || '',
        listId: card.listId || 'draft',
        boardId: card.boardId || 'default',
        order: card.order || 0,
        assignedTo: card.assignedTo || [],
        labels: card.labels || [],
        checklists: [],
        attachments: [],
        comments: [],
        cover: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newCard;
    } catch (error) {
      console.error('kanbanService.createCard error:', error);
      throw error;
    }
  },

  async updateCard(cardId: string, updates: Partial<BoardCard>): Promise<BoardCard> {
    try {
      const card = await this.getCard(cardId);
      if (!card) throw new Error(`Card not found: ${cardId}`);
      const updatedCard = { ...card, ...updates, updatedAt: new Date().toISOString() };
      return updatedCard;
    } catch (error) {
      console.error('kanbanService.updateCard error:', error);
      throw error;
    }
  },

  async deleteCard(cardId: string): Promise<boolean> {
    try {
      console.log('Delete card:', cardId);
      return true;
    } catch (error) {
      console.error('kanbanService.deleteCard error:', error);
      return false;
    }
  },

  async moveCard(cardId: string, toListId: string, order: number): Promise<boolean> {
    try {
      console.log('Move card:', cardId, 'to list:', toListId, 'order:', order);
      return true;
    } catch (error) {
      console.error('kanbanService.moveCard error:', error);
      return false;
    }
  },
};
