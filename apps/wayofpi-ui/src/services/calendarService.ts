/**
 * Real Calendar Service - Placeholder for calendar events
 * Uses Worker Portal APIs or returns empty for now
 */

import type { CalendarEvent } from '../../types/calendar';

const API_BASE = ''; // Use relative URLs (proxied by Vite to Bun on 3333)

export interface CalendarService {
  getAllEvents: () => Promise<CalendarEvent[]>;
  getEvent: (id: string) => Promise<CalendarEvent | null>;
  createEvent: (event: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  deleteEvent: (id: string) => Promise<boolean>;
  getEventsByDateRange: (start: string, end: string) => Promise<CalendarEvent[]>;
}

export const calendarService: CalendarService = {
  async getAllEvents(): Promise<CalendarEvent[]> {
    try {
      // No dedicated calendar API yet - return empty or use tasks with due dates
      return [];
    } catch (error) {
      console.error('calendarService.getAllEvents error:', error);
      return [];
    }
  },

  async getEvent(id: string): Promise<CalendarEvent | null> {
    try {
      const events = await this.getAllEvents();
      return events.find(e => e.id === id) || null;
    } catch (error) {
      console.error('calendarService.getEvent error:', error);
      return null;
    }
  },

  async createEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      id: `event_${Date.now()}`,
      title: event.title || 'New Event',
      start_time: event.start_time || new Date().toISOString(),
      end_time: event.end_time || new Date().toISOString(),
      description: event.description || '',
      created_at: new Date().toISOString(),
    };
    return newEvent;
  },

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const event = await this.getEvent(id);
      if (!event) throw new Error(`Event not found: ${id}`);
      return { ...event, ...updates };
    } catch (error) {
      console.error('calendarService.updateEvent error:', error);
      throw error;
    }
  },

  async deleteEvent(id: string): Promise<boolean> {
    try {
      console.log('Delete event:', id);
      return true;
    } catch (error) {
      console.error('calendarService.deleteEvent error:', error);
      return false;
    }
  },

  async getEventsByDateRange(_start: string, _end: string): Promise<CalendarEvent[]> {
    try {
      const events = await this.getAllEvents();
      // Filter by date range (simplified)
      return events;
    } catch (error) {
      console.error('calendarService.getEventsByDateRange error:', error);
      return [];
    }
  },
};
