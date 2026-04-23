/**
 * Screen Buffer - Virtual terminal buffer (256x80 characters)
 * Maintains scrollback history and current display
 */

/**
 * Cell represents a single character with attributes
 */
interface Cell {
  char: string;
  fg: string;
  bg: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  blink: boolean;
  invisible: boolean;
}

/**
 * Winsize structure for window resize
 */
interface winsize {
  ws_row: number;
  ws_col: number;
  ws_xpixel: number;
  ws_ypixel: number;
}

/**
 * Screen Buffer maintains a virtual screen
 */
export class ScreenBuffer {
  private width: number = 80;
  private height: number = 24;
  private rows: Cell[][];
  private scrollback: string[];
  private scrollbackMax: number = 1000;
  private cursor: { x: number; y: number };
  private mode: 'normal' | 'alternate' = 'normal';
  private alternateBuffer: Cell[][];

  constructor(width: number = 80, height: number = 24) {
    this.width = width;
    this.height = height;
    this.scrollback = [];
    this.rows = [];
    this.cursor = { x: 0, y: 0 };
    this.alternateBuffer = [];
    
    // Initialize main buffer
    for (let y = 0; y < this.height; y++) {
      this.rows[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.rows[y][x] = {
          char: ' ',
          fg: 'reset',
          bg: 'reset',
          bold: false,
          italic: false,
          underline: false,
          blink: false,
          invisible: false,
        };
      }
    }
    
    // Initialize alternate buffer
    for (let y = 0; y < this.height; y++) {
      this.alternateBuffer[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.alternateBuffer[y][x] = {
          char: ' ',
          fg: 'reset',
          bg: 'reset',
          bold: false,
          italic: false,
          underline: false,
          blink: false,
          invisible: false,
        };
      }
    }
  }

