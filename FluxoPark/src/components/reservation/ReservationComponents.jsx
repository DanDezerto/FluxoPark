import React from "react";

export function ReservationHeader({onBack}) {
			return <header className="bg-[#1d2b52] text-white">
				<div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 sm:px-6">
					<button type="button" onClick={onBack} aria-label="Voltar à busca" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xl transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white">←</button>
					<img src="RefsVisuais/FluxoPark%20-%20Logotipo%20(1).png" alt="Logotipo FluxoPark" className="h-12 w-12 object-contain" />
					<div><strong className="font-display text-xl font-bold sm:text-2xl">FluxoPark</strong><p className="text-xs text-white/75">Reserva de estacionamento</p></div>
				</div>
			</header>;
		}

		export function ParkingIdentity({name, address}) {
			return <div className="mt-6 rounded-xl border border-[#e9e5f5] bg-[#faf8ff] p-4">
				<div className="flex items-start gap-3">
					<span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eee8ff] text-lg text-[#7c3aed]" aria-hidden="true">P</span>
					<div className="min-w-0"><h2 className="font-display font-semibold">{name}</h2><p className="mt-1 text-sm leading-5 text-[#68738a]">{address}</p></div>
				</div>
			</div>;
		}

		export function BookingApiStatus({isLoading, apiError}) {
			return <div className={`mt-5 rounded-lg px-4 py-3 text-xs leading-5 ${apiError ? "border border-red-200 bg-red-50 text-red-800" : "border border-[#f1dfae] bg-[#fff9e9] text-[#785713]"}`} role={apiError ? "alert" : "status"}>
				{isLoading ? "Carregando estacionamentos, vagas e reservas da API local..." : apiError ? apiError : <><strong>API local conectada:</strong> disponibilidade, tarifas e reservas são lidas e gravadas no json-server. O pagamento continua simulado.</>}
			</div>;
		}

		export function TimeSlotPicker({availableSlots, reservationTime, timeSlots, disabled, onSelect, error}) {
			return <fieldset className="sm:col-span-2">
				<legend className="text-sm font-semibold">Horários com vagas disponíveis</legend>
				<p className="mt-1 text-xs text-[#758098]">{availableSlots.length} horários com vaga disponível para o tipo selecionado.</p>
				<div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
					{timeSlots.map(time => {
						const selectable = availableSlots.includes(time);
						const selectedSlot = reservationTime === time;
						return <button key={time} type="button" disabled={!selectable || disabled} aria-pressed={selectedSlot} onClick={() => onSelect(time)} className={`min-h-10 rounded-lg border px-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 ${selectable ? selectedSlot ? "border-[#7c3aed] bg-[#7c3aed] text-white" : "border-[#d9dee8] bg-white text-[#34415c] hover:border-[#7c3aed] hover:text-[#7c3aed]" : "cursor-not-allowed border-[#edf0f5] bg-[#f8fafc] text-[#a2a9b7] line-through"}`} title={selectable ? "Selecionar horário" : "Sem vaga disponível nesse horário"}>{time}{!selectable && <span className="sr-only">, indisponível</span>}</button>;
					})}
				</div>
				{error && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{error}</p>}
			</fieldset>;
		}

		export function SpotPicker({spots, reservationTime, selectedSpotId, isSpotAvailable, onSelect, disabled}) {
			const availableCount = spots.filter(spot => reservationTime && isSpotAvailable(spot)).length;
			return <fieldset className="sm:col-span-2">
				<legend className="text-sm font-semibold">Escolha uma vaga <span className="font-normal text-[#758098]">({availableCount} disponíveis)</span></legend>
				<div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
					{spots.map(spot => {
						const available = Boolean(reservationTime && isSpotAvailable(spot));
						const selected = selectedSpotId === spot.id;
						return <button key={spot.id} type="button" disabled={!available || disabled} aria-pressed={selected} onClick={() => onSelect(spot.id)} className={`min-h-10 rounded-lg border px-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 ${!available ? "cursor-not-allowed border-[#edf0f5] bg-[#f8fafc] text-[#a2a9b7]" : selected ? "border-[#7c3aed] bg-[#7c3aed] text-white" : "border-[#d9dee8] bg-white text-[#34415c] hover:border-[#7c3aed] hover:text-[#7c3aed]"}`}>{spot.label}{!available && <span className="sr-only">, indisponível</span>}</button>;
					})}
				</div>
				{reservationTime && availableCount === 0 && <p className="mt-2 text-xs text-[#758098]">Não há vagas desse tipo nesse período. Tente outra duração ou horário.</p>}
			</fieldset>;
		}

		export function DriverDetailsFields({register, errors}) {
			return <fieldset className="border-t border-[#edf0f5] pt-5">
				<legend className="font-display text-lg font-semibold">Seus dados</legend>
				<div className="mt-3 grid gap-4 sm:grid-cols-2">
					<label className="grid gap-1.5 text-sm font-semibold sm:col-span-2" htmlFor="driver-name">Nome completo
						<input id="driver-name" type="text" autoComplete="name" maxLength="100" {...register("driverName")} placeholder="Como podemos chamar você?" aria-invalid={Boolean(errors.driverName)} className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none placeholder:text-[#9aa3b4] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/15" />
						{errors.driverName && <span role="alert" className="text-xs font-medium text-red-700">{errors.driverName.message}</span>}
					</label>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="driver-email">E-mail
						<input id="driver-email" type="email" autoComplete="email" maxLength="160" {...register("driverEmail")} placeholder="voce@exemplo.com" aria-invalid={Boolean(errors.driverEmail)} className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none placeholder:text-[#9aa3b4] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/15" />
						{errors.driverEmail && <span role="alert" className="text-xs font-medium text-red-700">{errors.driverEmail.message}</span>}
					</label>
					<label className="grid gap-1.5 text-sm font-semibold" htmlFor="driver-phone">Celular
						<input id="driver-phone" type="tel" autoComplete="tel" maxLength="20" {...register("driverPhone")} placeholder="(11) 99999-9999" aria-invalid={Boolean(errors.driverPhone)} className="min-h-11 rounded-lg border border-[#d9dee8] px-3 text-sm font-normal outline-none placeholder:text-[#9aa3b4] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/15" />
						{errors.driverPhone && <span role="alert" className="text-xs font-medium text-red-700">{errors.driverPhone.message}</span>}
					</label>
				</div>
			</fieldset>;
		}

		export function PaymentMethodPicker({paymentMethod, onChange}) {
			const methods = ["Pix", "Cartão de crédito"];
			return <fieldset className="border-t border-[#edf0f5] pt-5">
				<legend className="font-display text-lg font-semibold">Forma de pagamento (demonstração)</legend>
				<div className="mt-3 grid gap-3 sm:grid-cols-2">
					{methods.map(method => <label key={method} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 text-sm font-semibold transition ${paymentMethod === method ? "border-[#7c3aed] bg-[#faf8ff] text-[#5125a7]" : "border-[#d9dee8] hover:border-[#b8a6dc]"}`}>
						<input type="radio" name="paymentMethod" value={method} checked={paymentMethod === method} onChange={() => onChange(method)} className="accent-[#7c3aed]" />{method}
					</label>)}
				</div>
			</fieldset>;
		}

		export function ReservationSummary({spotType, spotLabel, duration, hourlyRate, paymentMethod, price, placeId}) {
			return <aside className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-6" aria-label="Resumo demonstrativo da reserva">
				<h2 className="font-display text-xl font-semibold">Resumo</h2>
				<p className="mt-1 text-xs text-[#758098]">Tarifas cadastradas na API local; pagamento não processado.</p>
				<div className="mt-5 flex items-center justify-between gap-3 border-b border-[#edf0f5] pb-4 text-sm"><span className="text-[#68738a]">Vaga {spotType.toLowerCase()} {spotLabel || ""}</span><strong>{duration} {duration === 1 ? "hora" : "horas"}</strong></div>
				<div className="mt-4 flex items-center justify-between text-sm"><span className="text-[#68738a]">Estimativa por hora</span><span>R$ {hourlyRate.toFixed(2).replace(".", ",")}</span></div>
				<div className="mt-3 flex items-center justify-between text-sm"><span className="text-[#68738a]">Pagamento escolhido</span><span>{paymentMethod}</span></div>
				<div className="mt-5 flex items-end justify-between border-t border-[#edf0f5] pt-4"><span className="font-semibold">Total estimado</span><strong className="font-display text-2xl text-[#7c3aed]">R$ {price.toFixed(2).replace(".", ",")}</strong></div>
				<p className="mt-5 rounded-lg bg-[#f8fafc] p-3 text-xs leading-5 text-[#68738a]">Valor e disponibilidade vêm do db.json. A gravação local demonstra a reserva, mas o json-server não é um backend transacional para uso real.</p>
				{placeId && <p className="mt-3 break-all text-[10px] text-[#9aa3b4]">ID do local: {placeId}</p>}
			</aside>;
		}

		export function ReservationReview({reservationDate, reservationTime, duration, spotType, spotLabel, paymentMethod, price, onEdit}) {
			return <section className="rounded-xl border border-[#e9e5f5] bg-[#faf8ff] p-4" aria-labelledby="review-title">
				<h2 id="review-title" className="font-display font-semibold">Revise antes de confirmar</h2>
				<dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
					<div><dt className="text-[#68738a]">Data e horário</dt><dd className="font-semibold">{new Intl.DateTimeFormat("pt-BR").format(new Date(`${reservationDate}T12:00:00`))} · {reservationTime}</dd></div>
					<div><dt className="text-[#68738a]">Duração e vaga</dt><dd className="font-semibold">{duration} {duration === 1 ? "hora" : "horas"} · {spotType} {spotLabel}</dd></div>
					<div><dt className="text-[#68738a]">Pagamento (simulado)</dt><dd className="font-semibold">{paymentMethod}</dd></div>
					<div><dt className="text-[#68738a]">Total estimado</dt><dd className="font-semibold text-[#7c3aed]">R$ {price.toFixed(2).replace(".", ",")}</dd></div>
				</dl>
				<button type="button" onClick={onEdit} className="mt-4 text-sm font-semibold text-[#6236bc] underline underline-offset-2">Editar dados da solicitação</button>
			</section>;
		}

		export function ReservationConfirmation({reservation, code, parkingAddress}) {
			return <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10 sm:px-6">
				<section className="w-full rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm sm:p-10" aria-labelledby="confirmation-title">
					<div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e9f8ef] text-3xl font-bold text-[#13834f]" aria-hidden="true">✓</div>
					<p className="mt-6 text-center text-xs font-bold uppercase tracking-[0.16em] text-[#7c3aed]">Solicitação registrada nesta demonstração</p>
					<h1 id="confirmation-title" className="mt-2 text-center font-display text-3xl font-semibold text-[#172749]">Reserva simulada!</h1>
					<p className="mt-3 text-center text-sm leading-6 text-[#68738a]">Obrigado, {reservation.driverName}. A reserva foi registrada na API local para demonstração. Nenhum pagamento real foi processado.</p>
					<div className="mt-7 rounded-xl bg-[#f8fafc] p-5">
						<div className="flex items-center justify-between gap-4 border-b border-[#e5e7eb] pb-4"><span className="text-sm text-[#68738a]">Código de demonstração</span><strong className="font-display text-lg text-[#172749]">{code}</strong></div>
						<dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
							<div><dt className="text-[#68738a]">Estacionamento</dt><dd className="mt-1 font-semibold">{reservation.parkingName}</dd></div>
							<div><dt className="text-[#68738a]">Endereço</dt><dd className="mt-1 font-semibold">{parkingAddress}</dd></div>
							<div><dt className="text-[#68738a]">Período</dt><dd className="mt-1 font-semibold">{new Intl.DateTimeFormat("pt-BR").format(new Date(reservation.startAt))} · {new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date(reservation.startAt))}–{new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date(reservation.endAt))}</dd></div>
							<div><dt className="text-[#68738a]">Duração e vaga</dt><dd className="mt-1 font-semibold">{reservation.durationHours} {reservation.durationHours === 1 ? "hora" : "horas"} · {reservation.spotType} {reservation.spotLabel}</dd></div>
							<div><dt className="text-[#68738a]">Pagamento selecionado</dt><dd className="mt-1 font-semibold">{reservation.paymentMethod} (simulação)</dd></div>
							<div><dt className="text-[#68738a]">E-mail</dt><dd className="mt-1 font-semibold">{reservation.driverEmail}</dd></div>
							<div><dt className="text-[#68738a]">Celular</dt><dd className="mt-1 font-semibold">{reservation.driverPhone}</dd></div>
							<div><dt className="text-[#68738a]">Total estimado</dt><dd className="mt-1 font-semibold">R$ {Number(reservation.totalAmount).toFixed(2).replace(".", ",")}</dd></div>
						</dl>
					</div>
					<p className="mt-4 text-center text-xs leading-5 text-[#758098]">A API local grava esta reserva no arquivo db.json. Como o json-server não implementa transações, esta demonstração não garante exclusividade em acessos simultâneos.</p>
					<a href="paginaInicialMotorista.html" className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#1d2b52] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2c4177]">Voltar para a busca</a>
				</section>
			</main>;
		}
