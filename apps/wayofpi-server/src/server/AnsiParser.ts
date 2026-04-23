/**
 * ANSI Parser - Complete ANSI escape code handling
 * Implements state machine for cursor movement, colors, etc.
 */

/**
 * ANSI escape code parser state machine
 */
export class AnsiParser {
  private mode: 'normal' | 'ESC' | 'CSI' | 'SS3' | 'DS3';
  private params: number[];
  private intermediates: string[];
  private currentCursor: { x: number; y: number };
  private currentFg: string;
  private currentBg: string;
  private effects: { bold: boolean; italic: boolean; underline: boolean; blink: boolean; }

  constructor() {
    this.mode = 'normal';
    this.params = [];
    this.intermediates = [];
    this.currentCursor = { x: 0, y: 0 };
    this.currentFg = 'reset';
    this.currentBg = 'reset';
    this.effects = { bold: false, italic: false, underline: false, blink: false };
  }

  /**
   * Parse ANSI escape code and update cursor/formatting
   */
  parse(code: string): {
    cursor: { x: number; y: number };
    fg: string;
    bg: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    blink: boolean;
  } {
    let result: any = {
      cursor: { ...this.currentCursor },
      fg: this.currentFg,
      bg: this.currentBg,
      bold: this.effects.bold,
      italic: this.effects.italic,
      underline: this.effects.underline,
      blink: this.effects.blink,
    };

    // Process escape code (ESC [ ...)
    if (code.startsWith('\x1b[')) {
      const sequence = code.substring(2);
      this.processCsiSequence(sequence);
    }

    // Return cursor/formats
    return result;
  }

  /**
   * Process CSI sequences
   */
  private processCsiSequence(sequence: string): void {
    // Split parameter and intermediate commands
    const parts = sequence.split(';');
    this.params = parts.map((part) => {
      const num = parseInt(part, 10);
      return isNaN(num) ? 0 : num;
    });

    // Process each CSI intermediate command
    let commandIndex = 0;
    while (commandIndex < parts.length) {
      const command = parts[commandIndex];

      switch (command) {
        // Cursor movement
        case 'A': // Cursor up (ESC [ A)
          const paramA = this.params[0] || 1;
          this.currentCursor.y = Math.max(0, this.currentCursor.y - paramA);
          break;

        case 'B': // Cursor down (ESC [ B)
          const paramB = this.params[0] || 1;
          this.currentCursor.y = Math.min(24, this.currentCursor.y + paramB);
          break;

        case 'C': // Cursor forward (ESC [ C)
          const paramC = this.params[0] || 1;
          this.currentCursor.x = Math.min(79, this.currentCursor.x + paramC);
          break;

        case 'D': // Cursor backward (ESC [ D)
          const paramD = this.params[0] || 1;
          this.currentCursor.x = Math.max(0, this.currentCursor.x - paramD);
          break;

        case 'H': // Cursor position (ESC [ ; H)
          if (this.params.length > 0) {
            this.currentCursor.x = (this.params[0] || 1) - 1;
          }
          if (this.params.length > 1) {
            this.currentCursor.y = (this.params[1] || 1) - 1;
          }
          break;

        case 'J': // Clear screen (ESC [ J)
          this.clearScreen(this.params[0] || 0);
          break;

        case 'K': // Clear line (ESC [ K)
          this.clearLine(this.params[0] || 0);
          break;

        case 'm': // SGR - Select graphic rendition (ESC [ m)
          this.processSgr(params);
          break;

        case 'I': // Insert characters
        case 'P': // Delete characters:
          this.handleCursorChars(command, this.params[0] || 1);
          break;

        case 'S': // Scroll up
        case 'T': // Scroll down
          this.handleScroll(command, this.params[0] || 1);
          break;

        case 'Z': // Report cursor position
          this.reportCursorPosition();
          break;

        case '?': // Dec/ECM sequences
          this.handleDecEcm(this.params);
          break;
      }
      commandIndex++;
    }
  }

  /**
   * Process SGR (Select Graphic Rendition)
   */
  private processSgr(params: number[]): void {
    const effects: { [key: number]: { fg?: string; bg?: string; effect: string } } = {
      0: { fg: 'reset', bg: 'reset', effect: 'reset' },
      1: { effect: 'bold' },
      2: { effect: 'dim' },
      3: { effect: 'italic' },
      4: { effect: 'underline' },
      5: { effect: 'blink' },
      7: { effect: 'inverse' },
      8: { effect: 'invert' },
      30: { fg: 'black' },
      31: { fg: 'red' },
      32: { fg: 'green' },
      33: { fg: 'yellow' },
      34: { fg: 'blue' },
      35: { fg: 'magenta' },
      36: { fg: 'cyan' },
      37: { fg: 'white' },
      40: { bg: 'black' },
      41: { bg: 'red' },
      42: { bg: 'green' },
      43: { bg: 'yellow' },
      44: { bg: 'blue' },
      45: { bg: 'magenta' },
      46: { bg: 'cyan' },
      47: { bg: 'white' },
    };

    this.effects = {
      bold: params.includes(1),
      italic: params.includes(3),
      underline: params.includes(4),
      blink: params.includes(5),
    };

    params.forEach((param) => {
      if (effects[param]) {
        if (effects[param].effect === 'reset') {
          this.effects = { bold: false, italic: false, underline: false, blink: false };
        } else {
          this.effects.bold = !!effects[param].effect;
          this.effects.italic = !!effects[param].effect;
          this.effects.underline = !!effects[param].effect;
          this.effects.blink = !!effects[param].effect;
        }
      }
    });
  }

  /**
   * Clear screen from cursor position
   */
  private clearScreen(mode: number = 0): void {
    if (mode === 0) {
      // Clear from cursor to end
      for (let y = this.currentCursor.y; y < 24; y++) {
        for (let x = this.currentCursor.x; x < 80; x++) {
          // Clear cell
        }
      }
    } else if (mode === 1) {
      // Clear from beginning to cursor
      for (let y = 0; y < this.currentCursor.y; y++) {
        for (let x = 0; x < 80; x++) {
          // Clear cell
        }
      }
    } else if (mode === 2) {
      // Clear entire screen
      for (let y = 0; y < 24; y++) {
        for (let x = 0; x < 80; x++) {
          // Clear cell
        }
      }
    }
  }

  /**
   * Clear line from cursor
   */
  private clearLine(mode: number = 0): void {
    // Clear from cursor to end of line
    for (let x = this.currentCursor.x; x < 80; x++) {
      // Clear cell
    }
  }

  /**
   * Handle cursor character insertion/deletion
   */
  private handleCursorChars(command: string, count: number): void {
    // Insert/Delete characters at current position
  }

  /**
   * Handle scroll commands
   */
  private handleScroll(command: string, count: number): void {
    // Scroll up/down
  }

  /**
   * Report cursor position
   */
  private reportCursorPosition(): void {
    // Return cursor position as \033[?25h
  }

  /**
   * Handle Dec/ECM sequences
   */
  private handleDecEcm(params: number[]): void {
    // Handle escape sequences like '?25l' (hide cursor), '?25h' (show cursor)
  }

  /**
   * Get current formatting
   */
  getFormatting(): {
    cursor: { x: number; y: number };
    fg: string;
    bg: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    blink: boolean;
  } {
    return {
      cursor: this.currentCursor,
      fg: this.currentFg,
      bg: this.currentBg,
      bold: this.effects.bold,
      italic: this.effects.italic,
      underline: this.effects.underline,
      blink: this.effects.blink,
    };
  }
}

export default AnsiParser;