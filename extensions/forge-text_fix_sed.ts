/**
 * Forged tool module (Agent Forge) — Uses sed to fix common problems in text files (trailing whitespace, missing newlines, etc.)
 * Generated file. Edit carefully; run /reload after changes.
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "text_fix_sed",
		label: "text_fix_sed",
		description: "Uses sed to fix common problems in text files (trailing whitespace, missing newlines, etc.)",
		parameters: Type.Object({
			input: Type.String({ description: "Single text argument for this forged tool" }),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const input = (params as { input: string }).input;
			import { readFile } from 'fs/promises'

const execute = async (input: string) => {
  try {
    const filename = input.split(':')[0] || 'input.txt'
    const fixes = []
    
    // Fix trailing whitespace
    let content = await readFile(filename, 'utf-8')
    if (content.trim().length > 0 && !content.endsWith('\n')) {
      content += '\n'
      fixes.push('Added missing newline at end of file')
    }
    
    // Remove trailing spaces from lines
    const lines = content.split('\n')
    content = lines.map(line => line.replace(/\s+$/, '')).join('\n')
    fixes.push('Removed trailing whitespace from all lines')
    
    // Remove trailing blank lines (but keep at least one newline)
    content = content.replace(/(\n[ \t]*)+$/, '\n')
    fixes.push('Removed excessive trailing blank lines')
    
    // Write back
    await writeFile(`${filename}.fixed`, content)
    
    return {
      content: [{
        type: 'text',
        text: `Fixed ${content.length} bytes in file:\n${fixes.join('\n')}`
      }],
      details: { filename, byteLength: content.length }
    }
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `Error processing file: ${String(err)}`
      }],
      details: {}
    }
  }
}

export default execute
		},
	});
}
