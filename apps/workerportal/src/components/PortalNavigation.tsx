/**
 * Worker Portal Navigation - Simplified for portal users
 */
import { 
  LayoutDashboard, 
  Briefcase, 
  Clock, 
  FileText, 
  User, 
  Settings,
  LogOut,
} from "lucide-react";

export function PortalNavigation({ token, refreshToken }: { token: string; refreshToken: (t: string) => void }) {
  const isClient = window.location.pathname.startsWith("/client");
  const isPortal = window.location.pathname.startsWith("/portal");
  const isLogout = window.location.pathname.startsWith("/logout");
  
  return (
    <div className="portal-navbar flex shrink-0 items-center justify-between bg-[#252526] p-2">
      <div className="flex items-center gap-2 text-sm text-[#cccccc]">
        <span className="font-medium">Worker Portal</span>
        <span className="text-xs text-[#858585]">Time Entry System</span>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Quick links (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={() => isClient ? undefined : window.location.pathname = "/client"}
            className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs transition-colors ${
              isClient 
                ? "bg-[#ea580c] text-white font-medium" 
                : "text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
            }`}
          >
            <LayoutDashboard size={12} />
            <span className="hidden sm:inline">Client</span>
          </button>
          
          <button
            onClick={() => isPortal ? undefined : window.location.pathname = "/portal"}
            className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs transition-colors ${
              isPortal 
                ? "bg-[#ea580c] text-white font-medium" 
                : "text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
            }`}
          >
            <Briefcase size={12} />
            Portal
          </button>
          
          <button
            onClick={() => window.location.pathname = "/admin"}
            className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs transition-colors ${
              isClient || isPortal
                ? "text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]" 
                : "text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
            }`}
          >
            <Settings size={12} />
            <span className="hidden sm:inline">Admin</span>
          </button>
          
          <button
            onClick={() => window.location.pathname = "/profile"}
            className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs transition-colors ${
              isClient || isPortal || isLogout
                ? "text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]" 
                : "text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]"
            }`}
          >
            <User size={12} />
            Profile
          </button>
        </div>
        
        <button
          onClick={() => window.location.pathname = "/help"}
          className="rounded px-3 py-1.5 text-xs text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc] transition-colors"
          title="Help"
        >
          <span className="text-[#858585]">?</span>
        </button>
        
        <button
          onClick={() => {
            localStorage.removeItem("portal_token");
            window.location.pathname = "/profile";
          }}
          className="rounded px-3 py-1.5 text-xs text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc] transition-colors"
          title="Logout"
        >
          <LogOut size={14} />
        </button>
        
        {/* Token status */}
        <span className="text-xs text-[#858585] hidden md:inline">
          {token ? "✓ Authenticated" : "Not logged in"}
        </span>
      </div>
    </div>
  );
}

export default PortalNavigation;
