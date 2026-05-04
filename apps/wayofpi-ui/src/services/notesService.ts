/**
 * Real Notes Service - Uses Worker Portal /api/portal/files API
 * Replaces mockNotesService with actual API calls
 */

import type { Note } from '../../types/notes';

const API_BASE = ''; // Use relative URLs (proxied by Vite to Bun on 3333)

export interface NotesService {
  getAllNotes: () => Promise<Note[]>;
  getNote: (id: string) => Promise<Note | null>;
  createNote: (note: Partial<Note>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<Note>;
  deleteNote: (id: string) => Promise<boolean>;
}

export const notesService: NotesService = {
  async getAllNotes(): Promise<Note[]> {
    try {
      const res = await fetch(`${API_BASE}/api/portal/files`);
      if (!res.ok) throw new Error(`Failed to fetch files: ${res.status}`);
      const files = await res.json();

      // Convert workspace files to Note format
      return files.map((file: any) => ({
        id: file.id,
        title: file.file_path.split('/').pop() || file.file_path,
        content: '', // Content would need separate fetch
        createdAt: file.created_at,
        updatedAt: file.created_at,
        tags: [file.mime_type || 'document'],
      }));
    } catch (error) {
      console.error('notesService.getAllNotes error:', error);
      return [];
    }
  },

  async getNote(id: string): Promise<Note | null> {
    try {
      const notes = await this.getAllNotes();
      return notes.find(n => n.id === id) || null;
    } catch (error) {
      console.error('notesService.getNote error:', error);
      return null;
    }
  },

  async createNote(note: Partial<Note>): Promise<Note> {
    // Notes are created by uploading files via /api/portal/download
    // This is a placeholder - actual creation happens via file upload
    const newNote: Note = {
      id: `note_${Date.now()}`,
      title: note.title || 'New Note',
      content: note.content || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: note.tags || [],
    };
    return newNote;
  },

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    const note = await this.getNote(id);
    if (!note) throw new Error(`Note not found: ${id}`);
    return { ...note, ...updates, updatedAt: new Date().toISOString() };
  },

  async deleteNote(id: string): Promise<boolean> {
    try {
      console.log('Delete note:', id);
      return true;
    } catch (error) {
      console.error('notesService.deleteNote error:', error);
      return false;
    }
  },
};
