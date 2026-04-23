/**
 * Session Manager - Background server for terminal sessions
 * Core architecture following tmux/screen model
 */

class SessionManager {
  constructor(port = 3333) {
    this.port = port;
    this.sessions = new Map();
    this.socket = new webSocket.Server({ port }, (request, socket) => {
      socket.on("open", () => {
        console.log(`Client connected from ${socket.remoteAddress}`);
      });

      socket.on("close", () => {
        console.log(`Client disconnected from ${socket.remoteAddress}`);
      });
    });
  }

  createSession(prompt = "bash") {
    // Open PTY pair
    const ptyMaster = posix_openpt();

    // Fork shell on PTY slave
    forkpty(ptySlaveFd, prompt, {
      cwd: "/home/user",
      env: process.env,
    });

    // Create session with buffer
    const session = {
      id: crypto.randomUUID(),
      ptyMaster,
      ptySlave,
      shell: prompt,
      buffer: new Array(256)
        .fill()
        .map(() =>
          new Array(80).fill(" ").map((_, x) => ({ char: " ", fg: "reset" })),
        ),
      connected: true,
      createdAt: Date.now(),
    };

    this.sessions.set(session.id, session);
    return session.id;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    return session;
  }

  handleConnection(sessionId, data) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { error: "Session not found" };
    }

    // Echo data to PTY master (passes through to shell)
    session.ptyMaster.write(data);

    // Read PTY output
    const output = readlink(session.ptySlave);
    return { output };
  }
}

// ES module export
export default SessionManager;
