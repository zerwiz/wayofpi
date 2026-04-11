import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			"/api": { target: "http://127.0.0.1:3333", changeOrigin: true },
			// Longer path first so `/ws` does not steal terminal upgrades.
			"/ws/terminal": {
				target: "ws://127.0.0.1:3333",
				ws: true,
				changeOrigin: true,
			},
			"/ws": {
				target: "ws://127.0.0.1:3333",
				ws: true,
				changeOrigin: true,
			},
		},
	},
});
