/** Ollama `/api/tags` shape (subset). */
export interface OllamaTagModel {
	name: string;
	model?: string;
	size?: number;
	modified_at?: string;
}

export interface OllamaTagsResponse {
	models?: OllamaTagModel[];
}

export async function fetchOllamaTags(ollamaHost: string): Promise<{ ok: true; models: OllamaTagModel[] } | { ok: false; error: string }> {
	const host = ollamaHost.replace(/\/$/, "");
	try {
		const res = await fetch(`${host}/api/tags`, {
			method: "GET",
			headers: { Accept: "application/json" },
		});
		if (!res.ok) {
			const t = await res.text();
			return { ok: false, error: `Ollama tags ${res.status}: ${t.slice(0, 300)}` };
		}
		const data = (await res.json()) as OllamaTagsResponse;
		const list = Array.isArray(data.models) ? data.models : [];
		return { ok: true, models: list };
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		return { ok: false, error: message };
	}
}

const MODEL_ID_RE = /^[a-zA-Z0-9._:/+-]+$/;

export function isValidOllamaModelId(id: string): boolean {
	const t = id.trim();
	return t.length > 0 && t.length <= 200 && MODEL_ID_RE.test(t);
}

export function isValidOpenRouterModelId(id: string): boolean {
	const t = id.trim();
	return t.length > 0 && t.length <= 200 && /^[a-zA-Z0-9._:/+-]+$/.test(t);
}
