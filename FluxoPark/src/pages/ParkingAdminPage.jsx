import React from "react";
import { createRoot } from "react-dom/client";
import {demoRequest, readDemoSession, registerDemoAccount, startDemoSession, endDemoSession} from "../lib/demoAccounts.js";
import "../../paginaReserva.css";

const spotTypes = ["Comum", "Coberta", "Acessível"];
const emptyParking = {
	name: "",
	address: "",
	googlePlaceId: "",
	partner: true,
	rating: "",
	hourlyRates: {Comum: "", Coberta: "", Acessível: ""},
	toleranceMinutes: "15"
};

function makeId(prefix) {
	return `${prefix}-${window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 12)}`;
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
			toleranceMinutes: item.toleranceMinutes ?? 15,
			hourlyRates: {...emptyParking.hourlyRates, ...item.hourlyRates}
		});
		setSpotRows(allSpots.filter(spot => spot.parkingId === item.id).map(spot => ({...spot})));
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

	function updateRate(type, value) {
		setParking(current => ({...current, hourlyRates: {...current.hourlyRates, [type]: value}}));
	}

	function updateSpot(index, key, value) {
		setSpotRows(rows => rows.map((spot, rowIndex) => rowIndex === index ? {...spot, [key]: value} : spot));
	}

	function resizeSpotType(type, targetCount) {
		setSpotRows(rows => {
			const typedSpots = rows.filter(spot => spot.type === type);
			if (targetCount < typedSpots.length) {
				const removeCount = typedSpots.length - targetCount;
				const removed = new Set(typedSpots.slice(-removeCount));
				return rows.filter(spot => !removed.has(spot));
			}
			const usedLabels = new Set(rows.map(spot => spot.label.trim().toLowerCase()));
			const prefix = {"Comum": "COM", "Coberta": "COB", "Acessível": "ACE"}[type];
			const additions = [];
			let sequence = 1;
			while (additions.length < targetCount - typedSpots.length) {
				const label = `${prefix}-${String(sequence).padStart(2, "0")}`;
				if (!usedLabels.has(label.toLowerCase())) {
					additions.push({label, type});
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

	async function saveParking(event) {
			event.preventDefault();
			setError("");
			setNotice("");
			const formData = new FormData(event.currentTarget);
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
			if (normalizedSpots.some(spot => !spot.label) || new Set(labels).size !== labels.length) {
				setError("Preencha cada identificação de vaga e use identificações únicas.");
				return;
		}
		setSaving(true);
		try {
			if (!partnerSession) {
				const accounts = await demoRequest("parkingAccounts");
				if (accounts.some(account => account.email.toLowerCase() === email || account.cnpj === cnpj)) {
					throw new Error("Já existe um cadastro de parceiro com este e-mail ou CNPJ.");
				}
			}
			const parkingId = editingId || makeId("park");
			const payload = {
				id: parkingId,
				name: parking.name.trim(),
				address: parking.address.trim(),
				googlePlaceId: parking.googlePlaceId.trim() || null,
				partner: Boolean(parking.partner),
				rating: Number(parking.rating) || 0,
				hourlyRates: Object.fromEntries(spotTypes.map(type => [type, Number(parking.hourlyRates[type]) || 0])),
				toleranceMinutes: Number(parking.toleranceMinutes) || 0
			};
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
				const spotPayload = {parkingId, label: spot.label, type: spot.type};
				await request(spot.id ? `spots/${encodeURIComponent(spot.id)}` : "spots", {
					method: spot.id ? "PATCH" : "POST",
					headers: {"Content-Type": "application/json"},
					body: JSON.stringify(spot.id ? spotPayload : {...spotPayload, id: makeId("spot")})
				});
			}

			if (!partnerSession) {
				const account = await registerDemoAccount("parkingAccounts", {email, cnpj, parkingIds:[parkingId]}, password);
				startDemoSession(account, "parking");
			} else if (!editingId && partnerAccount && !partnerAccount.parkingIds?.includes(parkingId)) {
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
			if (!partnerSession) window.location.replace("cadastroEstacionamento.html");
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
				<p className="max-w-lg text-sm leading-6 text-[#68738a]">{partnerSession ? "Atualize seus estacionamentos, tarifas e vagas. Você só verá os locais vinculados a esta conta." : "Cadastre os dados do estabelecimento e da pessoa responsável para criar a conta do portal."}</p>
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
								<input id="partner-cnpj" name="partnerCnpj" type="text" inputMode="numeric" autoComplete="off" required minLength={14} maxLength={18} pattern="[0-9./-]{14,18}" placeholder="00.000.000/0000-00" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
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
							<legend className="font-display font-semibold">Forma e valor de cobrança</legend>
							<p className="mt-1 text-xs leading-5 text-[#68738a]">A cobrança é por hora; informe o valor para cada tipo de vaga disponível.</p>
							<div className="mt-3 grid gap-3 sm:grid-cols-3">
								{spotTypes.map(type => <label key={type} className="grid gap-1.5 text-xs font-semibold" htmlFor={`rate-${type}`}>{type} · R$/h
									<input id={`rate-${type}`} type="number" min="0.01" step="0.01" required={spotRows.some(spot => spot.type === type)} value={parking.hourlyRates[type]} onChange={event => updateRate(type, event.target.value)} className="min-h-10 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
								</label>)}
							</div>
						</fieldset>
						<fieldset className="border-t border-[#edf0f5] pt-4">
							<legend className="font-display font-semibold">Quantidade de vagas por tipo</legend>
							<div className="mt-3 grid gap-3 sm:grid-cols-3">
								{spotTypes.map(type => {
									const count = spotRows.filter(spot => spot.type === type).length;
									return <label key={type} className="grid gap-1.5 text-xs font-semibold" htmlFor={`spot-count-${type}`}>{type}
										<input id={`spot-count-${type}`} type="number" min="0" max="500" step="1" value={spotCountDraft[type] ?? count} onChange={event => setSpotCountDraft(counts => ({...counts, [type]: event.target.value}))} onBlur={() => commitSpotCount(type)} className="min-h-10 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15" />
									</label>;
								})}
							</div>
						</fieldset>
						<fieldset className="border-t border-[#edf0f5] pt-4">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<legend className="font-display font-semibold">Vagas ({spotRows.length})</legend>
								<button type="button" onClick={() => setSpotRows(rows => [...rows, {label: "", type: "Comum"}])} className="min-h-9 rounded-lg border border-[#6250b5] px-3 text-sm font-semibold text-[#51419c] transition hover:bg-[#f7f5ff]">+ Adicionar vaga</button>
							</div>
							<div className="mt-3 grid gap-2">
								{spotRows.map((spot, index) => <div key={spot.id || `new-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
									<label className="sr-only" htmlFor={`spot-label-${index}`}>Identificação da vaga {index + 1}</label>
									<input id={`spot-label-${index}`} value={spot.label} onChange={event => updateSpot(index, "label", event.target.value)} required placeholder="Ex.: A01" maxLength={20} className="min-h-10 min-w-0 rounded-lg border border-[#d9dee8] px-3 text-sm outline-none focus:border-[#6250b5]" />
									<label className="sr-only" htmlFor={`spot-type-${index}`}>Tipo da vaga {index + 1}</label>
									<select id={`spot-type-${index}`} value={spot.type} onChange={event => updateSpot(index, "type", event.target.value)} className="min-h-10 min-w-0 rounded-lg border border-[#d9dee8] bg-white px-2 text-sm outline-none focus:border-[#6250b5]">{spotTypes.map(type => <option key={type}>{type}</option>)}</select>
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
								<div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0f5] pt-3"><span className="text-xs text-[#68738a]">{item.partner ? "Parceiro" : "Não listado"} · Comum R$ {Number(item.hourlyRates?.Comum || 0).toFixed(2).replace(".", ",")}/h</span><button type="button" onClick={() => editParking(item)} className="min-h-9 rounded-lg border border-[#6250b5] px-3 text-xs font-semibold text-[#51419c] transition hover:bg-[#f7f5ff]">Alterar</button></div>
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