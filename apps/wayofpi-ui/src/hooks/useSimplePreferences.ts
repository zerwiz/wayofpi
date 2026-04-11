import { useCallback, useEffect, useState } from "react";

/** Persisted Simple UI chrome: dark vs light (Technical UI–aligned grays). */
export type SimpleColorMode = "dark" | "light";

const KEY_MODE = "wayofpi.simple.colorMode";
const LEGACY_DARK = "wayofpi.simple.darkMode";
const KEY_MD_PANE = "wayofpi.simple.mdPane";

/** Markdown in Simple file panel: raw source vs rendered preview (GitHub-style). */
export type SimpleMarkdownPaneMode = "source" | "preview";

/** Simple chat: show token-by-token reply vs wait for full message (localStorage). */
export const SIMPLE_CHAT_STREAM_UI_KEY = "wayofpi.simple.chatStreamUi";

export function readSimpleChatStreamUiEnabled(): boolean {
	try {
		return localStorage.getItem(SIMPLE_CHAT_STREAM_UI_KEY) !== "0";
	} catch {
		return true;
	}
}

export function writeSimpleChatStreamUiEnabled(on: boolean): void {
	try {
		localStorage.setItem(SIMPLE_CHAT_STREAM_UI_KEY, on ? "1" : "0");
	} catch {
		/* ignore */
	}
}

function readColorMode(): SimpleColorMode {
	try {
		const v = localStorage.getItem(KEY_MODE);
		if (v === "light" || v === "dark") return v;
		const legacy = localStorage.getItem(LEGACY_DARK);
		if (legacy === "0") return "light";
		if (legacy === "1") return "dark";
	} catch {
		/* ignore */
	}
	return "dark";
}

function readMarkdownPaneMode(): SimpleMarkdownPaneMode {
	try {
		const v = localStorage.getItem(KEY_MD_PANE);
		if (v === "source" || v === "preview") return v;
	} catch {
		/* ignore */
	}
	return "preview";
}

export function useSimplePreferences() {
	const [colorMode, setColorModeState] = useState<SimpleColorMode>("dark");
	const [approvalQueue, setApprovalQueueState] = useState(true);
	const [markdownPaneMode, setMarkdownPaneModeState] = useState<SimpleMarkdownPaneMode>("preview");

	useEffect(() => {
		setColorModeState(readColorMode());
		setMarkdownPaneModeState(readMarkdownPaneMode());
		try {
			const aq = localStorage.getItem("wayofpi.simple.approvalQueue");
			if (aq === "1") setApprovalQueueState(true);
			else if (aq === "0") setApprovalQueueState(false);
		} catch {
			/* ignore */
		}
	}, []);

	const setColorMode = useCallback((next: SimpleColorMode) => {
		setColorModeState(next);
		try {
			localStorage.setItem(KEY_MODE, next);
			localStorage.removeItem(LEGACY_DARK);
		} catch {
			/* ignore */
		}
	}, []);

	const setApprovalQueue = useCallback((next: boolean) => {
		setApprovalQueueState(next);
		try {
			localStorage.setItem("wayofpi.simple.approvalQueue", next ? "1" : "0");
		} catch {
			/* ignore */
		}
	}, []);

	const setMarkdownPaneMode = useCallback((next: SimpleMarkdownPaneMode) => {
		setMarkdownPaneModeState(next);
		try {
			localStorage.setItem(KEY_MD_PANE, next);
		} catch {
			/* ignore */
		}
	}, []);

	const isDark = colorMode === "dark";

	/** @deprecated use colorMode — kept for settings toggle wiring */
	const darkMode = isDark;
	const setDarkMode = useCallback((on: boolean) => setColorMode(on ? "dark" : "light"), [setColorMode]);

	return {
		colorMode,
		setColorMode,
		isDark,
		approvalQueue,
		setApprovalQueue,
		markdownPaneMode,
		setMarkdownPaneMode,
		darkMode,
		setDarkMode,
	};
}
