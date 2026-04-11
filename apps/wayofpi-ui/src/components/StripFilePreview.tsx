import { useEffect, useState } from "react";
import { apiGet } from "../api/client";
import type { FileGetResponse } from "../types/workspaceFile";

/**
 * Read-only file body for a horizontal dock tab (separate from the main editor buffer).
 */
export function StripFilePreview({ path }: { path: string }) {
	const [text, setText] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const ac = new AbortController();
		setText(null);
		setError(null);
		void (async () => {
			try {
				const data = await apiGet<FileGetResponse>(`/api/file?path=${encodeURIComponent(path)}`, {
					signal: ac.signal,
				});
				if (ac.signal.aborted) return;
				if ("encoding" in data && data.encoding === "base64") {
					setText(`[Binary or image — open in editor for full handling]\n${data.mimeType}\n${data.path}`);
				} else {
					setText(data.content ?? "");
				}
			} catch (e) {
				if (ac.signal.aborted) return;
				setError(e instanceof Error ? e.message : String(e));
			}
		})();
		return () => ac.abort();
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
