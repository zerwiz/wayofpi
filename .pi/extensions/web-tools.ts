/**
 * Web tools — WebSearch + WebFetch for Pi (Claude Code–style surface)
 *
 * **web_search** — Provider chain from `WEB_TOOLS_SEARCH_ORDER` (default `gemini,brave,duckduckgo`):
 * skipped when a provider’s key is missing. **Gemini** uses *Grounding with Google Search*
 * (`google_search` tool) when `GEMINI_API_KEY` is set. **Brave** if `BRAVE_SEARCH_API_KEY` / `BRAVE_API_KEY`.
 * **DuckDuckGo** HTML scrape as last resort.
 *
 * **web_fetch** — Default: direct HTTP(S) GET + HTML→text. Set `WEB_TOOLS_FETCH_BACKEND=gemini` (or `fallback`)
 * to use Gemini **URL context** when `GEMINI_API_KEY` is set (see `.env.sample`).
 *
 * Usage: `pi -e extensions/web-tools.ts`, **`just ext-web-tools`**, or add `.pi/extensions/web-tools.ts` to **`.pi/settings.json`** only if you do **not** load npm **`pi-web-access`** (duplicate **`web_search`** / **`web_fetch`**).
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { applyExtensionDefaults } from "./themeMap.ts";

const DEFAULT_UA =
	"Mozilla/5.0 (compatible; PiWebTools/1.0; +https://github.com/mariozechner/pi-coding-agent)";
const FETCH_TIMEOUT_MS = 28_000;
const MAX_FETCH_BYTES = 2 * 1024 * 1024;
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function braveKey(): string | undefined {
	return process.env.BRAVE_SEARCH_API_KEY?.trim() || process.env.BRAVE_API_KEY?.trim() || undefined;
}

function geminiKey(): string | undefined {
	return process.env.GEMINI_API_KEY?.trim() || undefined;
}

/** Model id for Gemini web tools (must support `google_search` / `url_context`; see Google AI docs). */
function geminiWebModel(): string {
	return (
		process.env.WEB_TOOLS_GEMINI_MODEL?.trim() ||
		process.env.GEMINI_WEB_MODEL?.trim() ||
		"gemini-2.0-flash"
	);
}

type SearchProvider = "gemini" | "brave" | "duckduckgo";

function searchProviderOrder(): SearchProvider[] {
	const raw = process.env.WEB_TOOLS_SEARCH_ORDER?.trim();
	const parts = raw
		? raw
				.split(/[\s,]+/)
				.map((s) => s.toLowerCase())
				.filter(Boolean)
		: ["gemini", "brave", "duckduckgo"];
	const allowed: SearchProvider[] = [];
	for (const p of parts) {
		if (p === "gemini" || p === "brave" || p === "duckduckgo") allowed.push(p);
	}
	return allowed.length ? allowed : ["gemini", "brave", "duckduckgo"];
}

/** `http` | `gemini` | `fallback` (try HTTP, then Gemini URL context) */
function webFetchBackend(): "http" | "gemini" | "fallback" {
	const v = process.env.WEB_TOOLS_FETCH_BACKEND?.trim().toLowerCase();
	if (v === "gemini" || v === "google" || v === "url_context") return "gemini";
	if (v === "fallback" || v === "auto") return "fallback";
	return "http";
}

interface GeminiCandidate {
	content?: { parts?: Array<{ text?: string }> };
	groundingMetadata?: {
		webSearchQueries?: string[];
		groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
	};
	urlContextMetadata?: {
		urlMetadata?: Array<{ retrievedUrl?: string; urlRetrievalStatus?: string }>;
	};
}

interface GeminiGenResponse {
	candidates?: GeminiCandidate[];
	promptFeedback?: { blockReason?: string };
	error?: { message?: string; code?: number };
}

