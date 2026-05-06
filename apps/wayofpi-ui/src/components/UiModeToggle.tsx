import { useState, useEffect } from "react";
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
	const [role, setRole] = useState<string>("");

	useEffect(() => {
		const token = localStorage.getItem("wop_token");
		if (token) {
			try {
				const tokenStr = token.includes('.') ? atob(token.split('.')[1]) : atob(token);
				const payload = JSON.parse(tokenStr);
				setRole(payload.role?.toUpperCase() || "");
			} catch (e) {
				console.error("Failed to parse token in UiModeToggle", e);
			}
		}
	}, []);

	const isSuperAdminRole = role === "SUPER_ADMIN";
	const isAdminRole = role === "ADMIN" || isSuperAdminRole;
	const isLeaderRole = role === "LEADER" || isAdminRole;
	const isWorkerRole = role === "WORKER" || isLeaderRole;
	const isClientRole = role === "CLIENT" || isAdminRole;

	const isClientPage = window.location.pathname.startsWith("/client");
	const isAdminPage = window.location.pathname.startsWith("/admin");
	const isPortalPage = window.location.pathname.startsWith("/portal");
	const isProfilePage = window.location.pathname.startsWith("/profile");
	const isSuperAdminPage = window.location.pathname.startsWith("/super-admin");

	const anyPageActive = isClientPage || isAdminPage || isPortalPage || isProfilePage || isSuperAdminPage;

	return (
		<div className="flex shrink-0 items-center gap-0.5 rounded border border-[#454545] bg-[#2d2d2d] p-0.5 text-[11px]">
			<button
				type="button"
				onClick={() => {
					if (window.location.pathname !== "/") window.location.pathname = "/";
					onUiModeChange("simple");
				}}
				className={`rounded px-1.5 py-0.5 transition-colors ${
					uiMode === "simple" && !anyPageActive ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Calmer layout and friendly labels"
			>
				Simple
			</button>

			{isWorkerRole && (
				<button
					type="button"
					onClick={() => {
						if (window.location.pathname !== "/") window.location.pathname = "/";
						onUiModeChange("technical");
					}}
					className={`rounded px-1.5 py-0.5 transition-colors ${
						uiMode === "technical" && !anyPageActive ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
					}`}
					title="IDE-style chrome and technical labels"
				>
					Technical
				</button>
			)}

			{isLeaderRole && (
				<button
					type="button"
					onClick={() => {
						if (window.location.pathname !== "/") window.location.pathname = "/";
						onUiModeChange("claw");
					}}
					className={`rounded px-1.5 py-0.5 transition-colors ${
						uiMode === "claw" && !anyPageActive ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
					}`}
					title="Claw roadmap: autonomous-agent shell"
				>
					Claw
				</button>
			)}

			<div className="mx-1 h-3 w-[1px] bg-[#454545]" />

			<button
				type="button"
				onClick={() => {
					if (window.location.pathname !== "/") window.location.pathname = "/";
					onUiModeChange("docs");
				}}
				className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
					uiMode === "docs" && !anyPageActive ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
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
					uiMode === "work" && !anyPageActive ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="Workboard mode: Time and tasks"
			>
				<Briefcase size={12} />
				Workboard
			</button>

			<div className="mx-1 h-3 w-[1px] bg-[#454545]" />

			{isClientRole && (
				<button
					type="button"
					onClick={() => window.location.pathname = "/client"}
					className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
						isClientPage ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
					}`}
					title="Client Dashboard"
				>
					<User size={12} />
					Client
				</button>
			)}

			{isWorkerRole && (
				<button
					type="button"
					onClick={() => window.location.pathname = "/portal"}
					className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
						isPortalPage ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
					}`}
					title="Worker Portal"
				>
					<LayoutDashboard size={12} />
					Portal
				</button>
			)}

			{isAdminRole && (
				<button
					type="button"
					onClick={() => window.location.pathname = "/admin"}
					className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
						isAdminPage ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
					}`}
					title="Admin Console"
				>
					<Shield size={12} />
					Admin
				</button>
			)}

			{isSuperAdminRole && (
				<button
					type="button"
					onClick={() => window.location.pathname = "/super-admin"}
					className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
						isSuperAdminPage ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
					}`}
					title="Developer View"
				>
					<Shield size={12} />
					DevView
				</button>
			)}

			<button
				type="button"
				onClick={() => window.location.pathname = "/profile"}
				className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
					isProfilePage ? "bg-[#ea580c] text-white" : "text-[#858585] hover:text-[#cccccc]"
				}`}
				title="User Profile"
			>
				<User size={12} />
				Profile
			</button>
		</div>
	);
}

