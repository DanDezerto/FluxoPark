import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
	root: resolve(__dirname, "FluxoPark"),
	publicDir: resolve(__dirname, "FluxoPark", "public"),
	server: {
		proxy: {
			"/parkings": "http://localhost:3000",
			"/spots": "http://localhost:3000",
			"/reservations": "http://localhost:3000",
			"/reviews": "http://localhost:3000"
		}
	},
	build: {
		outDir: resolve(__dirname, "dist"),
		emptyOutDir: true,
		rollupOptions: {
			input: {
				paginaInicialMotorista: resolve(__dirname, "FluxoPark", "paginaInicialMotorista.html"),
				paginaReserva: resolve(__dirname, "FluxoPark", "paginaReserva.html")
			}
		}
	}
});
