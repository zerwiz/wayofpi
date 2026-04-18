import { useEffect, useState } from "react";

/** `true` when `window.innerWidth <= maxWidthPx` (inclusive). SSR-safe initial `false`. */
export function useMaxWidthMediaQuery(maxWidthPx: number): boolean {
	const [matches, setMatches] = useState(() =>
		typeof window !== "undefined"
			? window.matchMedia(`(max-width: ${maxWidthPx}px)`).matches
			: false,
	);

	useEffect(() => {
		const mq = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
		const onChange = () => setMatches(mq.matches);
		onChange();
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [maxWidthPx]);

	return matches;
}
