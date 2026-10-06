import React from "react";
import { createRoot } from "react-dom/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { BookingApiStatus, DriverDetailsFields, ParkingIdentity, PaymentMethodPicker, PaymentStep, ReservationConfirmation, ReservationDatePicker, ReservationHeader, ReservationReview, ReservationSummary, SpotPicker, TimeSlotPicker } from "../components/reservation/ReservationComponents.jsx";
import { AppProviders } from "../providers/AppProviders.jsx";
import { createReservation, readCollection } from "../lib/api.js";
import { reservationSchema } from "../lib/reservationSchema.js";
import "../../paginaReserva.css";

		const durations = [1, 2, 4, 8];
		const timeSlots = Array.from({length: 35}, (_, index) => {
			const minutes = 6 * 60 + index * 30;
			return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
		});
		function localDateValue(date = new Date()) {
			const offset = date.getTimezoneOffset() * 60000;
			return new Date(date.getTime() - offset).toISOString().slice(0, 10);
		}

		function getBookingInterval(date, time, duration) {
			const start = new Date(`${date}T${time}:00`);
			const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
			return { startAt: start.toISOString(), endAt: end.toISOString() };
		}

		function App() {
			const params = React.useMemo(() => new URLSearchParams(window.location.search), []);
			const placeId = params.get("placeId") || "";
			const queryClient = useQueryClient();
			const initialReservationDate = React.useMemo(() => localDateValue(), []);
			const {register, handleSubmit, watch, setValue, formState:{errors, isSubmitting}} = useForm({
				resolver: zodResolver(reservationSchema),
				defaultValues: {
					reservationDate:initialReservationDate,
					driverName:"",
					driverEmail:"",
					driverPhone:""
				}
			});
			const reservationDate = watch("reservationDate");
			const formValues = watch();
			const [reservationTime, setReservationTime] = React.useState("");
			const [duration, setDuration] = React.useState(2);
			const [spotType, setSpotType] = React.useState("Comum");
			const [paymentMethod, setPaymentMethod] = React.useState("Pix");
			const [confirmation, setConfirmation] = React.useState("");
			const [submittedReservation, setSubmittedReservation] = React.useState(null);
			const [isReviewing, setIsReviewing] = React.useState(false);
			const [isPaying, setIsPaying] = React.useState(false);
			const [paymentCode, setPaymentCode] = React.useState("");
			const [isCompletingPayment, setIsCompletingPayment] = React.useState(false);
			const [showLeaveConfirmation, setShowLeaveConfirmation] = React.useState(false);
			const [formError, setFormError] = React.useState("");
			const [selectedSpotId, setSelectedSpotId] = React.useState("");
			const hasUnsavedChanges =
				reservationDate !== initialReservationDate ||
				Boolean(formValues.driverName?.trim() || formValues.driverEmail?.trim() || formValues.driverPhone?.trim()) ||
				Boolean(reservationTime || selectedSpotId) ||
				duration !== 2 ||
				spotType !== "Comum" ||
				paymentMethod !== "Pix";
			const parkingQuery = useQuery({queryKey:["parkings"], queryFn:() => readCollection("parkings")});
			const spotsQuery = useQuery({queryKey:["spots"], queryFn:() => readCollection("spots")});
			const reservationsQuery = useQuery({queryKey:["reservations"], queryFn:() => readCollection("reservations")});
			const reservationMutation = useMutation({
				mutationFn:createReservation,
				onSuccess:savedReservation => {
					setSubmittedReservation(savedReservation);
					setConfirmation(savedReservation.code);
					setIsPaying(false);
					queryClient.invalidateQueries({queryKey:["reservations"]});
				}
			});
			const parkings = parkingQuery.data || [];
			const allSpots = spotsQuery.data || [];
			const reservations = reservationsQuery.data || [];
			const isLoading = parkingQuery.isLoading || spotsQuery.isLoading || reservationsQuery.isLoading;
			const apiError = parkingQuery.error?.message || spotsQuery.error?.message || reservationsQuery.error?.message || "";
			const parking = placeId
				? parkings.find(item => item.googlePlaceId === placeId)
				: parkings.find(item => item.id === params.get("parkingId")) || parkings[0];
			const spots = allSpots.filter(spot => spot.parkingId === parking?.id);
			const parkingError = !isLoading && !apiError && !parking
				? placeId
					? "Este estacionamento ainda não está cadastrado na API local. Cadastre o ID do Google Maps no db.json para habilitar reservas."
					: "Nenhum estacionamento foi encontrado na API local."
				: apiError;
			const parkingName = parking?.name || params.get("name") || "Estacionamento";
			const parkingAddress = parking?.address || params.get("address") || "Local não cadastrado";
			const hourlyRate = Number(parking?.hourlyRates?.[spotType] || 0);
			const price = duration * hourlyRate;
			const minimumDate = localDateValue();

			React.useEffect(() => {
				if (!hasUnsavedChanges || confirmation) return undefined;
				const warnBeforeLeaving = event => {
					event.preventDefault();
					event.returnValue = "";
				};
				window.addEventListener("beforeunload", warnBeforeLeaving);
				return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
			}, [hasUnsavedChanges, confirmation]);

			const interval = reservationTime ? getBookingInterval(reservationDate, reservationTime, duration) : null;
			function isSpotAvailable(spot, requestedInterval = interval, reservationList = reservations) {
				if (!requestedInterval) return false;
				const start = new Date(requestedInterval.startAt).getTime();
				const end = new Date(requestedInterval.endAt).getTime();
				return !reservationList.some(reservation =>
					reservation.spotId === spot.id &&
					["confirmed", "active"].includes(reservation.status) &&
					new Date(reservation.startAt).getTime() < end &&
					new Date(reservation.endAt).getTime() > start
				);
			}
			const typedSpots = spots.filter(spot => spot.type === spotType);
			const availableSlots = timeSlots.filter(time => {
				if (!reservationDate) return false;
				const [hours, minutes] = time.split(":").map(Number);
				if (hours * 60 + minutes + duration * 60 > 23 * 60) return false;
				if (reservationDate === minimumDate) {
					const now = new Date();
					if (hours * 60 + minutes <= now.getHours() * 60 + now.getMinutes()) return false;
				}
				const slotInterval = getBookingInterval(reservationDate, time, duration);
				return typedSpots.some(spot => isSpotAvailable(spot, slotInterval));
			});

			function updateReservationDate(date) {
				setValue("reservationDate", date, {shouldDirty:true, shouldValidate:true});
				setReservationTime("");
				setSelectedSpotId("");
				setFormError("");
				setIsReviewing(false);
			}

			function handleBack() {
				if (!confirmation) {
					setShowLeaveConfirmation(true);
					return;
				}
				window.location.assign("paginaInicialMotorista.html");
			}

			async function submitReservation() {
				if (!parking || !interval || !selectedSpotId) {
					setFormError("Selecione um horário e uma vaga disponível para continuar.");
					setIsReviewing(false);
					return;
				}
				const selectedSpot = spots.find(spot => spot.id === selectedSpotId);
				if (!selectedSpot || !isSpotAvailable(selectedSpot)) {
					setFormError("Esta vaga não está mais disponível nesse período. Selecione outro horário ou vaga.");
					try {
						await queryClient.invalidateQueries({queryKey:["reservations"]});
					} catch (error) {
						console.error("Não foi possível atualizar as reservas locais.", error);
						setFormError("Não foi possível confirmar a disponibilidade. Verifique a conexão com a API local.");
					}
					setIsReviewing(false);
					return;
				}
				setFormError("");
				if (!isReviewing) {
					setIsReviewing(true);
					return;
				}
				try {
					const latestReservations = await queryClient.fetchQuery({
						queryKey:["reservations"],
						queryFn:() => readCollection("reservations"),
						staleTime:0
					});
					if (!isSpotAvailable(selectedSpot, interval, latestReservations)) {
						setFormError("A vaga acabou de ser ocupada para esse período. Escolha outro horário ou vaga.");
						setIsReviewing(false);
						return;
					}
					const code = `FP-${window.crypto?.randomUUID?.().slice(0, 8).toUpperCase() || Math.random().toString(36).slice(2, 10).toUpperCase()}`;
					setPaymentCode(code);
					setFormError("");
					setIsPaying(true);
				} catch (error) {
					console.error("Não foi possível confirmar a disponibilidade antes do pagamento.", error);
					setFormError(error.message || "Não foi possível verificar a disponibilidade. Confira se a API local está em execução.");
					setIsReviewing(false);
				}
			}

			async function completePayment() {
				if (!parking || !interval || !selectedSpotId || !paymentCode) {
					setFormError("Não foi possível recuperar os dados da reserva. Volte e revise a solicitação.");
					return;
				}
				const selectedSpot = spots.find(spot => spot.id === selectedSpotId);
				if (!selectedSpot) {
					setFormError("A vaga selecionada não está mais disponível. Volte e escolha outra.");
					setIsPaying(false);
					return;
				}
				setFormError("");
				setIsCompletingPayment(true);
				try {
					const latestReservations = await queryClient.fetchQuery({
						queryKey:["reservations"],
						queryFn:() => readCollection("reservations"),
						staleTime:0
					});
					if (!isSpotAvailable(selectedSpot, interval, latestReservations)) {
						setFormError("A vaga acabou de ser ocupada durante o pagamento. Escolha outro horário ou vaga.");
						setIsPaying(false);
						setIsReviewing(false);
						return;
					}
					const reservation = {
						code:paymentCode,
						parkingId: parking.id,
						parkingName: parking.name,
						spotId: selectedSpot.id,
						spotLabel: selectedSpot.label,
						driverName:formValues.driverName,
						driverEmail:formValues.driverEmail,
						driverPhone:formValues.driverPhone,
						startAt: interval.startAt,
						endAt: interval.endAt,
						durationHours: duration,
						spotType,
						paymentMethod,
						hourlyRate,
						totalAmount: price,
						paymentStatus: "simulated_approved",
						status: "confirmed",
						createdAt: new Date().toISOString()
					};
					await reservationMutation.mutateAsync(reservation);
				} catch (error) {
					console.error("Não foi possível registrar a reserva simulada na API local.", error);
					setFormError(error.message || "Não foi possível salvar a reserva. Confira se a API local está em execução.");
				} finally {
					setIsCompletingPayment(false);
				}
			}

			if (isPaying) {
				return <PaymentStep
					paymentMethod={paymentMethod}
					price={price}
					parkingName={parkingName}
					reservationTime={reservationTime}
					spotType={spotType}
					spotLabel={spots.find(spot => spot.id === selectedSpotId)?.label}
					paymentCode={paymentCode}
					onBack={() => { setIsPaying(false); setFormError(""); }}
					onComplete={completePayment}
					isSubmitting={isCompletingPayment || reservationMutation.isPending}
					error={formError}
				/>;
			}

			if (confirmation) {
				return <ReservationConfirmation
					reservation={submittedReservation}
					code={confirmation}
					parkingAddress={parkingAddress}
				/>;
			}

			return <div className="min-h-screen bg-[#f8fafc] text-[#172749]">
				<ReservationHeader onBack={handleBack} />
				<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
					<div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] lg:items-start">
						<section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-8" aria-labelledby="booking-title">
							<p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7c3aed]">Estacionamento parceiro</p>
							<h1 id="booking-title" className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Reserve sua vaga</h1>
							<p className="mt-2 text-sm leading-6 text-[#68738a]">Informe os dados da sua visita e revise a solicitação antes de continuar.</p>

							<ParkingIdentity name={parkingName} address={parkingAddress} />

							<BookingApiStatus isLoading={isLoading} apiError={parkingError} />

							<form className="mt-7 grid gap-5" onSubmit={handleSubmit(submitReservation)}>
								<fieldset>
									<legend className="font-display text-lg font-semibold">Quando você precisa da vaga?</legend>
									<div className="mt-3 grid gap-4 sm:grid-cols-2">
										<div className="grid gap-1.5 text-sm font-semibold sm:col-span-2">
											<label htmlFor="reservation-date">Data</label>
											<ReservationDatePicker value={reservationDate} minDate={minimumDate} error={errors.reservationDate?.message} onChange={updateReservationDate} disabled={isLoading || Boolean(parkingError)} />
										</div>
										<TimeSlotPicker
											availableSlots={availableSlots}
											reservationTime={reservationTime}
											timeSlots={timeSlots}
											disabled={isLoading || Boolean(parkingError)}
											onSelect={time => { setReservationTime(time); setSelectedSpotId(""); setFormError(""); setIsReviewing(false); }}
											error={formError}
										/>
										<label className="grid gap-1.5 text-sm font-semibold" htmlFor="reservation-duration">Duração
											<select id="reservation-duration" value={duration} onChange={event => { setDuration(Number(event.target.value)); setSelectedSpotId(""); setIsReviewing(false); }} disabled={isLoading || Boolean(parkingError)} className="min-h-11 rounded-lg border border-[#d9dee8] bg-white px-3 text-sm font-normal text-[#243451] outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/15">
												{durations.map(hours => <option key={hours} value={hours}>{hours} {hours === 1 ? "hora" : "horas"}</option>)}
											</select>
										</label>
										<label className="grid gap-1.5 text-sm font-semibold" htmlFor="spot-type">Tipo de vaga
											<select id="spot-type" value={spotType} onChange={event => { setSpotType(event.target.value); setSelectedSpotId(""); setIsReviewing(false); }} disabled={isLoading || Boolean(parkingError) || !parking} className="min-h-11 rounded-lg border border-[#d9dee8] bg-white px-3 text-sm font-normal text-[#243451] outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/15">
												{Object.keys(parking?.hourlyRates || {}).map(type => <option key={type}>{type}</option>)}
											</select>
										</label>
										<SpotPicker
											spots={typedSpots}
											reservationTime={reservationTime}
											selectedSpotId={selectedSpotId}
											isSpotAvailable={isSpotAvailable}
											onSelect={spotId => { setSelectedSpotId(spotId); setFormError(""); setIsReviewing(false); }}
											disabled={isLoading || Boolean(parkingError)}
										/>
									</div>
								</fieldset>

								<DriverDetailsFields
									register={register}
									errors={errors}
								/>

								<PaymentMethodPicker paymentMethod={paymentMethod} onChange={setPaymentMethod} />

								{isReviewing && <ReservationReview
									reservationDate={reservationDate}
									reservationTime={reservationTime}
									duration={duration}
									spotType={spotType}
									spotLabel={spots.find(spot => spot.id === selectedSpotId)?.label}
									paymentMethod={paymentMethod}
									price={price}
									onEdit={() => setIsReviewing(false)}
								/>}
								<button type="submit" disabled={isLoading || Boolean(parkingError) || isSubmitting} className="mt-1 min-h-12 rounded-lg bg-[#7c3aed] px-5 py-3 font-semibold text-white transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2">{isSubmitting ? "Verificando disponibilidade..." : isReviewing ? "Ir para pagamento" : "Revisar solicitação"}</button>
								<p className="text-center text-xs leading-5 text-[#758098]">A reserva só será registrada após a etapa demonstrativa de pagamento. Nenhuma cobrança real será feita.</p>
							</form>
						</section>

						<ReservationSummary
							spotType={spotType}
							spotLabel={spots.find(spot => spot.id === selectedSpotId)?.label}
							duration={duration}
							hourlyRate={hourlyRate}
							paymentMethod={paymentMethod}
							price={price}
							placeId={placeId}
						/>
					</div>
				</main>
				{showLeaveConfirmation && <div className="fixed inset-0 z-50 grid place-items-center bg-[#101a31]/60 p-4" onMouseDown={event => {
					if (event.target === event.currentTarget) setShowLeaveConfirmation(false);
				}}>
					<section role="dialog" aria-modal="true" aria-labelledby="leave-confirmation-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
						<h2 id="leave-confirmation-title" className="font-display text-xl font-semibold text-[#172749]">Sair da reserva?</h2>
						<p className="mt-3 text-sm leading-6 text-[#52627f]">Se você sair agora, os dados preenchidos nesta reserva não serão salvos.</p>
						<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
							<button type="button" onClick={() => setShowLeaveConfirmation(false)} className="min-h-11 rounded-lg border border-[#d9dee8] px-4 py-2 text-sm font-semibold text-[#34415c] transition hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]">Continuar preenchendo</button>
							<button type="button" onClick={() => window.location.assign("paginaInicialMotorista.html")} className="min-h-11 rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2">Sair sem salvar</button>
						</div>
					</section>
				</div>}
			</div>;
		}
		createRoot(document.getElementById("root")).render(<AppProviders><App /></AppProviders>);
