/** Display names in recaps / replay (not stored in JSONL roles). */
export const CHAT_USER_LABEL = "zerwis";
export const CHAT_AGENT_LABEL = "pi";

// No-op extension factory so Pi can load this file as an extension
// without warnings while other extensions import the labels.
export default function _chatLabelsExtension(): void {
  // intentionally empty
}
