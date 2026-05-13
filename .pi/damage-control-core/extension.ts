import { FileIO } from './file-system';

export interface ExtensionContext {
  readonly path: string;
  
  async readFile(path: string): Promise<string>;
  async writeFile(path: string, content: string): Promise<void>;
  async deleteFile(path: string): Promise<void>;
  
  readonly extensionPath: string;
}

export abstract class Extension {
  private context: ExtensionContext;

  static readonly EXTENSION_TYPES: ExtensionType[] = [
    ExtensionType.LANGUAJE,
    ExtensionType.PREVIEW,
    ExtensionType.RULES
  ];

  constructor() {
    this.context = {
      extensionPath: this.resolveExtensionContextPath(this.context.extensionPath),
      get path() { return this.resolveExtensionContextPath(this.context.extensionPath); },
      async readFile(path: string): Promise<string> { 
        return await FileIO.readFile(this.resolveExtensionContextPath(path)); 
      },
      async writeFile(path: string, content: string): Promise<void> { 
        await FileIO.writeFile(this.resolveExtensionContextPath(path), content); 
      },
      async deleteFile(path: string): Promise<void> { 
        await FileIO.deleteFile(this.resolveExtensionContextPath(path)); 
      },
    };
  }

  get context(): ExtensionContext {
    return this.context;
  }

  protected resolveExtensionContextPath(path: string): string {
    return path.replace(/\.pi\/$/, '').replace(/^\.\//, '');
  }

  async init(): Promise<void> {
    await this.initialize();
  }

  async close(): Promise<void> {
    // Cleanup if needed
  }

  async execute(command: string, args: string[] = []): Promise<{
    success: boolean;
    output?: string;
    error?: string;
    blocked?: boolean;
    blockReason?: string;
  }> {
    try {
      // This is a placeholder - actual execution would depend on implementation
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  abstract initialize(): Promise<void>;
}

export const extensionTypes: ExtensionType[] = [
  ExtensionType.LANGUAJE,
  ExtensionType.PREVIEW,
  ExtensionType.RULES
];