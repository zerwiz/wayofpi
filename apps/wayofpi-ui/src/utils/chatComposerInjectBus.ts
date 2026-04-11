/** Single active listener — Simple and Technical shells mount one chat composer at a time. */
type InjectFn = (text: string) => void;

let listener: InjectFn | null = null;

export function registerChatComposerInject(fn: InjectFn | null): void {
	listener = fn;
}

export function injectIntoChatComposer(text: string): void {
	const t = text.trim();
	if (!t) return;
	listener?.(t);
}
