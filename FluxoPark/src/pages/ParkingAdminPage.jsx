import React from "react";
import { createRoot } from "react-dom/client";
import {demoRequest, hashDemoPassword, readDemoSession, endDemoSession} from "../lib/demoAccounts.js";
import {getSpotFeatures, SPOT_FEATURES, toggleSpotFeature} from "../lib/spotFeatures.js";
import {DEFAULT_RATE_TIER_LIMITS, getHourlyRate, getRateTierLabels, normalizeHourlyRates, normalizeRateTierLimits, RATE_TIER_KEYS} from "../lib/parkingPricing.js";
import "../../paginaReserva.css";

const spotTypes = SPOT_FEATURES;
const weekdays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const defaultOpeningHours = Object.fromEntries(weekdays.map((_, day) => [day, {open:"06:00", close:"23:00"}]));
const emptyHourlyRates = () => Object.fromEntries(spotTypes.map(type => [type, Object.fromEntries(RATE_TIER_KEYS.map(key => [key, ""]))]));
const emptyParking = {
	name: "",
	address: "",
	googlePlaceId: "",
	partner: true,
	rating: "",
	hourlyRates: emptyHourlyRates(),
	rateTierLimits: {...DEFAULT_RATE_TIER_LIMITS},
	toleranceMinutes: "15",
	openingHours: defaultOpeningHours,
	allowsOvernight: false
};

function makeId(prefix) {
	return `${prefix}-${window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 12)}`;
}

