/**
 * Hook: Claw workspace state.
 *
 * Checks which `.claw/` scaffold files exist in the current workspace
 * via `GET /api/file?path=` (404 = absent), and exposes a `scaffold()`
 * action that creates any missing files via `PUT /api/file`.
 *
 * The hook does NOT auto-scaffold on mount — the user must trigger it.
 */
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { CLAW_WORKSPACE_FILES, type ClawWorkspaceFile } from "../utils/clawWorkspaceTemplates";

export type FileStatus = "unknown" | "checking" | "exists" | "missing" | "error";

export interface ClawFileState {
	file: ClawWorkspaceFile;
	status: FileStatus;
}

export interface UseClawWorkspaceResult {
	files: ClawFileState[];
	checking: boolean;
	scaffolding: boolean;
	/** How many scaffold files already exist. */
	existCount: number;
	/** How many scaffold files are missing. */
	missingCount: number;
	/** True once at least one check has completed. */
	ready: boolean;
	/** Re-check all files. */
	refresh: () => void;
	/** Write any missing files with their template content. */
	scaffold: () => Promise<void>;
	scaffoldError: string | null;
}

type Action =
	| { type: "check_start" }
	| { type: "file_result"; path: string; status: "exists" | "missing" | "error" }
	| { type: "check_done" }
	| { type: "scaffold_start" }
	| { type: "scaffold_done"; error: string | null }
	| { type: "file_written"; path: string };

interface State {
	files: ClawFileState[];
	checking: boolean;
	scaffolding: boolean;
	ready: boolean;
	scaffoldError: string | null;
}

function buildInitial(): State {
	return {
		files: CLAW_WORKSPACE_FILES.map((f) => ({ file: f, status: "unknown" })),
		checking: false,
		scaffolding: false,
		ready: false,
		scaffoldError: null,
	};
}

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "check_start":
			return {
				...state,
				checking: true,
				files: state.files.map((f) => ({ ...f, status: "checking" })),
			};
		case "file_result":
			return {
				...state,
				files: state.files.map((f) =>
					f.file.path === action.path ? { ...f, status: action.status } : f,
				),
			};
		case "check_done":
			return { ...state, checking: false, ready: true };
		case "scaffold_start":
			return { ...state, scaffolding: true, scaffoldError: null };
		case "scaffold_done":
			return { ...state, scaffolding: false, scaffoldError: action.error };
		case "file_written":
			return {
				...state,
				files: state.files.map((f) =>
					f.file.path === action.path ? { ...f, status: "exists" } : f,
				),
			};
		default:
			return state;
	}
}

/** Check whether a workspace-relative path exists by trying GET /api/file. */
async function checkFileExists(path: string, signal: AbortSignal): Promise<"exists" | "missing"> {
	try {
		const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`, { signal });
		return res.ok ? "exists" : "missing";
	} catch {
		return "missing";
	}
}

/** Write a workspace file via PUT /api/file. Returns error string or null on success. */
async function writeWorkspaceFile(path: string, content: string): Promise<string | null> {
	try {
		const res = await fetch("/api/file", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ path, content }),
		});
		if (!res.ok) {
			const t = await res.text();
			return `${res.status}: ${t}`;
		}
		return null;
	} catch (e) {
		return e instanceof Error ? e.message : String(e);
	}
}

export function useClawWorkspace(enabled: boolean): UseClawWorkspaceResult {
	const [state, dispatch] = useReducer(reducer, undefined, buildInitial);
	const [tick, setTick] = useState(0);
	const abortRef = useRef<AbortController | null>(null);

	const refresh = useCallback(() => setTick((t) => t + 1), []);

	useEffect(() => {
		if (!enabled) return;
		abortRef.current?.abort();
		const ctrl = new AbortController();
		abortRef.current = ctrl;

		dispatch({ type: "check_start" });

		void (async () => {
			await Promise.all(
				CLAW_WORKSPACE_FILES.map(async (f) => {
					if (ctrl.signal.aborted) return;
					const status = await checkFileExists(f.path, ctrl.signal);
					if (!ctrl.signal.aborted) {
						dispatch({ type: "file_result", path: f.path, status });
					}
				}),
			);
			if (!ctrl.signal.aborted) dispatch({ type: "check_done" });
		})();

		return () => ctrl.abort();
	}, [enabled, tick]);

	const scaffold = useCallback(async () => {
		dispatch({ type: "scaffold_start" });
		const missing = state.files.filter((f) => f.status === "missing");
		const errors: string[] = [];

		for (const { file } of missing) {
			const err = await writeWorkspaceFile(file.path, file.template);
			if (err) {
				errors.push(`${file.path}: ${err}`);
			} else {
				dispatch({ type: "file_written", path: file.path });
			}
		}

		dispatch({
			type: "scaffold_done",
			error: errors.length > 0 ? errors.join("\n") : null,
		});
		if (errors.length === 0) {
			// Recheck after scaffold
			setTick((t) => t + 1);
		}
	}, [state.files]);

	const existCount = state.files.filter((f) => f.status === "exists").length;
	const missingCount = state.files.filter((f) => f.status === "missing").length;

	return {
		files: state.files,
		checking: state.checking,
		scaffolding: state.scaffolding,
		existCount,
		missingCount,
		ready: state.ready,
		refresh,
		scaffold,
		scaffoldError: state.scaffoldError,
	};
}
