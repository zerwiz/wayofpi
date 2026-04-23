/**
 * PTY Manager - Handles pseudo-terminal creation and management
 * This is the core of terminal persistence following tmux/screen architecture
 */

import { spawn, PTY } from 'node:pty';
import { readFileSync } from 'node:fs';

/**
 * PTY Session represents a terminal instance
 */
class PTYS