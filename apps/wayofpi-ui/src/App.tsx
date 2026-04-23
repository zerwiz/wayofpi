/**
 * App - Main application entry point
 * Integrates SessionManager with PTY-based terminals
 */

import React from "react";
import AppContainer from "./AppContainer";
import { SessionManager } from "@wayofpi-server/session";

/**
 * App Component
 */
export default function App() {
  // Initialize SessionManager
  const sessionManager = new SessionManager(
    process.env.WAYOFPI_PORT || 3333,
  );

  console.log("✅ Way of Pi Terminal initialized");
  console.log("✅ PTY-based terminal ready");

  return <AppContainer
    sessionManager={sessionManager}
    prompt="$ "
  />;
}