async function geminiGenerateContent(
	apiKey: string,
	model: string,
	body: Record<string, unknown>,
): Promise<GeminiGenResponse> {
	const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`;
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"x-goog-api-key": apiKey,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
	});

	const json = (await res.json().catch(() => ({}))) as GeminiGenResponse;
	if (!res.ok) {
		const msg = json.error?.message ?? JSON.stringify(json).slice(0, 500);
		throw new Error(`Gemini HTTP ${res.status}: ${msg}`);
	}
	return json;
}

function candidateText(c: GeminiCandidate | undefined): string {
	if (!c?.content?.parts) return "";
	return c.content.parts
		.map((p) => p.text ?? "")
		.filter(Boolean)
		.join("\n")
		.trim();
}

async function searchGeminiGrounded(
	query: string,
	maxResults: number,
	apiKey: string,
	model: string,
): Promise<string> {
	const body = {
		contents: [
			{
				role: "user",
				parts: [
					{
						text: `Search the web and answer concisely. User query:\n\n${query}\n\nCite current facts; if uncertain, say so.`,
					},
				],
			},
		],
		tools: [{ google_search: {} }],
		generationConfig: { maxOutputTokens: 2048 },
	};

	let data: GeminiGenResponse;
	try {
		data = await geminiGenerateContent(apiKey, model, body);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return `Gemini search error: ${msg}`;
	}

	if (data.promptFeedback?.blockReason) {
		return `Gemini search blocked: ${data.promptFeedback.blockReason}`;
	}

	const cand = data.candidates?.[0];
	const summary = candidateText(cand);
	const gm = cand?.groundingMetadata;
	const chunks = gm?.groundingChunks ?? [];
	const queries = gm?.webSearchQueries ?? [];

	const lines: string[] = [
		`**Search (Gemini + Google Search):** ${query}`,
		"",
		summary || "(no summary text in response)",
		"",
	];

	if (queries.length) {
		lines.push(`**Queries used:** ${queries.join("; ")}`, "");
	}

	if (chunks.length) {
		lines.push("**Sources:**", "");
		let n = 0;
		for (const ch of chunks) {
			if (n >= maxResults) break;
			const uri = ch.web?.uri ?? "";
			const title = ch.web?.title ?? "(untitled)";
			if (!uri) continue;
			n++;
			lines.push(`${n}. **${title}**`);
			lines.push(`   ${uri}`);
			lines.push("");
		}
	} else {
		lines.push("_No grounding chunks in API response (model may have answered without search)._", "");
	}

	return lines.join("\n").trim();
}

function urlContextStatusLine(cand: GeminiCandidate | undefined): string {
	const raw = cand as Record<string, unknown> | undefined;
	const ucm = (raw?.urlContextMetadata ?? raw?.url_context_metadata) as Record<string, unknown> | undefined;
	const um = (ucm?.urlMetadata ?? ucm?.url_metadata) as Array<Record<string, unknown>> | undefined;
	if (!um?.length) return "";
	return um
		.map((m) => {
			const url = String(m.retrievedUrl ?? m.retrieved_url ?? "?");
			const st = String(m.urlRetrievalStatus ?? m.url_retrieval_status ?? "unknown");
			return `${url}: ${st}`;
		})
		.join("\n");
}

async function fetchPageViaGeminiUrlContext(
	url: string,
	maxChars: number,
	apiKey: string,
	model: string,
): Promise<string> {
	const prompt = [
		"Extract the main readable content of the page at the URL below.",
		"Output plain text with optional ## headings. Be faithful; do not invent facts.",
		"If login or paywall blocks access, say so briefly.",
		"",
		`URL: ${url}`,
	].join("\n");

	const tokens = Math.min(8192, Math.max(1024, Math.ceil(maxChars / 3) + 512));

	const body = {
		contents: [{ role: "user", parts: [{ text: prompt }] }],
		tools: [{ url_context: {} }],
		generationConfig: { maxOutputTokens: tokens },
	};

	let data: GeminiGenResponse;
	try {
		data = await geminiGenerateContent(apiKey, model, body);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		throw new Error(`Gemini URL context: ${msg}`);
	}

	const cand = data.candidates?.[0];
	const text = candidateText(cand);
	if (!text) {
		return "(Gemini returned no text; URL may be blocked or unsupported.)";
	}

	const statusLine = urlContextStatusLine(cand);
	if (statusLine) {
		const combined = `**URL context metadata:**\n${statusLine}\n\n---\n\n${text}`;
		return combined.length > maxChars ? combined.slice(0, maxChars) + `\n\n… [truncated to ${maxChars} chars]` : combined;
	}

	return text.length > maxChars ? text.slice(0, maxChars) + `\n\n… [truncated to ${maxChars} chars]` : text;
}

function isLikelyDirectFetchFailure(text: string): boolean {
	return (
		text.startsWith("HTTP ") ||
		text.startsWith("Error:") ||
		text.includes("refuse to load") ||
		text.length < 40
	);
}

function unwrapDdgRedirect(href: string): string {
	try {
		if (!href.includes("uddg=")) return href;
		const u = new URL(href, "https://duckduckgo.com");
		const uddg = u.searchParams.get("uddg");
		if (uddg) return decodeURIComponent(uddg);
		return href;
	} catch {
		return href;
	}
}

async function searchBrave(query: string, maxResults: number, key: string): Promise<string> {
	const u = new URL("https://api.search.brave.com/res/v1/web/search");
	u.searchParams.set("q", query);
	u.searchParams.set("count", String(Math.min(20, Math.max(1, maxResults))));

	const res = await fetch(u, {
		headers: {
			Accept: "application/json",
			"X-Subscription-Token": key,
		},
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
	});

	if (!res.ok) {
		const t = await res.text().catch(() => "");
		return `Brave Search error ${res.status}: ${t.slice(0, 500)}`;
	}

	const data = (await res.json()) as {
		web?: { results?: Array<{ title?: string; url?: string; description?: string }> };
	};

	const results = data.web?.results ?? [];
	if (results.length === 0) {
		return `No web results for query: ${query}`;
	}

	const lines: string[] = [`**Search (Brave):** ${query}`, ""];
	let n = 0;
	for (const r of results) {
		if (n >= maxResults) break;
		const title = r.title ?? "(no title)";
		const url = r.url ?? "";
		const desc = r.description ?? "";
		n++;
		lines.push(`${n}. **${title}**`);
		lines.push(`   ${url}`);
		if (desc) lines.push(`   ${desc.replace(/\s+/g, " ").slice(0, 280)}`);
		lines.push("");
	}
	return lines.join("\n").trim();
}

async function searchDuckDuckGo(query: string, maxResults: number): Promise<string> {
	const body = new URLSearchParams({ q: query }).toString();
	const res = await fetch("https://html.duckduckgo.com/html/", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"User-Agent": DEFAULT_UA,
		},
		body,
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
	});

	if (!res.ok) {
		return `DuckDuckGo HTTP ${res.status}: could not run web search. Set BRAVE_SEARCH_API_KEY for reliable results.`;
	}

	const html = await res.text();
	const seen = new Set<string>();
	const items: Array<{ title: string; url: string }> = [];

	const re =
		/<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
	let m: RegExpExecArray | null;
	while ((m = re.exec(html)) !== null && items.length < maxResults) {
		const rawHref = m[1];
		const title = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
		const url = unwrapDdgRedirect(rawHref);
		if (!url.startsWith("http")) continue;
		if (seen.has(url)) continue;
		seen.add(url);
		if (!title) continue;
		items.push({ title, url });
	}

	if (items.length === 0) {
		return [
			`No parseable DuckDuckGo results for: ${query}`,
			"",
			"Try `BRAVE_SEARCH_API_KEY` from https://brave.com/search/api/ or retry later (DDG may block automated clients).",
		].join("\n");
	}

	const lines: string[] = [`**Search (DuckDuckGo HTML):** ${query}`, ""];
	items.forEach((it, i) => {
		lines.push(`${i + 1}. **${it.title}**`);
		lines.push(`   ${it.url}`);
		lines.push("");
	});
	return lines.join("\n").trim();
}

function htmlToText(html: string): string {
	return html
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
		.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function isAllowedUrl(urlStr: string): URL | null {
	try {
		const u = new URL(urlStr);
		if (u.protocol !== "http:" && u.protocol !== "https:") return null;
		const host = u.hostname.toLowerCase();
		if (host === "localhost" || host.endsWith(".localhost")) return null;
		if (host === "127.0.0.1" || host === "::1") return null;
		return u;
	} catch {
		return null;
	}
}

async function fetchPageText(url: string, maxChars: number): Promise<string> {
	const u = isAllowedUrl(url);
	if (!u) {
		return "Error: only http(s) URLs are allowed (no file://, localhost, or loopback).";
	}

	const res = await fetch(u, {
		headers: { "User-Agent": DEFAULT_UA, Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8" },
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		redirect: "follow",
	});

	if (!res.ok) {
		return `HTTP ${res.status} ${res.statusText} for ${u.href}`;
	}

	const buf = await res.arrayBuffer();
	if (buf.byteLength > MAX_FETCH_BYTES) {
		return `Error: response larger than ${MAX_FETCH_BYTES} bytes; refuse to load.`;
	}

	const ctype = res.headers.get("content-type") ?? "";
	let text: string;
	if (ctype.includes("text/html") || ctype.includes("application/xhtml")) {
		const html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
		text = htmlToText(html);
	} else {
		text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
	}

	const cap = Math.min(Math.max(2_000, maxChars), 120_000);
	if (text.length > cap) {
		return `${text.slice(0, cap)}\n\n… [truncated to ${cap} chars]`;
	}
	return text || "(empty body)";
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_e, ctx: ExtensionContext) => {
		applyExtensionDefaults(import.meta.url, ctx);
	});

	pi.registerTool({
		name: "web_search",
		label: "Web search",
		description:
			"Search the public web. Tries providers in WEB_TOOLS_SEARCH_ORDER (default: gemini, brave, duckduckgo). Gemini uses Google Search grounding when GEMINI_API_KEY is set (model WEB_TOOLS_GEMINI_MODEL, default gemini-2.0-flash). Brave needs BRAVE_SEARCH_API_KEY; else DuckDuckGo HTML scrape.",
		parameters: Type.Object({
			query: Type.String({ description: "Search query" }),
			max_results: Type.Optional(
				Type.Number({
					description: "Max results to return (1–15, default 8)",
					minimum: 1,
					maximum: 15,
				}),
			),
		}),
		async execute(_id, params, _s, _u, _ctx) {
			const { query, max_results } = params as { query: string; max_results?: number };
			const q = query.trim();
			if (!q) {
				return { content: [{ type: "text", text: "Empty query." }], details: {} };
			}
			const max = Math.min(15, Math.max(1, max_results ?? 8));

			const gKey = geminiKey();
			const bKey = braveKey();
			const model = geminiWebModel();
			const order = searchProviderOrder();
			const errors: string[] = [];

			try {
				for (const provider of order) {
					if (provider === "gemini") {
						if (!gKey) continue;
						const text = await searchGeminiGrounded(q, max, gKey, model);
						if (!text.startsWith("Gemini search error") && !text.startsWith("Gemini search blocked")) {
							return { content: [{ type: "text", text }], details: {} };
						}
						errors.push(text);
						continue;
					}
					if (provider === "brave") {
						if (!bKey) continue;
						try {
							const text = await searchBrave(q, max, bKey);
							if (text.startsWith("Brave Search error") && text.length < 1200) {
								errors.push(text);
								continue;
							}
							return { content: [{ type: "text", text }], details: {} };
						} catch (e) {
							errors.push(e instanceof Error ? e.message : String(e));
						}
						continue;
					}
					if (provider === "duckduckgo") {
						try {
							const text = await searchDuckDuckGo(q, max);
							return { content: [{ type: "text", text }], details: {} };
						} catch (e) {
							errors.push(e instanceof Error ? e.message : String(e));
						}
					}
				}

				const hint =
					errors.length > 0
						? errors.join("\n---\n")
						: "No provider ran — set GEMINI_API_KEY and/or BRAVE_SEARCH_API_KEY, or include duckduckgo in WEB_TOOLS_SEARCH_ORDER.";
				return {
					content: [{ type: "text", text: `web_search: all configured providers failed or were skipped.\n\n${hint}` }],
					details: {},
				};
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				return {
					content: [
						{
							type: "text",
							text: `web_search failed: ${msg}`,
						},
					],
					details: {},
				};
			}
		},
	});

	pi.registerTool({
		name: "web_fetch",
		label: "Web fetch",
		description:
			"Fetch a public http(s) URL as plain text. Default: direct HTTP + HTML strip. Set WEB_TOOLS_FETCH_BACKEND=gemini to use Gemini URL context (GEMINI_API_KEY). WEB_TOOLS_FETCH_BACKEND=fallback tries HTTP then Gemini. Localhost blocked for direct fetch.",
		parameters: Type.Object({
			url: Type.String({ description: "Full http(s) URL to fetch" }),
			max_chars: Type.Optional(
				Type.Number({
					description: "Max characters after extraction (default 50_000, max 120_000)",
					minimum: 2000,
					maximum: 120_000,
				}),
			),
		}),
		async execute(_id, params, _s, _u, _ctx) {
			const { url, max_chars } = params as { url: string; max_chars?: number };
			const u = url.trim();
			if (!u) {
				return { content: [{ type: "text", text: "Empty url." }], details: {} };
			}
			const cap = max_chars ?? 50_000;
			const backend = webFetchBackend();
			const gKey = geminiKey();
			const model = geminiWebModel();

			try {
				let text: string;
				let via = "direct HTTP";

				if (backend === "gemini") {
					if (gKey) {
						text = await fetchPageViaGeminiUrlContext(u, cap, gKey, model);
						via = "Gemini URL context";
					} else {
						text = await fetchPageText(u, cap);
						via = "direct HTTP (GEMINI_API_KEY missing for WEB_TOOLS_FETCH_BACKEND=gemini)";
					}
				} else if (backend === "fallback") {
					text = await fetchPageText(u, cap);
					if (gKey && isLikelyDirectFetchFailure(text)) {
						text = await fetchPageViaGeminiUrlContext(u, cap, gKey, model);
						via = "Gemini URL context (after direct HTTP weak/failed)";
					}
				} else {
					text = await fetchPageText(u, cap);
				}

				const header = `**Fetched (${via}):** ${u}\n\n`;
				return { content: [{ type: "text", text: header + text }], details: {} };
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				return { content: [{ type: "text", text: `web_fetch failed: ${msg}` }], details: {} };
			}
		},
	});
}
