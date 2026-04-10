import { forwardRef, useCallback, useEffect, useRef } from "react";
import { useFileEditor } from "../hooks/useFileEditor";
import type { WorkspaceEditorRef } from "../types/workspaceEditor";
import { EditorPanel, type EditorPanelProps } from "./EditorPanel";

export type MainEditorColumnApi = {
	save: () => Promise<void>;
	reload: () => Promise<void>;
	getContent: () => string;
	dirty: boolean;
};

type SharedEditorPanelProps = Omit<
	EditorPanelProps,
	| "path"
	| "content"
	| "onChange"
	| "loading"
	| "error"
	| "dirty"
	| "diskBaseline"
	| "onSave"
	| "onCursor"
	| "onClosePanel"
	| "isActiveColumn"
>;

/**
 * One main-workspace editor column with its own `useFileEditor` state (so multiple files stay open side by side).
 */
export const TechnicalEditorColumn = forwardRef<
	WorkspaceEditorRef,
	{
		path: string;
		isFocused: boolean;
		autoSave: boolean;
		onActivate: () => void;
		onClose: () => void;
		onColumnApi: (path: string, api: MainEditorColumnApi | null) => void;
		onFocusedMeta: (meta: { dirty: boolean; loading: boolean; error: string | null }) => void;
		onCursor?: (line: number, col: number) => void;
		shared: SharedEditorPanelProps;
	}
>(function TechnicalEditorColumn(
	{ path, isFocused, autoSave, onActivate, onClose, onColumnApi, onFocusedMeta, onCursor, shared },
	ref,
) {
	const { content, setContent, lastPersistedContent, loading, error, dirty, save, reload } = useFileEditor(path, {
		autoSave,
	});

	const contentRef = useRef(content);
	contentRef.current = content;

	const publishApi = useCallback(() => {
		const api: MainEditorColumnApi = {
			save,
			reload,
			getContent: () => contentRef.current,
			dirty,
		};
		onColumnApi(path, api);
	}, [path, save, reload, dirty, onColumnApi]);

	useEffect(() => {
		publishApi();
		return () => onColumnApi(path, null);
	}, [path, publishApi, onColumnApi]);

	useEffect(() => {
		if (!isFocused) return;
		onFocusedMeta({ dirty, loading, error: error ?? null });
	}, [isFocused, dirty, loading, error, onFocusedMeta]);

	return (
		<div
			className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden outline-none"
			onPointerDownCapture={() => onActivate()}
			role="presentation"
		>
			<EditorPanel
				ref={ref}
				path={path}
				content={content}
				onChange={setContent}
				loading={loading}
				error={error}
				dirty={dirty}
				diskBaseline={lastPersistedContent}
				onSave={() => void save()}
				onCursor={isFocused ? onCursor : undefined}
				onClosePanel={onClose}
				isActiveColumn={isFocused}
				{...shared}
			/>
		</div>
	);
});