function formatCnpj(value) {
	const digits = value.replace(/\D/g, "").slice(0, 14);
	if (digits.length > 12) return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`;
	if (digits.length > 8) return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8)}`;
	if (digits.length > 5) return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5)}`;
	if (digits.length > 2) return `${digits.slice(0,2)}.${digits.slice(2)}`;
	return digits;
}

function featuresForSpot(spot) {
	return getSpotFeatures(spot);
}

async function request(path, options) {
	const response = await fetch(`/${path}`, options);
	if (!response.ok) throw new Error(`Falha na API (${response.status}) ao salvar os dados.`);
	return response.status === 204 ? null : response.json();
}

function ParkingAdminPage() {
	const [partnerSession] = React.useState(() => readDemoSession("parking"));
	const [partnerAccount, setPartnerAccount] = React.useState(null);
	const [parkings, setParkings] = React.useState([]);
	const [allSpots, setAllSpots] = React.useState([]);
	const [parking, setParking] = React.useState(emptyParking);
	const [spotRows, setSpotRows] = React.useState([]);
	const [spotCountDraft, setSpotCountDraft] = React.useState({});
	const [editingId, setEditingId] = React.useState("");
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState("");
	const [notice, setNotice] = React.useState("");

	async function loadData() {
		setLoading(true);
		setError("");
		try {
			const [parkingData, spotData] = await Promise.all([request("parkings"), request("spots")]);
			if (partnerSession) {
				const account = await demoRequest(`parkingAccounts/${encodeURIComponent(partnerSession.id)}`);
				if (!account) throw new Error("A conta do parceiro não foi encontrada. Entre novamente.");
				setPartnerAccount(account);
				const ownedParkings = parkingData.filter(item => account.parkingIds?.includes(item.id));
				const ownedIds = new Set(ownedParkings.map(item => item.id));
				setParkings(ownedParkings);
				setAllSpots(spotData.filter(spot => ownedIds.has(spot.parkingId)));
			} else {
				setPartnerAccount(null);
				setParkings([]);
				setAllSpots([]);
			}
		} catch (loadError) {
			setError(`${loadError.message} Confira se a API está rodando na porta 3000.`);
			if (partnerSession && loadError.message.includes("(404)")) {
				endDemoSession();
				window.location.replace("loginEstacionamento.html");
			}
		} finally {
			setLoading(false);
		}
	}

	React.useEffect(() => { loadData(); }, []);

	function editParking(item) {
		setEditingId(item.id);
		setParking({
			...emptyParking,
			...item,
			googlePlaceId: item.googlePlaceId || "",
			rating: item.rating ?? "",
			rateTierLimits: normalizeRateTierLimits(item.rateTierLimits),
			toleranceMinutes: item.toleranceMinutes ?? 15,
			hourlyRates: Object.fromEntries(Object.entries(normalizeHourlyRates(item.hourlyRates)).map(([type, rates]) => [
				type,
				Object.fromEntries(RATE_TIER_KEYS.map(key => [key, rates[key] === null ? "" : String(rates[key])]))
			])),
			openingHours: item.openingHours || defaultOpeningHours,
			allowsOvernight: Boolean(item.allowsOvernight)
		});
		setSpotRows(allSpots.filter(spot => spot.parkingId === item.id).map(spot => ({...spot, features:featuresForSpot(spot)})));
		setSpotCountDraft({});
		setError("");
		setNotice("");
		window.scrollTo({top: 0, behavior: "smooth"});
	}

	function resetForm() {
		setEditingId("");
		setParking(emptyParking);
		setSpotRows([]);
		setSpotCountDraft({});
		setError("");
		setNotice("");
	}

	function updateRate(type, tier, value) {
		setParking(current => ({
			...current,
			hourlyRates: {
				...current.hourlyRates,
				[type]: {...current.hourlyRates[type], [tier]:value}
			}
		}));
	}

	function updateRateTierLimit(key, value) {
		setParking(current => ({...current, rateTierLimits:{...current.rateTierLimits, [key]:value}}));
	}

	function updateSpot(index, key, value) {
		setSpotRows(rows => rows.map((spot, rowIndex) => rowIndex === index ? {...spot, [key]: value} : spot));
	}

	function resizeSpotType(type, targetCount) {
		setSpotRows(rows => {
			const typedSpots = rows.filter(spot => featuresForSpot(spot).includes(type));
			if (targetCount < typedSpots.length) {
				const removeCount = typedSpots.length - targetCount;
				const removed = new Set(typedSpots.slice(-removeCount));
				return rows.filter(spot => !removed.has(spot));
			}
			const usedLabels = new Set(rows.map(spot => spot.label.trim().toLowerCase()));
			const prefix = {"Coberta": "COB", "Descoberta": "DES", "Especial": "ESP"}[type];
			const additions = [];
			let sequence = 1;
			while (additions.length < targetCount - typedSpots.length) {
				const label = `${prefix}-${String(sequence).padStart(2, "0")}`;
				if (!usedLabels.has(label.toLowerCase())) {
					additions.push({label, type, features:[type]});
					usedLabels.add(label.toLowerCase());
				}
				sequence += 1;
			}
			return [...rows, ...additions];
		});
	}

	function commitSpotCount(type) {
		const draft = spotCountDraft[type];
		if (draft === undefined) return;
		resizeSpotType(type, Math.min(500, Math.max(0, Number(draft) || 0)));
		setSpotCountDraft(counts => {
			const nextCounts = {...counts};
			delete nextCounts[type];
			return nextCounts;
		});
	}

	function updateSpotFeature(index, feature, checked) {
		setSpotRows(rows => rows.map((spot, rowIndex) => {
			if (rowIndex !== index) return spot;
			const nextFeatures = toggleSpotFeature(featuresForSpot(spot), feature, checked);
			return {...spot, features:nextFeatures, type:nextFeatures[0] || ""};
		}));
	}

	function updateOpeningHours(day, key, value) {
		setParking(current => ({...current, openingHours:{...current.openingHours, [day]:{...current.openingHours[day], [key]:value}}}));
	}

	function toggleOpeningDay(day) {
		setParking(current => {
			const openingHours = {...current.openingHours};
			if (openingHours[day]) delete openingHours[day];
			else openingHours[day] = {open:"06:00", close:"23:00"};
			return {...current, openingHours};
		});
	}

	async function saveParking(event) {
			event.preventDefault();
			setError("");
			setNotice("");
			const formElement = event.currentTarget;
			const formData = new FormData(formElement);
			const email = String(formData.get("partnerEmail") || "").trim().toLowerCase();
			const cnpj = String(formData.get("partnerCnpj") || "").replace(/\D/g, "");
			const password = String(formData.get("partnerPassword") || "");
			const passwordConfirm = String(formData.get("partnerPasswordConfirm") || "");
			if (!partnerSession && (!email || cnpj.length !== 14 || password.length < 8 || password !== passwordConfirm)) {
				setError(password !== passwordConfirm ? "As senhas não coincidem." : "Informe e-mail, CNPJ válido com 14 dígitos e senha de pelo menos 8 caracteres.");
				return;
			}
			const normalizedSpots = spotRows.map(spot => ({...spot, label: spot.label.trim()}));
			const labels = normalizedSpots.map(spot => spot.label.toLowerCase());
			if (normalizedSpots.length === 0) {
				setError("Informe a quantidade de vagas que o estacionamento vai disponibilizar.");
				return;
			}
			if (normalizedSpots.some(spot => !spot.label || featuresForSpot(spot).length === 0) || new Set(labels).size !== labels.length) {
				setError("Preencha cada identificação, escolha pelo menos uma tag por vaga e use identificações únicas.");
				return;
		}
		setSaving(true);
		try {
			const parkingId = editingId || makeId("park");
			const payload = {
				id: parkingId,
				name: parking.name.trim(),
				address: parking.address.trim(),
				googlePlaceId: parking.googlePlaceId.trim() || null,
				partner: Boolean(parking.partner),
				rating: Number(parking.rating) || 0,
				rateTierLimits: normalizeRateTierLimits(parking.rateTierLimits),
				hourlyRates: Object.fromEntries(spotTypes.map(type => [type, Object.fromEntries(RATE_TIER_KEYS.map(key => [
					key,
					Number(parking.hourlyRates[type][key]) || 0
				]))])),
				toleranceMinutes: Number(parking.toleranceMinutes) || 0,
				openingHours:parking.openingHours,
				allowsOvernight:Boolean(parking.allowsOvernight)
			};
			if (!partnerSession) {
				const [accounts, requests] = await Promise.all([demoRequest("parkingAccounts"), demoRequest("partnerRequests")]);
				if (accounts.some(account => account.email.toLowerCase() === email || account.cnpj === cnpj) ||
					requests.some(request => request.email.toLowerCase() === email || request.cnpj === cnpj)) {
					throw new Error("Já existe um cadastro ou solicitação de parceiro com este e-mail ou CNPJ.");
				}
				const normalizedFeatures = normalizedSpots.map(spot => ({...spot, features:featuresForSpot(spot)}));
				await request("partnerRequests", {
					method:"POST",
					headers:{"Content-Type":"application/json"},
					body:JSON.stringify({
						id:makeId("partner-request"), email, cnpj, passwordDigest:await hashDemoPassword(password),
						parking:payload, spots:normalizedFeatures, status:"pending", createdAt:new Date().toISOString()
					})
				});
				setNotice("Solicitação enviada para análise. Você receberá acesso ao portal após a aprovação do administrador.");
				setParking(emptyParking);
				setSpotRows([]);
				setSpotCountDraft({});
				formElement.reset();
				return;
			}
			await request(editingId ? `parkings/${encodeURIComponent(parkingId)}` : "parkings", {
				method: editingId ? "PATCH" : "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify(payload)
			});

			const previousSpots = allSpots.filter(spot => spot.parkingId === parkingId);
			const retainedIds = new Set(normalizedSpots.map(spot => spot.id).filter(Boolean));
			for (const previous of previousSpots) {
				if (!retainedIds.has(previous.id)) await request(`spots/${encodeURIComponent(previous.id)}`, {method: "DELETE"});
			}
			for (const spot of normalizedSpots) {
				const features = featuresForSpot(spot);
				const spotPayload = {parkingId, label: spot.label, type:features[0], features};
				await request(spot.id ? `spots/${encodeURIComponent(spot.id)}` : "spots", {
					method: spot.id ? "PATCH" : "POST",
					headers: {"Content-Type": "application/json"},
					body: JSON.stringify(spot.id ? spotPayload : {...spotPayload, id: makeId("spot")})
				});
			}

			if (!editingId && partnerAccount && !partnerAccount.parkingIds?.includes(parkingId)) {
				const updatedAccount = {...partnerAccount, parkingIds:[...(partnerAccount.parkingIds || []), parkingId]};
				await demoRequest(`parkingAccounts/${encodeURIComponent(partnerAccount.id)}`, {
					method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(updatedAccount)
				});
				setPartnerAccount(updatedAccount);
			}

			await loadData();
			setNotice(editingId ? "Estacionamento e vagas atualizados." : partnerSession ? "Novo estacionamento cadastrado." : "Cadastro demonstrativo concluído. Agora você pode fazer login para gerenciar o estabelecimento.");
			setEditingId("");
			setParking(emptyParking);
			setSpotRows([]);
			setSpotCountDraft({});
		} catch (saveError) {
			setError(`${saveError.message} Os dados já enviados permanecem na API; confira a lista antes de tentar novamente.`);
		} finally {
			setSaving(false);
		}
	}

	return <div className="min-h-screen bg-[#f4f6fa] text-[#172749]">
		<header className="bg-[#1d2b52] text-white">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
				<a href="paginaInicialMotorista.html" className="flex items-center gap-3 text-white no-underline">
					<img src="RefsVisuais/FluxoPark%20-%20Logotipo%20(1).png" alt="" className="h-11 w-11 object-contain" />
					<span><strong className="font-display text-xl font-bold">FluxoPark</strong><small className="block text-xs text-white/70">Portal do estacionamento</small></span>
				</a>
				{partnerSession && <button type="button" onClick={() => {endDemoSession(); window.location.assign("loginEstacionamento.html");}} className="text-sm font-semibold text-white/85 hover:text-white">Sair do portal</button>}
			</div>
		</header>
		<main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
			<div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#dfe3eb] pb-5">
				<div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6250b5]">{partnerSession ? "Área do parceiro" : "Novo parceiro"}</p><h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{partnerSession ? "Manutenção do estacionamento" : "Cadastrar estabelecimento"}</h1></div>
				<p className="max-w-lg text-sm leading-6 text-[#68738a]">{partnerSession ? "Atualize seus estacionamentos, tarifas, horários e vagas. Você só verá os locais vinculados a esta conta." : "Cadastre o estabelecimento e o responsável. A conta será criada após análise da solicitação pelo administrador."}</p>
			</div>
			{error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
			{notice && <p role="status" className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}
			<div className="mt-6 grid items-start gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
				<section className="rounded-xl border border-[#e1e5ed] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="parking-form-title">
					<div className="flex items-center justify-between gap-3">
						<h2 id="parking-form-title" className="font-display text-xl font-semibold">{editingId ? "Alterar estacionamento" : "Cadastrar estacionamento"}</h2>
						{editingId && <button type="button" onClick={resetForm} className="text-sm font-semibold text-[#51419c] underline underline-offset-2">Cancelar edição</button>}
					</div>
					<form className="mt-5 grid gap-5" onSubmit={saveParking}>
						{!partnerSession && <fieldset className="grid gap-4 border-b border-[#edf0f5] pb-5 sm:grid-cols-2">
							<legend className="font-display font-semibold">Conta do responsável</legend>
							<label className="grid gap-1.5 text-sm font-semibold" htmlFor="partner-email">E-mail
								<input id="partner-email" name="partnerEmail" type="email" autoComplete="email" required placeholder="responsavel@exemplo.com" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
							</label>
							<label className="grid gap-1.5 text-sm font-semibold" htmlFor="partner-cnpj">CNPJ
								<input id="partner-cnpj" name="partnerCnpj" type="text" inputMode="numeric" autoComplete="off" required minLength={18} maxLength={18} pattern="[0-9]{2}\.[0-9]{3}\.[0-9]{3}/[0-9]{4}-[0-9]{2}" onChange={event => { event.currentTarget.value = formatCnpj(event.currentTarget.value); }} placeholder="00.000.000/0000-00" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
							</label>
							<label className="grid gap-1.5 text-sm font-semibold" htmlFor="partner-password">Senha do portal
								<input id="partner-password" name="partnerPassword" type="password" autoComplete="new-password" required minLength={8} placeholder="Mínimo de 8 caracteres" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
							</label>
							<label className="grid gap-1.5 text-sm font-semibold" htmlFor="partner-password-confirm">Confirmar senha
								<input id="partner-password-confirm" name="partnerPasswordConfirm" type="password" autoComplete="new-password" required minLength={8} placeholder="Digite a senha novamente" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
							</label>
							<p role="note" className="rounded-lg border border-[#f1dfae] bg-[#fff9e9] px-3 py-2.5 text-xs leading-5 text-[#785713] sm:col-span-2">Protótipo local: não use CNPJ ou senha reais. Os dados ficam na API de demonstração, sem segurança de produção.</p>
						</fieldset>}
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="grid gap-1.5 text-sm font-semibold sm:col-span-2" htmlFor="parking-name">Nome do estacionamento
								<input id="parking-name" value={parking.name} onChange={event => setParking({...parking, name: event.target.value})} required maxLength={100} className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
							</label>
							<label className="grid gap-1.5 text-sm font-semibold sm:col-span-2" htmlFor="parking-address">Endereço
								<input id="parking-address" value={parking.address} onChange={event => setParking({...parking, address: event.target.value})} required maxLength={180} className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
							</label>
							<label className="grid gap-1.5 text-sm font-semibold sm:col-span-2" htmlFor="google-place-id">ID de lugar do Google Maps <span className="font-normal text-[#758098]">Opcional; use para vincular um local do Maps</span>
								<input id="google-place-id" value={parking.googlePlaceId || ""} onChange={event => setParking({...parking, googlePlaceId: event.target.value})} maxLength={180} placeholder="ChIJ..." className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
							</label>
							<label className="grid gap-1.5 text-sm font-semibold" htmlFor="parking-rating">Avaliação
								<input id="parking-rating" type="number" min="0" max="5" step="0.1" value={parking.rating} onChange={event => setParking({...parking, rating: event.target.value})} className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
							</label>
							<label className="grid gap-1.5 text-sm font-semibold" htmlFor="tolerance-minutes">Tolerância de chegada (min)
								<input id="tolerance-minutes" type="number" min="0" max="180" value={parking.toleranceMinutes} onChange={event => setParking({...parking, toleranceMinutes: event.target.value})} className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
							</label>
						</div>
						<fieldset className="border-t border-[#edf0f5] pt-4">
							<legend className="font-display font-semibold">Horário de funcionamento por dia</legend>
							<p className="mt-1 text-xs leading-5 text-[#68738a]">Os horários serão verificados quando o motorista selecionar entrada e saída.</p>
							<div className="mt-3 grid gap-2">
								{weekdays.map((day, index) => <div key={day} className="grid items-center gap-2 rounded-lg bg-[#f8fafc] p-2 sm:grid-cols-[minmax(140px,1fr)_1fr_1fr]">
									<label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={Boolean(parking.openingHours[index])} onChange={() => toggleOpeningDay(index)} className="accent-[#6250b5]" />{day}</label>
									{parking.openingHours[index] ? <>
										<label className="grid grid-cols-[auto_1fr] items-center gap-2 text-xs text-[#68738a]">Abre<input type="time" required value={parking.openingHours[index].open} onChange={event => updateOpeningHours(index, "open", event.target.value)} className="min-h-9 rounded-md border border-[#d9dee8] bg-white px-2 text-sm text-[#172749]" /></label>
										<label className="grid grid-cols-[auto_1fr] items-center gap-2 text-xs text-[#68738a]">Fecha<input type="time" required value={parking.openingHours[index].close} onChange={event => updateOpeningHours(index, "close", event.target.value)} className="min-h-9 rounded-md border border-[#d9dee8] bg-white px-2 text-sm text-[#172749]" /></label>
									</> : <span className="text-xs text-[#758098] sm:col-span-2">Fechado</span>}
								</div>)}
							</div>
							<label className="mt-3 flex min-h-10 items-center gap-2 text-sm font-medium"><input type="checkbox" checked={Boolean(parking.allowsOvernight)} onChange={event => setParking({...parking, allowsOvernight:event.target.checked})} className="accent-[#6250b5]" />Permite que o veículo permaneça de um dia para o outro</label>
						</fieldset>
						<fieldset className="border-t border-[#edf0f5] pt-4">
							<legend className="font-display font-semibold">Forma e valor de cobrança</legend>
							<p className="mt-1 text-xs leading-5 text-[#68738a]">Defina os limites de duração para este estacionamento. A tarifa da faixa selecionada é aplicada a cada hora reservada.</p>
							<div className="mt-3 grid gap-3 sm:grid-cols-2">
								<label className="grid gap-1.5 text-xs font-semibold" htmlFor="rate-tier-first-limit">Primeira faixa até (horas)
									<input id="rate-tier-first-limit" type="number" min="1" max={Number(parking.rateTierLimits.second) - 1 || 3} step="1" required value={parking.rateTierLimits.first} onChange={event => updateRateTierLimit("first", event.target.value)} className="min-h-10 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
								</label>
								<label className="grid gap-1.5 text-xs font-semibold" htmlFor="rate-tier-second-limit">Segunda faixa até (horas)
									<input id="rate-tier-second-limit" type="number" min={Number(parking.rateTierLimits.first) + 1 || 2} max="24" step="1" required value={parking.rateTierLimits.second} onChange={event => updateRateTierLimit("second", event.target.value)} className="min-h-10 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
								</label>
							</div>
							<div className="mt-3 grid gap-3">
								{spotTypes.map(type => <fieldset key={type} className="rounded-lg border border-[#e1e5ed] p-3">
									<legend className="px-1 text-sm font-semibold">{type}</legend>
									<div className="grid gap-3 sm:grid-cols-3">
										{RATE_TIER_KEYS.map(tier => <label key={tier} className="grid gap-1.5 text-xs font-semibold" htmlFor={`rate-${type}-${tier}`}>{getRateTierLabels(parking.rateTierLimits)[tier]} · R$/h
											<input id={`rate-${type}-${tier}`} type="number" min="0.01" step="0.01" required={spotRows.some(spot => featuresForSpot(spot).includes(type))} value={parking.hourlyRates[type][tier]} onChange={event => updateRate(type, tier, event.target.value)} className="min-h-10 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
										</label>)}
									</div>
								</fieldset>)}
							</div>
						</fieldset>
						<fieldset className="border-t border-[#edf0f5] pt-4">
							<legend className="font-display font-semibold">Quantidade de vagas por tipo</legend>
							<div className="mt-3 grid gap-3 sm:grid-cols-3">
								{spotTypes.map(type => {
									const count = spotRows.filter(spot => featuresForSpot(spot).includes(type)).length;
									return <label key={type} className="grid gap-1.5 text-xs font-semibold" htmlFor={`spot-count-${type}`}>{type}
										<input id={`spot-count-${type}`} type="number" min="0" max="500" step="1" value={spotCountDraft[type] ?? count} onChange={event => setSpotCountDraft(counts => ({...counts, [type]: event.target.value}))} onBlur={() => commitSpotCount(type)} className="min-h-10 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
									</label>;
								})}
							</div>
						</fieldset>
						<fieldset className="border-t border-[#edf0f5] pt-4">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<legend className="font-display font-semibold">Vagas ({spotRows.length})</legend>
								<button type="button" onClick={() => setSpotRows(rows => [...rows, {label: "", type: "Descoberta", features:["Descoberta"]}])} className="min-h-9 rounded-lg border border-[#6250b5] px-3 text-sm font-semibold text-[#51419c] transition hover:bg-[#f7f5ff]">+ Adicionar vaga</button>
							</div>
							<div className="mt-3 grid gap-2">
								{spotRows.map((spot, index) => <div key={spot.id || `new-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-2">
									<label className="sr-only" htmlFor={`spot-label-${index}`}>Identificação da vaga {index + 1}</label>
									<input id={`spot-label-${index}`} value={spot.label} onChange={event => updateSpot(index, "label", event.target.value)} required placeholder="Ex.: A01" maxLength={20} className="min-h-10 min-w-0 rounded-lg border border-[#d9dee8] px-3 text-sm outline-none focus:border-[#6250b5]" />
									<fieldset className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-[#d9dee8] px-2"><legend className="sr-only">Tags da vaga {index + 1}</legend>{spotTypes.map(type => <label key={type} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={featuresForSpot(spot).includes(type)} onChange={event => updateSpotFeature(index, type, event.target.checked)} className="accent-[#6250b5]" />{type}</label>)}</fieldset>
									<button type="button" onClick={() => setSpotRows(rows => rows.filter((_, rowIndex) => rowIndex !== index))} aria-label={`Remover vaga ${spot.label || index + 1}`} className="grid h-10 w-10 place-items-center rounded-lg text-lg text-[#9d3440] transition hover:bg-red-50">×</button>
								</div>)}
								{spotRows.length === 0 && <p className="rounded-lg bg-[#f7f8fb] px-3 py-3 text-sm text-[#68738a]">Adicione pelo menos uma vaga para disponibilizar reservas.</p>}
							</div>
						</fieldset>
						<label className="flex min-h-11 items-center gap-3 border-t border-[#edf0f5] pt-4 text-sm font-semibold">
							<input type="checkbox" checked={Boolean(parking.partner)} onChange={event => setParking({...parking, partner: event.target.checked})} className="h-4 w-4 accent-[#6250b5]" />
							Exibir como estacionamento parceiro na busca local
						</label>
						<button type="submit" disabled={saving || loading} className="min-h-12 rounded-lg bg-[#6250b5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#51419c] disabled:cursor-wait disabled:opacity-60">{saving ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar estacionamento"}</button>
					</form>
				</section>
				<section aria-labelledby="parking-list-title">
					<div className="flex items-end justify-between gap-3 border-b border-[#dfe3eb] pb-3">
						<div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6250b5]">API local</p><h2 id="parking-list-title" className="mt-1 font-display text-xl font-semibold">Cadastrados</h2></div>
						<span className="text-sm text-[#68738a]">{parkings.length} locais</span>
					</div>
					{loading ? <p role="status" className="py-6 text-sm text-[#68738a]">Carregando dados...</p> : <div className="mt-3 grid gap-2.5">
						{parkings.map(item => {
							const count = allSpots.filter(spot => spot.parkingId === item.id).length;
							return <article key={item.id} className="rounded-lg border border-[#e1e5ed] bg-white p-4">
								<div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-display font-semibold">{item.name}</h3><p className="mt-1 text-xs leading-5 text-[#68738a]">{item.address}</p></div><span className="shrink-0 rounded-full bg-[#eef0fa] px-2.5 py-1 text-xs font-bold text-[#51419c]">{count} vagas</span></div>
								<div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0f5] pt-3"><span className="text-xs text-[#68738a]">{item.partner ? "Parceiro" : "Não listado"} · Descoberta a partir de R$ {(getHourlyRate(item.hourlyRates, "Descoberta", 1) || 0).toFixed(2).replace(".", ",")}/h</span><button type="button" onClick={() => editParking(item)} className="min-h-9 rounded-lg border border-[#6250b5] px-3 text-xs font-semibold text-[#51419c] transition hover:bg-[#f7f5ff]">Alterar</button></div>
							</article>;
						})}
						{parkings.length === 0 && <p className="rounded-lg border border-dashed border-[#d9dee8] px-4 py-8 text-center text-sm text-[#68738a]">Nenhum estacionamento cadastrado.</p>}
					</div>}
				</section>
			</div>
			<p className="mt-6 rounded-lg border border-[#f1dfae] bg-[#fff9e9] px-4 py-3 text-xs leading-5 text-[#785713]">Protótipo local: alterações são gravadas no json-server. Os controles de login e acesso não substituem autenticação real; use apenas dados fictícios.</p>
		</main>
	</div>;
}

createRoot(document.getElementById("root")).render(<ParkingAdminPage />);