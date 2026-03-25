/**
 * Auto-load shim: Pi scans .pi/extensions/*.ts as extensions only.
 * The real module lives under ../../extensions/ so ./themeMap.ts resolves there.
 */
export { default } from "../../extensions/extension-picker.ts";

