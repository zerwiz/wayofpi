/**
 * Worker Portal Header - Worker-specific header for team overview
 */

interface PortalHeaderProps {
  token: string | null;
  onRefresh: () => void;
}

export function PortalHeader({ token, onRefresh }: PortalHeaderProps) {
  return (
    <div className="portal-header flex items-center justify-between bg-[#2d2d2d] px-4 py-2">
      <div className="flex items-center gap-4 text-sm text-[#cccccc]">
        <span className="font-medium">Worker Portal</span>
        <span className="text-xs text-[#858585]">Time Entry System</span>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-xs text-[#858585] hidden md:inline">
          {token ? "✓ Authenticated" : "Not logged in"}
        </span>
        <button
          onClick={onRefresh}
          className="rounded px-3 py-1 text-xs text-[#858585] bg-[#3c3c3c] hover:bg-[#4c4c4c] hover:text-white transition-colors"
          title="Refresh token"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

export default PortalHeader;
