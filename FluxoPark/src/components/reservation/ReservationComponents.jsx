import React from "react";
import QRCode from "qrcode";
import {cardExpiryIsValid, digitsOnly, formatCardExpiry, formatCardNumber, identifyCardBrand} from "../../lib/paymentMethods.js";
import {getSpotFeatures} from "../../lib/spotFeatures.js";

const weekdayLabels = [
	{short:"Seg", full:"Segunda-feira"},
	{short:"Ter", full:"Terça-feira"},
	{short:"Qua", full:"Quarta-feira"},
	{short:"Qui", full:"Quinta-feira"},
	{short:"Sex", full:"Sexta-feira"},
	{short:"Sáb", full:"Sábado"},
	{short:"Dom", full:"Domingo"}
];

function parseBrazilianDate(value) {
	const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
	if (!match) return "";
	const [, day, month, year] = match;
	const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
	if (parsed.getUTCFullYear() !== Number(year) || parsed.getUTCMonth() !== Number(month) - 1 || parsed.getUTCDate() !== Number(day)) return "";
	return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function formatBrazilianDate(value) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

function dateParts(value) {
	const [year, month, day] = value.split("-").map(Number);
	return {year, month, day};
}

export function ReservationDatePicker({id = "reservation-date", value, minDate, disabled, error, onChange}) {
	const [dateText, setDateText] = React.useState(() => formatBrazilianDate(value));
	const [calendarOpen, setCalendarOpen] = React.useState(false);
	const initialDate = value || minDate;
	const [visibleMonth, setVisibleMonth] = React.useState(() => {
		const {year, month} = dateParts(initialDate);
		return new Date(year, month - 1, 1);
	});
	React.useEffect(() => {
		if (!value) return;
		setDateText(formatBrazilianDate(value));
		const {year, month} = dateParts(value);
		setVisibleMonth(new Date(year, month - 1, 1));
	}, [value]);
	const parsedInput = parseBrazilianDate(dateText);
	const dateError = dateText && (!parsedInput || parsedInput < minDate)
		? parsedInput
			? `A data deve ser igual ou posterior a ${formatBrazilianDate(minDate)}.`
			: "Informe uma data válida no formato DD/MM/AAAA."
		: "";
	const formatId = `${id}-format`;
	const errorId = `${id}-error`;
	const firstWeekday = (new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay() + 6) % 7;
	const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
	const minimumMonth = dateParts(minDate);
	const previousMonthDisabled = visibleMonth.getFullYear() < minimumMonth.year ||
		(visibleMonth.getFullYear() === minimumMonth.year && visibleMonth.getMonth() + 1 <= minimumMonth.month);
	const monthLabel = new Intl.DateTimeFormat("pt-BR", {month:"long", year:"numeric"}).format(visibleMonth);

	function selectDate(date) {
		if (date < minDate) return;
		setDateText(formatBrazilianDate(date));
		onChange(date);
		setCalendarOpen(false);
	}

	return <div className="relative">
		<div className="flex min-h-11 overflow-hidden rounded-lg border border-[#d9dee8] bg-white focus-within:border-[#7c3aed] focus-within:ring-2 focus-within:ring-[#7c3aed]/15">
			<input id={id} type="text" inputMode="numeric" autoComplete="off" placeholder="DD/MM/AAAA" value={dateText} onChange={event => {
				const nextText = event.target.value;
				const nextDate = parseBrazilianDate(nextText);
				setDateText(nextText);
				if (nextDate && nextDate >= minDate) {
					const {year, month} = dateParts(nextDate);
					setVisibleMonth(new Date(year, month - 1, 1));
					onChange(nextDate);
				} else {
					onChange("");
				}
				}} aria-invalid={Boolean(dateError || error)} aria-describedby={dateError || error ? `${formatId} ${errorId}` : formatId} disabled={disabled} className="min-w-0 flex-1 bg-transparent px-3 text-sm font-normal text-[#243451] outline-none placeholder:text-[#9aa3b4] disabled:cursor-not-allowed" />
			<button type="button" aria-label="Abrir calendário" aria-expanded={calendarOpen} aria-controls={`${id}-calendar`} onClick={() => setCalendarOpen(open => !open)} disabled={disabled} className="px-3 text-lg text-[#68738a] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#7c3aed] disabled:cursor-not-allowed" title="Abrir calendário">▦</button>
		</div>
			<p id={formatId} className="mt-1 text-xs font-normal text-[#758098]">Formato: dia/mês/ano</p>
			{(dateError || error) && <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-red-700">{dateError || error}</p>}
		{calendarOpen && <div id={`${id}-calendar`} className="absolute left-0 top-full z-20 mt-2 w-[min(20rem,calc(100vw-3rem))] rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-xl">
			<div className="mb-3 flex items-center justify-between gap-3">
				<button type="button" aria-label="Mês anterior" disabled={previousMonthDisabled} onClick={() => setVisibleMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid h-9 w-9 place-items-center rounded-lg text-lg text-[#34415c] hover:bg-[#f3f0fa] disabled:cursor-not-allowed disabled:opacity-40">‹</button>
				<p className="font-semibold capitalize text-[#243451]" aria-live="polite">{monthLabel}</p>
				<button type="button" aria-label="Próximo mês" onClick={() => setVisibleMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid h-9 w-9 place-items-center rounded-lg text-lg text-[#34415c] hover:bg-[#f3f0fa]">›</button>
			</div>
			<div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#758098]">
				{weekdayLabels.map(day => <span key={day.short} className="py-1" aria-label={day.full}>{day.short}</span>)}
			</div>
			<div className="mt-1 grid grid-cols-7 gap-1">
				{Array.from({length:firstWeekday}, (_, index) => <span key={`empty-${index}`} aria-hidden="true" />)}
				{Array.from({length:daysInMonth}, (_, index) => {
					const day = index + 1;
					const date = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
					const unavailable = date < minDate;
					return <button key={date} type="button" disabled={unavailable} aria-label={`${day} de ${monthLabel}`} aria-pressed={date === value} onClick={() => selectDate(date)} className={`grid h-9 place-items-center rounded-lg text-sm ${date === value ? "bg-[#7c3aed] font-semibold text-white" : "text-[#34415c] hover:bg-[#f3f0fa]"} disabled:cursor-not-allowed disabled:text-[#c5cad3] disabled:hover:bg-transparent`}>{day}</button>;
				})}
			</div>
		</div>}
	</div>;
}

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
						const features = getSpotFeatures(spot);
						return <button key={spot.id} type="button" disabled={!available || disabled} aria-pressed={selected} onClick={() => onSelect(spot.id)} title={features.join(", ")} className={`min-h-10 rounded-lg border px-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 ${!available ? "cursor-not-allowed border-[#edf0f5] bg-[#f8fafc] text-[#a2a9b7]" : selected ? "border-[#7c3aed] bg-[#7c3aed] text-white" : "border-[#d9dee8] bg-white text-[#34415c] hover:border-[#7c3aed] hover:text-[#7c3aed]"}`}>{spot.label}<span className="block text-[10px] font-normal">{features.join(" · ")}</span>{!available && <span className="sr-only">, indisponível</span>}</button>;
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

		export function PaymentMethodPicker({paymentMethod, onChange, methods, selectedCardId, onSelectCard}) {
			return <fieldset className="border-t border-[#edf0f5] pt-5">
				<legend className="font-display text-lg font-semibold">Forma de pagamento (demonstração)</legend>
				<div className="mt-3 grid gap-3 sm:grid-cols-2">
					{["Pix", ...methods.map(method => `Cartão ${method.brand} •••• ${method.last4}`), "Novo cartão"].map(method => {
						const card = methods.find(item => method === `Cartão ${item.brand} •••• ${item.last4}`);
						const selected = card ? paymentMethod === "Card" && selectedCardId === card.id : method === "Novo cartão" ? paymentMethod === "NewCard" : paymentMethod === method;
						return <label key={card?.id || method} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 text-sm font-semibold transition ${selected ? "border-[#7c3aed] bg-[#faf8ff] text-[#5125a7]" : "border-[#d9dee8] hover:border-[#b8a6dc]"}`}>
							<input type="radio" name="paymentMethod" checked={selected} onChange={() => card ? onSelectCard(card.id) : onChange(method === "Novo cartão" ? "NewCard" : method)} className="accent-[#7c3aed]" />
							{card ? `${card.brand} •••• ${card.last4} · ${card.type === "credit" ? "Crédito" : "Débito"}` : method}
						</label>;
					})}
				</div>
				{methods.length === 0 && <p className="mt-2 text-xs text-[#758098]">Não há cartões salvos. Você pode cadastrar um na etapa de pagamento ou em <a href="metodosPagamento.html" className="font-semibold text-[#6236bc] underline">Meus métodos de pagamento</a>.</p>}
			</fieldset>;
		}

		export function ReservationSummary({spotType, spotLabel, duration, hourlyRate, rateTierLabel, paymentMethod, price, placeId, reservationDate, reservationTime, endTime, endDate, vehicle}) {
			return <aside className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-6" aria-label="Resumo demonstrativo da reserva">
				<h2 className="font-display text-xl font-semibold">Resumo</h2>
				<p className="mt-1 text-xs text-[#758098]">Tarifas cadastradas na API local; pagamento não processado.</p>
				<div className="mt-5 flex items-center justify-between gap-3 border-b border-[#edf0f5] pb-4 text-sm"><span className="text-[#68738a]">Vaga {spotType.toLowerCase()} {spotLabel || ""}</span><strong>{duration.toFixed(2)} h</strong></div>
				<div className="mt-3 text-sm"><span className="text-[#68738a]">Entrada / saída</span><p className="font-semibold">{reservationTime || "--:--"} – {endTime || "--:--"}{endDate && endDate !== reservationDate ? ` · saída ${new Intl.DateTimeFormat("pt-BR").format(new Date(`${endDate}T12:00:00`))}` : ""}</p></div>
				{vehicle && <div className="mt-3 text-sm"><span className="text-[#68738a]">Veículo</span><p className="font-semibold">{vehicle.plate} · {vehicle.model}</p></div>}
				<div className="mt-4 flex items-center justify-between gap-3 text-sm"><span className="text-[#68738a]">Tarifa aplicada{rateTierLabel ? ` · ${rateTierLabel}` : ""}</span><span className="shrink-0">R$ {hourlyRate.toFixed(2).replace(".", ",")}/h</span></div>
				<div className="mt-3 flex items-center justify-between text-sm"><span className="text-[#68738a]">Pagamento escolhido</span><span>{paymentMethod}</span></div>
				<div className="mt-5 flex items-end justify-between border-t border-[#edf0f5] pt-4"><span className="font-semibold">Total estimado</span><strong className="font-display text-2xl text-[#7c3aed]">R$ {price.toFixed(2).replace(".", ",")}</strong></div>
				<p className="mt-5 rounded-lg bg-[#f8fafc] p-3 text-xs leading-5 text-[#68738a]">Valor e disponibilidade vêm do db.json. A gravação local demonstra a reserva, mas o json-server não é um backend transacional para uso real.</p>
				{placeId && <p className="mt-3 break-all text-[10px] text-[#9aa3b4]">ID do local: {placeId}</p>}
			</aside>;
		}

		export function ReservationReview({reservationDate, reservationTime, endTime, endDate, duration, spotType, spotLabel, hourlyRate, rateTierLabel, paymentMethod, price, vehicle, onEdit}) {
			return <section className="rounded-xl border border-[#e9e5f5] bg-[#faf8ff] p-4" aria-labelledby="review-title">
				<h2 id="review-title" className="font-display font-semibold">Revise antes de confirmar</h2>
				<dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
					<div><dt className="text-[#68738a]">Data e período</dt><dd className="font-semibold">{new Intl.DateTimeFormat("pt-BR").format(new Date(`${reservationDate}T12:00:00`))} · {reservationTime}–{endTime}{endDate !== reservationDate ? ` (saída ${new Intl.DateTimeFormat("pt-BR").format(new Date(`${endDate}T12:00:00`))})` : ""}</dd></div>
					<div><dt className="text-[#68738a]">Duração e vaga</dt><dd className="font-semibold">{duration.toFixed(2)} h · {spotType} {spotLabel}</dd></div>
					<div><dt className="text-[#68738a]">Tarifa por hora · {rateTierLabel}</dt><dd className="font-semibold">R$ {hourlyRate.toFixed(2).replace(".", ",")}/h</dd></div>
					{vehicle && <div><dt className="text-[#68738a]">Veículo</dt><dd className="font-semibold">{vehicle.plate} · {vehicle.model}</dd></div>}
					<div><dt className="text-[#68738a]">Pagamento (simulado)</dt><dd className="font-semibold">{paymentMethod}</dd></div>
					<div><dt className="text-[#68738a]">Total estimado</dt><dd className="font-semibold text-[#7c3aed]">R$ {price.toFixed(2).replace(".", ",")}</dd></div>
				</dl>
				<button type="button" onClick={onEdit} className="mt-4 text-sm font-semibold text-[#6236bc] underline underline-offset-2">Editar dados da solicitação</button>
			</section>;
		}

		export function PaymentStep({paymentMethod, price, hourlyRate, rateTierLabel, parkingName, reservationDate, reservationTime, endTime, endDate, spotType, spotLabel, paymentCode, savedCard, onBack, onComplete, isSubmitting, error}) {
			const [qrDataUrl, setQrDataUrl] = React.useState("");
			const [qrError, setQrError] = React.useState("");
			const [copyStatus, setCopyStatus] = React.useState("");
			const [cardNumber, setCardNumber] = React.useState("");
			const [expiry, setExpiry] = React.useState("");
			const [holder, setHolder] = React.useState("");
			const [cardType, setCardType] = React.useState("credit");
			const [saveCard, setSaveCard] = React.useState(false);
			const [cardError, setCardError] = React.useState("");
			const pixPayload = `FLUXOPARK-DEMO-NAO-PAGAVEL|${paymentCode}|${price.toFixed(2)}`;
			const formattedPrice = `R$ ${price.toFixed(2).replace(".", ",")}`;
			React.useEffect(() => {
				if (paymentMethod !== "Pix") return undefined;
				let cancelled = false;
				QRCode.toDataURL(pixPayload, {errorCorrectionLevel:"M", margin:2, width:240}).then(dataUrl => {
					if (!cancelled) setQrDataUrl(dataUrl);
				}).catch(generationError => {
					console.error("Não foi possível gerar o QR code demonstrativo.", generationError);
					if (!cancelled) setQrError("Não foi possível gerar o QR code. Tente voltar e avançar novamente.");
				});
				return () => {cancelled = true;};
			}, [paymentMethod, pixPayload]);
			async function copyPixCode() {
				try {
					await navigator.clipboard.writeText(pixPayload);
					setCopyStatus("Código de demonstração copiado.");
				} catch (copyError) {
					console.error("Não foi possível copiar o código PIX demonstrativo.", copyError);
					setCopyStatus("Não foi possível copiar automaticamente. Selecione e copie o código exibido.");
				}
			}
			function submitCard(event) {
				event.preventDefault();
				const number = digitsOnly(cardNumber);
				if (number.length < 13 || number.length > 19 || !cardExpiryIsValid(expiry) || digitsOnly(event.currentTarget.elements.cvv.value).length < 3) {
					setCardError("Confira o número, a validade futura e o código de segurança do cartão.");
					return;
				}
				setCardError("");
				onComplete(saveCard ? {
					holder:holder.trim().toUpperCase(), expiry, type:cardType,
					brand:identifyCardBrand(number), last4:number.slice(-4)
				} : null);
			}
			return <div className="min-h-screen bg-[#f8fafc] text-[#172749]">
				<ReservationHeader onBack={onBack} />
				<main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
					<section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-8" aria-labelledby="payment-title">
						<p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7c3aed]">Etapa final</p><h1 id="payment-title" className="mt-2 font-display text-3xl font-semibold">Pagamento</h1>
						<p className="mt-2 text-sm leading-6 text-[#68738a]">Método escolhido: <strong>{savedCard ? `${savedCard.brand} •••• ${savedCard.last4}` : paymentMethod === "NewCard" ? "Novo cartão" : paymentMethod}</strong>. Simulação, sem cobrança real.</p>
						<div className="mt-5 grid gap-2 rounded-xl bg-[#f8fafc] p-4 text-sm sm:grid-cols-2">
							<p><span className="text-[#68738a]">Estacionamento:</span> <strong>{parkingName}</strong></p><p><span className="text-[#68738a]">Vaga:</span> <strong>{spotType} {spotLabel}</strong></p>
							<p><span className="text-[#68738a]">Período:</span> <strong>{new Intl.DateTimeFormat("pt-BR").format(new Date(`${reservationDate}T12:00:00`))} · {reservationTime}–{endTime}{endDate !== reservationDate ? ` (${new Intl.DateTimeFormat("pt-BR").format(new Date(`${endDate}T12:00:00`))})` : ""}</strong></p>
							<p><span className="text-[#68738a]">Tarifa aplicada ({rateTierLabel}):</span> <strong>R$ {hourlyRate.toFixed(2).replace(".", ",")}/h</strong></p>
							<p><span className="text-[#68738a]">Total:</span> <strong className="text-[#7c3aed]">{formattedPrice}</strong></p>
						</div>
						{paymentMethod === "Pix" ? <section className="mt-6 grid justify-items-center gap-4 rounded-xl border border-[#e9e5f5] p-5 text-center" aria-label="Pagamento demonstrativo por Pix">
							<h2 className="font-display text-xl font-semibold">QR code de demonstração</h2><p className="max-w-md text-sm leading-6 text-[#68738a]">Este QR code contém apenas um texto de teste; não é um código Pix pagável.</p>
							{qrDataUrl ? <img src={qrDataUrl} alt="QR code com texto de demonstração não pagável" className="h-60 w-60 rounded-lg border border-[#e5e7eb] p-2" /> : qrError ? <p role="alert" className="text-sm text-red-700">{qrError}</p> : <p role="status" className="text-sm text-[#68738a]">Gerando QR code...</p>}
							<textarea aria-label="Código demonstrativo não pagável" readOnly value={pixPayload} rows={3} className="w-full resize-none rounded-lg border border-[#d9dee8] bg-[#f8fafc] p-3 font-mono text-xs" />
							<button type="button" onClick={copyPixCode} className="min-h-11 rounded-lg border border-[#7c3aed] px-5 text-sm font-semibold text-[#6236bc]">Copiar código</button>{copyStatus && <p role="status" className="text-sm text-[#526079]">{copyStatus}</p>}
							{error && <p role="alert" className="text-sm text-red-700">{error}</p>}
							<button type="button" onClick={() => onComplete(null)} disabled={isSubmitting} className="min-h-12 w-full rounded-lg bg-[#7c3aed] px-5 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting ? "Registrando..." : `Confirmar pagamento de ${formattedPrice}`}</button>
						</section> : savedCard ? <section className="mt-6 grid gap-4 rounded-xl border border-[#e9e5f5] p-5">
							<p className="text-sm">Pagamento simulado com <strong>{savedCard.brand} •••• {savedCard.last4}</strong> ({savedCard.type === "credit" ? "crédito" : "débito"}).</p>
							{error && <p role="alert" className="text-sm text-red-700">{error}</p>}
							<button type="button" onClick={() => onComplete(null)} disabled={isSubmitting} className="min-h-12 rounded-lg bg-[#7c3aed] px-5 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting ? "Registrando..." : `Confirmar pagamento de ${formattedPrice}`}</button>
						</section> : <form className="mt-6 grid gap-4 rounded-xl border border-[#e9e5f5] p-5" onSubmit={submitCard}>
							<div><h2 className="font-display text-xl font-semibold">Cadastrar cartão para esta reserva</h2><p className="mt-1 text-sm leading-5 text-[#68738a]">Digite números e validade; a formatação é automática.</p></div>
							<label className="grid gap-1.5 text-sm font-semibold" htmlFor="card-holder">Nome impresso no cartão<input id="card-holder" required maxLength={100} value={holder} onChange={event => setHolder(event.target.value.toUpperCase())} autoComplete="cc-name" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 font-normal uppercase" /></label>
							<label className="grid gap-1.5 text-sm font-semibold" htmlFor="card-number">Número do cartão<input id="card-number" required inputMode="numeric" autoComplete="cc-number" value={cardNumber} onChange={event => setCardNumber(formatCardNumber(event.target.value))} className="min-h-11 rounded-lg border border-[#d9dee8] px-3 font-normal" placeholder="0000 0000 0000 0000" /></label>
							<div className="grid gap-4 sm:grid-cols-3">
								<label className="grid gap-1.5 text-sm font-semibold" htmlFor="card-expiry">Validade<input id="card-expiry" required inputMode="numeric" autoComplete="cc-exp" value={expiry} onChange={event => setExpiry(formatCardExpiry(event.target.value))} className="min-h-11 rounded-lg border border-[#d9dee8] px-3 font-normal" placeholder="MM/AA" /></label>
								<label className="grid gap-1.5 text-sm font-semibold" htmlFor="card-cvv">CVV<input id="card-cvv" name="cvv" required type="password" inputMode="numeric" autoComplete="cc-csc" minLength={3} maxLength={4} pattern="[0-9]{3,4}" className="min-h-11 rounded-lg border border-[#d9dee8] px-3 font-normal" placeholder="000" /></label>
								<label className="grid gap-1.5 text-sm font-semibold" htmlFor="card-type">Função<select id="card-type" value={cardType} onChange={event => setCardType(event.target.value)} className="min-h-11 rounded-lg border border-[#d9dee8] bg-white px-3 font-normal"><option value="credit">Crédito</option><option value="debit">Débito</option></select></label>
							</div>
							<label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={saveCard} onChange={event => setSaveCard(event.target.checked)} className="accent-[#7c3aed]" />Salvar este cartão nos meus métodos de pagamento</label>
							<p className="rounded-lg border border-[#f1dfae] bg-[#fff9e9] px-3 py-2.5 text-xs leading-5 text-[#785713]">Protótipo: CVV e número completo nunca são armazenados. Use somente dados fictícios.</p>
							{(cardError || error) && <p role="alert" className="text-sm text-red-700">{cardError || error}</p>}
							<button type="submit" disabled={isSubmitting} className="min-h-12 rounded-lg bg-[#7c3aed] px-5 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting ? "Registrando..." : `Simular pagamento de ${formattedPrice}`}</button>
						</form>}
						<p className="mt-4 text-center text-xs leading-5 text-[#758098]">Nenhuma cobrança real será feita; somente a reserva demonstrativa será gravada.</p>
					</section>
				</main>
			</div>;
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
							<div><dt className="text-[#68738a]">Período</dt><dd className="mt-1 font-semibold">{new Intl.DateTimeFormat("pt-BR").format(new Date(reservation.startAt))} · {new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date(reservation.startAt))}–{new Intl.DateTimeFormat("pt-BR", {hour:"2-digit", minute:"2-digit"}).format(new Date(reservation.endAt))}{new Date(reservation.startAt).toDateString() !== new Date(reservation.endAt).toDateString() ? ` (${new Intl.DateTimeFormat("pt-BR").format(new Date(reservation.endAt))})` : ""}</dd></div>
							<div><dt className="text-[#68738a]">Veículo</dt><dd className="mt-1 font-semibold">{reservation.vehiclePlate} · {reservation.vehicleModel}</dd></div>
							<div><dt className="text-[#68738a]">Duração e vaga</dt><dd className="mt-1 font-semibold">{Number(reservation.durationHours).toFixed(2)} h · {reservation.spotType} {reservation.spotLabel}</dd></div>
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
