import React from "react";
import {createRoot} from "react-dom/client";
import {registerDemoAdministrator} from "../lib/demoAccounts.js";
import {digitsOnly} from "../lib/paymentMethods.js";
import "../../paginaReserva.css";

function AdministratorRegistrationPage() {
	const [cpf, setCpf] = React.useState("");
	const [error, setError] = React.useState("");
	const [saving, setSaving] = React.useState(false);
	function formatCpf(value) {
		const digits = digitsOnly(value).slice(0, 11);
		if (digits.length > 9) return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
		if (digits.length > 6) return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
		if (digits.length > 3) return `${digits.slice(0,3)}.${digits.slice(3)}`;
		return digits;
	}
	async function submit(event) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const password = String(form.get("password"));
		if (password !== String(form.get("confirmPassword"))) {
			setError("As senhas não coincidem.");
			return;
		}
		const normalizedCpf = digitsOnly(cpf);
		if (normalizedCpf.length !== 11) {
			setError("Informe um CPF com 11 dígitos.");
			return;
		}
		setSaving(true);
		setError("");
		try {
			await registerDemoAdministrator({
				name:String(form.get("name")).trim(),
				email:String(form.get("email")).trim().toLowerCase(),
				cpf:normalizedCpf
			}, password, String(form.get("registrationCode")));
			window.location.assign("loginAdministrador.html");
		} catch (saveError) {
			setError(`${saveError.message} Confira se a API está em execução.`);
			setSaving(false);
		}
	}
	return <div className="min-h-screen bg-[#f4f6fa] text-[#172749]">
		<header className="bg-[#1d2b52] text-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6"><a href="paginaInicialMotorista.html" className="font-display text-xl font-bold text-white no-underline">FluxoPark</a><a href="loginAdministrador.html" className="text-sm font-semibold text-white">Já tenho acesso</a></div></header>
		<main className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
			<section className="rounded-xl border border-[#e1e5ed] bg-white p-6 shadow-sm sm:p-9">
				<p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6250b5]">Acesso restrito</p><h1 className="mt-2 font-display text-3xl font-semibold">Cadastrar administrador</h1>
				<p className="mt-2 text-sm leading-6 text-[#68738a]">O código de cadastro é verificado pela API local; para implantação, defina `ADMIN_REGISTRATION_CODE` no ambiente do servidor.</p>
				<form onSubmit={submit} className="mt-6 grid gap-4">
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="admin-name">Nome<input id="admin-name" name="name" required minLength={2} maxLength={100} autoComplete="name" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 font-normal" /></label>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="admin-email">E-mail<input id="admin-email" name="email" type="email" required autoComplete="email" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 font-normal" /></label>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="admin-cpf">CPF<input id="admin-cpf" inputMode="numeric" required maxLength={14} value={cpf} onChange={event => setCpf(formatCpf(event.target.value))} placeholder="000.000.000-00" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 font-normal" /></label>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="admin-password">Senha<input id="admin-password" name="password" type="password" required minLength={8} autoComplete="new-password" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 font-normal" /></label>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="admin-confirm">Confirmar senha<input id="admin-confirm" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 font-normal" /></label>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="admin-code">Código de administrador<input id="admin-code" name="registrationCode" type="password" required autoComplete="off" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 font-normal" /></label>
					{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</p>}
					<p role="note" className="rounded-lg border border-[#f1dfae] bg-[#fff9e9] px-3 py-2.5 text-xs leading-5 text-[#785713]">Protótipo local: o json-server não oferece autenticação/autorização completa. Use apenas dados fictícios.</p>
					<button disabled={saving} className="min-h-12 rounded-lg bg-[#6250b5] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Verificando..." : "Criar conta administrativa"}</button>
				</form>
			</section>
		</main>
	</div>;
}
createRoot(document.getElementById("root")).render(<AdministratorRegistrationPage />);
