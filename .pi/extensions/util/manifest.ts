/**
 * Extension Manifest & Category Definitions for Way of Pi
 * Helps the pi-loader manage conflicts and stacking rules.
 */

export type ExtensionCategory = 'ui-core' | 'ui-widget' | 'function' | 'utility';

export interface ExtensionManifest {
  name: string;
  category: ExtensionCategory;
  conflicts?: string[];
  description?: string;
}

export const EXTENSION_MANIFEST: Record<string, ExtensionManifest> = {
  // UI Cores (Only one sets the main footer/layout)
  'agent-team': { name: 'Agent Team', category: 'ui-core' },
  'minimal': { name: 'Minimal UI', category: 'ui-core' },
  'pure-focus': { name: 'Pure Focus', category: 'ui-core' },

  // UI Widgets (Stackable - use addWidget/setWidget)
  'subagent-widget': { name: 'Subagent Widget', category: 'ui-widget' },
  'tool-counter-widget': { name: 'Tool Counter Widget', category: 'ui-widget' },
  'session-replay': { name: 'Session Replay', category: 'ui-widget' },
  'purpose-gate': { name: 'Purpose Gate', category: 'ui-widget' },

  // Functions (Background logic & Hooks)
  'damage-control': { name: 'Damage Control', category: 'function' },
  'theme-cycler': { name: 'Theme Cycler', category: 'function' },
  'session-memory': { name: 'Session Memory', category: 'function' },
  'agent-chain': { name: 'Agent Chain', category: 'function' },
  'cross-agent': { name: 'Cross Agent', category: 'function' },
  'tilldone': { name: 'TillDone Tasks', category: 'function' },
  'pi-pi': { name: 'Pi-Pi Meta Agent', category: 'function' },
  'context-loader': { name: 'Context Loader', category: 'function' },
  'rules-lookup': { name: 'Rules Lookup', category: 'function' },
  'rule-errors': { name: 'Rule Errors', category: 'function' },

  // Utilities
  'system-select': { name: 'System Select', category: 'utility' },
  'themeMap': { name: 'Theme Mapper', category: 'utility' },
  'web-tools': { name: 'Web Tools', category: 'utility' },
  'github-management': { name: 'GitHub Management', category: 'utility' },
};
