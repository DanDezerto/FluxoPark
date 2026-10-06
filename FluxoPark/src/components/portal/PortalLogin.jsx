import React from "react";
import {authenticateDemoAccount} from "../../lib/demoAccounts.js";
import "../../../paginaReserva.css";

export function PortalLogin({accountType}) {
	const isDriver = accountType === "driver";
	const isAdministrator = accountType === "admin";
	const title = isDriver ? "Acesse sua conta" : isAdministrator ? "Acesso administrativo" : "Acesso do estacionamento";
	const description = isDriver
		? "Entre para continuar sua experiência de busca e reserva."
		: isAdministrator
			? "Entre para tratar denúncias e solicitações de novos parceiros."
		: "Gerencie os dados, tarifas e vagas do seu estacionamento.";
	const target = isDriver ? "contaUsuario.html" : isAdministrator ? "tratamentoRequisicoes.html" : "cadastroEstacionamento.html";
	const otherLogin = isDriver ? "loginEstacionamento.html" : "loginUsuario.html";
	const collection = isDriver ? "users" : isAdministrator ? "administrators" : "parkingAccounts";
	const otherLabel = isDriver ? "Acessar como estacionamento" : "Acessar como motorista";
	const [error, setError] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setSubmitting(true);
		const formData = new FormData(event.currentTarget);
		try {
			await authenticateDemoAccount(collection, String(formData.get("email")), String(formData.get("password")));
			window.location.assign(target);
		} catch (loginError) {
			console.error("Falha no login demonstrativo.", loginError);
			setError(`${loginError.message} Confira se a API local está em execução.`);
			setSubmitting(false);
		}
	}

	return <div className="min-h-screen bg-[#f4f6fa] text-[#172749]">
		<header className="bg-[#1d2b52] text-white">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
				<a href="paginaInicialMotorista.html" className="flex items-center gap-3 text-white no-underline">
					<img src="RefsVisuais/FluxoPark%20-%20Logotipo%20(1).png" alt="" className="h-11 w-11 object-contain" />
					<span><strong className="font-display text-xl font-bold">FluxoPark</strong><small className="block text-xs text-white/70">Estacionamento Dinâmico</small></span>
				</a>
				<a href="paginaInicialMotorista.html" className="text-sm font-semibold text-white/85 hover:text-white">Voltar à busca</a>
			</div>
		</header>
		<main className="mx-auto grid min-h-[calc(100vh-76px)] max-w-6xl content-center gap-6 px-4 py-8 md:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] md:px-6">
			<section className="flex flex-col justify-between rounded-xl bg-[#1d2b52] p-7 text-white sm:p-9">
				<div>
					<p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a8baff]">{isDriver ? "Área do motorista" : isAdministrator ? "FluxoPark" : "Área do parceiro"}</p>
					<h1 className="mt-3 max-w-md font-display text-3xl font-semibold leading-tight sm:text-4xl">{isDriver ? "Sua próxima vaga começa aqui." : isAdministrator ? "Tratamento de requisições." : "Seu estacionamento, organizado."}</h1>
					<p className="mt-4 max-w-md text-sm leading-6 text-white/75">{description}</p>
				</div>
				<div className="mt-10 border-t border-white/15 pt-5 text-sm text-white/70">Busca, tarifas e reservas em um só lugar.</div>
			</section>
			<section className="rounded-xl border border-[#e1e5ed] bg-white p-6 shadow-sm sm:p-9" aria-labelledby="login-title">
				<p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6250b5]">FluxoPark</p>
				<h2 id="login-title" className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{title}</h2>
				<p className="mt-2 text-sm leading-6 text-[#68738a]">Entre com o e-mail e a senha usados no cadastro demonstrativo.</p>
				<form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="login-email">{isDriver ? "E-mail" : "E-mail do responsável"}
						<input id="login-email" name="email" type="email" autoComplete="username" required placeholder="voce@exemplo.com" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
					</label>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="login-password">Senha
						<input id="login-password" name="password" type="password" autoComplete="current-password" minLength={8} required placeholder="Mínimo de 8 caracteres" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
					</label>
					<p role="note" className="rounded-lg border border-[#f1dfae] bg-[#fff9e9] px-3 py-2.5 text-xs leading-5 text-[#785713]">Acesso demonstrativo local. Não use dados reais: esta versão não oferece autenticação segura.</p>
					{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</p>}
					<button type="submit" disabled={submitting} className="mt-1 min-h-12 rounded-lg bg-[#6250b5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#51419c] disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#6250b5] focus:ring-offset-2">{submitting ? "Verificando..." : "Entrar"}</button>
				</form>
				{!isAdministrator && <p className="mt-6 border-t border-[#edf0f5] pt-5 text-sm text-[#68738a]">{isDriver ? "Ainda não tem conta?" : "Quer reservar uma vaga?"} <a href={isDriver ? "cadastroUsuario.html" : otherLogin} className="font-semibold text-[#51419c] underline underline-offset-2">{isDriver ? "Cadastre-se" : otherLabel}</a></p>}
				{isDriver && <p className="mt-3 text-sm text-[#68738a]">É um estacionamento parceiro? <a href={otherLogin} className="font-semibold text-[#51419c] underline underline-offset-2">{otherLabel}</a></p>}
				{!isDriver && !isAdministrator && <p className="mt-3 text-sm text-[#68738a]">Ainda não é parceiro? <a href="cadastroEstacionamento.html" className="font-semibold text-[#51419c] underline underline-offset-2">Cadastre seu estabelecimento</a></p>}
				{isDriver && <p className="mt-3 text-sm text-[#68738a]"><a href="loginAdministrador.html" className="font-semibold text-[#51419c] underline underline-offset-2">Acesso administrativo</a></p>}
				{isAdministrator && <p className="mt-6 border-t border-[#edf0f5] pt-5 text-sm text-[#68738a]">Ainda não tem acesso? <a href="cadastroAdministrador.html" className="font-semibold text-[#51419c] underline underline-offset-2">Cadastrar administrador</a></p>}
			</section>
		</main>
	</div>;
}