import React from "react";
import {readDemoSession} from "../../lib/demoAccounts.js";

export function DriverHeader({query, onQueryChange, onSearch, menuOpen, onToggleMenu}) {
			const driverSession = readDemoSession("driver");
			return <header className="bg-[#1d2b52] text-white">
				<div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-10 gap-y-5 px-5 py-6 sm:px-8 lg:min-h-[190px] lg:flex-nowrap lg:px-10">
					<a href="paginaInicialMotorista.html" className="flex min-w-0 flex-1 items-center gap-4 text-white no-underline sm:gap-5" aria-label="FluxoPark início">
						<img className="h-14 w-14 shrink-0 object-contain sm:h-[84px] sm:w-[84px]" src="RefsVisuais/FluxoPark%20-%20Logotipo%20(1).png" alt="Logotipo FluxoPark" />
						<span className="min-w-0">
							<strong className="font-display block truncate text-4xl font-bold tracking-[-0.07em] sm:text-6xl xl:text-7xl">FluxoPark</strong>
							<small className="mt-1 block text-sm font-semibold sm:mt-2 sm:text-xl">Estacionamento Dinâmico</small>
						</span>
					</a>
					<form onSubmit={onSearch} className="order-3 w-full lg:order-none lg:w-[360px] lg:shrink-0">
						<label htmlFor="destination" className="mb-2 block font-display text-lg font-semibold sm:text-xl">Digite o destino desejado:</label>
						<div className="flex h-11 overflow-hidden rounded-full border-2 border-white/90 pl-4 focus-within:ring-2 focus-within:ring-white/40">
							<input id="destination" value={query} onChange={event => onQueryChange(event.target.value)} placeholder="Digite um endereço" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60" />
							<button type="submit" aria-label="Buscar" className="grid w-12 place-items-center text-white transition hover:bg-white/10">
								<svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2.5]"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path></svg>
							</button>
						</div>
					</form>
					<button type="button" onClick={onToggleMenu} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} className="grid shrink-0 gap-[6px] rounded-lg p-2 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/70">
						<span className="h-[5px] w-9 rounded-full bg-white sm:w-11"></span><span className="h-[5px] w-9 rounded-full bg-white sm:w-11"></span><span className="h-[5px] w-9 rounded-full bg-white sm:w-11"></span>
					</button>
				</div>
				{menuOpen && <nav aria-label="Acesso às contas" className="border-t border-white/15 bg-[#172444] px-5 py-3 sm:px-8 lg:px-10">
					<div className="mx-auto flex max-w-[1500px] flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
						<a href="loginUsuario.html" className="text-white/90 transition hover:text-white">Entrar como motorista</a>
						{driverSession && <a href="contaUsuario.html" className="text-white/90 transition hover:text-white">Minha conta e reservas</a>}
						<a href="loginEstacionamento.html" className="text-white/90 transition hover:text-white">Portal do estacionamento</a>
					</div>
				</nav>}
			</header>;
		}

		export function ParkingCard({option, index, isSelected, onSelect, reservationHref}) {
			const distanceLabel = option.source === "local"
				? "Distância depende da busca real"
				: option.driveMinutes === Number.MAX_SAFE_INTEGER
					? "Rota indisponível"
					: `${option.driveMinutes} min de carro · ${option.distanceMeters < 1000 ? `${option.distanceMeters} m` : `${(option.distanceMeters / 1000).toFixed(1)} km`}`;
			const priceLabel = option.hourlyRate
				? `R$ ${option.hourlyRate.toFixed(2).replace(".", ",")}/h`
				: option.priceLevel
					? "R$" + "$".repeat(option.priceLevel)
					: "Consultar preço";

			return <article id={`parking-${option.id}`} className={`overflow-hidden rounded-xl border bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${isSelected ? "border-[#416cf2] shadow-md ring-1 ring-[#416cf2]/15" : "border-[#e5e7eb] shadow-sm"}`}>
				<button type="button" onClick={onSelect} aria-expanded={isSelected} className="w-full p-3.5 text-left sm:p-4">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0"><div className="flex items-center gap-2"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${index === 0 ? "bg-[#416cf2] text-white" : "bg-[#edf0f7] text-[#52627f]"}`}>{index + 1}</span><h2 className="truncate font-display text-[15px] font-semibold text-[#172749] sm:text-base">{option.name}</h2></div><p className="mt-1 truncate pl-8 text-xs text-[#68738a]">{option.address}</p></div>
						<span className="shrink-0 rounded-full bg-[#fff2bd] px-2 py-1 text-xs font-bold text-[#805c00]">{option.rating ? `★ ${option.rating.toFixed(1)}` : "Sem nota"}</span>
					</div>
					<div className="mt-3 flex flex-wrap gap-1.5 pl-8">
						<span className="rounded-full bg-[#e5f8ee] px-2.5 py-1 text-[11px] font-bold text-[#087548]">{priceLabel}</span>
						<span className="rounded-full bg-[#e9edff] px-2.5 py-1 text-[11px] font-bold text-[#3f5dd7]"><svg aria-hidden="true" viewBox="0 0 24 24" className="mr-1 inline h-3.5 w-3.5 fill-none stroke-current stroke-[1.8]"><path d="M5 16.5h14l-1.3-6a2 2 0 0 0-2-1.5H8.3a2 2 0 0 0-2 1.5l-1.3 6Z"/><path d="M5 16.5v2h2v-2m10 0v2h2v-2M7 13h10M8 9l1-2h6l1 2"/><circle cx="8" cy="14.5" r=".8" fill="currentColor"/><circle cx="16" cy="14.5" r=".8" fill="currentColor"/></svg>{distanceLabel}</span>
						{option.partner && <span className="rounded-full bg-[#eee8ff] px-2.5 py-1 text-[11px] font-bold text-[#6236bc]">♛ Parceiro</span>}
					</div>
				</button>
				{option.partner && <div className="px-3.5 pb-3.5 sm:px-4"><a href={reservationHref} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2">Reservar vaga</a></div>}
				{isSelected && <div className="border-t border-[#edf0f5] bg-[#fafbfe] px-4 py-3.5">
					<div className="mb-3 flex items-center justify-between"><h3 className="font-display text-sm font-semibold">Sobre este estacionamento</h3><span className="text-xs text-[#758098]">{option.source === "local" ? "Dados do projeto" : option.detailsLoaded ? "Informações do Google" : "Carregando detalhes..."}</span></div>
					{option.photos?.length > 0 ? <div className="grid grid-cols-4 gap-1.5" aria-label="Fotos do estacionamento">{option.photos.map((photo, photoIndex) => <img key={photoIndex} src={photo} alt={`Foto de ${option.name}`} className="h-12 w-full rounded-md object-cover" loading="lazy" />)}</div> : <p className="text-xs text-[#68738a]">Fotos indisponíveis.</p>}
					{option.rating > 0 && <p className="mt-3 text-xs text-[#526079]">Avaliação: <strong className="text-[#253653]">★ {option.rating.toFixed(1)}</strong>{option.reviewCount ? ` · ${option.reviewCount} avaliações` : ""}</p>}
					{option.phone && <p className="mt-2 text-xs text-[#526079]">Contato: <strong className="text-[#253653]">{option.phone}</strong></p>}
					{option.openingHours?.length > 0 && <div className="mt-3 text-xs text-[#526079]"><strong className="text-[#253653]">Horários</strong><ul className="mt-1 grid gap-1">{option.openingHours.map(hour => <li key={hour}>{hour}</li>)}</ul></div>}
					{option.reviews?.length > 0 && <div className="mt-3 text-xs text-[#526079]"><strong className="text-[#253653]">Comentários recentes</strong><ul className="mt-1 grid gap-2">{option.reviews.slice(0,3).map((review, reviewIndex) => <li key={reviewIndex} className="rounded-md bg-white p-2"><strong>{review.authorAttribution?.displayName || "Usuário do Google"}</strong><span className="ml-2">★ {review.rating || "—"}</span><p className="mt-1">{review.text?.text || "Comentário sem texto"}</p></li>)}</ul></div>}
					{option.priceLevel === 0 && !option.hourlyRate && <p className="mt-2 text-xs text-[#526079]">Preço não informado pelo Google.</p>}
					{option.place && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs"><span className="text-[#526079]">Informações fornecidas pelo Google Maps</span><a href={option.googleMapsURI || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(option.name + " " + option.address)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#1d2b52] px-3 py-2 font-semibold text-white transition hover:bg-[#2c4177]">Abrir no Google Maps ↗</a></div>}
					{option.source === "local" && <p className="mt-3 text-xs text-[#758098]">Dados cadastrados no json-server. A lista de teste não representa a proximidade do destino informado.</p>}
					{!option.place && option.source !== "local" && <p className="mt-3 text-xs text-[#758098]">Este resultado é de demonstração.</p>}
				</div>}
			</article>;
		}
