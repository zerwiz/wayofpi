import type { UiMode } from "../hooks/useUiMode";
import { FileText, Briefcase, Shield, User, LayoutDashboard, Code2, Bot, FileCode } from "lucide-react";

interface NavItem {
  id: UiMode | "portal" | "client" | "admin" | "profile";
  label: string;
  icon: React.ReactNode;
  title: string;
  path?: string;
  showCondition?: () => boolean;
}

interface NavigationProps {
  uiMode: UiMode;
  onUiModeChange: (mode: UiMode) => void;
  /** Current pathname-based context (portal, client, admin, profile) */
  isPortal: boolean;
  isClient: boolean;
  isAdmin: boolean;
  isProfile: boolean;
  /** Optional: user role to conditionally show context nav */
  userRole?: "worker" | "client" | "admin" | null;
}

const PRIMARY_NAV: NavItem[] = [
  { id: "simple", label: "Simple", icon: <Code2 size={14} />, title: "Calmer layout and friendly labels" },
  { id: "technical", label: "Technical", icon: <Code2 size={14} />, title: "IDE-style chrome and technical labels" },
  { id: "claw", label: "Claw", icon: <Bot size={14} />, title: "Claw roadmap: autonomous-agent shell" },
  { id: "docs", label: "Docs", icon: <FileText size={14} />, title: "Docs mode: Document-centric layout" },
  { id: "work", label: "Work", icon: <Briefcase size={14} />, title: "Work mode: Time and tasks" },
];

const CONTEXT_NAV: NavItem[] = [
  { id: "client", label: "Client", icon: <User size={14} />, title: "Client Dashboard", path: "/client", showCondition: () => true },
  { id: "portal", label: "Portal", icon: <LayoutDashboard size={14} />, title: "Worker Portal", path: "/portal", showCondition: (role?: string) => role === "worker" || !role },
  { id: "admin", label: "Admin", icon: <Shield size={14} />, title: "Super Admin Dashboard", path: "/admin", showCondition: (role?: string) => role === "admin" || !role },
  { id: "profile", label: "Profile", icon: <User size={14} />, title: "User Profile", path: "/profile", showCondition: () => true },
];

export function Navigation({ uiMode, onUiModeChange, isPortal, isClient, isAdmin, isProfile, userRole = null }: NavigationProps) {
  const isContextActive = isPortal || isClient || isAdmin || isProfile;

  const handlePrimaryClick = (mode: UiMode) => {
    if (window.location.pathname !== "/") window.location.pathname = "/";
    onUiModeChange(mode);
  };

  const handleContextClick = (item: NavItem) => {
    if (item.path) window.location.pathname = item.path;
  };

  const isActive = (item: NavItem): boolean => {
    if (item.path) {
      return window.location.pathname.startsWith(item.path);
    }
    return uiMode === item.id && !isContextActive;
  };

  const navBtnClass = (active: boolean) =>
    `flex items-center gap-1 rounded px-2 py-1 text-[12px] transition-colors ${
      active ? "bg-[#ea580c] text-white" : "text-[#858585] hover:bg-[#474747] hover:text-[#cccccc]"
    }`;

  return (
    <nav className="flex shrink-0 items-center gap-1" aria-label="Main navigation">
      {/* Primary Navigation */}
      <div className="flex shrink-0 items-center gap-0.5 rounded border border-[#454545] bg-[#2d2d2d] p-0.5">
        {PRIMARY_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handlePrimaryClick(item.id as UiMode)}
            className={navBtnClass(isActive(item))}
            title={item.title}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Context-Aware Navigation (shown when Work mode active or based on role) */}
      <div className="flex shrink-0 items-center gap-0.5 rounded border border-[#454545] bg-[#2d2d2d] p-0.5">
        {CONTEXT_NAV.map((item) => {
          const shouldShow = item.showCondition ? item.showCondition(userRole) : true;
          if (!shouldShow) return null;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleContextClick(item)}
              className={navBtnClass(isActive(item))}
              title={item.title}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
