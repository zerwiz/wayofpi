import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { 
  SimplePage, ClawPage, DocsPage, WorkPage,
  UserProfile, AdminDashboard, SuperAdminDashboard,
  ClientDashboard, WorkerPortal
} from "./pages";
import { RefactorProvider, useRefactor } from "./context/RefactorContext";
import { UserRoleBadge } from "./components/UserRoleBadge";

const uiModeRouteMap: Record<string, string> = {
  simple: "/ide",
  work: "/kanban",
  claw: "/ata",
  docs: "/docs",
};

const routeUiModeMap: Record<string, string> = {
  "/ide": "simple",
  "/kanban": "work",
  "/ata": "claw",
  "/docs": "docs",
};

function RouteSync() {
  const { setUiMode } = useRefactor();
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    const mode = routeUiModeMap[path];
    if (mode) {
      setUiMode(mode);
    }
  }, [path, setUiMode]);

  return null;
}

function UiModeWatcher() {
  const { uiMode } = useRefactor();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const lastMode = React.useRef(uiMode);

  useEffect(() => {
    const expectedPath = uiModeRouteMap[uiMode] || "/ide";
    if (pathname !== expectedPath) {
      if (lastMode.current === uiMode) return;
      lastMode.current = uiMode;
      navigate(expectedPath, { replace: true });
    }
  }, [uiMode, navigate, pathname]);

  return null;
}

function RoleBadgeBar() {
  return (
    <div className="pointer-events-none fixed bottom-2 right-2 z-50 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
      <UserRoleBadge />
    </div>
  );
}

function WorkerPortalWrapper() {
  const { uiMode, setUiMode } = useRefactor();
  return <WorkerPortal uiMode={uiMode} setUiMode={setUiMode} />;
}

function AdminDashboardWrapper() {
  const { uiMode, setUiMode } = useRefactor();
  return <AdminDashboard uiMode={uiMode} setUiMode={setUiMode} />;
}

function SuperAdminDashboardWrapper() {
  const { uiMode, setUiMode } = useRefactor();
  return <SuperAdminDashboard uiMode={uiMode} setUiMode={setUiMode} />;
}

function ClientDashboardWrapper() {
  const { uiMode, setUiMode } = useRefactor();
  return <ClientDashboard uiMode={uiMode} setUiMode={setUiMode} />;
}

function UserProfileWrapper() {
  const { uiMode, setUiMode } = useRefactor();
  return <UserProfile uiMode={uiMode} setUiMode={setUiMode} />;
}

export default function App() {
  return (
    <RefactorProvider>
      <RouteSync />
      <UiModeWatcher />
      <RoleBadgeBar />
      <Routes>
        <Route path="/" element={<Navigate to="/ide" replace />} />
        <Route path="/ide" element={<SimplePage />} />
        <Route path="/kanban" element={<WorkPage />} />
        <Route path="/ata" element={<ClawPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/portal" element={<WorkerPortalWrapper />} />
        <Route path="/admin" element={<AdminDashboardWrapper />} />
        <Route path="/super-admin" element={<SuperAdminDashboardWrapper />} />
        <Route path="/client" element={<ClientDashboardWrapper />} />
        <Route path="/profile" element={<UserProfileWrapper />} />
      </Routes>
    </RefactorProvider>
  );
}
