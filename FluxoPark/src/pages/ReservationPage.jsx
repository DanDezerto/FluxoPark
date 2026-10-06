import React from "react";
import { createRoot } from "react-dom/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { BookingApiStatus, DriverDetailsFields, ParkingIdentity, PaymentMethodPicker, PaymentStep, ReservationConfirmation, ReservationDatePicker, ReservationHeader, ReservationReview, ReservationSummary, SpotPicker, Time24Input } from "../components/reservation/ReservationComponents.jsx";
import { AppProviders } from "../providers/AppProviders.jsx";
import { createReservation, readCollection } from "../lib/api.js";
import {createDemoId, demoRequest, readDemoSession} from "../lib/demoAccounts.js";
import {calculateReservationPrice, getRateTierLabel} from "../lib/parkingPricing.js";
import {createReservationInterval, isWithinParkingHours} from "../lib/reservationRules.js";
import {getSpotFeatures, SPOT_FEATURES, toggleSpotFeature} from "../lib/spotFeatures.js";
import { reservationSchema } from "../lib/reservationSchema.js";
import "../../paginaReserva.css";

		function localDateValue(date = new Date()) {
			const offset = date.getTimezoneOffset() * 60000;
			return new Date(date.getTime() - offset).toISOString().slice(0, 10);
		}

		function nextLocalDateValue(dateValue) {
			const date = new Date(`${dateValue}T12:00:00`);
			date.setDate(date.getDate() + 1);
			return localDateValue(date);
		}

		function App() {
			const params = React.useMemo(() => new URLSearchParams(window.location.search), []);
			const placeId = params.get("placeId") || "";
			const queryClient = useQueryClient();
			const driverSession = React.useMemo(() => readDemoSession("driver"), []);
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
			const [endTime, setEndTime] = React.useState("");
			const [differentExitDate, setDifferentExitDate] = React.useState(false);
			const [exitDate, setExitDate] = React.useState(initialReservationDate);
			const [selectedFeatures, setSelectedFeatures] = React.useState([]);
			const [paymentMethod, setPaymentMethod] = React.useState("Pix");
			const [selectedCardId, setSelectedCardId] = React.useState("");
			const [driverAccount, setDriverAccount] = React.useState(null);
			const [selectedVehicleId, setSelectedVehicleId] = React.useState("");
			const [vehicleDraft, setVehicleDraft] = React.useState({plate:"", model:"", color:""});
			const [vehicleFormOpen, setVehicleFormOpen] = React.useState(false);
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
				Boolean(endTime) ||
				differentExitDate ||
				selectedFeatures.length > 0 ||
				paymentMethod !== "Pix";
			const parkingQuery = useQuery({queryKey:["parkings"], queryFn:() => readCollection("parkings")});
			const spotsQuery = useQuery({queryKey:["spots"], queryFn:() => readCollection("spots")});
			const reservationsQuery = useQuery({queryKey:["reservations"], queryFn:() => readCollection("reservations")});
			const paymentMethodsQuery = useQuery({
				queryKey:["paymentMethods", driverSession?.id],
				queryFn:() => readCollection("paymentMethods"),
				enabled:Boolean(driverSession)
			});
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
			const paymentMethods = (paymentMethodsQuery.data || []).filter(method => method.userId === driverSession?.id);
			const savedCard = paymentMethod === "Card" ? paymentMethods.find(method => method.id === selectedCardId) : null;
			const isLoading = parkingQuery.isLoading || spotsQuery.isLoading || reservationsQuery.isLoading || (Boolean(driverSession) && paymentMethodsQuery.isLoading);
			const apiError = parkingQuery.error?.message || spotsQuery.error?.message || reservationsQuery.error?.message || paymentMethodsQuery.error?.message || "";
			const parking = placeId
				? parkings.find(item => item.googlePlaceId === placeId)
				: parkings.find(item => item.id === params.get("parkingId")) || parkings[0];
			const spots = allSpots.filter(spot => spot.parkingId === parking?.id);
			const activeBan = parking?.banned && (!parking.banUntil || new Date(parking.banUntil) > new Date());
			const parkingError = activeBan
				? `Este estabelecimento está temporariamente indisponível${parking.banUntil ? ` até ${new Intl.DateTimeFormat("pt-BR").format(new Date(parking.banUntil))}` : " por tempo indeterminado"}.`
				: !isLoading && !apiError && !parking
				? placeId
					? "Este estacionamento ainda não está cadastrado na API local. Cadastre o ID do Google Maps no db.json para habilitar reservas."
					: "Nenhum estacionamento foi encontrado na API local."
				: apiError;
			const parkingName = parking?.name || params.get("name") || "Estacionamento";
			const parkingAddress = parking?.address || params.get("address") || "Local não cadastrado";
			const minimumDate = localDateValue();
			const mayCrossMidnight = Boolean(parking?.allowsOvernight);
			const effectiveExitDate = differentExitDate ? exitDate : "";
			const interval = createReservationInterval(reservationDate, reservationTime, endTime, mayCrossMidnight, effectiveExitDate);
			const endDate = interval ? localDateValue(new Date(interval.endAt)) : reservationDate;
			const duration = interval?.durationHours || 0;
			const selectedSpot = spots.find(spot => spot.id === selectedSpotId);
			const selectedSpotFeatures = selectedSpot ? getSpotFeatures(selectedSpot) : selectedFeatures;
			const pricedFeatures = selectedSpot
				? selectedSpotFeatures
				: selectedFeatures.length ? selectedFeatures : SPOT_FEATURES;
			const reservationSpotType = selectedSpotFeatures.join(", ") || "Qualquer";
			const {hourlyRate, total:price} = calculateReservationPrice(parking?.hourlyRates || {}, pricedFeatures, duration);
			const rateTierLabel = duration ? getRateTierLabel(duration) : "";
			const hoursValid = Boolean(interval && parking && isWithinParkingHours(parking, interval));
			const selectedVehicle = driverAccount?.vehicles?.find(item => item.id === selectedVehicleId) || null;
			const reservationTimeError = reservationTime && endTime && !interval
				? differentExitDate
					? "A data e o horário de saída devem ser posteriores à entrada, dentro de um período de até 24 horas."
					: mayCrossMidnight ? "O período informado não é válido." : "Este estabelecimento não permite atravessar a meia-noite."
				: interval && !hoursValid ? "O período informado está fora do horário de funcionamento do estabelecimento." : "";

			React.useEffect(() => {
				if (!driverSession) return;
				demoRequest(`users/${encodeURIComponent(driverSession.id)}`).then(account => {
					setDriverAccount(account);
					setValue("driverName", account.name || "");
					setValue("driverEmail", account.email || "");
					setValue("driverPhone", account.phone || "");
					if (account.vehicles?.length) setSelectedVehicleId(account.vehicles[0].id);
				}).catch(error => {
					console.error("Não foi possível carregar a conta do motorista para a reserva.", error);
					setFormError(`${error.message} Não foi possível carregar seus veículos.`);
				});
			}, [driverSession, setValue]);

			React.useEffect(() => {
				if (!hasUnsavedChanges || confirmation) return undefined;
				const warnBeforeLeaving = event => {
					event.preventDefault();
					event.returnValue = "";
				};
				window.addEventListener("beforeunload", warnBeforeLeaving);
				return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
			}, [hasUnsavedChanges, confirmation]);

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
			const typedSpots = spots.filter(spot => {
				const features = getSpotFeatures(spot);
				return selectedFeatures.every(feature => features.includes(feature));
			});

			function updateReservationDate(date) {
				setValue("reservationDate", date, {shouldDirty:true, shouldValidate:true});
				setReservationTime("");
				setEndTime("");
				setExitDate(current => differentExitDate
					? (!date || current < nextLocalDateValue(date) ? date ? nextLocalDateValue(date) : initialReservationDate : current)
					: (!date || current < date ? date || initialReservationDate : current));
				setSelectedSpotId("");
				setFormError("");
				setIsReviewing(false);
			}

			async function addReservationVehicle(event) {
				event?.preventDefault();
				if (!driverAccount) return;
				const plate = vehicleDraft.plate.trim().toUpperCase();
				if (!plate || !vehicleDraft.model.trim() || !vehicleDraft.color.trim()) {
					setFormError("Preencha placa, modelo e cor do veículo.");
					return;
				}
				if (driverAccount.vehicles?.some(vehicle => vehicle.plate.toUpperCase() === plate)) {
					setFormError("Esse veículo já está cadastrado na sua conta.");
					return;
				}
				const vehicle = {...vehicleDraft, id:createDemoId("vehicle"), plate, model:vehicleDraft.model.trim(), color:vehicleDraft.color.trim()};
				const updated = {...driverAccount, vehicles:[...(driverAccount.vehicles || []), vehicle]};
				try {
					await demoRequest(`users/${encodeURIComponent(driverAccount.id)}`, {
						method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(updated)
					});
					setDriverAccount(updated);
					setSelectedVehicleId(vehicle.id);
					setVehicleDraft({plate:"", model:"", color:""});
					setVehicleFormOpen(false);
					setFormError("");
				} catch (error) {
					console.error("Não foi possível cadastrar o veículo durante a reserva.", error);
					setFormError(`${error.message} O veículo não foi cadastrado.`);
				}
			}

			function handleBack() {
				if (!confirmation) {
					setShowLeaveConfirmation(true);
					return;
				}
				window.location.assign("paginaInicialMotorista.html");
			}

			async function submitReservation() {
				if (!driverSession || !driverAccount || !selectedVehicle) {
					setFormError("Entre como motorista e selecione um veículo cadastrado para continuar.");
					setIsReviewing(false);
					return;
				}
				if (!parking || !interval || !hoursValid || !selectedSpotId) {
					setFormError(reservationTimeError || "Informe entrada e saída dentro do horário de funcionamento e escolha uma vaga.");
					setIsReviewing(false);
					return;
				}
				if (reservationDate === minimumDate && new Date(interval.startAt) <= new Date()) {
					setFormError("O horário de entrada deve ser posterior ao horário atual.");
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

			async function completePayment(cardMetadata = null) {
				if (!parking || !interval || !selectedSpotId || !paymentCode || !selectedVehicle) {
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
					let savedDuringPayment = null;
					if (cardMetadata) {
						savedDuringPayment = {
							id:createDemoId("card"), userId:driverSession.id, ...cardMetadata,
							isDefault:paymentMethods.length === 0, createdAt:new Date().toISOString()
						};
						await demoRequest("paymentMethods", {
							method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(savedDuringPayment)
						});
						await queryClient.invalidateQueries({queryKey:["paymentMethods", driverSession.id]});
					}
					const chargedMethod = paymentMethod === "Pix"
						? "Pix"
						: savedDuringPayment
							? `${savedDuringPayment.brand} •••• ${savedDuringPayment.last4} (${savedDuringPayment.type === "credit" ? "crédito" : "débito"})`
							: savedCard
								? `${savedCard.brand} •••• ${savedCard.last4} (${savedCard.type === "credit" ? "crédito" : "débito"})`
								: "Cartão";
					const reservation = {
						code:paymentCode,
						parkingId: parking.id,
						parkingName: parking.name,
						spotId: selectedSpot.id,
						spotLabel: selectedSpot.label,
						driverName:formValues.driverName,
						driverEmail:formValues.driverEmail,
						driverPhone:formValues.driverPhone,
						driverId:driverSession.id,
						vehicleId:selectedVehicle.id,
						vehiclePlate:selectedVehicle.plate,
						vehicleModel:selectedVehicle.model,
						startAt: interval.startAt,
						endAt: interval.endAt,
						durationHours: duration,
						spotType:reservationSpotType,
						spotFeatures:selectedSpotFeatures,
						paymentMethod:chargedMethod,
						paymentMethodId:(savedDuringPayment || savedCard)?.id || null,
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
					paymentMethod={savedCard ? `${savedCard.brand} •••• ${savedCard.last4}` : paymentMethod === "NewCard" ? "Novo cartão" : paymentMethod}
					price={price}
					hourlyRate={hourlyRate}
					rateTierLabel={rateTierLabel}
					parkingName={parkingName}
					reservationDate={reservationDate}
					reservationTime={reservationTime}
					endTime={endTime}
					endDate={endDate}
					spotType={reservationSpotType}
					spotLabel={spots.find(spot => spot.id === selectedSpotId)?.label}
					savedCard={savedCard}
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
											<ReservationDatePicker id="reservation-date" value={reservationDate} minDate={minimumDate} error={errors.reservationDate?.message} onChange={updateReservationDate} disabled={isLoading || Boolean(parkingError)} />
										</div>
										<label className="grid gap-1.5 text-sm font-semibold" htmlFor="reservation-entry">Horário de entrada
											<Time24Input id="reservation-entry" value={reservationTime} onChange={time => {setReservationTime(time); setSelectedSpotId(""); setFormError(""); setIsReviewing(false);}} disabled={isLoading || Boolean(parkingError)} />
										</label>
										<label className="grid gap-1.5 text-sm font-semibold" htmlFor="reservation-exit">Horário de saída
											<Time24Input id="reservation-exit" value={endTime} onChange={time => {setEndTime(time); setSelectedSpotId(""); setFormError(""); setIsReviewing(false);}} disabled={isLoading || Boolean(parkingError)} />
										</label>
										<label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
											<input type="checkbox" checked={differentExitDate} onChange={event => {
												const checked = event.target.checked;
												setDifferentExitDate(checked);
												if (checked && exitDate <= reservationDate) setExitDate(nextLocalDateValue(reservationDate));
												setSelectedSpotId("");
												setFormError("");
												setIsReviewing(false);
											}} disabled={isLoading || Boolean(parkingError) || !mayCrossMidnight} className="h-4 w-4 accent-[#7c3aed]" />
											Retirar o carro em um dia diferente do dia de entrada
										</label>
										{differentExitDate && <div className="grid gap-1.5 text-sm font-semibold sm:col-span-2">
											<label htmlFor="reservation-exit-date">Data de saída</label>
											<ReservationDatePicker id="reservation-exit-date" value={exitDate} minDate={nextLocalDateValue(reservationDate || minimumDate)} disabled={isLoading || Boolean(parkingError)} onChange={date => {
												setExitDate(date);
												setSelectedSpotId("");
												setFormError("");
												setIsReviewing(false);
											}} />
										</div>}
										<p className="sm:col-span-2 text-xs leading-5 text-[#758098]">
											{duration ? `Período: ${duration.toFixed(2).replace(".", ",")} horas. Total estimado calculado pelas horas entre a entrada e a saída.` : "Escolha os dois horários; o total é calculado pela diferença entre eles."}
											{parking?.allowsOvernight ? " Este estabelecimento permite permanência de um dia para o outro." : " Este estabelecimento não permite permanência de um dia para o outro."}
										</p>
										{reservationTimeError && <p role="alert" className="sm:col-span-2 text-xs font-semibold text-red-700">{reservationTimeError}</p>}
										<fieldset className="sm:col-span-2">
											<legend className="text-sm font-semibold">Características da vaga (tags)</legend>
											<p className="mt-1 text-xs text-[#758098]">Selecione tags para filtrar. Coberta e Descoberta são mutuamente exclusivas; Especial pode ser combinada com qualquer uma.</p>
											<div className="mt-2 flex flex-wrap gap-2">{SPOT_FEATURES.map(feature => <label key={feature} className={`cursor-pointer rounded-full border px-3 py-2 text-xs font-semibold ${selectedFeatures.includes(feature) ? "border-[#7c3aed] bg-[#faf8ff] text-[#6236bc]" : "border-[#d9dee8] text-[#526079]"}`}>
												<input type="checkbox" className="sr-only" checked={selectedFeatures.includes(feature)} onChange={event => {setSelectedFeatures(current => toggleSpotFeature(current, feature, event.target.checked)); setSelectedSpotId(""); setIsReviewing(false);}} />{feature}
											</label>)}</div>
										</fieldset>
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

								<fieldset className="border-t border-[#edf0f5] pt-5">
									<legend className="font-display text-lg font-semibold">Veículo da reserva</legend>
									{driverSession ? driverAccount ? <>
										<div className="mt-3 flex flex-wrap items-end gap-3">
											<label className="grid min-w-[220px] flex-1 gap-1.5 text-sm font-semibold" htmlFor="reservation-vehicle">Selecione um veículo cadastrado
												<select id="reservation-vehicle" required value={selectedVehicleId} onChange={event => setSelectedVehicleId(event.target.value)} className="min-h-11 rounded-lg border border-[#d9dee8] bg-white px-3 text-sm font-normal">
													<option value="">Selecione</option>{(driverAccount.vehicles || []).map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} · {vehicle.model} · {vehicle.color}</option>)}
												</select>
											</label>
											<button type="button" onClick={() => setVehicleFormOpen(open => !open)} className="min-h-11 rounded-lg border border-[#6250b5] px-4 text-sm font-semibold text-[#51419c]">{vehicleFormOpen ? "Cancelar" : "Cadastrar novo veículo"}</button>
										</div>
										{vehicleFormOpen && <div className="mt-3 grid gap-3 rounded-lg bg-[#f8fafc] p-3 sm:grid-cols-4">
											<label className="grid gap-1 text-xs font-semibold">Placa<input required maxLength={8} value={vehicleDraft.plate} onChange={event => setVehicleDraft({...vehicleDraft, plate:event.target.value.toUpperCase()})} className="min-h-10 rounded-lg border border-[#d9dee8] px-2 text-sm font-normal" /></label>
											<label className="grid gap-1 text-xs font-semibold">Modelo<input required value={vehicleDraft.model} onChange={event => setVehicleDraft({...vehicleDraft, model:event.target.value})} className="min-h-10 rounded-lg border border-[#d9dee8] px-2 text-sm font-normal" /></label>
											<label className="grid gap-1 text-xs font-semibold">Cor<input required value={vehicleDraft.color} onChange={event => setVehicleDraft({...vehicleDraft, color:event.target.value})} className="min-h-10 rounded-lg border border-[#d9dee8] px-2 text-sm font-normal" /></label>
											<button type="button" onClick={() => addReservationVehicle()} className="mt-auto min-h-10 rounded-lg bg-[#6250b5] px-3 text-xs font-semibold text-white">Salvar veículo</button>
										</div>}
									</> : <p role="status" className="mt-2 text-sm text-[#68738a]">Carregando veículos da sua conta...</p>
									: <p className="mt-2 text-sm text-[#68738a]">Para reservar, <a href="loginUsuario.html" className="font-semibold text-[#6236bc] underline">entre na sua conta de motorista</a> ou <a href="cadastroUsuario.html" className="font-semibold text-[#6236bc] underline">cadastre-se</a> e adicione seu veículo.</p>}
								</fieldset>

								<DriverDetailsFields
									register={register}
									errors={errors}
								/>

								<PaymentMethodPicker
									paymentMethod={paymentMethod}
									onChange={method => {setPaymentMethod(method); setSelectedCardId("");}}
									methods={paymentMethods}
									selectedCardId={selectedCardId}
									onSelectCard={id => {setPaymentMethod("Card"); setSelectedCardId(id);}}
								/>

								{isReviewing && <ReservationReview
									reservationDate={reservationDate}
									reservationTime={reservationTime}
									endTime={endTime}
									endDate={endDate}
									duration={duration}
									spotType={reservationSpotType}
									spotLabel={spots.find(spot => spot.id === selectedSpotId)?.label}
									hourlyRate={hourlyRate}
									rateTierLabel={rateTierLabel}
									paymentMethod={savedCard ? `${savedCard.brand} •••• ${savedCard.last4}` : paymentMethod === "NewCard" ? "Novo cartão" : paymentMethod}
									price={price}
									vehicle={selectedVehicle}
									onEdit={() => setIsReviewing(false)}
								/>}
								<button type="submit" disabled={isLoading || Boolean(parkingError) || isSubmitting} className="mt-1 min-h-12 rounded-lg bg-[#7c3aed] px-5 py-3 font-semibold text-white transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-2">{isSubmitting ? "Verificando disponibilidade..." : isReviewing ? "Ir para pagamento" : "Revisar solicitação"}</button>
								<p className="text-center text-xs leading-5 text-[#758098]">A reserva só será registrada após a etapa demonstrativa de pagamento. Nenhuma cobrança real será feita.</p>
							</form>
						</section>

						<ReservationSummary
							spotType={reservationSpotType}
							spotLabel={spots.find(spot => spot.id === selectedSpotId)?.label}
							duration={duration}
							hourlyRate={hourlyRate}
							rateTierLabel={rateTierLabel}
							paymentMethod={savedCard ? `${savedCard.brand} •••• ${savedCard.last4}` : paymentMethod === "NewCard" ? "Novo cartão" : paymentMethod}
							price={price}
							placeId={placeId}
							reservationDate={reservationDate}
							reservationTime={reservationTime}
							endTime={endTime}
							endDate={endDate}
							vehicle={selectedVehicle}
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
