/**
 * Hermes Terminal Page Types
 *
 * Type definitions for Hermes UI components.
 * Used by HermesPage, HermesTerminalView, and HermesFileBrowser.
 *
 * @packageDocumentation
 */

import type { Dispatch, SetStateAction } from "react"

/**
 * Terminal command suggestion for quick-access commands panel
 */
export interface TerminalCommand {
  /** Command display name */
  name: string
  /** Command description */
  desc: string
  /** Executable command string */
  command: string
  /** Optional keyboard shortcut */
  shortcut?: string
}

/**
 * Command history entry for terminal view
 */
export interface CommandHistoryEntry {
  /** Command executed */
  cmd: string
  /** Command output */
  output: string
  /** When command was executed */
  timestamp: Date
  /** Whether command succeeded */
  success: boolean
  /** Error message if failed */
  error?: string
}

/**
 * File system node type for file browser
 */
export interface HermesFileNode {
  /** Node name */
  name: string
  /** File system path */
  path: string
  /** Node type: file, directory, or executable */
  type: "file" | "directory" | "executable" | "symbolic-link"
  /** File size in bytes (for files) */
  size?: number
  /** Modification timestamp (for files) */
  mtime?: Date
  /** Whether item is selected */
  selected: boolean
  /** Whether item is expanded (for directories) */
  expanded?: boolean
  /** Permission bits (for directories) */
  permissions?: string
  /** File icon or emoji */
  icon?: string
}

/**
 * File browser state
 */
export interface HermesFileBrowserState {
  /** Current directory path */
  currentPath: string
  /** Selected file or directory */
  selection: HermesFileNode | null
  /** All nodes in current directory */
  nodes: HermesFileNode[]
  /** Search query string */
  searchQuery: string
  /** Whether search is active */
  searching: boolean
  /** Breadcrumb path segments */
  breadcrumbs: Array<{ name: string; path: string }
>
}

/**
 * Hermes page props
 */
export interface HermesPageProps {
  /** Path to Hermes installation directory */
  hermesPath: string
  /** Callback when command is executed */
  onCommandExecuted?: (command: string, output: string) => void
  /** Initial quick-access commands */
  initialCommands?: TerminalCommand[]
  /** File browser state (optional, for controlled mode) */
  fileBrowserState?: HermesFileBrowserState
  /** Set file browser state (optional) */
  onFileBrowserStateChange?: Dispatch<SetStateAction<HermesFileBrowserState>>
}

/**
 * Hermes terminal view props
 */
export interface HermesTerminalViewProps {
  /** Command history entries */
  commands: CommandHistoryEntry[]
  /** Function to execute commands */
  onCommandSubmit: (command: string) => Promise<string>
  /** Quick-access command suggestions */
  initialCommands: TerminalCommand[]
  /** Path to Hermes installation */
  hermesPath: string
}

/**
 * Command execution result
 */
export interface CommandResult {
  /** Exit code */
  exitCode: number
  /** Standard output */
  stdout: string
  /** Standard error */
  stderr: string
  /** Execution duration in milliseconds */
  duration: number
  /** Whether command succeeded */
  success: boolean
}

/**
 * Hermes configuration options
 */
export interface HermesConfig {
  /** Hermes CLI path */
  cliPath: string
  /** Home directory */
  hermesHome: string
  /** Virtual environment path */
  venvPath: string
  /** Honcho base URL */
  honchoBaseUrl: string
  /** Model provider */
  modelProvider: string
  /** Model name */
  modelName: string
  /** Enable streaming */
  streamingEnabled: boolean
  /** Max context tokens */
  maxContextTokens: number
}

/**
 * Tool execution request
 */
export interface ToolExecutionRequest {
  /** Tool name */
  toolName: string
  /** Tool arguments */
  arguments: Record<string, unknown>
  /** Whether to wait for tool to complete */
  waitForCompletion: boolean
  /** Timeout in milliseconds */
  timeout?: number
}

/**
 * Tool execution response
 */
export interface ToolExecutionResponse {
  /** Tool name */
  toolName: string
  /** Tool output */
  output: string
  /** Error message if failed */
  error?: string
  /** Whether execution was successful */
  success: boolean
}

/**
 * Session state for Hermes
 */
export interface HermesSessionState {
  /** Session ID */
  sessionId: string
  /** Session name */
  name: string
  /** When session started */
  createdAt: Date
  /** When session last accessed */
  lastAccessed: Date
  /** Current working directory */
  cwd: string
  /** Whether session is running */
  running: boolean
  /** Current prompt */
  prompt: string
  /** History of commands */
  history: string[]
  /** User profile */
  profile: string
}
