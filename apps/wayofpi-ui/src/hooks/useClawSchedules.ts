/**
 * Hook: Claw schedule management (Phase D stub).
 *
 * Schedules are stored in `localStorage` under `wayofpi.claw.schedules`.
 * They represent Pi turns the operator wants to trigger on a timer — no
 * backend execution yet. Backend wiring is tracked in docs/WOP_CLAW_MODE_PLAN.md §Phase D.
 */
import { useCallback, useEffect, useState } from "react";

export type ScheduleStatus = "enabled" | "disabled";
export type ScheduleLastResult = "success" | "error" | null;
export type ScheduleTriggerMode = "cron" | "once";

export interface ClawSchedule {
	id: string;
	name: string;
	description: string;
	/** Recurring pattern when `triggerMode` is `cron` (5-field). Empty when one-time only. */
	cron: string;
	/** How the schedule selects a run time. */
	triggerMode: ScheduleTriggerMode;
	/** When `once`: ISO instant from local date+time. Otherwise null. */
	runOnceAt: string | null;
	/** Agent name from .pi/agents/ — null means default session agent */
	agentName: string | null;
	/** The prompt / task instruction sent as the turn */
	prompt: string;
	status: ScheduleStatus;
	/** ISO date of last execution (stub — not yet executed) */
	lastRun: string | null;
	lastResult: ScheduleLastResult;
	createdAt: string;
}

const STORAGE_KEY = "wayofpi.claw.schedules";

function normalizeSchedule(raw: unknown): ClawSchedule | null {
	if (!raw || typeof raw !== "object") return null;
	const o = raw as Record<string, unknown>;
	const id = typeof o.id === "string" ? o.id : "";
	if (!id) return null;

	const name = typeof o.name === "string" ? o.name : "";
	const description = typeof o.description === "string" ? o.description : "";
	const cron = typeof o.cron === "string" ? o.cron : "0 9 * * *";
	const agentName =
		o.agentName === null || o.agentName === undefined
			? null
			: typeof o.agentName === "string"
				? o.agentName || null
				: null;
	const prompt = typeof o.prompt === "string" ? o.prompt : "";
	const status: ScheduleStatus = o.status === "disabled" ? "disabled" : "enabled";
	const lastRun = typeof o.lastRun === "string" || o.lastRun === null ? (o.lastRun as string | null) : null;
	const lastResult =
		o.lastResult === "success" || o.lastResult === "error" || o.lastResult === null
			? (o.lastResult as ScheduleLastResult)
			: null;
	const createdAt = typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString();

	let triggerMode: ScheduleTriggerMode = o.triggerMode === "once" ? "once" : "cron";
	let runOnceAt: string | null =
		typeof o.runOnceAt === "string" && o.runOnceAt.trim() ? o.runOnceAt.trim() : null;

	if (triggerMode === "once" && !runOnceAt) {
		triggerMode = "cron";
	}

	let outCron = cron;
	if (triggerMode === "once") {
		outCron = "";
	}

	return {
		id,
		name,
		description,
		cron: outCron,
		triggerMode,
		runOnceAt: triggerMode === "once" ? runOnceAt : null,
		agentName,
		prompt,
		status,
		lastRun,
		lastResult,
		createdAt,
	};
}

function loadSchedules(): ClawSchedule[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const arr = JSON.parse(raw) as unknown[];
		if (!Array.isArray(arr)) return [];
		return arr.map(normalizeSchedule).filter((s): s is ClawSchedule => s !== null);
	} catch {
		/* ignore */
	}
	return [];
}

function saveSchedules(schedules: ClawSchedule[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
	} catch {
		/* ignore */
	}
}

function makeId(): string {
	return `sched-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useClawSchedules() {
	const [schedules, setSchedules] = useState<ClawSchedule[]>(() => loadSchedules());

	useEffect(() => {
		saveSchedules(schedules);
	}, [schedules]);

	const addSchedule = useCallback(
		(partial: Omit<ClawSchedule, "id" | "createdAt" | "lastRun" | "lastResult">) => {
			setSchedules((prev) => [
				...prev,
				{
					...partial,
					id: makeId(),
					createdAt: new Date().toISOString(),
					lastRun: null,
					lastResult: null,
				},
			]);
		},
		[],
	);

	const updateSchedule = useCallback(
		(id: string, patch: Partial<Omit<ClawSchedule, "id" | "createdAt">>) => {
			setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
		},
		[],
	);

	const deleteSchedule = useCallback((id: string) => {
		setSchedules((prev) => prev.filter((s) => s.id !== id));
	}, []);

	const toggleSchedule = useCallback((id: string) => {
		setSchedules((prev) =>
			prev.map((s) =>
				s.id === id
					? { ...s, status: s.status === "enabled" ? "disabled" : "enabled" }
					: s,
			),
		);
	}, []);

	return { schedules, addSchedule, updateSchedule, deleteSchedule, toggleSchedule };
}
