import { Building2, ClipboardCheck, MessageSquare, Play, ShieldCheck, Wallet } from "lucide-react";
import { registerClawUiModule, type ClawUiModuleContext } from "./clawUiModules";

/**
 * Common styles for Claw modules
 */
const cardBase = "rounded-xl border p-5 shadow-sm transition-all";
const darkCard = `${cardBase} border-[#3c3c3c] bg-[#252526] text-[#cccccc]`;
const lightCard = `${cardBase} border-[#e5e5e5] bg-white text-[#333333]`;

const SectionHeader = ({ title, icon: Icon, dark }: { title: string, icon: any, dark: boolean }) => (
	<div className="mb-4 flex items-center gap-2">
		<Icon size={18} className="text-[#ea580c]" />
		<h3 className={`text-xs font-bold uppercase tracking-wider ${dark ? "text-[#858585]" : "text-[#666]"}`}>
			{title}
		</h3>
	</div>
);

const ActionBtn = ({ label, icon: Icon, onClick, dark }: { label: string, icon: any, onClick: () => void, dark: boolean }) => (
	<button
		onClick={onClick}
		className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
			dark 
				? "bg-[#3c3c3c] text-[#cccccc] hover:bg-[#4a4a4a]" 
				: "bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb]"
		}`}
	>
		<Icon size={14} />
		{label}
	</button>
);

// --- REVIEW MODULE ---
registerClawUiModule({
	id: "review",
	label: "Review",
	title: "Ticket Approval Queue",
	icon: ClipboardCheck,
	order: 40,
	render: ({ appearanceDark }) => (
		<div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
			<div className={appearanceDark ? darkCard : lightCard}>
				<SectionHeader title="Pending Tickets" icon={ClipboardCheck} dark={appearanceDark} />
				<div className="flex items-center justify-center py-12 text-sm opacity-50">
					All clear. No tickets awaiting leader review.
				</div>
			</div>
			
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className={appearanceDark ? darkCard : lightCard}>
					<SectionHeader title="Communications" icon={MessageSquare} dark={appearanceDark} />
					<div className="flex flex-wrap gap-2">
						<ActionBtn label="Message Worker" icon={MessageSquare} onClick={() => {}} dark={appearanceDark} />
						<ActionBtn label="Send to Client" icon={Play} onClick={() => {}} dark={appearanceDark} />
					</div>
				</div>
				<div className={appearanceDark ? darkCard : lightCard}>
					<SectionHeader title="Automations" icon={Play} dark={appearanceDark} />
					<div className="flex flex-wrap gap-2">
						<ActionBtn label="Sync with Budget" icon={Play} onClick={() => {}} dark={appearanceDark} />
						<ActionBtn label="Notify Overdue" icon={Play} onClick={() => {}} dark={appearanceDark} />
					</div>
				</div>
			</div>
		</div>
	),
});

// --- FINANCIALS MODULE ---
registerClawUiModule({
	id: "financials",
	label: "Finance",
	title: "Project Budgets & Rates",
	icon: Wallet,
	order: 50,
	render: ({ appearanceDark }) => (
		<div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className={appearanceDark ? darkCard : lightCard}>
					<SectionHeader title="Project Burn Rate" icon={Wallet} dark={appearanceDark} />
					<div className="text-2xl font-bold text-[#ea580c]">0 SEK</div>
					<div className="text-[10px] opacity-60">Total across active projects</div>
				</div>
				<div className={appearanceDark ? darkCard : lightCard}>
					<SectionHeader title="Communications" icon={MessageSquare} dark={appearanceDark} />
					<ActionBtn label="Request Budget Approval" icon={MessageSquare} onClick={() => {}} dark={appearanceDark} />
				</div>
				<div className={appearanceDark ? darkCard : lightCard}>
					<SectionHeader title="Automations" icon={Play} dark={appearanceDark} />
					<ActionBtn label="Recalculate Totals" icon={Play} onClick={() => {}} dark={appearanceDark} />
				</div>
			</div>
		</div>
	),
});

// --- OFFICE MODULE ---
registerClawUiModule({
	id: "office",
	label: "Office",
	title: "Invoicing & Integration",
	icon: Building2,
	order: 60,
	render: ({ appearanceDark }) => (
		<div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
			<div className={appearanceDark ? darkCard : lightCard}>
				<SectionHeader title="Invoice Preparation" icon={Building2} dark={appearanceDark} />
				<div className="flex items-center justify-center py-12 text-sm opacity-50">
					Select approved tickets to generate underlag.
				</div>
			</div>
			
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className={appearanceDark ? darkCard : lightCard}>
					<SectionHeader title="Sync Actions" icon={Play} dark={appearanceDark} />
					<div className="flex flex-wrap gap-2">
						<ActionBtn label="Push to Fortnox" icon={Play} onClick={() => {}} dark={appearanceDark} />
						<ActionBtn label="Push to Visma" icon={Play} onClick={() => {}} dark={appearanceDark} />
					</div>
				</div>
				<div className={appearanceDark ? darkCard : lightCard}>
					<SectionHeader title="Reporting" icon={MessageSquare} dark={appearanceDark} />
					<ActionBtn label="Email Summary to Client" icon={MessageSquare} onClick={() => {}} dark={appearanceDark} />
				</div>
			</div>
		</div>
	),
});

// --- COMPLIANCE MODULE ---
registerClawUiModule({
	id: "compliance",
	label: "Audit",
	title: "Ledger & Compliance",
	icon: ShieldCheck,
	order: 70,
	render: ({ appearanceDark }) => (
		<div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
			<div className={appearanceDark ? darkCard : lightCard}>
				<SectionHeader title="Staff Ledger (Personalliggare)" icon={ShieldCheck} dark={appearanceDark} />
				<div className="flex items-center justify-center py-12 text-sm opacity-50">
					Current site status: 0 workers checked in.
				</div>
			</div>
			
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className={appearanceDark ? darkCard : lightCard}>
					<SectionHeader title="Legal Exports" icon={Play} dark={appearanceDark} />
					<div className="flex flex-wrap gap-2">
						<ActionBtn label="Export Skatteverket XML" icon={Play} onClick={() => {}} dark={appearanceDark} />
						<ActionBtn label="Generate KMA Report" icon={Play} onClick={() => {}} dark={appearanceDark} />
					</div>
				</div>
				<div className={appearanceDark ? darkCard : lightCard}>
					<SectionHeader title="Direct Alerts" icon={MessageSquare} dark={appearanceDark} />
					<ActionBtn label="Alert Missing Check-out" icon={MessageSquare} onClick={() => {}} dark={appearanceDark} />
				</div>
			</div>
		</div>
	),
});
