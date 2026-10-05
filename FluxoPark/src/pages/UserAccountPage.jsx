import React from "react";
import {createRoot} from "react-dom/client";
import {createDemoId, demoRequest, endDemoSession, readDemoSession} from "../lib/demoAccounts.js";
import "../../paginaReserva.css";

const inputClass = "min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15";

function UserAccountPage() {
	const session = readDemoSession("driver");
	const [account, setAccount] = React.useState(null);
	const [reservations, setReservations] = React.useState([]);
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState("");
	const [notice, setNotice] = React.useState("");
	const [vehicle, setVehicle] = React.useState({plate:"", model:"", color:""});

	React.useEffect(() => {
		if (!session) {
			window.location.replace("loginUsuario.html");
			return;
		}
		Promise.all([
			demoRequest(`users/${encodeURIComponent(session.id)}`),
			demoRequest("reservations")
		]).then(([user, items]) => {
			setAccount(user);
			setReservations(items.filter(item => item.driverEmail?.toLowerCase() === user.email.toLowerCase()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
		}).catch(loadError => {
			console.error("Não foi possível carregar a conta do motorista.", loadError);
			setError(`${loadError.message} Confira se a API local está em execução.`);
		}).finally(() => setLoading(false));
	}, []);

	async function saveProfile(event) {
		event.preventDefault();
		setSaving(true);
		setError("");
		setNotice("");
		try {
			const form = new FormData(event.currentTarget);
			const updated = {...account, name:String(form.get("name")).trim(), phone:String(form.get("phone")).trim()};
			await demoRequest(`users/${encodeURIComponent(account.id)}`, {
				method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(updated)
			});
			setAccount(updated);
			setNotice("Dados do perfil atualizados.");
		} catch (saveError) {
			console.error("Não foi possível atualizar o perfil do motorista.", saveError);
			setError(`${saveError.message} Os dados não foram confirmados.`);
		} finally {
			setSaving(false);
		}
	}

	async function addVehicle(event) {
		event.preventDefault();
		setError("");
		setNotice("");
		const updated = {...account, vehicles:[...(account.vehicles || []), {
			id:createDemoId("vehicle"), plate:vehicle.plate.trim().toUpperCase(), model:vehicle.model.trim(), color:vehicle.color.trim()
		}]};
		try {
			await demoRequest(`users/${encodeURIComponent(account.id)}`, {
				method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(updated)
			});
			setAccount(updated);
			setVehicle({plate:"", model:"", color:""});
			setNotice("Veículo adicionado.");
		} catch (saveError) {
			console.error("Não foi possível adicionar o veículo.", saveError);
			setError(`${saveError.message} O veículo não foi confirmado.`);
		}
	}

	async function removeVehicle(vehicleId) {
		setError("");
		setNotice("");
		const updated = {...account, vehicles:account.vehicles.filter(item => item.id !== vehicleId)};
		try {
			await demoRequest(`users/${encodeURIComponent(account.id)}`, {
				method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(updated)
			});
			setAccount(updated);
			setNotice("Veículo removido.");
		} catch (saveError) {
			console.error("Não foi possível remover o veículo.", saveError);
			setError(`${saveError.message} A alteração não foi confirmada.`);
		}
	}

	if (!session || loading) return <main className="grid min-h-screen place-items-center bg-[#f4f6fa] p-6 text-sm text-[#68738a]">{loading ? "Carregando sua conta..." : "Redirecionando para o login..."}</main>;

	return <div className="min-h-screen bg-[#f4f6fa] text-[#172749]">
		<header className="bg-[#1d2b52] text-white"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
			<a href="paginaInicialMotorista.html" className="font-display text-xl font-bold text-white no-underline">FluxoPark</a>
			<div className="flex items-center gap-4 text-sm"><a href="paginaInicialMotorista.html" className="text-white/85 hover:text-white">Buscar vagas</a><button type="button" onClick={() => {endDemoSession(); window.location.assign("loginUsuario.html");}} className="font-semibold text-white">Sair</button></div>
		</div></header>
		<main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9">
			<p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6250b5]">Área do motorista</p>
			<h1 className="mt-1 font-display text-3xl font-semibold">Minha conta</h1>
			<p className="mt-2 text-sm text-[#68738a]">Perfil, veículos e histórico das reservas deste cadastro.</p>
			<div className="mt-5 grid gap-5">
				{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
				{notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}
				{account && <>
					<section className="rounded-xl border border-[#e1e5ed] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="profile-title">
						<h2 id="profile-title" className="font-display text-xl font-semibold">Dados do perfil</h2>
						<form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={saveProfile}>
							<label className="grid gap-1.5 text-sm font-semibold" htmlFor="profile-name">Nome completo<input id="profile-name" name="name" required minLength={2} maxLength={100} defaultValue={account.name} className={inputClass} /></label>
							<label className="grid gap-1.5 text-sm font-semibold" htmlFor="profile-email">E-mail<input id="profile-email" type="email" readOnly value={account.email} className={`${inputClass} bg-[#f8fafc]`} /></label>
							<label className="grid gap-1.5 text-sm font-semibold" htmlFor="profile-phone">Celular<input id="profile-phone" name="phone" type="tel" required maxLength={20} defaultValue={account.phone} className={inputClass} /></label>
							<div className="flex items-end"><button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-[#6250b5] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Salvando..." : "Salvar perfil"}</button></div>
						</form>
					</section>
					<section className="rounded-xl border border-[#e1e5ed] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="vehicles-title">
						<h2 id="vehicles-title" className="font-display text-xl font-semibold">Meus veículos</h2>
						<div className="mt-4 grid gap-2 sm:grid-cols-2">
							{(account.vehicles || []).map(item => <article key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#edf0f5] p-3">
								<div><strong className="text-sm">{item.plate}</strong><p className="mt-1 text-xs text-[#68738a]">{item.model} · {item.color}</p></div>
								<button type="button" onClick={() => removeVehicle(item.id)} className="rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">Remover</button>
							</article>)}
							{(account.vehicles || []).length === 0 && <p className="text-sm text-[#68738a]">Nenhum veículo cadastrado.</p>}
						</div>
						<form className="mt-5 grid gap-3 border-t border-[#edf0f5] pt-5 sm:grid-cols-4" onSubmit={addVehicle}>
							<label className="grid gap-1.5 text-xs font-semibold" htmlFor="vehicle-plate">Placa<input id="vehicle-plate" required maxLength={8} value={vehicle.plate} onChange={event => setVehicle({...vehicle, plate:event.target.value})} className={`${inputClass} uppercase`} /></label>
							<label className="grid gap-1.5 text-xs font-semibold" htmlFor="vehicle-model">Modelo<input id="vehicle-model" required value={vehicle.model} onChange={event => setVehicle({...vehicle, model:event.target.value})} className={inputClass} /></label>
							<label className="grid gap-1.5 text-xs font-semibold" htmlFor="vehicle-color">Cor<input id="vehicle-color" required value={vehicle.color} onChange={event => setVehicle({...vehicle, color:event.target.value})} className={inputClass} /></label>
							<button type="submit" className="mt-auto min-h-11 rounded-lg border border-[#6250b5] px-3 text-sm font-semibold text-[#51419c] hover:bg-[#f7f5ff]">Adicionar veículo</button>
						</form>
					</section>
				</>}
				<section className="rounded-xl border border-[#e1e5ed] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="history-title">
					<div className="flex flex-wrap items-center justify-between gap-2"><h2 id="history-title" className="font-display text-xl font-semibold">Histórico de reservas</h2><span className="text-sm text-[#68738a]">{reservations.length} reservas</span></div>
					<div className="mt-4 grid gap-3">
						{reservations.map(item => <article key={item.id || item.code} className="rounded-lg border border-[#edf0f5] p-4">
							<div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{item.parkingName}</h3><p className="mt-1 text-xs text-[#68738a]">{new Intl.DateTimeFormat("pt-BR").format(new Date(item.startAt))} · {new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date(item.startAt))}</p></div><span className="rounded-full bg-[#eef0fa] px-2.5 py-1 text-xs font-semibold text-[#51419c]">{item.status === "confirmed" ? "Confirmada" : item.status}</span></div>
							<p className="mt-3 text-sm text-[#526079]">{item.durationHours} h · Vaga {item.spotType} {item.spotLabel} · R$ {Number(item.totalAmount).toFixed(2).replace(".", ",")} · {item.paymentMethod} (simulado)</p>
							<p className="mt-1 text-xs text-[#758098]">Código: {item.code}</p>
						</article>)}
						{reservations.length === 0 && <p className="rounded-lg bg-[#f8fafc] px-4 py-6 text-center text-sm text-[#68738a]">Ainda não há reservas associadas a este cadastro.</p>}
					</div>
				</section>
				<p role="note" className="rounded-lg border border-[#f1dfae] bg-[#fff9e9] px-4 py-3 text-xs leading-5 text-[#785713]">Protótipo local: os dados ficam no json-server e esta sessão não é segura. Use somente informações fictícias.</p>
			</div>
		</main>
	</div>;
}

createRoot(document.getElementById("root")).render(<UserAccountPage />);
