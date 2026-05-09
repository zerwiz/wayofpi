import React from "react";
import { 
  SimplePage, 
  ClawPage, 
  DocsPage, 
  WorkPage,
  LoginPage,
  WelcomePage,
  UserProfile,
  AdminDashboard,
  SuperAdminDashboard,
  ClientDashboard,
  WorkerPortal
} from "./pages";
import { RefactorProvider, useRefactor } from "./context/RefactorContext";

/**
 * AppShellInternal - The main router for Way of Work.
 * Swaps between isolated page subsystems based on uiMode.
 */
function AppShellInternal() {
  const { uiMode } = useRefactor();

  // ── Work shell ────────────────────────────────────────────────
  if (uiMode === "work") {
    return <WorkPage />;
  }

  // ── Docs shell ────────────────────────────────────────────────
  if (uiMode === "docs") {
    return <DocsPage />;
  }

  // ── Claw shell ───────────────────────────────────────────────
  if (uiMode === "claw") {
    return <ClawPage />;
  }

  // ── Simple shell (Default) ───────────────────────────────────
  return <SimplePage />;
}

/**
 * Root App Component
 * Wrapped in RefactorProvider to enable shared state across extracted hooks and pages.
 */
export default function App() {
  return (
    <RefactorProvider>
      <AppShellInternal />
    </RefactorProvider>
  );
}
