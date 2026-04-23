```/home/zerwiz/CodeP/Way of pi/apps/wayofpi-server/src/ScreenBuffer.js# Screen Buffer - Virtual terminal buffer (256x80 characters)
# Maintains scrollback history and current display

class ScreenBuffer {
  constructor(width = 80, height = 25) {
    this.width = width;
    this.height = height;
    this.rows = [];

    // Initialize buffer
    for (let y = 0; y < height; y++) {
      this.rows[y] = [];
      for (let x = 0; x < width; x++) {
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

    // Scrollback buffer (last 1000 lines)
    this.scrollback = [];
    this.scrollbackMax = 1000;

    // Cursor position
    this.cursor = {
      x: 0,
      y: 0,
    };
  }

  /**
   * Parse ANSI escape codes and update buffer
   */
  parseAnsiEscape(text) {
    let state = 'normal';
    let currentFg = 'reset';
    let currentBg = 'reset';
    let currentCursor = { x: 0, y: 0 };

    // Process each character
    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === 'C') {
        // Cursor forward (ESC[<n>C)
        currentCursor.x += parseInt(match(1));
        this.moveCursor();
      } else if (char === 'A') {
        // Cursor up (ESC[<n>A)
        currentCursor.y -= parseInt(match(1));
        this.moveCursor();
      } else if (char === 'B') {
        // Cursor down (ESC[<n>B)
        currentCursor.y += parseInt(match(1));
        this.moveCursor();
      } else if (char === 'D') {
        // Cursor backward (ESC[<n>D)
        currentCursor.x -= parseInt(match(1));
        this.moveCursor();
      } else if (char === 'm') {
        // SGR: Set general attributes
        state = 'normal';
      } else if (char === 'H') {
        // HP: Set cursor position (ESC[<row>;<col>H)
        this.setCursor(currentRow, currentCol);
      }

      // Update current row with character
      if (state === 'normal') {
        this.rows[currentCursor.y][currentCursor.x] = {
          char,
          fg: currentFg,
          bg: currentBg,
        };
      }
    }

    return text;
  }

  moveCursor() {
    // Handle cursor movement with scrollback
    if (this.cursor.y < 0 || this.cursor.y >= this.height) {
      // Handle scrollback logic
    }
  }

  moveCursor() {
    if (this.cursor.y < 0) {
      this.scrollback.shift();
      this.cursor.y = 0;
    }

    if (this.cursor.x >= this.width) {
      this.rows[this.cursor.y].push({ char: ' ', fg: 'reset' });
      this.rows[this.cursor.y].pop();
      this.cursor.x = this.width - 1;
    }
  }
}

// ES module export
export default ScreenBuffer;
ENDOFFILE
