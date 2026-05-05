import type { UiMode } from "../hooks/useUiMode";
import { FileText, Briefcase, Shield, User, LayoutDashboard } from "lucide-react";

/** Same control as in the technical `MenuBar` (IDE chrome). */
export function UiModeToggle({
	uiMode,
	onUiModeChange,
}: {
	uiMode: UiMode;
	onUiModeChange: (mode: UiMode) => void;
}) {
	const isClient = window.location.pathname.startsWith("/client");
	const isAdmin = window.location.pathname.startsWith("/admin");
	const isPortal = window.location.pathname.startsWith("/portal");
	const isProfile = window.location.pathname.startsWith("/profile");

	return (
		<div className="flex shrink-0 items-center gap-0.5 rounded border border-[#454545] bg-[#2d2d2d] p-0.5 text-[11px]">
			<button
				type="button"
				onClick={() => {
					if (window.location.pathname !== "/") window.location.pathname = "/";
					onUiModeChange("simple");
				}}
				className={`rounded px-1.5 py-0.5 transition-colors ${
					uiMode === "simple" && !isClient && !isAdmin && !isPortal && !isProfile ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Calmer layout and friendly labels"
			>
				Simple
			</button>
			<button
				type="button"
				onClick={() => {
					if (window.location.pathname !== "/") window.location.pathname = "/";
					onUiModeChange("technical");
				}}
				className={`rounded px-1.5 py-0.5 transition-colors ${
					uiMode === "technical" && !isClient && !isAdmin && !isPortal && !isProfile ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="IDE-style chrome and technical labels"
			>
				Technical
			</button>
			<button
				type="button"
				onClick={() => {
					if (window.location.pathname !== "/") window.location.pathname = "/";
					onUiModeChange("claw");
				}}
				className={`rounded px-1.5 py-0.5 transition-colors ${
					uiMode === "claw" && !isClient && !isAdmin && !isPortal && !isProfile ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Claw roadmap: autonomous-agent shell"
			>
				Claw
			</button>
			<button
				type="button"
				onClick={() => {
					if (window.location.pathname !== "/") window.location.pathname = "/";
					onUiModeChange("docs");
				}}
				className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
					uiMode === "docs" && !isClient && !isAdmin && !isPortal && !isProfile ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Docs mode: 3-panel layout"
			>
				<FileText size={12} />
				Docs
			</button>
			<button
				type="button"
				onClick={() => {
					if (window.location.pathname !== "/") window.location.pathname = "/";
					onUiModeChange("work");
				}}
				className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
					uiMode === "work" && !isClient && !isAdmin && !isPortal && !isProfile ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Work mode: Time and tasks"
			>
				<Briefcase size={12} />
				Work
			</button>
			<div className="mx-1 h-3 w-[1px] bg-[#454545]" />
			<button
				type="button"
				onClick={() => window.location.pathname = "/client"}
				className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
					isClient ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Client Dashboard"
			>
				<User size={12} />
				Client
			</button>
			<button
				type="button"
				onClick={() => window.location.pathname = "/portal"}
				className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
					isPortal ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Worker Portal"
			>
				<LayoutDashboard size={12} />
				Portal
			</button>
			<button
				type="button"
				onClick={() => window.location.pathname = "/admin"}
				className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
					isAdmin ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Super Admin Dashboard"
			>
				<Shield size={12} />
				Admin
			</button>
			<button
				type="button"
				onClick={() => window.location.pathname = "/profile"}
				className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
					isProfile ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="User Profile"
			>
				<User size={12} />
				Profile
			</button>
		</div>

	);
}

