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
			"/reviews": "http://localhost:3000",
			"/users": "http://localhost:3000",
			"/parkingAccounts": "http://localhost:3000",
			"/paymentMethods": "http://localhost:3000",
			"/reports": "http://localhost:3000",
			"/partnerRequests": "http://localhost:3000",
			"/administrators": "http://localhost:3000",
			"/admin": "http://localhost:3000"
		}
	},
	build: {
		outDir: resolve(__dirname, "dist"),
		emptyOutDir: true,
		rollupOptions: {
			input: {
				index: resolve(__dirname, "FluxoPark", "index.html"),
				loginUsuario: resolve(__dirname, "FluxoPark", "loginUsuario.html"),
				cadastroUsuario: resolve(__dirname, "FluxoPark", "cadastroUsuario.html"),
				contaUsuario: resolve(__dirname, "FluxoPark", "contaUsuario.html"),
				loginEstacionamento: resolve(__dirname, "FluxoPark", "loginEstacionamento.html"),
				cadastroEstacionamento: resolve(__dirname, "FluxoPark", "cadastroEstacionamento.html"),
				paginaInicialMotorista: resolve(__dirname, "FluxoPark", "paginaInicialMotorista.html"),
				paginaReserva: resolve(__dirname, "FluxoPark", "paginaReserva.html"),
				cadastroAdministrador: resolve(__dirname, "FluxoPark", "cadastroAdministrador.html"),
				loginAdministrador: resolve(__dirname, "FluxoPark", "loginAdministrador.html"),
				tratamentoRequisicoes: resolve(__dirname, "FluxoPark", "tratamentoRequisicoes.html"),
				minhasDenuncias: resolve(__dirname, "FluxoPark", "minhasDenuncias.html"),
				metodosPagamento: resolve(__dirname, "FluxoPark", "metodosPagamento.html")
			}
		}
	}
});
