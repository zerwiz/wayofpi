/**
 * AppContainer - Container for terminal sessions
 * Maintains PTY session connections
 */

import React, { useState, useEffect } from "react";
import { LogsPanel } from "./logs/index";
import { SessionManagerClient } from "./lib/SessionManagerClient";
/**
 * Props for AppContainer
 */
type AppContainerProps = {
  sessionManager: SessionManagerClient;
  prompt?: string;
  sessionId?: string;
};

/**
 * AppContainer Component
 */
const AppContainer: React.FC<AppContainerProps> = ({
  sessionManager,
  prompt = "$ ",
  sessionId = crypto.randomUUID(),
}) => {
  /**
   * Create new terminal session
   */
  const createSession = () => {
    const session = sessionManager.createSession("bash");
    console.log(`Created new session: ${session}`);
    return session;
  };

  /**
   * Handle user typing
   */
  const handleUserInput = (input: string) => {
    if (input.trim()) {
      // Send to PTY master
      sessionManager.handleConnection(sessionId, input).catch(() => {
        console.error("Error sending input to PTY");
      });
    }
  };

  /**
   * Handle command execution
   */
  const handleCommandExecute = (command: string) => {
    // Execute command in terminal
    console.log(`Executing: ${command}`);
  };

  /**
   * Handle window resize
   */
  const handleResize = (rows: number, cols: number) => {
    console.log(`Window resized to ${rows}x${cols}`);
  };

  /**
   * Render app
   */
  return (
    <div className="terminal-container">
      <LogsPanel
        sessionManager={sessionManager}
        sessionId={sessionId}
        prompt={prompt}
        onInput={handleUserInput}
        onExecute={handleCommandExecute}
        onResize={handleResize}
      />
    </div>
  );
};

export default AppContainer;