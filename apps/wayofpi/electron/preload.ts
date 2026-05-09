import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  async sendMessage(channel: string, data?: any): Promise<any> {
    return ipcRenderer.send(channel, data);
  },
  async receiveMessage<T>(channel: string, data?: any): Promise<T> {
    return ipcRenderer.recv(channel, data);
  },
});
