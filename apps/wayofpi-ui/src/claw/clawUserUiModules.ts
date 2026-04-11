/**
 * Register extra Claw nav tabs / full-width panels here.
 *
 * This module is imported from `App.tsx` at startup so `registerClawUiModule`
 * runs before the first paint.
 *
 * Example:
 *
 * ```ts
 * import { Boxes } from "lucide-react";
 * import { registerClawUiModule } from "./clawUiModules";
 *
 * registerClawUiModule({
 *   id: "operator-dash",
 *   label: "Dash",
 *   title: "Operator dashboard",
 *   icon: Boxes,
 *   order: 40,
 *   render: ({ appearanceDark }) => (
 *     <div className={`flex flex-1 items-center justify-center p-6 text-sm ${
 *       appearanceDark ? "text-[#858585]" : "text-[#666]"
 *     }`}>
 *       Build your UI here.
 *     </div>
 *   ),
 * });
 * ```
 */

export {};
