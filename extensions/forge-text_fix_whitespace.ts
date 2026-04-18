/**
 * Forged tool module (Agent Forge) — Normalizes whitespace issues in text files
 * Generated file. Edit carefully; run /reload after changes.
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "text_fix_whitespace",
		label: "text_fix_whitespace",
		description: "Normalizes whitespace issues in text files",
		parameters: Type.Object({
			input: Type.String({ description: "Single text argument for this forged tool" }),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const input = (params as { input: string }).input;
			import { readFile, writeFile } from 'fs/promises'

const execute = async (input: string) => {
  try {
    const filename = input.split(':')[0] || 'input.txt'
    let content = await readFile(filename, 'utf-8')
    
    const fixes = []
    
    // Convert all tab characters to 4 spaces
    content = content.replace(/\t/g, '    ')
    fixes.push('Converted tabs to spaces')
    
    // Remove multiple consecutive spaces (keep max 1 space)
    content = content.replace(/[^\S\n]+/g, ' ')
    fixes.push('Removed excessive spaces between words')
    
    // Normalize Windows line endings to Unix
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    fixes.push('Normalized line endings to Unix style')
    
    // Remove trailing whitespace from each line
    const lines = content.split('\n')
    content = lines.map(line => line.trimEnd()).join('\n')
    fixes.push('Trimmed trailing whitespace from lines')
    
    // Remove excessive blank lines (keep max 2 consecutive newlines)
    content = content.replace(/\n{3,}/g, '\n\n')
    fixes.push('Normalized blank lines')
    
    await writeFile(`${filename}.fixed`, content)
    
    return {
      content: [{
        type: 'text',
        text: `Fixed whitespace issues in ${filename}:\n${fixes.join('\n')}`
      }],
      details: { lines: content.split('\n').length }
    }
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${String(err)}`
      }],
      details: {}
    }
  }
}

export default execute
		},
	});
}
