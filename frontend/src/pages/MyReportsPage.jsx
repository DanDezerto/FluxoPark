import React from "react";
import {createRoot} from "react-dom/client";
import {demoRequest, endDemoSession, readDemoSession} from "../lib/demoAccounts.js";
import "../../paginaReserva.css";

function MyReportsPage() {
	const session = readDemoSession("driver");
	const [reports, setReports] = React.useState([]);
	const [error, setError] = React.useState("");
	React.useEffect(() => {
		if (!session) {
			window.location.replace("loginUsuario.html");
			return;
		}
		demoRequest("reports")
			.then(items => setReports(items.filter(item => item.driverId === session.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
			.catch(loadError => setError(`${loadError.message} Confira se a API local está em execução.`));
	}, []);
	return <div className="min-h-screen bg-[#f4f6fa] text-[#172749]">
		<header className="bg-[#1d2b52] text-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6"><a href="paginaInicialMotorista.html" className="font-display text-xl font-bold text-white no-underline">FluxoPark</a><nav className="flex gap-4 text-sm"><a href="contaUsuario.html" className="text-white/85 hover:text-white">Minha conta</a><button onClick={() => {endDemoSession(); window.location.assign("loginUsuario.html");}} className="font-semibold">Sair</button></nav></div></header>
		<main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
			<p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6250b5]">Área do motorista</p><h1 className="mt-1 font-display text-3xl font-semibold">Minhas denúncias</h1><p className="mt-2 text-sm text-[#68738a]">Acompanhe as denúncias e as respostas da equipe FluxoPark.</p>
			{error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
			<div className="mt-6 grid gap-3">{reports.map(report => <article key={report.id} className="rounded-xl border border-[#e1e5ed] bg-white p-5 shadow-sm">
				<div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-lg font-semibold">{report.parkingName || "Estabelecimento"} · {report.category}</h2><p className="mt-1 text-xs text-[#68738a]">{new Intl.DateTimeFormat("pt-BR", {dateStyle:"medium", timeStyle:"short"}).format(new Date(report.createdAt))}</p></div><span className="rounded-full bg-[#eef0fa] px-2.5 py-1 text-xs font-semibold text-[#51419c]">{report.status === "answered" ? "Respondida" : "Em análise"}</span></div>
				<p className="mt-3 text-sm leading-6 text-[#526079]">{report.details}</p>
				{report.adminResponse && <div className="mt-4 rounded-lg border-l-4 border-[#6250b5] bg-[#f8f6ff] p-4"><h3 className="text-sm font-semibold">Resposta do administrador</h3><p className="mt-1 text-sm leading-6 text-[#526079]">{report.adminResponse}</p></div>}
			</article>)}
			{reports.length === 0 && !error && <p className="rounded-xl border border-dashed border-[#d9dee8] bg-white px-4 py-12 text-center text-sm text-[#68738a]">Você ainda não enviou denúncias.</p>}</div>
		</main>
	</div>;
}

createRoot(document.getElementById("root")).render(<MyReportsPage />);
