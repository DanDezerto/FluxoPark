import React from "react";
import {createRoot} from "react-dom/client";
import {createDemoId, demoRequest, endDemoSession, readDemoSession} from "../lib/demoAccounts.js";
import {cardExpiryIsValid, digitsOnly, formatCardExpiry, formatCardNumber, identifyCardBrand} from "../lib/paymentMethods.js";
import "../../paginaReserva.css";

const inputClass = "min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none focus:border-[#6250b5] focus:ring-2 focus:ring-[#6250b5]/15";
const blankCard = {holder:"", number:"", expiry:"", type:"credit"};

function PaymentMethodsPage() {
	const session = readDemoSession("driver");
	const [methods, setMethods] = React.useState([]);
	const [card, setCard] = React.useState(blankCard);
	const [editingId, setEditingId] = React.useState("");
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState("");
	const [notice, setNotice] = React.useState("");

	async function loadMethods() {
		const allMethods = await demoRequest("paymentMethods");
		setMethods(allMethods.filter(method => method.userId === session.id));
	}

	React.useEffect(() => {
		if (!session) {
			window.location.replace("loginUsuario.html");
			return;
		}
		loadMethods().catch(loadError => setError(`${loadError.message} Confira se a API local está em execução.`)).finally(() => setLoading(false));
	}, []);

	async function saveCard(event) {
		event.preventDefault();
		setError("");
		setNotice("");
		const number = digitsOnly(card.number);
		if (!editingId && (number.length < 13 || number.length > 19)) {
			setError("Informe um número de cartão válido, com 13 a 19 dígitos.");
			return;
		}
		if (!cardExpiryIsValid(card.expiry)) {
			setError("Informe uma validade futura no formato MM/AA.");
			return;
		}
		setSaving(true);
		try {
			const metadata = {
				holder: card.holder.trim().toUpperCase(),
				expiry: card.expiry,
				type: card.type
			};
			if (editingId) {
				await demoRequest(`paymentMethods/${encodeURIComponent(editingId)}`, {
					method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(metadata)
				});
				setNotice("Método de pagamento atualizado.");
			} else {
				const newMethod = {
					id:createDemoId("card"), userId:session.id, ...metadata,
					brand:identifyCardBrand(number), last4:number.slice(-4), isDefault:methods.length === 0,
					createdAt:new Date().toISOString()
				};
				await demoRequest("paymentMethods", {
					method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(newMethod)
				});
				setNotice("Cartão cadastrado. Os dados completos e o código de segurança não são armazenados.");
			}
			setCard(blankCard);
			setEditingId("");
			await loadMethods();
		} catch (saveError) {
			setError(`${saveError.message} O método não foi confirmado.`);
		} finally {
			setSaving(false);
		}
	}

	async function removeCard(id) {
		setError("");
		try {
			const removedCard = methods.find(method => method.id === id);
			await demoRequest(`paymentMethods/${encodeURIComponent(id)}`, {method:"DELETE"});
			await loadMethods();
			const replacement = removedCard?.isDefault && methods.find(method => method.id !== id);
			if (replacement) {
				await demoRequest(`paymentMethods/${encodeURIComponent(replacement.id)}`, {
					method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({isDefault:true})
				});
				await loadMethods();
			}
			setNotice("Cartão removido.");
		} catch (removeError) {
			setError(`${removeError.message} O cartão não foi removido.`);
		}
	}

	async function setDefault(id) {
		try {
			await Promise.all(methods.map(method => demoRequest(`paymentMethods/${encodeURIComponent(method.id)}`, {
				method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({isDefault:method.id === id})
			})));
			await loadMethods();
			setNotice("Cartão preferencial atualizado.");
		} catch (updateError) {
			setError(`${updateError.message} A preferência não foi atualizada.`);
		}
	}

	if (!session || loading) return <main className="grid min-h-screen place-items-center bg-[#f4f6fa] p-6 text-sm text-[#68738a]">{loading ? "Carregando cartões..." : "Redirecionando..."}</main>;

	return <div className="min-h-screen bg-[#f4f6fa] text-[#172749]">
		<header className="bg-[#1d2b52] text-white"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
			<a href="paginaInicialMotorista.html" className="font-display text-xl font-bold text-white no-underline">FluxoPark</a>
			<nav className="flex flex-wrap items-center gap-4 text-sm"><a href="contaUsuario.html" className="text-white/85 hover:text-white">Minha conta</a><button onClick={() => {endDemoSession(); window.location.assign("loginUsuario.html");}} className="font-semibold text-white">Sair</button></nav>
		</div></header>
		<main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
			<p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6250b5]">Área do motorista</p>
			<h1 className="mt-1 font-display text-3xl font-semibold">Meus métodos de pagamento</h1>
			<p className="mt-2 text-sm text-[#68738a]">Cadastre, edite ou remova cartões para selecionar ao reservar.</p>
			{error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
			{notice && <p role="status" className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}
			<div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
				<section className="rounded-xl border border-[#e1e5ed] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="saved-cards-title">
					<h2 id="saved-cards-title" className="font-display text-xl font-semibold">Cartões cadastrados</h2>
					<div className="mt-4 grid gap-3">
						{methods.map(method => <article key={method.id} className="rounded-lg border border-[#edf0f5] p-4">
							<div className="flex flex-wrap items-start justify-between gap-2">
								<div><h3 className="font-semibold">{method.brand} •••• {method.last4}</h3><p className="mt-1 text-sm text-[#68738a]">{method.holder} · {method.type === "credit" ? "Crédito" : "Débito"} · vence {method.expiry}</p></div>
								{method.isDefault && <span className="rounded-full bg-[#eee8ff] px-2.5 py-1 text-xs font-semibold text-[#6236bc]">Preferencial</span>}
							</div>
							<div className="mt-3 flex flex-wrap gap-3 text-sm">
								<button type="button" onClick={() => {setCard({holder:method.holder, number:"", expiry:method.expiry, type:method.type}); setEditingId(method.id);}} className="font-semibold text-[#51419c] underline">Editar</button>
								<button type="button" onClick={() => removeCard(method.id)} className="font-semibold text-red-700 underline">Remover</button>
								{!method.isDefault && <button type="button" onClick={() => setDefault(method.id)} className="font-semibold text-[#51419c] underline">Definir preferencial</button>}
							</div>
						</article>)}
						{methods.length === 0 && <p className="rounded-lg bg-[#f8fafc] px-4 py-6 text-center text-sm text-[#68738a]">Você ainda não cadastrou cartões.</p>}
					</div>
				</section>
				<section className="rounded-xl border border-[#e1e5ed] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="card-form-title">
					<h2 id="card-form-title" className="font-display text-xl font-semibold">{editingId ? "Editar cartão" : "Adicionar cartão"}</h2>
					<form className="mt-4 grid gap-4" onSubmit={saveCard}>
						<label className="grid gap-1.5 text-sm font-semibold" htmlFor="card-holder">Nome impresso no cartão
							<input id="card-holder" required maxLength={100} value={card.holder} onChange={event => setCard({...card, holder:event.target.value.toUpperCase()})} className={inputClass} />
						</label>
						{!editingId && <label className="grid gap-1.5 text-sm font-semibold" htmlFor="card-number">Número do cartão
							<input id="card-number" required inputMode="numeric" autoComplete="cc-number" value={card.number} onChange={event => setCard({...card, number:formatCardNumber(event.target.value)})} className={inputClass} placeholder="0000 0000 0000 0000" />
							<span className="text-xs font-normal text-[#758098]">Digite apenas os números; a formatação é automática.</span>
						</label>}
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="grid gap-1.5 text-sm font-semibold" htmlFor="card-expiry">Validade
								<input id="card-expiry" required inputMode="numeric" autoComplete="cc-exp" value={card.expiry} onChange={event => setCard({...card, expiry:formatCardExpiry(event.target.value)})} className={inputClass} placeholder="MM/AA" />
							</label>
							<label className="grid gap-1.5 text-sm font-semibold" htmlFor="card-type">Função
								<select id="card-type" value={card.type} onChange={event => setCard({...card, type:event.target.value})} className={`${inputClass} bg-white`}>
									<option value="credit">Crédito</option><option value="debit">Débito</option>
								</select>
							</label>
						</div>
						<p role="note" className="rounded-lg border border-[#f1dfae] bg-[#fff9e9] px-3 py-2.5 text-xs leading-5 text-[#785713]">Protótipo de pagamento: somente bandeira, quatro últimos dígitos e validade são guardados. Não informe cartão real.</p>
						<div className="flex flex-wrap gap-3">
							<button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-[#6250b5] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar cartão"}</button>
							{editingId && <button type="button" onClick={() => {setCard(blankCard); setEditingId("");}} className="min-h-11 rounded-lg border border-[#d9dee8] px-4 text-sm font-semibold">Cancelar</button>}
						</div>
					</form>
				</section>
			</div>
		</main>
	</div>;
}

createRoot(document.getElementById("root")).render(<PaymentMethodsPage />);
