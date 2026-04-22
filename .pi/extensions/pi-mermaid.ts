/**
 * @requires @mariozechner/pi-coding-agent v0.9.0+
 * @description: Provides mermaid.js diagram rendering via Pi's markdown tools
 * @url: https://npm.dev.io/mermaid
 * @category: graphics
 */
export default function(pi) {
  /**
   * Create a mermaid diagram with the given code
   * Pi renders mermaid code as markdown code blocks
   */
  pi.registerTool({
    name: 'createMermaidDiagram',
    description: 'Create mermaid.js diagram (flowcharts, sequence diagrams, graphs) - Pi renders via markdown tools',
    params: {
      diagram: {
        desc: 'Mermaid.js code for the diagram to render',
        type: 'string',
        required: true
      }
    },
    async exec(params) {
      // Wrap mermaid code in markdown code block
      const markdown = '```mermaid\n' + params.diagram + '\n```';
      
      // Render via Pi's markdown tools
      return await pi.registerMarkdown(markdown, {
        markdown: true,
        code: markdown
      });
    }
  });

  /**
   * Helper function for quick diagram creation
   */
  pi.registerTool({
    name: 'flowDiagram',
    description: 'Create a flow chart diagram using mermaid flowchart syntax',
    params: {
      steps: {
        desc: 'Array of objects with id, label, and optional description',
        type: 'array',
        required: false
      }
    },
    async exec(params) {
      const flow = params.steps || [];
      let graph = 'graph TD\n';
      
      flow.forEach((step, idx) => {
        const id = step.id || `step${idx}`;
        const label = step.label;
        const desc = step.description ? `\n    ${id}{{${label}<br>${step.description}}}` : `\n    ${id}[${label}]`;
        graph += desc;
      });
      
      // Add default connections
      if (flow.length > 1) {
        for (let i = 0; i < flow.length - 1; i++) {
          graph += `\n    ${flow[i].id || `step${i}`}-->${flow[i+1].id || `step${i+1}`}`;
        }
      }
      
      return await pi.createMermaidDiagram({ diagram: graph });
    }
  });

  /**
   * Quick sequence diagram helper
   */
  pi.registerTool({
    name: 'sequenceDiagram',
    description: 'Create a sequence diagram using mermaid sequence syntax',
    params: {
      actors: {
        desc: 'Array of actor names',
        type: 'array',
        required: true
      },
      messages: {
        desc: 'Array of message objects with from, to, and content',
        type: 'array',
        required: false
      }
    },
    async exec(params) {
      const actors = params.actors || [];
      const messages = params.messages || [];
      let mermaid = `sequenceDiagram\n`;
      
      // Add actor boxes
      actors.forEach(actor => {
        mermaid += `autonumber\n`;
        mermaid += `participant ${actor} as ${actor.toLowerCase()}\n`;
      });
      
      // Add messages
      messages.forEach(msg => {
        const from = msg.from || actors[0];
        const to = msg.to || actors[1] || (actors[0] === actors[1] ? actors[0] : actors[0]);
        const content = msg.content || `Message`;
        const arrow = (msg.direction === 'left' || msg.type === 'reply') ? '<--' : '-->';
        mermaid += `${arrow} ${to}-[${content}]\n`;
      });
      
      return await pi.createMermaidDiagram({ diagram: mermaid });
    }
  });

  /**
   * Quick class diagram helper
   */
  pi.registerTool({
    name: 'classDiagram',
    description: 'Create a class diagram using mermaid class syntax',
    params: {
      classes: {
        desc: 'Array of class objects with name and properties/methods',
        type: 'array',
        required: true
      },
      relationships: {
        desc: 'Array of relationship objects with from, to, and type',
        type: 'array',
        required: false
      }
    },
    async exec(params) {
      const classes = params.classes || [];
      const relationships = params.relationships || [];
      let mermaid = 'classDiagram\n';
      
      // Add classes
      classes.forEach(cls => {
        const name = cls.name || `Class`;
        const props = cls.properties || [];
        const methods = cls.methods || [];
        
        // Build class block
        let classDef = `${name} {\n`;
        
        // Properties
        props.forEach(prop => {
          classDef += `    +${prop.description || ''} ${prop}\n`;
        });
        
        // Methods
        methods.forEach(method => {
          const params = method.params ? `(${method.params})` : '';
          const ret = method.return ? ` -> ${method.return}` : '';
          classDef += `    +${method.description || ''}${method.method || 'method'}${params}${ret}\n`;
        });
        
        classDef += `}`;
        mermaid += classDef + '\n';
      });
      
      // Relationships
      relationships.forEach(rel => {
        const from = rel.from || classes[0]?.name;
        const to = rel.to || classes[1]?.name;
        const type = rel.type || 'ref';
        mermaid += `    ${from}[${rel.from}] o-- ${to}[${rel.to}] : ${type}\n`;
      });
      
      return await pi.createMermaidDiagram({ diagram: mermaid });
    }
  });

  return {};
}
