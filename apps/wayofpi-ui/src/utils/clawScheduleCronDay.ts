/**
 * Local-time helpers: does a 5-field cron expression fire at least once
 * on a given calendar day? Used by Claw Schedules month calendar (Phase D stub).
 *
 * Supported: star, ?, n, a-b, lists, steps (e.g. star-slash-n), a-b-slash-n — Vixie-style m/h/dom/month/dow.
 * dow uses 0–6 (Sun–Sat), same as JS Date#getDay(). Month 1–12, dom 1–31.
 */

function splitCron(expr: string): [string, string, string, string, string] | null {
	const parts = expr.trim().split(/\s+/).filter(Boolean);
	if (parts.length !== 5) return null;
	return parts as [string, string, string, string, string];
}

const MAX_CRON_LIST_DEPTH = 48;

function matchField(spec: string, value: number, min: number, max: number, depth = 0): boolean {
	if (depth > MAX_CRON_LIST_DEPTH) return false;
	let s = spec.trim();
	if (s === "*" || s === "?") return true;

	if (s.includes(",")) {
		return s.split(",").some((p) => matchField(p.trim(), value, min, max, depth + 1));
	}

	let step = 1;
	let baseSpec = s;
	if (s.includes("/")) {
		const [left, stepStr] = s.split("/");
		baseSpec = left ?? "*";
		step = Number.parseInt(stepStr ?? "1", 10);
		if (!Number.isFinite(step) || step < 1) return false;
	}

	const inBase = (() => {
		if (baseSpec === "*" || baseSpec === "?") return value >= min && value <= max;
		if (baseSpec.includes("-")) {
			const [loS, hiS] = baseSpec.split("-");
			const lo = Number.parseInt(loS?.trim() ?? "", 10);
			const hi = Number.parseInt(hiS?.trim() ?? "", 10);
			if (!Number.isFinite(lo) || !Number.isFinite(hi)) return false;
			return value >= lo && value <= hi;
		}
		const n = Number.parseInt(baseSpec, 10);
		if (!Number.isFinite(n)) return false;
		return n === value;
	})();
	if (!inBase) return false;
	if (step === 1) return true;

	if (baseSpec === "*" || baseSpec === "?") {
		return (value - min) % step === 0;
	}
	if (baseSpec.includes("-")) {
		const lo = Number.parseInt(baseSpec.split("-")[0]?.trim() ?? "", 10);
		if (!Number.isFinite(lo)) return false;
		return (value - lo) % step === 0;
	}
	const n = Number.parseInt(baseSpec, 10);
	if (!Number.isFinite(n)) return false;
	return (value - n) % step === 0;
}

function normalizeCronDowField(dowS: string): string {
	// Non-standard: some crons use 7 for Sunday; JS getDay() uses 0 for Sunday.
	return dowS
		.split(",")
		.map((t) => (t.trim() === "7" ? "0" : t.trim()))
		.join(",");
}

function matchesAt(parts: [string, string, string, string, string], dt: Date): boolean {
	const [minS, hourS, domS, monthS, dowS] = parts;

	if (!matchField(minS, dt.getMinutes(), 0, 59)) return false;
	if (!matchField(hourS, dt.getHours(), 0, 23)) return false;
	if (!matchField(domS, dt.getDate(), 1, 31)) return false;
	if (!matchField(monthS, dt.getMonth() + 1, 1, 12)) return false;
	if (!matchField(normalizeCronDowField(dowS), dt.getDay(), 0, 6)) return false;
	return true;
}

export function scheduleRunsOnLocalDay(cronExpr: string, day: Date): boolean {
	try {
		if (typeof cronExpr !== "string" || !cronExpr.trim()) return false;
		if (!(day instanceof Date) || Number.isNaN(day.getTime())) return false;
		const parts = splitCron(cronExpr);
		if (!parts) return false;
		const y = day.getFullYear();
		const mo = day.getMonth();
		const d = day.getDate();
		for (let mins = 0; mins < 1440; mins++) {
			const dt = new Date(y, mo, d, Math.floor(mins / 60), mins % 60, 0, 0);
			if (matchesAt(parts, dt)) return true;
		}
		return false;
	} catch {
		return false;
	}
}

function pad2(n: number): string {
	return n < 10 ? `0${n}` : String(n);
}

/** Sorted unique HH:MM (local) when the cron fires on this calendar day, capped. */
export function fireTimesOnLocalDay(cronExpr: string, day: Date, cap = 12): string[] {
	try {
		if (typeof cronExpr !== "string" || !cronExpr.trim()) return [];
		if (!(day instanceof Date) || Number.isNaN(day.getTime())) return [];
		const parts = splitCron(cronExpr);
		if (!parts) return [];
		const y = day.getFullYear();
		const mo = day.getMonth();
		const d = day.getDate();
		const seen = new Set<string>();
		const out: string[] = [];
		for (let mins = 0; mins < 1440; mins++) {
			const dt = new Date(y, mo, d, Math.floor(mins / 60), mins % 60, 0, 0);
			if (!matchesAt(parts, dt)) continue;
			const label = `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
			if (seen.has(label)) continue;
			seen.add(label);
			out.push(label);
			if (out.length >= cap) break;
		}
		return out.sort();
	} catch {
		return [];
	}
}
