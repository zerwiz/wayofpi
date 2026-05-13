import type { ExtensionAPI } from '@pi/sdk';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

/**
 * Extension: Rules Lookup
 * Provides the agent with tools to read the Pi developer rules
 * for compliance checking when building new extensions, skills,
 * or modifying system configuration.
 */
export default async function init(api: ExtensionAPI) {
  // Get rules directory paths
  const globalRulesPath = path.join(os.homedir(), '.pi', 'rules');
  const localRulesPath = path.join(process.cwd(), '.pi', 'rules');

  // Create rules lookup service
  const rulesService = {
    getLocalPath: (baseDir: string, filename: string) => {
      const filePath = path.join(baseDir, filename);
      
      // Try local first, then global
      return [filePath, path.join(globalRulesPath, filename)].find(f => fs.existsSync(f));
    },

    listRules: async (): Promise<{ success: false; error: string } | { success: true; rules: Array<{ filename: string; location: 'global' | 'workspace' }> }> => {
      try {
        const results: Array<{ filename: string; location: 'global' | 'workspace' }> = [];

        for (const rPath of [globalRulesPath, localRulesPath]) {
          try {
            if (fs.existsSync(rPath)) {
              const files = await fs.readdir(rPath);
              results.push(
                ...files
                  .filter((f) => f.endsWith('.md') && !f.startsWith('node_modules'))
                  .map((f) => ({
                    filename: f,
                    location: rPath.startsWith(os.homedir()) ? 'global' : 'workspace'
                  }))
              );
            }
          } catch {
            // Directory might not exist, continue
          }
        }

        if (results.length === 0) {
          return {
            success: false,
            error: 'No rule documents found in ~/.pi/rules/ or ./.pi/rules/',
          };
        }

        return { success: true, rules: results };
      } catch (error) {
        return {
          success: false,
          error: `Failed to list rules: ${String(error)}`,
        };
      }
    },

    getRuleContent: async <T extends { filename?: string; location?: 'global' | 'workspace' }>(args: T): Promise<{ success: false; error: string } | { success: true; content: string }> => {
      try {
        const baseDir = args.location === 'workspace' ? localRulesPath : globalRulesPath;
        const files: string[] = [
          ...[baseDir, path.join(baseDir, '.pi/rules')].filter(dir => fs.existsSync(dir)),
        ];

        for (const dir of files) {
          const relativePath = path.join(baseDir, args.filename);
          if (fs.existsSync(relativePath)) {
            const content = await fs.readFile(relativePath, 'utf-8');
            
            // Truncate if very large
            const safeContent =
              content.length > 10000
                ? content.substring(0, 10000) + '\n\n... [Truncated]'
                : content;

            return { success: true, content: safeContent };
          }
        }

        return {
          success: false,
          error: `Rule file not found: ${args.filename || 'unknown'}`,
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to read rule: ${String(error)}`,
        };
      }
    },
  };

  // Register list tool
  api.registerTool({
    name: 'list_developer_rules',
    description: 'Lists all available developer rule documents and specifications.',
    schema: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => {
      return await rulesService.listRules();
    },
  });

  // Register content tool
  api.registerTool({
    name: 'get_rule_content',
    description: 'Reads the content of a specific rule document.',
    schema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Name of rule file to read',
        },
        location: {
          type: 'string',
          enum: ['global', 'workspace'],
          description: 'Whether to look in global or workspace rules folder',
        },
      },
      required: ['filename'],
    },
    execute: async (args: any) => {
      return await rulesService.getRuleContent(args);
    },
  });

  // Cleanup on deactivation
  return () => {};
}