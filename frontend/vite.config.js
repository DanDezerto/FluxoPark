import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
	root: __dirname,
	publicDir: resolve(__dirname, "public"),
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
				index: resolve(__dirname, "index.html"),
				loginUsuario: resolve(__dirname, "loginUsuario.html"),
				cadastroUsuario: resolve(__dirname, "cadastroUsuario.html"),
				contaUsuario: resolve(__dirname, "contaUsuario.html"),
				loginEstacionamento: resolve(__dirname, "loginEstacionamento.html"),
				cadastroEstacionamento: resolve(__dirname, "cadastroEstacionamento.html"),
				paginaInicialMotorista: resolve(__dirname, "paginaInicialMotorista.html"),
				paginaReserva: resolve(__dirname, "paginaReserva.html"),
				cadastroAdministrador: resolve(__dirname, "cadastroAdministrador.html"),
				loginAdministrador: resolve(__dirname, "loginAdministrador.html"),
				tratamentoRequisicoes: resolve(__dirname, "tratamentoRequisicoes.html"),
				minhasDenuncias: resolve(__dirname, "minhasDenuncias.html"),
				metodosPagamento: resolve(__dirname, "metodosPagamento.html")
			}
		}
	}
});
