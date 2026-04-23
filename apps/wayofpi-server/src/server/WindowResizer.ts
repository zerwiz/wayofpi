/**
 * Window Resizer - Handles PTY window resize events
 * Implements ioctl(fd, TIOCSWINSZ, &winsize)
 */

/**
 * Winsize structure for ioctl calls
 */
export class WindowResizer {
  private winsize: {
    ws_row: number;
    ws_col: number;
    ws_xpixel: number;
    ws_ypixel: number;
  } = {
    ws_row: 24,
    ws_col: 80,
    ws_xpixel: 0,
    ws_ypixel: 0,
  };

  /**
   * Set window size via ioctl
   */
  ioctlSetWinsize(
    fd: number,
    rows: number,
    cols: number,
  ): boolean {
    try {
      const ws = new Buffer(32); // Winsize structure
      ws.readUInt16LE(0) = rows; // ws_row
      ws.readUInt16LE(2) = cols; // ws_col
      ws.readUInt16LE(4) = 0; // ws_xpixel
      ws.readUInt16LE(6) = 0; // ws_ypixel

      ioctl(fd, 'TIOCSWINSZ', ws, () => {
        this.winsize.ws_row = rows;
        this.winsize.ws_col = cols;
        console.log(`Window resized to ${cols}x${rows}`);
      });
      return true;
    } catch (error) {
      console.error('ioctl failed:', error);
      return false;
    }
  }

  /**
   * Handle SIGWINCH signal (window resize)
   */
  handleSIGWINCH(
    sessionId: string,
    rows: number,
    cols: number,
  ): void {
    // Program like htop/top will auto-resize based on new size
    const sessionManager = require('./SessionManager');
    const session = sessionManager.getSession(sessionId);

    if (session) {
      this.ioctlSetWinsize(session.ptySlaveFd, rows, cols);
    }
  }

  /**
   * Detect terminal resize via stdin
   */
  detectResize(): void {
    // Detect SIGWINCH and update winsize
  }

  /**
   * Update terminal dimensions
   */
  updateTerminalDimensions(sessionId: string, rows: number, cols: number): {
    output: string;
    success: boolean;
  } {
    const sessionManager = require('./SessionManager');
    const session = sessionManager.getSession(sessionId);

    if (!session) {
      return {
        output: '',
        success: false,
        error: 'Session not found',
      };
    }

    const ws = new winsize({ rows, cols, ws_xpixel: 0, ws_ypixel: 0 });
    session.ptySlaveFd.ioctl(0, 'TIOCSWINSZ', ws, () => {
      // Update session buffer
    });

    return { output: '',
    success: true };
  }

  /**
   * Get current terminal size
   */
  getTerminalSize(sessionId: string): {
    rows: number;
    cols: number;
  } {
    const session = sessionManager.getSession(sessionId);

    if (!session) {
      return { rows: 24, cols: 80 };
    }

    return {
      rows: session.ptySlaveFd.ws_row,
      cols: session.ptySlaveFd.ws_col,
    };
  }

  /**
   * Handle resize from client
   */
  handleResizeRequest(sessionId: string, newRows: number, newCols: number): {
    output: string;
    success: boolean;
  } {
    const sessionManager = require('./SessionManager');
    const session = sessionManager.getSession(sessionId);

    if (!session) {
      return {
        output: '',
        success: false,
        error: 'Session not found',
      };
    }

    const ws = new winsize({ rows: newRows, cols: newCols, ws_xpixel: 0 , ws_ypixel: 0 });
    ioctl(session.ptySlaveFd, 'TIOCSWINSZ', ws, () => {
      console.log(`Window resized to ${newCols}x${newRows}`);
      // Update session buffer
    });

    return { output: '', success: true };
  }
}

export default WindowResizer;