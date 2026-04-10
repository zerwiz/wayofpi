/** GET `/api/file` JSON. Omitted `encoding` means UTF-8 text (legacy shape). */
export type FileGetResponse =
	| { path: string; encoding?: "utf8"; content: string }
	| { path: string; encoding: "base64"; mimeType: string; content: string };

export type FilePreview =
	| { kind: "image"; src: string }
	| { kind: "binary"; mimeType: string };
