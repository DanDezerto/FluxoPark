import React from "react";
import {createRoot} from "react-dom/client";
import {demoRequest, endDemoSession, readDemoSession} from "../lib/demoAccounts.js";
import "../../paginaReserva.css";

const weekdays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

async function request(path, options) {
	const response = await fetch(`/${path}`, options);
	if (!response.ok) throw new Error(`Falha na API (${response.status}) ao processar a requisição.`);
	return response.status === 204 ? null : response.json();
}

function RequestTreatmentPage() {
	const session = readDemoSession("admin");
	const [reports, setReports] = React.useState([]);
	const [requests, setRequests] = React.useState([]);
	const [parkings, setParkings] = React.useState([]);
	const [responses, setResponses] = React.useState({});
	const [penalties, setPenalties] = React.useState({});
	const [error, setError] = React.useState("");
	const [notice, setNotice] = React.useState("");
	async function reload() {
		const [reportData, requestData, parkingData] = await Promise.all([
			demoRequest("reports"), demoRequest("partnerRequests"), demoRequest("parkings")
		]);
		setReports(reportData.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
		setRequests(requestData.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
		setParkings(parkingData);
	}
	React.useEffect(() => {
		if (!session) {
			window.location.replace("loginAdministrador.html");
			return;
		}
		reload().catch(loadError => setError(`${loadError.message} Confira se a API está em execução.`));
	}, []);

	async function processReport(report) {
		setError("");
		setNotice("");
		const responseText = responses[report.id]?.trim();
		if (!responseText) {
			setError("Escreva uma resposta antes de concluir a denúncia.");
			return;
		}
		try {
			const penalty = penalties[report.id] || "none";
			const parking = parkings.find(item => item.id === report.parkingId);
			const update = {adminResponse:responseText, status:"answered", answeredAt:new Date().toISOString(), administratorId:session.id};
			if (parking && penalty !== "none") {
				const banUntil = penalty === "indefinite" ? null : new Date(Date.now() + Number(penalty) * 86400000).toISOString();
				await request(`parkings/${encodeURIComponent(parking.id)}`, {
					method:"PATCH", headers:{"Content-Type":"application/json"},
					body:JSON.stringify({banned:true, banUntil, banReason:responseText})
				});
				update.penalty = penalty === "indefinite" ? "indefinite" : `${penalty} dias`;
			}
			await request(`reports/${encodeURIComponent(report.id)}`, {method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(update)});
			await reload();
			setNotice("Denúncia respondida e análise registrada.");
		} catch (processError) {
			setError(`${processError.message} A resposta não foi confirmada.`);
		}
	}

	async function processPartnerRequest(partnerRequest, approved) {
		setError("");
		setNotice("");
		try {
			if (approved) {
				const proposal = partnerRequest.parking;
				const parkingId = `park-${partnerRequest.id}`;
				const accountId = `partner-${partnerRequest.id}`;
				const [currentParkings, currentSpots, currentAccounts] = await Promise.all([
					demoRequest("parkings"), demoRequest("spots"), demoRequest("parkingAccounts")
				]);
				if (!currentParkings.some(item => item.id === parkingId)) {
					await request("parkings", {
						method:"POST", headers:{"Content-Type":"application/json"},
						body:JSON.stringify({...proposal, id:parkingId, partner:true, requestId:partnerRequest.id})
					});
				}
				for (const [index, spot] of (partnerRequest.spots || []).entries()) {
					const spotId = `spot-${partnerRequest.id}-${index + 1}`;
					if (currentSpots.some(item => item.id === spotId)) continue;
					await request("spots", {
						method:"POST", headers:{"Content-Type":"application/json"},
						body:JSON.stringify({...spot, id:spotId, parkingId})
					});
				}
				if (!currentAccounts.some(item => item.id === accountId)) {
					await request("parkingAccounts", {
						method:"POST", headers:{"Content-Type":"application/json"},
						body:JSON.stringify({
							id:accountId, email:partnerRequest.email, cnpj:partnerRequest.cnpj,
							passwordDigest:partnerRequest.passwordDigest, parkingIds:[parkingId], createdAt:new Date().toISOString()
						})
					});
				}
			}
			await request(`partnerRequests/${encodeURIComponent(partnerRequest.id)}`, {
				method:"PATCH", headers:{"Content-Type":"application/json"},
				body:JSON.stringify({status:approved ? "approved" : "rejected", reviewedAt:new Date().toISOString(), reviewedBy:session.id})
			});
			await reload();
			setNotice(approved ? "Estabelecimento aprovado e conta de parceiro criada." : "Solicitação de parceria recusada.");
		} catch (processError) {
			setError(`${processError.message} Confira os dados e tente novamente.`);
		}
	}

	if (!session) return <main className="grid min-h-screen place-items-center text-sm text-[#68738a]">Redirecionando para o acesso administrativo...</main>;
	return <div className="min-h-screen bg-[#f4f6fa] text-[#172749]">
		<header className="bg-[#1d2b52] text-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6"><a href="paginaInicialMotorista.html" className="font-display text-xl font-bold text-white no-underline">FluxoPark · Administração</a><button onClick={() => {endDemoSession(); window.location.assign("loginAdministrador.html");}} className="text-sm font-semibold">Sair</button></div></header>
		<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
			<p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6250b5]">Área administrativa</p><h1 className="mt-1 font-display text-3xl font-semibold">Tratamento de requisições</h1><p className="mt-2 text-sm text-[#68738a]">Analise denúncias de motoristas e solicitações de novos parceiros.</p>
			{error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
			{notice && <p role="status" className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}
			<section className="mt-7" aria-labelledby="reports-title"><div className="flex items-center justify-between border-b border-[#dfe3eb] pb-3"><h2 id="reports-title" className="font-display text-2xl font-semibold">Denúncias</h2><span className="text-sm text-[#68738a]">{reports.filter(report => report.status !== "answered").length} pendentes</span></div>
				<div className="mt-4 grid gap-4">{reports.map(report => <article key={report.id} className="rounded-xl border border-[#e1e5ed] bg-white p-5 shadow-sm">
					<div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-semibold">{report.parkingName} · {report.category}</h3><p className="mt-1 text-xs text-[#68738a]">{report.driverEmail} · {new Intl.DateTimeFormat("pt-BR", {dateStyle:"medium", timeStyle:"short"}).format(new Date(report.createdAt))}</p></div><span className="rounded-full bg-[#eef0fa] px-2.5 py-1 text-xs font-semibold text-[#51419c]">{report.status === "answered" ? "Respondida" : "Pendente"}</span></div>
					<p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#526079]">{report.details}</p>
					{report.status !== "answered" ? <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
						<label className="grid gap-1 text-sm font-semibold" htmlFor={`reply-${report.id}`}>Resposta ao motorista<textarea id={`reply-${report.id}`} rows="3" value={responses[report.id] || ""} onChange={event => setResponses({...responses, [report.id]:event.target.value})} className="rounded-lg border border-[#d9dee8] p-3 text-sm font-normal" /></label>
						<div className="grid content-end gap-2"><label className="grid gap-1 text-xs font-semibold" htmlFor={`penalty-${report.id}`}>Penalidade<select id={`penalty-${report.id}`} value={penalties[report.id] || "none"} onChange={event => setPenalties({...penalties, [report.id]:event.target.value})} className="min-h-10 rounded-lg border border-[#d9dee8] bg-white px-2 text-sm"><option value="none">Sem banimento</option><option value="7">7 dias</option><option value="30">30 dias</option><option value="indefinite">Indeterminado</option></select></label><button onClick={() => processReport(report)} className="min-h-10 rounded-lg bg-[#6250b5] px-4 text-sm font-semibold text-white">Enviar resposta</button></div>
					</div> : <div className="mt-4 rounded-lg bg-[#f8f6ff] p-3 text-sm"><strong>Resposta:</strong> {report.adminResponse}{report.penalty && <p className="mt-1 text-xs">Penalidade: {report.penalty}</p>}</div>}
				</article>)}{reports.length === 0 && <p className="rounded-xl border border-dashed border-[#d9dee8] bg-white px-4 py-10 text-center text-sm text-[#68738a]">Nenhuma denúncia recebida.</p>}</div>
			</section>
			<section className="mt-10" aria-labelledby="partners-title"><div className="flex items-center justify-between border-b border-[#dfe3eb] pb-3"><h2 id="partners-title" className="font-display text-2xl font-semibold">Solicitações de parceria</h2><span className="text-sm text-[#68738a]">{requests.filter(item => item.status === "pending").length} pendentes</span></div>
				<div className="mt-4 grid gap-4">{requests.map(item => <article key={item.id} className="rounded-xl border border-[#e1e5ed] bg-white p-5 shadow-sm">
					<div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{item.parking?.name}</h3><p className="mt-1 text-sm text-[#68738a]">{item.parking?.address}</p><p className="mt-1 text-xs text-[#758098]">{item.email} · CNPJ {item.cnpj}</p></div><span className="rounded-full bg-[#eef0fa] px-2.5 py-1 text-xs font-semibold text-[#51419c]">{item.status === "pending" ? "Pendente" : item.status === "approved" ? "Aprovada" : "Recusada"}</span></div>
					{item.status === "pending" && <div className="mt-4 flex flex-wrap gap-3"><button onClick={() => processPartnerRequest(item, true)} className="min-h-10 rounded-lg bg-[#6250b5] px-4 text-sm font-semibold text-white">Aprovar e criar conta</button><button onClick={() => processPartnerRequest(item, false)} className="min-h-10 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700">Recusar</button></div>}
				</article>)}{requests.length === 0 && <p className="rounded-xl border border-dashed border-[#d9dee8] bg-white px-4 py-10 text-center text-sm text-[#68738a]">Nenhuma solicitação de parceria recebida.</p>}</div>
			</section>
			<p className="mt-8 rounded-lg border border-[#f1dfae] bg-[#fff9e9] px-4 py-3 text-xs leading-5 text-[#785713]">Protótipo local: as rotas do json-server não aplicam autorização; em produção, a gestão e os banimentos precisam ser protegidos por um backend com autenticação.</p>
		</main>
	</div>;
}
createRoot(document.getElementById("root")).render(<RequestTreatmentPage />);
