import React from "react";
import {createRoot} from "react-dom/client";
import {createDemoId, demoRequest, endDemoSession, readDemoSession} from "../lib/demoAccounts.js";
import {getEffectiveHourlyRate} from "../lib/parkingPricing.js";
import {createReservationInterval, isWithinParkingHours} from "../lib/reservationRules.js";
import {getSpotFeatures} from "../lib/spotFeatures.js";
import "../../paginaReserva.css";

const inputClass = "min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15";
const reservationChangeCutoffMs = 24 * 60 * 60 * 1000;

function toDateTimeLocal(value) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function formatCurrency(value) {
	return `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
}

function canChangeReservation(reservation, now = Date.now()) {
	return reservation.status === "confirmed" &&
		new Date(reservation.startAt).getTime() - now >= reservationChangeCutoffMs;
}

function reservationOwnerMatches(reservation, user) {
	return reservation.driverId === user.id ||
		reservation.driverEmail?.toLowerCase() === user.email.toLowerCase();
}

function UserAccountPage() {
	const session = readDemoSession("driver");
	const [account, setAccount] = React.useState(null);
	const [reservations, setReservations] = React.useState([]);
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState("");
	const [notice, setNotice] = React.useState("");
	const [vehicle, setVehicle] = React.useState({plate:"", model:"", color:""});
	const [editingReservationId, setEditingReservationId] = React.useState("");
	const [editDraft, setEditDraft] = React.useState({startAt:"", endAt:""});
	const [pendingReservationChange, setPendingReservationChange] = React.useState(null);
	const [reservationBusyId, setReservationBusyId] = React.useState("");
	const [now, setNow] = React.useState(Date.now());

	React.useEffect(() => {
		const timer = window.setInterval(() => setNow(Date.now()), 60000);
		return () => window.clearInterval(timer);
	}, []);

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

	function beginEditReservation(reservation) {
		setError("");
		setNotice("");
		if (!canChangeReservation(reservation)) {
			setError("Só é possível editar ou cancelar reservas confirmadas com pelo menos 24 horas de antecedência.");
			return;
		}
		setEditingReservationId(reservation.code);
		setEditDraft({startAt:toDateTimeLocal(reservation.startAt), endAt:toDateTimeLocal(reservation.endAt)});
	}

	function buildEditedReservation(currentReservation, draft, currentReservations, parkings, spots) {
		if (!canChangeReservation(currentReservation)) {
			throw new Error("O prazo para editar esta reserva terminou. São necessárias pelo menos 24 horas de antecedência.");
		}
		if (!reservationOwnerMatches(currentReservation, account)) {
			throw new Error("Esta reserva não pertence à sua conta.");
		}
		if (!currentReservation.id) throw new Error("Não foi possível identificar a reserva para atualizá-la.");
		const parking = parkings.find(item => item.id === currentReservation.parkingId);
		const spot = spots.find(item => item.id === currentReservation.spotId && item.parkingId === currentReservation.parkingId);
		if (!parking || !spot) throw new Error("O estacionamento ou a vaga desta reserva não está mais disponível.");
		const [startDate, startTime] = draft.startAt.split("T");
		const [endDate, endTime] = draft.endAt.split("T");
		const interval = createReservationInterval(startDate, startTime, endTime, Boolean(parking.allowsOvernight), endDate);
		if (!interval) throw new Error("Informe um período válido de até 24 horas, de acordo com o funcionamento do estacionamento.");
		if (new Date(interval.startAt).getTime() - Date.now() < reservationChangeCutoffMs) {
			throw new Error("O novo início da estadia também precisa respeitar a antecedência mínima de 24 horas.");
		}
		if (!isWithinParkingHours(parking, interval)) {
			throw new Error("O período informado está fora do horário de funcionamento do estacionamento.");
		}
		const occupied = currentReservations.some(item =>
			item.code !== currentReservation.code &&
			item.spotId === currentReservation.spotId &&
			["confirmed", "active"].includes(item.status) &&
			new Date(item.startAt).getTime() < new Date(interval.endAt).getTime() &&
			new Date(item.endAt).getTime() > new Date(interval.startAt).getTime()
		);
		if (occupied) throw new Error("A vaga já está reservada nesse período. Escolha outro horário.");
		if (interval.startAt === currentReservation.startAt && interval.endAt === currentReservation.endAt) {
			throw new Error("Altere a data ou o horário antes de confirmar a edição.");
		}

		const features = currentReservation.spotFeatures?.length
			? currentReservation.spotFeatures
			: getSpotFeatures(spot);
		const savedRate = Number(currentReservation.hourlyRate);
		const paidRate = Number(currentReservation.totalAmount) / Number(currentReservation.durationHours);
		const effectiveRate = Number.isFinite(savedRate) && savedRate > 0
			? savedRate
			: Number.isFinite(paidRate) && paidRate > 0
				? paidRate
				: getEffectiveHourlyRate(parking.hourlyRates, features, currentReservation.durationHours);
		if (!Number.isFinite(effectiveRate) || effectiveRate <= 0) {
			throw new Error("Não foi possível determinar a tarifa da reserva para calcular o ajuste.");
		}
		const durationDifference = interval.durationHours - Number(currentReservation.durationHours);
		const adjustment = Math.round(effectiveRate * Math.abs(durationDifference) * 100) / 100;
		const signedAdjustment = durationDifference > 0 ? adjustment : durationDifference < 0 ? -adjustment : 0;
		const newTotal = Math.round((Number(currentReservation.totalAmount) + signedAdjustment) * 100) / 100;
		if (newTotal < 0) throw new Error("O cálculo do estorno excederia o valor pago pela reserva.");
		const type = signedAdjustment > 0 ? "simulated_charge" : signedAdjustment < 0 ? "simulated_refund" : "";
		const adjustmentEntry = type ? {
			id:createDemoId("adjustment"),
			type,
			amount:adjustment,
			status:"simulated",
			paymentMethod:currentReservation.paymentMethod,
			createdAt:new Date().toISOString()
		} : null;
		const updatedReservation = {
			...currentReservation,
			startAt:interval.startAt,
			endAt:interval.endAt,
			durationHours:interval.durationHours,
			hourlyRate:effectiveRate,
			totalAmount:newTotal,
			updatedAt:new Date().toISOString(),
			paymentAdjustments:adjustmentEntry
				? [...(currentReservation.paymentAdjustments || []), adjustmentEntry]
				: currentReservation.paymentAdjustments || []
		};
		if (type === "simulated_refund") updatedReservation.paymentStatus = "simulated_partial_refund";
		if (type === "simulated_charge") updatedReservation.paymentStatus = "simulated_adjustment";
		return {
			kind:"edit",
			reservation:updatedReservation,
			adjustmentType:type,
			adjustmentAmount:adjustment,
			previewStartAt:interval.startAt,
			previewEndAt:interval.endAt,
			previewTotal:newTotal
		};
	}

	async function prepareReservationEdit(event, reservation) {
		event.preventDefault();
		setError("");
		setNotice("");
		setReservationBusyId(reservation.code);
		try {
			const [currentReservations, parkings, spots] = await Promise.all([
				demoRequest("reservations"),
				demoRequest("parkings"),
				demoRequest("spots")
			]);
			const currentReservation = currentReservations.find(item => item.code === reservation.code);
			if (!currentReservation) throw new Error("A reserva não foi encontrada na API.");
			const change = buildEditedReservation(currentReservation, editDraft, currentReservations, parkings, spots);
			setPendingReservationChange(change);
		} catch (changeError) {
			console.error("Não foi possível preparar a edição da reserva.", changeError);
			setError(`${changeError.message} Nenhuma alteração foi salva.`);
		} finally {
			setReservationBusyId("");
		}
	}

	async function prepareReservationCancellation(reservation) {
		setError("");
		setNotice("");
		setReservationBusyId(reservation.code);
		try {
			const currentReservations = await demoRequest("reservations");
			const currentReservation = currentReservations.find(item => item.code === reservation.code);
			if (!currentReservation) throw new Error("A reserva não foi encontrada na API.");
			if (!canChangeReservation(currentReservation)) {
				throw new Error("O prazo para cancelar esta reserva terminou. São necessárias pelo menos 24 horas de antecedência.");
			}
			if (!reservationOwnerMatches(currentReservation, account)) {
				throw new Error("Esta reserva não pertence à sua conta.");
			}
			setPendingReservationChange({
				kind:"cancel",
				reservation:currentReservation,
				adjustmentAmount:Number(currentReservation.totalAmount) || 0
			});
		} catch (changeError) {
			console.error("Não foi possível preparar o cancelamento da reserva.", changeError);
			setError(`${changeError.message} Nenhuma alteração foi salva.`);
		} finally {
			setReservationBusyId("");
		}
	}

	async function confirmReservationChange() {
		const pending = pendingReservationChange;
		if (!pending || !account) return;
		setError("");
		setNotice("");
		setReservationBusyId(pending.reservation.code);
		try {
			const currentReservations = await demoRequest("reservations");
			const currentReservation = currentReservations.find(item => item.code === pending.reservation.code);
			if (!currentReservation) throw new Error("A reserva não foi encontrada na API.");
			if (!reservationOwnerMatches(currentReservation, account)) throw new Error("Esta reserva não pertence à sua conta.");
			if (!canChangeReservation(currentReservation)) {
				throw new Error("O prazo de 24 horas terminou antes da confirmação. A reserva não foi alterada.");
			}

			let updatedReservation;
			if (pending.kind === "cancel") {
				const refundAmount = Number(currentReservation.totalAmount) || 0;
				if (refundAmount !== pending.adjustmentAmount) {
					setPendingReservationChange({...pending, reservation:currentReservation, adjustmentAmount:refundAmount});
					setNotice("O valor da reserva mudou. Confira o valor atualizado do estorno e confirme novamente.");
					return;
				}
				const adjustment = {
					id:createDemoId("adjustment"),
					type:"simulated_refund",
					reason:"cancellation",
					amount:refundAmount,
					status:"simulated",
					paymentMethod:currentReservation.paymentMethod,
					createdAt:new Date().toISOString()
				};
				updatedReservation = {
					...currentReservation,
					status:"cancelled",
					cancelledAt:new Date().toISOString(),
					paymentStatus:"simulated_refunded",
					paymentAdjustments:[...(currentReservation.paymentAdjustments || []), adjustment]
				};
			} else {
				const [parkings, spots] = await Promise.all([demoRequest("parkings"), demoRequest("spots")]);
				const recalculated = buildEditedReservation(currentReservation, editDraft, currentReservations, parkings, spots);
				if (recalculated.adjustmentAmount !== pending.adjustmentAmount ||
					recalculated.adjustmentType !== pending.adjustmentType ||
					recalculated.previewStartAt !== pending.previewStartAt ||
					recalculated.previewEndAt !== pending.previewEndAt ||
					recalculated.previewTotal !== pending.previewTotal) {
					setPendingReservationChange(recalculated);
					setNotice("Os dados da reserva mudaram. Confira novamente o período e o ajuste antes de confirmar.");
					return;
				}
				updatedReservation = recalculated.reservation;
			}

			await demoRequest(`reservations/${encodeURIComponent(currentReservation.id)}`, {
				method:"PATCH",
				headers:{"Content-Type":"application/json"},
				body:JSON.stringify(updatedReservation)
			});
			setReservations(items => items.map(item => item.code === updatedReservation.code ? updatedReservation : item));
			setPendingReservationChange(null);
			setEditingReservationId("");
			setNotice(pending.kind === "cancel"
				? `Reserva cancelada. Estorno demonstrativo de ${formatCurrency(pending.adjustmentAmount)} registrado.`
				: pending.adjustmentType === "simulated_refund"
					? `Reserva atualizada. Estorno demonstrativo de ${formatCurrency(pending.adjustmentAmount)} registrado.`
					: pending.adjustmentType === "simulated_charge"
						? `Reserva atualizada. Cobrança demonstrativa adicional de ${formatCurrency(pending.adjustmentAmount)} registrada.`
						: "Reserva atualizada sem diferença de valor.");
		} catch (changeError) {
			console.error("Não foi possível confirmar a alteração da reserva.", changeError);
			setError(`${changeError.message} A reserva não foi alterada.`);
		} finally {
			setReservationBusyId("");
		}
	}

	if (!session || loading) return <main className="grid min-h-screen place-items-center bg-[#f4f6fa] p-6 text-sm text-[#68738a]">{loading ? "Carregando sua conta..." : "Redirecionando para o login..."}</main>;

	return <div className="min-h-screen bg-[#f4f6fa] text-[#172749]">
		<header className="bg-[#1d2b52] text-white"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
			<a href="paginaInicialMotorista.html" className="font-display text-xl font-bold text-white no-underline">FluxoPark</a>
			<div className="flex flex-wrap items-center gap-4 text-sm"><a href="paginaInicialMotorista.html" className="text-white/85 hover:text-white">Buscar vagas</a><a href="metodosPagamento.html" className="text-white/85 hover:text-white">Métodos de pagamento</a><a href="minhasDenuncias.html" className="text-white/85 hover:text-white">Minhas denúncias</a><button type="button" onClick={() => {endDemoSession(); window.location.assign("loginUsuario.html");}} className="font-semibold text-white">Sair</button></div>
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
					<p className="mt-2 rounded-lg border border-[#f1dfae] bg-[#fff9e9] px-3 py-2.5 text-xs leading-5 text-[#785713]">Reservas confirmadas podem ser editadas ou canceladas até 24 horas antes do início. Estornos e cobranças adicionais são apenas demonstrativos: nenhum dinheiro é movimentado.</p>
					<div className="mt-4 grid gap-3">
						{reservations.map(item => {
							const canChange = canChangeReservation(item, now);
							const isEditing = editingReservationId === item.code;
							const startDateTime = new Date(item.startAt);
							const endDateTime = new Date(item.endAt);
							return <article key={item.id || item.code} className="rounded-lg border border-[#edf0f5] p-4">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div><h3 className="font-semibold">{item.parkingName}</h3><p className="mt-1 text-xs text-[#68738a]">{new Intl.DateTimeFormat("pt-BR").format(startDateTime)} · {new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(startDateTime)}–{new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(endDateTime)}{startDateTime.toDateString() !== endDateTime.toDateString() ? ` (${new Intl.DateTimeFormat("pt-BR").format(endDateTime)})` : ""}</p></div>
									<span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "cancelled" ? "bg-red-50 text-red-700" : "bg-[#eef0fa] text-[#51419c]"}`}>{item.status === "confirmed" ? "Confirmada" : item.status === "cancelled" ? "Cancelada" : item.status}</span>
								</div>
								<p className="mt-3 text-sm text-[#526079]">{Number(item.durationHours).toFixed(2)} h · {item.vehiclePlate ? `Veículo ${item.vehiclePlate} · ` : ""}Vaga {item.spotType} {item.spotLabel} · {formatCurrency(item.totalAmount)} · {item.paymentMethod} (simulado)</p>
								<p className="mt-1 text-xs text-[#758098]">Código: {item.code}</p>
								{item.paymentAdjustments?.length > 0 && <div className="mt-3 rounded-lg bg-[#f8fafc] p-3">
									<h4 className="text-xs font-semibold text-[#34415c]">Ajustes demonstrativos</h4>
									<ul className="mt-1 grid gap-1 text-xs text-[#526079]">
										{item.paymentAdjustments.map(adjustment => <li key={adjustment.id}>{adjustment.type === "simulated_refund" ? "Estorno simulado" : "Cobrança adicional simulada"} · {formatCurrency(adjustment.amount)} · {new Intl.DateTimeFormat("pt-BR", {dateStyle:"short", timeStyle:"short"}).format(new Date(adjustment.createdAt))}</li>)}
									</ul>
								</div>}
								{canChange && <div className="mt-3 flex flex-wrap gap-2 border-t border-[#edf0f5] pt-3">
									<button type="button" disabled={Boolean(reservationBusyId)} onClick={() => isEditing ? setEditingReservationId("") : beginEditReservation(item)} className="min-h-9 rounded-lg border border-[#6250b5] px-3 text-xs font-semibold text-[#51419c] disabled:opacity-50">{isEditing ? "Fechar edição" : "Editar reserva"}</button>
									<button type="button" disabled={Boolean(reservationBusyId)} onClick={() => prepareReservationCancellation(item)} className="min-h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{reservationBusyId === item.code ? "Aguarde..." : "Cancelar e solicitar estorno"}</button>
								</div>}
								{item.status === "confirmed" && !canChange && <p className="mt-3 border-t border-[#edf0f5] pt-3 text-xs text-[#758098]">O prazo para editar ou cancelar encerrou: são necessárias pelo menos 24 horas antes do início da estadia.</p>}
								{isEditing && <form className="mt-4 grid gap-3 border-t border-[#edf0f5] pt-4 sm:grid-cols-2" onSubmit={event => prepareReservationEdit(event, item)}>
									<p className="text-sm font-semibold sm:col-span-2">Edite o início e o fim da estadia</p>
									<label className="grid gap-1.5 text-xs font-semibold" htmlFor={`reservation-start-${item.code}`}>Início
										<input id={`reservation-start-${item.code}`} type="datetime-local" required min={toDateTimeLocal(now + reservationChangeCutoffMs)} value={editDraft.startAt} onChange={event => setEditDraft({...editDraft, startAt:event.target.value})} className={inputClass} />
									</label>
									<label className="grid gap-1.5 text-xs font-semibold" htmlFor={`reservation-end-${item.code}`}>Fim
										<input id={`reservation-end-${item.code}`} type="datetime-local" required min={editDraft.startAt || undefined} value={editDraft.endAt} onChange={event => setEditDraft({...editDraft, endAt:event.target.value})} className={inputClass} />
									</label>
									<p className="text-xs leading-5 text-[#68738a] sm:col-span-2">A nova duração usa a tarifa por hora registrada na reserva. Reduzir o tempo gera estorno simulado; aumentá-lo exige confirmar uma cobrança adicional simulada. O período continua sujeito aos horários do local e à disponibilidade da vaga.</p>
									<button type="submit" disabled={Boolean(reservationBusyId)} className="min-h-10 rounded-lg bg-[#6250b5] px-4 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2">{reservationBusyId === item.code ? "Verificando..." : "Revisar alteração"}</button>
								</form>}
							</article>;
						})}
						{reservations.length === 0 && <p className="rounded-lg bg-[#f8fafc] px-4 py-6 text-center text-sm text-[#68738a]">Ainda não há reservas associadas a este cadastro.</p>}
					</div>
				</section>
				<p role="note" className="rounded-lg border border-[#f1dfae] bg-[#fff9e9] px-4 py-3 text-xs leading-5 text-[#785713]">Protótipo local: os dados ficam no json-server e esta sessão não é segura. Use somente informações fictícias.</p>
			</div>
		</main>
		{pendingReservationChange && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#101a31]/60 p-4" onMouseDown={event => {if (event.target === event.currentTarget) setPendingReservationChange(null);}}>
			<section role="dialog" aria-modal="true" aria-labelledby="reservation-change-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
				<p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6250b5]">Confirmação demonstrativa</p>
				<h2 id="reservation-change-title" className="mt-1 font-display text-xl font-semibold">{pendingReservationChange.kind === "cancel" ? "Cancelar reserva?" : "Confirmar alteração?"}</h2>
				{pendingReservationChange.kind === "cancel"
					? <p className="mt-3 text-sm leading-6 text-[#526079]">A reserva será cancelada e um estorno simulado de <strong>{formatCurrency(pendingReservationChange.adjustmentAmount)}</strong> será registrado no histórico.</p>
					: <div className="mt-3 grid gap-2 text-sm leading-6 text-[#526079]">
						<p>Novo período: {new Intl.DateTimeFormat("pt-BR", {dateStyle:"medium", timeStyle:"short"}).format(new Date(pendingReservationChange.previewStartAt))} até {new Intl.DateTimeFormat("pt-BR", {dateStyle:"medium", timeStyle:"short"}).format(new Date(pendingReservationChange.previewEndAt))}.</p>
						<p>{pendingReservationChange.adjustmentType === "simulated_refund"
							? <>Estorno simulado: <strong>{formatCurrency(pendingReservationChange.adjustmentAmount)}</strong>.</>
							: pendingReservationChange.adjustmentType === "simulated_charge"
								? <>Cobrança adicional simulada no método {pendingReservationChange.reservation.paymentMethod}: <strong>{formatCurrency(pendingReservationChange.adjustmentAmount)}</strong>.</>
								: "A alteração não muda o valor da reserva."}</p>
						<p>Total atualizado: <strong>{formatCurrency(pendingReservationChange.previewTotal)}</strong>.</p>
					</div>}
				<p className="mt-4 rounded-lg border border-[#f1dfae] bg-[#fff9e9] px-3 py-2.5 text-xs leading-5 text-[#785713]">Esta versão apenas registra a simulação no db.json. Não há estorno nem cobrança real.</p>
				<div className="mt-5 flex flex-wrap justify-end gap-3">
					<button type="button" disabled={Boolean(reservationBusyId)} onClick={() => setPendingReservationChange(null)} className="min-h-10 rounded-lg border border-[#d9dee8] px-4 text-sm font-semibold text-[#34415c] disabled:opacity-50">Voltar</button>
					<button type="button" disabled={Boolean(reservationBusyId)} onClick={confirmReservationChange} className="min-h-10 rounded-lg bg-[#6250b5] px-4 text-sm font-semibold text-white disabled:opacity-60">{reservationBusyId ? "Salvando..." : pendingReservationChange.kind === "cancel" ? "Confirmar cancelamento" : "Confirmar alteração"}</button>
				</div>
			</section>
		</div>}
	</div>;
}

createRoot(document.getElementById("root")).render(<UserAccountPage />);
