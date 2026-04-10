import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPutJson } from "../api/client";
import type { FileGetResponse, FilePreview } from "../types/workspaceFile";

function payloadToPreview(r: FileGetResponse): { text: string; preview: FilePreview | null } {
	if ("encoding" in r && r.encoding === "base64") {
		const mime = r.mimeType || "application/octet-stream";
		if (mime.startsWith("image/")) {
			return { text: "", preview: { kind: "image", src: `data:${mime};base64,${r.content}` } };
		}
		return { text: "", preview: { kind: "binary", mimeType: mime } };
	}
	return { text: r.content, preview: null };
}

export function useFileEditor(path: string | null, options?: { autoSave?: boolean }) {
	const autoSave = options?.autoSave ?? false;
	const [content, setContent] = useState("");
	const [lastPersistedContent, setLastPersistedContent] = useState("");
	const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dirty, setDirty] = useState(false);

	useEffect(() => {
		if (!path) {
			setContent("");
			setLastPersistedContent("");
			setFilePreview(null);
			setDirty(false);
			setError(null);
			return;
		}
		let cancelled = false;
		setLoading(true);
		setError(null);
		apiGet<FileGetResponse>(`/api/file?path=${encodeURIComponent(path)}`)
			.then((r) => {
				if (!cancelled) {
					const { text, preview } = payloadToPreview(r);
					setContent(text);
					setLastPersistedContent(text);
					setFilePreview(preview);
					setDirty(false);
				}
			})
			.catch((e) => {
				if (!cancelled) setError(e instanceof Error ? e.message : String(e));
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [path]);

	const setContentTracked = useCallback(
		(next: string) => {
			if (filePreview) return;
			setContent(next);
			setDirty(true);
		},
		[filePreview],
	);

	const save = useCallback(async () => {
		if (!path || filePreview) return;
		setError(null);
		try {
			await apiPutJson<{ ok: boolean }>("/api/file", { path, content });
			setLastPersistedContent(content);
			setDirty(false);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	}, [path, content, filePreview]);

	const reload = useCallback(async () => {
		if (!path) return;
		setLoading(true);
		setError(null);
		try {
			const r = await apiGet<FileGetResponse>(`/api/file?path=${encodeURIComponent(path)}`);
			const { text, preview } = payloadToPreview(r);
			setContent(text);
			setLastPersistedContent(text);
			setFilePreview(preview);
			setDirty(false);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, [path]);

	const saveRef = useRef(save);
	saveRef.current = save;

	useEffect(() => {
		if (!autoSave || !path || !dirty || filePreview) return;
		const t = window.setTimeout(() => {
			void saveRef.current();
		}, 850);
		return () => window.clearTimeout(t);
	}, [autoSave, path, dirty, content, filePreview]);

	return {
		content,
		setContent: setContentTracked,
		lastPersistedContent,
		filePreview,
		loading,
		error,
		dirty,
		save,
		reload,
	};
}
