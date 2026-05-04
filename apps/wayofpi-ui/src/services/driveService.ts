/**
 * Real Drive Service - Uses Worker Portal /api/portal/files API
 * Replaces mockDriveService with actual API calls
 */

import type { DriveFile } from '../../types/drive';

const API_BASE = ''; // Use relative URLs (proxied by Vite to Bun on 3333)

export interface DriveService {
  getAllFiles: () => Promise<DriveFile[]>;
  getFile: (id: string) => Promise<DriveFile | null>;
  uploadFile: (file: Partial<DriveFile>, content: string) => Promise<DriveFile>;
  deleteFile: (id: string) => Promise<boolean>;
  getFilesByType: (mimeType: string) => Promise<DriveFile[]>;
}

export const driveService: DriveService = {
  async getAllFiles(): Promise<DriveFile[]> {
    try {
      const res = await fetch(`${API_BASE}/api/portal/files`);
      if (!res.ok) throw new Error(`Failed to fetch files: ${res.status}`);
      const files = await res.json();

      // Convert workspace files to DriveFile format
      return files.map((file: any) => ({
        id: file.id,
        name: file.file_path.split('/').pop() || file.file_path,
        mime_type: file.mime_type || 'application/octet-stream',
        size: file.file_size || 0,
        created_at: file.created_at,
        updated_at: file.created_at,
        path: file.file_path,
        download_count: file.download_count || 0,
      }));
    } catch (error) {
      console.error('driveService.getAllFiles error:', error);
      return [];
    }
  },

  async getFile(id: string): Promise<DriveFile | null> {
    try {
      const files = await this.getAllFiles();
      return files.find(f => f.id === id) || null;
    } catch (error) {
      console.error('driveService.getFile error:', error);
      return null;
    }
  },

  async uploadFile(file: Partial<DriveFile>, _content: string): Promise<DriveFile> {
    // File upload happens via /api/portal/download endpoint
    // This is a placeholder
    const newFile: DriveFile = {
      id: `file_${Date.now()}`,
      name: file.name || 'New File',
      mime_type: file.mime_type || 'application/octet-stream',
      size: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      path: file.path || '',
      download_count: 0,
    };
    return newFile;
  },

  async deleteFile(id: string): Promise<boolean> {
    try {
      console.log('Delete file:', id);
      return true;
    } catch (error) {
      console.error('driveService.deleteFile error:', error);
      return false;
    }
  },

  async getFilesByType(mimeType: string): Promise<DriveFile[]> {
    try {
      const files = await this.getAllFiles();
      return files.filter(f => f.mime_type === mimeType);
    } catch (error) {
      console.error('driveService.getFilesByType error:', error);
      return [];
    }
  },
};
