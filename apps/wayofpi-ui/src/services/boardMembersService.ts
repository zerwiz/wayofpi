/**
 * Real Board Members Service - Uses /api/admin/users API
 * Replaces mockKanbanService for team/worker roster
 */

import type { BoardMember } from '../../../types/kanban';

const API_BASE = ''; // Use relative URLs (proxied by Vite to Bun on 3333)

export interface BoardMembersService {
  getMembers: (boardId: string) => Promise<BoardMember[]>;
  addMember: (boardId: string, member: Partial<BoardMember>) => Promise<BoardMember>;
  removeMember: (boardId: string, memberId: string) => Promise<boolean>;
  updateMemberRole: (boardId: string, memberId: string, role: string) => Promise<boolean>;
}

export const kanbanService: BoardMembersService = {
  async getMembers(_boardId: string): Promise<BoardMember[]> {
    try {
      // Fetch users from admin API (or use tenant users)
      const res = await fetch(`${API_BASE}/api/admin/users`);
      if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
      const users = await res.json();

      // Convert users to BoardMember format
      return users.map((user: any) => ({
        id: user.id,
        name: user.full_name || user.username,
        email: user.email || '',
        role: user.role === 'WORKER' ? 'member' : 'admin',
        avatar: undefined,
        isActive: user.active === 1,
        lastActive: user.last_login || user.created_at,
      }));
    } catch (error) {
      console.error('kanbanService.getMembers error:', error);
      return [];
    }
  },

  async addMember(_boardId: string, member: Partial<BoardMember>): Promise<BoardMember> {
    // Adding members would be done via admin API
    // This is a placeholder
    const newMember: BoardMember = {
      id: `member_${Date.now()}`,
      name: member.name || 'New Member',
      email: member.email || '',
      role: member.role || 'member',
      avatar: undefined,
      isActive: true,
      lastActive: new Date().toISOString(),
    };
    return newMember;
  },

  async removeMember(_boardId: string, memberId: string): Promise<boolean> {
    try {
      console.log('Remove member:', memberId);
      return true;
    } catch (error) {
      console.error('kanbanService.removeMember error:', error);
      return false;
    }
  },

  async updateMemberRole(_boardId: string, memberId: string, role: string): Promise<boolean> {
    try {
      console.log('Update member role:', memberId, 'to', role);
      return true;
    } catch (error) {
      console.error('kanbanService.updateMemberRole error:', error);
      return false;
    }
  },
};
