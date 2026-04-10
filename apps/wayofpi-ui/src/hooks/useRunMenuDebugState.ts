import { useState } from "react";

/**
 * Run menu breakpoint toggles (gutter / F9) and related flags.
 * Kept in one hook so App.tsx cannot reference breakpointsByPath without the matching useState.
 */
export function useRunMenuDebugState() {
	const [breakpointsByPath, setBreakpointsByPath] = useState<Record<string, number[]>>({});
	const [allBreakpointsDisabled, setAllBreakpointsDisabled] = useState(false);
	/** Reserved for a future debug adapter; stop / step stay inert until then. */
	const debugSessionActive = false;
	return {
		breakpointsByPath,
		setBreakpointsByPath,
		allBreakpointsDisabled,
		setAllBreakpointsDisabled,
		debugSessionActive,
	};
}