  /**
   * Write text to buffer, handling ANSI escape codes
   */
  write(text: string): void {
    let state = 'normal';
    let sgrParams: { fg?: string; bg?: string; effect?: string } = {};
    
    // Process each character
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      switch (state) {
        case 'normal':
          if (char === 'ESC' || char === '\033') {
            state = 'ESC';
          } else if (char === '\n') {
            // Newline
            this.cursor.y++;
            if (this.cursor.y >= this.height) {
              this.cursor.y = 0;
              this.pushToScrollback();
            }
          } else if (this.cursor.x < this.width) {
            // Insert character at current position
            const cell = this.rows[this.cursor.y][this.cursor.x];
            cell.char = char;
            cell.fg = sgrParams.fg || 'reset';
            cell.bg = sgrParams.bg || 'reset';
            cell.bold = sgrParams.effect === 'bold';
            cell.italic = sgrParams.effect === 'italic';
            this.incrCursor();
          } else if (this.cursor.x === this.width) {
            // Wrap to new line
            this.cursor.y++;
            this.cursor.x = 0;
            this.rows[this.cursor.y][this.cursor.x] = {
              char,
              fg: sgrParams.fg || 'reset',
              bg: sgrParams.bg || 'reset',
              bold: sgrParams.effect === 'bold',
              italic: sgrParams.effect === 'italic',
            };
            this.pushToScrollback();
          }
          break;
          
        case 'ESC':
          if (char === '[') {
            state = 'CSI';
            this.csiParam = [];
          } else if (text[i] === '\0037') {
            // ^_ - Clear line
            this.clearLine();
            state = 'normal';
          } else if (char === 'c') {
            // Clear screen
            this.clearScreen();
            state = 'normal';
          }
          break;
          
        case 'CSI':
          if (/\d/.test(char)) {
            this.csiParam.push(char);
          } else if (char === ';') {
            this.csiParam.push(';');
          } else {
            // Complete CSI sequence
            const sequence = this.csiParam.join('') + char;
            this.processCSI(sequence);
            state = 'normal';
            this.csiParam = [];
          }
          break;
      }
    }
  }

  /**
   * Process CSI sequences
   */
  private processCSI(sequence: string): void {
    switch (sequence) {
      // Cursor movement
      case 'A':
        // Cursor up
        if (this.csiParam) {
          this.cursor.y -= parseInt(this.csiParam, 10) || 1;
          this.moveCursorIntoBuffer();
        }
        break;
      case 'B':
        // Cursor down
        if (this.csiParam) {
          this.cursor.y += parseInt(this.csiParam, 10) || 1;
          this.moveCursorIntoBuffer();
        }
        break;
      case 'C':
        // Cursor forward
        if (this.csiParam) {
          this.cursor.x += parseInt(this.csiParam, 10) || 1;
        }
        break;
      case 'D':
        // Cursor backward
        if (this.csiParam) {
          this.cursor.x -= parseInt(this.csiParam, 10) || 1;
        }
        break;
      // Colors
      case 'm':
        // SGR - General attributes
        if (this.csiParam) {
          const params = this.csiParam.split(';').map(Number) as Array<string | number>;
          const effects: { [key: number]: { fg?: string; bg?: string; effect?: string } } = {
            0: { fg: 'reset', bg: 'reset', effect: 'reset' },
            1: { effect: 'bold' },
            2: { effect: 'dim' },
            3: { effect: 'italic' },
            4: { effect: 'underline' },
            5: { effect: 'blink' },
            7: { effect: 'inverse' },
            8: { effect: 'invis' },
          };
          
          params.forEach((param) => {
            if (param >= 30 || param >= 40) {
              // Set color (simplified for demo)
            }
          });
        }
        break;
    }
  }

  /**
   * Handle ESC[H - Home position
   */
  private handleHomePosition(row: number, col: number): void {
    this.cursor.x = col;
    this.cursor.y = row;
  }

  /**
   * Increment cursor with wraparound
   */
  private incrCursor(): void {
    if (this.cursor.x >= this.width - 1) {
      this.cursor.x = 0;
      if (this.cursor.y >= this.height - 1) {
        this.cursor.y = 0;
        this.pushToScrollback();
      } else {
        this.cursor.y++;
      }
    } else {
      this.cursor.x++;
    }
  }

  /**
   * Move cursor into valid buffer position
   */
  private moveCursorIntoBuffer(): void {
    if (this.cursor.y >= this.height) {
      this.cursor.y = this.height - 1;
    } else if (this.cursor.y < 0) {
      this.pushToScrollback();
      this.cursor.y = 0;
    }
    
    if (this.cursor.x >= this.width) {
      this.cursor.x = this.width - 1;
    } else if (this.cursor.x < 0) {
      this.cursor.x = 0;
    }
  }

  /**
   * Clear current line
   */
  private clearLine(): void {
    if (this.cursor.x >= this.width) return;
    
    // Clear from cursor to end of line
    let index = this.cursor.x;
    while (index < this.width) {
      const cell = this.rows[this.cursor.y][index];
      cell.char = ' ';
      cell.fg = 'reset';
      index++;
    }
  }

  /**
   * Clear entire screen
   */
  private clearScreen(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.rows[y][x] = {
          char: ' ',
          fg: 'reset',
          bg: 'reset',
          bold: false,
          italic: false,
          underline: false,
          blink: false,
          invisible: false,
        };
      }
    }
    
    this.cursor = { x: 0, y: 0 };
  }

  /**
   * Push row to scrollback history
   */
  private pushToScrollback(): void {
    if (this.scrollback.length >= this.scrollbackMax) {
      this.scrollback.shift();
    }
    this.scrollback.push(this.rows);
  }

  /**
   * Switch to alternate buffer (for full-screen apps)
   */
  switchToAlternate(): void {
    this.mode = 'alternate';
  }

  /**
   * Switch back to primary buffer
   */
  switchToPrimary(): void {
    this.mode = 'normal';
  }
}