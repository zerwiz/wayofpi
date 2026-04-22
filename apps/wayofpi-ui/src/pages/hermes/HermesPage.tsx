import React from "react";
import HermesTerminalView from "../components/hermes/HermesTerminalView";
import HermesFileBrowser from "../components/hermes/HermesFileBrowser";
import type { TerminalCommand } from "../types/hermes";

interface HermesPageProps {
  hermesPath: string;
  onCommandExecuted?: (command: string, output: string) => void;
  initialCommands?: TerminalCommand[];
}

/**
 * HermesTerminalPage
 *
 * Full terminal interface for Hermes CLI with integrated file browser.
 * Hermes installs to /.hermes directory (hidden, with leading dot).
 *
 * @param hermesPath - Path to Hermes installation directory (default: /home/zerwiz/CodeP/Way of pi/.hermes)
 * @param onCommandExecuted - Callback for command execution events
 * @param initialCommands - Optional set of quick-access commands
 */
export const HermesTerminalPage: React.FC<HermesPageProps> = ({
  hermesPath = "/home/zerwiz/CodeP/Way of pi/.hermes",
  onCommandExecuted,
  initialCommands = [
    {
      name: "status",
      desc: "Check Hermes and Honcho status",
      command: "hermes status",
    },
    {
      name: "chat",
      desc: "Start new chat session",
      command: 'hermes chat -q "hello"',
    },
    {
      name: "honcho-setup",
      desc: "Setup Honcho integration",
      command: "hermes honcho setup",
    },
    { name: "clean", desc: "Clear session cache", command: "hermes clean" },
  ],
}: HermesPageProps) => {
  const terminalRef = React.useRef<HTMLDivElement>(null);
  const [commandHistory, setCommandHistory] = React.useState<
    Array<{ cmd: string; output: string; timestamp: Date }>
  >([]);

  /**
   * Handle command execution
   * Simulates Hermes CLI output in terminal view
   */
  const executeCommand = React.useCallback(
    async (command: string) => {
      if (!command.trim()) return;

      const output = await hermesExecuteCommand(command, hermesPath);
      const entry: { cmd: string; output: string; timestamp: Date } = {
        cmd: command,
        output,
        timestamp: new Date(),
      };
      setCommandHistory((prev) => [...prev, entry]);

      onCommandExecuted?.(command, output);
    },
    [hermesPath, onCommandExecuted],
  );

  /**
   * Simulated Hermes CLI execution
   * In production, this would connect to actual Hermes process
   */
  const hermesExecuteCommand = async (
    cmd: string,
    path: string,
  ): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate various command outputs
        if (cmd.includes("status")) {
          resolve(
            `[+] Hermes CLI ready at ${path}/.venv/bin/hermes\n` +
              `[+] Honcho connection: ACTIVE\n` +
              `[+] Workspace: active\n` +
              `[+] Session ID: ${generateSessionId()}`,
          );
        } else if (cmd.includes("chat")) {
          resolve(
            `Starting Hermes chat session...\n` +
              `[> Processing: ${cmd.split('"')[1] || "command"}\n` +
              `[+] Hermes response: I am Hermes, your intelligent CLI assistant.\n` +
              `Type 'exit' to end session.`,
          );
        } else if (cmd.includes("honcho-setup")) {
          resolve(
            `[+] Initializing Honcho integration...\n` +
              `[+] Checking Honcho API availability...\n` +
              `[+] Workspace: hermes-ws\n` +
              `[+] Peer ID: hermes-peer-${generatePeerId()}\n` +
              `[+] Integration complete!`,
          );
        } else if (cmd.includes("clean")) {
          resolve(
            `[+] Clearing session cache...\n` +
              `[+] Removed ${Math.floor(Math.random() * 100)} stale sessions\n` +
              `[+] Cache cleared successfully.`,
          );
        } else {
          resolve(`Hermes: ${cmd}\n[> Ready for command...`);
        }
      }, 500);
    });
  };

  /**
   * Generate pseudo-random session ID
   */
  const generateSessionId = (): string => {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  };

  /**
   * Generate pseudo-random peer ID
   */
  const generatePeerId = (): string => {
    return `peer_${Math.random().toString(36).substring(2, 8)}`;
  };

  return (
    <div
      className="hermes-terminal-page"
      style={{ display: "flex", height: "100%" }}
    >
      {/* Main Terminal View - Center */}
      <div
        className="hermes-terminal-panel"
        style={{ flex: 3, minWidth: "400px" }}
      >
        <HermesTerminalView
          ref={terminalRef}
          commands={commandHistory}
          onCommandSubmit={executeCommand}
          initialCommands={initialCommands}
          hermesPath={hermesPath}
        />
      </div>

      {/* File Browser - Right */}
      <div
        className="hermes-file-browser-panel"
        style={{ flex: 1, minWidth: "200px" }}
      >
        <HermesFileBrowser hermesPath={hermesPath} />
      </div>
    </div>
  );
};

export default HermesTerminalPage;
