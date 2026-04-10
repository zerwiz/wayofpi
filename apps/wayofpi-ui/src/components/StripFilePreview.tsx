import { useEffect, useState } from "react";

type FilePayload =
	| { path: string; content: string; encoding?: undefined; mimeType?: undefined }
	| { path: string; content: string; encoding: "base64"; mimeType: string };

/**
 * Read-only file body for a horizontal dock tab (separate from the main editor buffer).
 */
export function StripFilePreview({ path }: { path: string }) {
	const [text, setText] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setText(null);
		setError(null);
		void (async () => {
			try {
				const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`, {
					headers: { Accept: "application/json" },
				});
				const data = (await res.json()) as FilePayload & { error?: string };
				if (!res.ok) {
					throw new Error(data.error || `${res.status}`);
				}
				if (cancelled) return;
				if (data.encoding === "base64") {
					setText(`[Binary or image — open in editor for full handling]\n${data.mimeType}\n${data.path}`);
				} else {
					setText(data.content ?? "");
				}
			} catch (e) {
				if (!cancelled) setError(e instanceof Error ? e.message : String(e));
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [path]);

	if (error) {
		return (
			<div className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[12px] text-[#f14c4c]">{error}</div>
		);
	}
	if (text === null) {
		return (
			<div className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[12px] text-[#858585]">Loading…</div>
		);
	}
	return (
		<pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-[12px] text-[#cccccc]">
			{text}
		</pre>
	);
}
