import { ExtensionAPI } from 'pi-coding-agent';
import * as path from 'path';
import * as fs from 'fs';

export default async function init(api: ExtensionAPI) {
  const AGENTS_MD_PATH = path.join(
    api.config.globalPath,
    '/.pi/AGENTS.md'
  );

  api.tools.register('context-loader', async () => {
    try {
      // Check if AGENTS.md exists
      if (!fs.existsSync(AGENTS_MD_PATH)) {
        return {
          content: null,
          error: 'AGENTS.md not found at global path',
          status: 'error'
        };
      }

      // Read AGENTS.md content
      const agentsContent = fs.readFileSync(AGENTS_MD_PATH, 'utf-8');

      // Return the content for agent context
      return {
        content: agentsContent,
        status: 'success',
        message: 'Context loaded successfully'
      };
    } catch (error) {
      return {
        content: null,
        error: error.message,
        status: 'error'
      };
    }
  });
}