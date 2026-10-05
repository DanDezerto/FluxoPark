import React from "react";
import { createRoot } from "react-dom/client";
import {registerDemoAccount} from "../lib/demoAccounts.js";
import "../../paginaReserva.css";

function UserRegistrationPage() {
	const [notice, setNotice] = React.useState("");
	const [error, setError] = React.useState("");
	const [saving, setSaving] = React.useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		const formElement = event.currentTarget;
		const formData = new FormData(formElement);
		if (formData.get("password") !== formData.get("passwordConfirm")) {
			setError("As senhas não coincidem.");
			setNotice("");
			return;
		}
		setError("");
		setNotice("");
		setSaving(true);
		try {
			await registerDemoAccount("users", {
				name: String(formData.get("name")).trim(),
				email: String(formData.get("email")).trim().toLowerCase(),
				phone: String(formData.get("phone")).trim(),
				vehicles: [{
					id: `vehicle-${window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 12)}`,
					plate: String(formData.get("vehiclePlate")).trim().toUpperCase(),
					model: String(formData.get("vehicleModel")).trim(),
					color: String(formData.get("vehicleColor")).trim()
				}]
			}, String(formData.get("password")));
			setNotice("Cadastro demonstrativo salvo. Agora você já pode entrar com seu e-mail e senha.");
			formElement.reset();
		} catch (saveError) {
			console.error("Não foi possível salvar o cadastro demonstrativo.", saveError);
			setError(`${saveError.message} Confira se a API local está em execução.`);
		} finally {
			setSaving(false);
		}
	}

	return <div className="min-h-screen bg-[#f4f6fa] text-[#172749]">
		<header className="bg-[#1d2b52] text-white">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
				<a href="paginaInicialMotorista.html" className="flex items-center gap-3 text-white no-underline">
					<img src="RefsVisuais/FluxoPark%20-%20Logotipo%20(1).png" alt="" className="h-11 w-11 object-contain" />
					<span><strong className="font-display text-xl font-bold">FluxoPark</strong><small className="block text-xs text-white/70">Estacionamento Dinâmico</small></span>
				</a>
				<a href="loginUsuario.html" className="text-sm font-semibold text-white/85 hover:text-white">Já tenho conta</a>
			</div>
		</header>
		<main className="mx-auto grid min-h-[calc(100vh-76px)] max-w-6xl content-center gap-6 px-4 py-8 md:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] md:px-6">
			<section className="flex flex-col justify-between rounded-xl bg-[#1d2b52] p-7 text-white sm:p-9">
				<div>
					<p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a8baff]">Área do motorista</p>
					<h1 className="mt-3 max-w-md font-display text-3xl font-semibold leading-tight sm:text-4xl">Encontre sua próxima vaga com facilidade.</h1>
					<p className="mt-4 max-w-md text-sm leading-6 text-white/75">Crie sua conta para acompanhar sua experiência no FluxoPark.</p>
				</div>
				<div className="mt-10 border-t border-white/15 pt-5 text-sm text-white/70">Busca, tarifas e reservas em um só lugar.</div>
			</section>
			<section className="rounded-xl border border-[#e1e5ed] bg-white p-6 shadow-sm sm:p-9" aria-labelledby="registration-title">
				<p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6250b5]">FluxoPark</p>
				<h2 id="registration-title" className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Criar conta de motorista</h2>
				<p className="mt-2 text-sm leading-6 text-[#68738a]">Preencha seus dados para começar.</p>
				<form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="register-name">Nome completo
						<input id="register-name" name="name" type="text" autoComplete="name" required minLength={2} placeholder="Seu nome" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
					</label>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="register-email">E-mail
						<input id="register-email" name="email" type="email" autoComplete="email" required placeholder="voce@exemplo.com" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
					</label>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="register-phone">Celular
						<input id="register-phone" name="phone" type="tel" autoComplete="tel" required placeholder="(11) 99999-9999" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
					</label>
					<p className="pt-1 text-sm font-semibold text-[#172749]">Informações do veículo</p>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="register-vehicle-plate">Placa
						<input id="register-vehicle-plate" name="vehiclePlate" type="text" autoComplete="off" required maxLength={8} placeholder="ABC1D23" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal uppercase outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
					</label>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="register-vehicle-model">Modelo
						<input id="register-vehicle-model" name="vehicleModel" type="text" required placeholder="Ex.: Honda Civic" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
					</label>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="register-vehicle-color">Cor
						<input id="register-vehicle-color" name="vehicleColor" type="text" required placeholder="Ex.: Prata" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
					</label>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="register-password">Senha
						<input id="register-password" name="password" type="password" autoComplete="new-password" minLength={8} required placeholder="Mínimo de 8 caracteres" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
					</label>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="register-password-confirm">Confirmar senha
						<input id="register-password-confirm" name="passwordConfirm" type="password" autoComplete="new-password" minLength={8} required placeholder="Digite a senha novamente" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
					</label>
					<p role="note" className="rounded-lg border border-[#f1dfae] bg-[#fff9e9] px-3 py-2.5 text-xs leading-5 text-[#785713]">Cadastro demonstrativo salvo na API local. Não use dados pessoais ou senhas reais: esta versão não oferece autenticação segura.</p>
					{error && <p role="alert" className="rounded-lg border border-[#f0caca] bg-[#fff5f5] px-3 py-2.5 text-sm leading-5 text-[#9b2929]">{error}</p>}
					{notice && <p role="status" className="rounded-lg border border-[#cce8d7] bg-[#f0faf4] px-3 py-2.5 text-sm leading-5 text-[#24633d]">{notice}</p>}
					<button type="submit" disabled={saving} className="mt-1 min-h-12 rounded-lg bg-[#6250b5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#51419c] disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#6250b5] focus:ring-offset-2">{saving ? "Salvando..." : "Criar conta"}</button>
				</form>
				<p className="mt-6 border-t border-[#edf0f5] pt-5 text-sm text-[#68738a]">Já tem uma conta? <a href="loginUsuario.html" className="font-semibold text-[#51419c] underline underline-offset-2">Entrar</a></p>
			</section>
		</main>
	</div>;
}

createRoot(document.getElementById("root")).render(<UserRegistrationPage />);
