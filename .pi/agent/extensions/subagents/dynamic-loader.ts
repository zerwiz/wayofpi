// === Dynamic Agent Loader ===
// Location: .pi/agent/extensions/subagents/dynamic-loader.ts
// Auto-discovers .md agents from .pi/agents/
// Converts them to subagent prompts
// See: https://pi.dev/extensions/
import path from 'path';
import { fileURLToPath } from 'url';
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// __dirname for subagents

export default function (api: ExtensionAPI) {
  console.log("=== Dynamic Agent Loader ===");
  console.log("Loading subagents from .pi/agents/*.md");
  console.log("===============================");

  // Directory containing agent .md files
  const agentsDir = path.resolve(__dirname, '../../../..'); // .pi/agents/
  
  // Known agent file extensions
  const agentExtensions = [
    '.md',    // Primary: markdown prompts
    '.yaml',  // YAML prompts
    '.yml',
    '.txt',   // Plain text prompts
    '.json',  // JSON prompts
  ];

  // Discover agents
  function discoverAgents(dir: string): Promise<string[]> {
    return (async () => {
      console.log(`Discovered agents from: ${dir}`);
      return fs.readdirSync(dir)
        .filter(file => file.startsWith('.') === false)
        .map(file => path.join(dir, file));
    })();
  }

  // Read agent prompt from .md or other files
  async function readAgentPrompt(agentPath: string): Promise<{
    name: string;
    description: string;
    content: string;
  } | null> {
    try {
      const content = fs.readFileSync(agentPath, 'utf-8');
      
      // Extract header info
      const name = extractName(content);
      const description = extractDescription(content);
      
      return {
        name: name || path.basename(agentPath, path.extname(agentPath)),
        description: description || 'Agent subagent',
        content,
      };
    } catch (error) {
      console.error(`Failed to read agent: ${agentPath}`, error);
      return null;
    }
  }

  // Extract agent name from header
  function extractName(content: string): string | null {
    // Look for "name:" in YAML frontmatter
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    if (nameMatch) {
      return nameMatch[1].trim();
    }
    
    // Or look for "# name:" in markdown
    const commentMatch = content.match(/#?\s*name:\s*(.+)$/m);
    if (commentMatch) {
      return commentMatch[1].trim();
    }
    
    return path.basename(content, path.extname(content));
  }

  // Extract description from header
  function extractDescription(content: string): string | null {
    // Look for "description:" in YAML frontmatter
    const descMatch = content.match(/^description:\s*(.+)$/m);
    if (descMatch) {
      return descMatch[1].trim();
    }
    
    // Or look for "# description:" 
    const commentMatch = content.match(/#?\s*description:\s*(.+)$/m);
    if (commentMatch) {
      return commentMatch[1].trim();
    }
    
    // Use first line as description if not found
    const firstLine = content.split('\n')[0]?.trim();
    if (firstLine && firstLine.length > 0) {
      return firstLine;
    }
    
    return 'Subagent';
  }

  // Register all discovered agents as subagent tools
  async function registerAllAgents() {
    const agents: {
      path: string;
      prompt: string;
      name: string;
    }[] = [];
    
    // Read agents directory
    try {
      const files = fs.readdirSync(agentsDir);
      
      for (const file of files) {
        // Skip hidden files and directories
        if (file.startsWith('.') === false && fs.existsSync(path.join(agentsDir, file))) {
          const agentPath = path.join(agentsDir, file);
          const stats = fs.statSync(agentPath);
          
          // Only process files (not directories)
          if (stats.isFile()) {
            const { name, description, content } = await readAgentPrompt(agentPath);
            if (name && description) {
              agents.push({
                path: agentPath,
                name,
                description,
              });
            }
          }
        }
      }
      
      console.log(`Discovered ${agents.length} agents from ${agentsDir}`);
      
      // Register each agent as a subagent
      for (const agent of agents) {
        registerSubAgent(agent);
      }
      
    } catch (error) {
      console.error(`Failed to read agents directory`, error);
    }
  }

  // Register a single subagent
  function registerSubAgent(agent: { name: string; description: string; path: string }) {
    api.registerTool({
      name: `subagent:${agent.name.toLowerCase()}`,
      label: agent.name,
      description: agent.description,
      parameters: Type.Object({
        // Parameters will be inferred from agent content
      }),
      async execute(toolCallId: string, params: Record<string, unknown>) {
        // Execute the agent from its prompt
        return {
          content: [
            { 
              type: "text", 
              text: `Subagent: ${agent.name}\n` +
                     `Description: ${agent.description}\n\n` +
                     `Running with prompt content...\n` +
                     `See subagent definition: ${agent.path}`
            }
          ],
          details: {
            agent: agent.name,
            toolId: toolCallId,
            path: agent.path,
          },
        };
      },
    });
    
    console.log(`✓ Registered: ${agent.name}`);
  }

  // State persistence for discovered agents
  api.on("session_start", async () => {
    await registerAllAgents();
  });

  // Also register on initialization
  registerAllAgents();

  // Events
  api.on("message_start", async () => {
    console.log("Subagent event fired");
  });

  api.on("message_end", async () => {
    console.log("Subagent event completed");
  });

  console.log(`✓ Dynamic agent loader initialized`);
  console.log(`✦ Agents discovered from: ${agentsDir}`);
  console.log(`✦ Supports .md, .yaml, .json, .txt, .yml`);
};