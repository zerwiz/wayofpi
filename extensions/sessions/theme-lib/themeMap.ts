/**
 * themeMap.ts — Simple theme configuration
 */

/** Available theme names */
export type ThemeName =
  | "default"
  | "light"
  | "dark"
  | "ocean"
  | "forest"
  | "catppuccin-mocha"
  | "cyberpunk"
  | "dracula"
  | "everforest"
  | "gruvbox"
  | "midnight-ocean"
  | "nord"
  | "ocean-breeze"
  | "rose-pine"
  | "synthwave"
  | "tokyo-night";

export const themeMap: Record<ThemeName, Record<string, string>> = {
  default: {
    bg: "#1a1a2e",
    fg: "#eaeaea",
    accent: "#4a9eff",
    muted: "#6c757d",
    danger: "#dc3545",
  },
  light: {
    bg: "#ffffff",
    fg: "#212529",
    accent: "#007bff",
    muted: "#6c757d",
    danger: "#dc3545",
  },
  dark: {
    bg: "#121212",
    fg: "#e0e0e0",
    accent: "#bb86fc",
    muted: "#757575",
    danger: "#cf6679",
  },
  ocean: {
    bg: "#0a1929",
    fg: "#94a3b8",
    accent: "#06b6d4",
    muted: "#475569",
    danger: "#f43f5e",
  },
  forest: {
    bg: "#0d2618",
    fg: "#7ee787",
    accent: "#22c55e",
    muted: "#4ade80",
    danger: "#f87171",
  },
  "catppuccin-mocha": {
    bg: "#1e1d29",
    fg: "#cdd6f4",
    accent: "#cba6f7",
    muted: "#a6adc8",
    danger: "#f38ba8",
  },
  cyberpunk: {
    bg: "#000000",
    fg: "#ffffff",
    accent: "#00ffff",
    muted: "#7f7f7f",
    danger: "#ff0055",
  },
  dracula: {
    bg: "#282a36",
    fg: "#f8f8f2",
    accent: "#bd93f9",
    muted: "#6272a4",
    danger: "#ff5555",
  },
  everforest: {
    bg: "#1d2021",
    fg: "#ebc87d",
    accent: "#88c0d0",
    muted: "#a3b1a6",
    danger: "#f28f8f",
  },
  gruvbox: {
    bg: "#282828",
    fg: "#ebdbb2",
    accent: "#d5c4a1",
    muted: "#a89f81",
    danger: "#ff5555",
  },
  "midnight-ocean": {
    bg: "#1b2b34",
    fg: "#d8dee9",
    accent: "#7fbbb",
    muted: "#5c6b7b",
    danger: "#e76f6f",
  },
  nord: {
    bg: "#2e3440",
    fg: "#d8dee9",
    accent: "#88c0d0",
    muted: "#4c566a",
    danger: "#bf616a",
  },
  "ocean-breeze": {
    bg: "#082032",
    fg: "#89b4ba",
    accent: "#0077b6",
    muted: "#49566a",
    danger: "#e63946",
  },
  "rose-pine": {
    bg: "#191724",
    fg: "#e0def4",
    accent: "#f6c177",
    muted: "#6e6a82",
    danger: "#eb6f92",
  },
  synthwave: {
    bg: "#121212",
    fg: "#ffffff",
    accent: "#ff00ff",
    muted: "#707070",
    danger: "#ff0000",
  },
  "tokyo-night": {
    bg: "#1a1b26",
    fg: "#a9b1d6",
    accent: "#7aa2f7",
    muted: "#565f89",
    danger: "#f7768e",
  },
};
