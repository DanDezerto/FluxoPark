import React from "react";
import { createRoot } from "react-dom/client";
import { useQueryClient } from "@tanstack/react-query";
import { DriverHeader, ParkingCard } from "../components/driver/DriverComponents.jsx";
import { AppProviders } from "../providers/AppProviders.jsx";
import { readCollection } from "../lib/api.js";
import "../../paginaInicialMotorista-react.css";

		function App() {
			const queryClient = useQueryClient();
			const [query, setQuery] = React.useState("");
			const [destinationName, setDestinationName] = React.useState("");
			const [sort, setSort] = React.useState("distance");
			const [selected, setSelected] = React.useState(null);
			const [menuOpen, setMenuOpen] = React.useState(false);
			const [status, setStatus] = React.useState("Digite um destino para encontrar estacionamentos próximos.");
			const [options, setOptions] = React.useState([]);
			const [mapReady, setMapReady] = React.useState(false);
			const [mapsError, setMapsError] = React.useState("");
			const mapElement = React.useRef(null);
			const mapRef = React.useRef(null);
			const placesRef = React.useRef(null);
			const routesRef = React.useRef(null);
			const markersRef = React.useRef([]);
			const routeLinesRef = React.useRef([]);
			const destinationMarkerRef = React.useRef(null);
			const routesByIdRef = React.useRef(new Map());
			const destinationRef = React.useRef(null);
			const requestIdRef = React.useRef(0);
			const shownOptions = React.useMemo(() => [...options].sort((a, b) => sort === "rating" ? b.rating - a.rating : sort === "price" ? (a.hourlyRate ?? a.priceLevel ?? 99) - (b.hourlyRate ?? b.priceLevel ?? 99) : a.distanceMeters - b.distanceMeters), [options, sort]);

			React.useEffect(() => {
				const apiKey = window.FLUXOPARK_CONFIG?.googleMapsApiKey;
				if (!apiKey) {
					setMapsError("Google Maps sem configuração. A busca demonstrativa está disponível.");
					return;
				}
				window.initFluxoParkMap = async () => {
					try {
						mapRef.current = new google.maps.Map(mapElement.current, {
							center: {lat:-23.561, lng:-46.655},
							zoom: 14,
							mapTypeControl: false,
							streetViewControl: false,
							fullscreenControl: false
						});
						const [{Place}, {Route}] = await Promise.all([
							google.maps.importLibrary("places"),
							google.maps.importLibrary("routes")
						]);
						placesRef.current = Place;
						routesRef.current = Route;
						setMapReady(true);
						setMapsError("");
					} catch(error) {
						console.error("Falha ao iniciar Places API (New) ou Routes API.", error);
						setMapsError("Não foi possível iniciar a busca. Confira Places API (New), Routes API e faturamento no Google Cloud.");
					}
				};
				const script = document.createElement("script");
				script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&callback=initFluxoParkMap`;
				script.async = true;
				script.onerror = () => setMapsError("Não foi possível carregar o Google Maps. Verifique a chave e a conexão.");
				window.gm_authFailure = () => setMapsError("A chave do Google Maps foi recusada. Confira as restrições, APIs e faturamento.");
				document.head.appendChild(script);
				return () => {
					delete window.initFluxoParkMap;
					script.remove();
				};
			}, []);

			function updateMapMarkers(places, destination) {
				markersRef.current.forEach(marker => marker.setMap(null));
				markersRef.current = [];
				routeLinesRef.current.forEach(line => line.setMap(null));
				routeLinesRef.current = [];
				routesByIdRef.current.clear();
				if (destinationMarkerRef.current) destinationMarkerRef.current.setMap(null);
				destinationMarkerRef.current = new google.maps.Marker({map:mapRef.current, position:destination, title:"Seu destino", icon:{path:google.maps.SymbolPath.CIRCLE, scale:10, fillColor:"#ef4444", fillOpacity:1, strokeColor:"#fff", strokeWeight:3}});
				places.forEach((place, index) => {
					const marker = new google.maps.Marker({map:mapRef.current, position:place.location, title:place.partner ? `${place.name} (parceiro)` : place.name, label:{text:String(index + 1), color:"#fff", fontWeight:"700"}, icon:{path:google.maps.SymbolPath.CIRCLE, scale:10, fillColor:place.partner ? "#7c3aed" : "#416cf2", fillOpacity:1, strokeColor:"#fff", strokeWeight:3}});
					marker.addListener("click", () => {
						const option = optionsRef.current.find(item => item.id === place.id);
						if (option) selectParking(option);
					});
					markersRef.current.push(marker);
				});
				mapRef.current.setCenter(destination);
				mapRef.current.setZoom(15);
			}

			async function searchAround(location, label) {
				if (!placesRef.current || !routesRef.current || !mapRef.current) throw new Error("O Google Maps ainda está carregando. Tente novamente em instantes.");
				const requestId = ++requestIdRef.current;
				const {places} = await placesRef.current.searchNearby({
					fields:["displayName","formattedAddress","location","rating","priceLevel","id","googleMapsURI"],
					locationRestriction:{center:location, radius:4000},
					includedPrimaryTypes:["parking"],
					maxResultCount:10,
					rankPreference:"DISTANCE"
				});
				if (!places?.length) throw new Error("Nenhum estacionamento encontrado em até 4 km do destino.");
				let routeFailures = 0;
				const results = await Promise.all(places.filter(place => place.location).map(async place => {
					let distanceMeters = Number.MAX_SAFE_INTEGER;
					let driveMinutes = Number.MAX_SAFE_INTEGER;
					try {
						const result = await routesRef.current.computeRoutes({origin:place.location, destination:location, travelMode:"DRIVING", fields:["distanceMeters","durationMillis","path"]});
						const route = result.routes?.[0];
						if (route) {
							distanceMeters = route.distanceMeters;
							driveMinutes = Math.max(1, Math.round(route.durationMillis / 60000));
							routesByIdRef.current.set(place.id, route);
						}
					} catch(error) {
						routeFailures += 1;
						console.warn(`Não foi possível calcular a rota de carro para ${typeof place.displayName === "string" ? place.displayName : place.displayName?.text || "um estacionamento"}.`, error);
					}
					const priceLevels = {PRICE_LEVEL_INEXPENSIVE:1,PRICE_LEVEL_MODERATE:2,PRICE_LEVEL_EXPENSIVE:3,PRICE_LEVEL_VERY_EXPENSIVE:4};
					return {
						id:place.id,
						name:(typeof place.displayName === "string" ? place.displayName : place.displayName?.text) || "Estacionamento",
						address:place.formattedAddress || "Endereço indisponível",
						location:place.location,
						driveMinutes,
						distanceMeters,
						rating:place.rating || 0,
						priceLevel:priceLevels[place.priceLevel] || 0,
						partner:Array.isArray(window.FLUXOPARK_CONFIG?.googleMapsPartnerPlaceIds) && window.FLUXOPARK_CONFIG.googleMapsPartnerPlaceIds.includes(place.id),
						place,
						googleMapsURI:place.googleMapsURI
					};
				}));
				if (requestId !== requestIdRef.current) return;
				if (!results.length) throw new Error("Os resultados encontrados não têm localização válida.");
				optionsRef.current = results;
				setOptions(results);
				destinationRef.current = location;
				setDestinationName(label);
				setSelected(null);
				updateMapMarkers(results, location);
				return routeFailures;
			}
			const optionsRef = React.useRef([]);

			async function loadLocalParkings() {
				setStatus("Carregando estacionamentos cadastrados no json-server...");
				try {
					const parkings = await queryClient.fetchQuery({
						queryKey: ["parkings"],
						queryFn: () => readCollection("parkings")
					});
					const localOptions = parkings.filter(parking => parking.partner).map(parking => ({
						id:parking.googlePlaceId || parking.id,
						parkingId:parking.id,
						name:parking.name,
						address:parking.address,
						driveMinutes:Number.MAX_SAFE_INTEGER,
						distanceMeters:Number.MAX_SAFE_INTEGER,
						rating:parking.rating || 0,
						hourlyRate:Number(parking.hourlyRates?.Comum || 0),
						priceLevel:0,
						partner:true,
						source:"local"
					}));
					optionsRef.current = localOptions;
					setOptions(localOptions);
					setDestinationName("Estacionamentos do json-server");
					setSelected(null);
					destinationRef.current = null;
					markersRef.current.forEach(marker => marker.setMap(null));
					markersRef.current = [];
					routeLinesRef.current.forEach(line => line.setMap(null));
					routeLinesRef.current = [];
					if (destinationMarkerRef.current) destinationMarkerRef.current.setMap(null);
					destinationMarkerRef.current = null;
					setStatus(localOptions.length
						? `${localOptions.length} parceiro(s) cadastrado(s) na API local. Distâncias não filtradas pelo destino.`
						: "A API local não possui estacionamentos parceiros cadastrados.");
				} catch(error) {
					console.error("Não foi possível carregar os estacionamentos do json-server.", error);
					setStatus(`${error.message || "Falha ao consultar a API local."} Inicie o servidor com npm.cmd start.`);
				}
			}

			async function submitSearch(event) {
				event.preventDefault();
				const destination = query.trim();
				if (!destination) return;
				setSelected(null);
				if (!mapReady) {
					if (window.FLUXOPARK_CONFIG?.googleMapsApiKey) {
						setStatus(mapsError || "O Google Maps ainda está carregando. Tente novamente em instantes.");
						return;
					}
					await loadLocalParkings();
					return;
				}
				setStatus("Procurando o destino e estacionamentos próximos...");
				try {
					const {places} = await placesRef.current.searchByText({textQuery:destination, fields:["displayName","formattedAddress","location"], maxResultCount:1, region:"br"});
					const place = places?.[0];
					if (!place?.location) throw new Error("Destino não encontrado. Tente informar o endereço completo e a cidade.");
					const routeFailures = await searchAround(place.location, place.formattedAddress || destination);
					setStatus(routeFailures
						? `Estacionamentos próximos de ${place.formattedAddress || destination}. ${routeFailures} rota(s) de carro indisponível(is); confira a cota da Routes API.`
						: `Estacionamentos próximos de ${place.formattedAddress || destination}, ordenados pela distância de carro.`);
				} catch(error) {
					console.error("Falha ao pesquisar destino e estacionamentos.", error);
					setStatus(error.message || "Não foi possível concluir a busca.");
				}
			}

			function showRoute(option) {
				if (option.source === "local" || !option.location || !mapRef.current || !destinationRef.current) return;
				routeLinesRef.current.forEach(line => line.setMap(null));
				routeLinesRef.current = [];
				const route = routesByIdRef.current.get(option.id);
				if (route) {
					routeLinesRef.current = route.createPolylines();
					routeLinesRef.current.forEach(line => {
						line.setOptions({strokeColor:"#f2684a", strokeOpacity:.9, strokeWeight:5});
						line.setMap(mapRef.current);
					});
				}
				mapRef.current.panTo(option.location);
				mapRef.current.setZoom(16);
			}

			function selectParking(option) {
				setSelected(option.id);
				showRoute(option);
				expandPlace(option);
				window.requestAnimationFrame(() => {
					document.getElementById(`parking-${option.id}`)?.scrollIntoView({behavior:"smooth", block:"center"});
				});
			}

			async function expandPlace(option) {
				if (!option.place || option.detailsLoaded) return;
				try {
					await option.place.fetchFields({fields:["formattedAddress","nationalPhoneNumber","regularOpeningHours","photos","reviews","userRatingCount","googleMapsURI"]});
					const details = option.place;
					const updated = {...option, address:details.formattedAddress || option.address, phone:details.nationalPhoneNumber, openingHours:details.regularOpeningHours?.weekdayDescriptions || [], photos:details.photos?.slice(0,4).map(photo => photo.getURI({maxWidth:240,maxHeight:120})) || [], reviews:details.reviews || [], reviewCount:details.userRatingCount || 0, googleMapsURI:details.googleMapsURI || option.googleMapsURI, detailsLoaded:true};
					optionsRef.current = optionsRef.current.map(item => item.id === option.id ? updated : item);
					setOptions(optionsRef.current);
				} catch(error) {
					console.error("Falha ao carregar detalhes do estacionamento.", error);
					setStatus(`Não foi possível carregar os detalhes: ${error.message}`);
				}
			}

			function toggleSelection(option) {
				const nextId = selected === option.id ? null : option.id;
				setSelected(nextId);
				if (nextId) {
					showRoute(option);
					expandPlace(option);
				} else {
					routeLinesRef.current.forEach(line => line.setMap(null));
					routeLinesRef.current = [];
				}
			}

			function useMyLocation() {
				if (!navigator.geolocation) {
					setStatus("A geolocalização não está disponível neste navegador.");
					return;
				}
				setStatus("Obtendo sua localização...");
				navigator.geolocation.getCurrentPosition(position => {
					const location = {lat:position.coords.latitude, lng:position.coords.longitude};
					if (mapRef.current) mapRef.current.setCenter(location);
					if (mapReady) searchAround(location, "Minha localização").then(routeFailures => setStatus(routeFailures
						? `Estacionamentos próximos da sua localização. ${routeFailures} rota(s) de carro indisponível(is); confira a cota da Routes API.`
						: "Estacionamentos próximos da sua localização, ordenados pela distância de carro.")).catch(error => setStatus(error.message));
					else setStatus("Localização encontrada. Configure o Google Maps para buscar estacionamentos.");
				}, error => {
					setStatus(error.code === error.PERMISSION_DENIED ? "Permita o acesso à localização nas configurações do navegador." : "Não foi possível obter sua localização.");
				}, {enableHighAccuracy:true, timeout:10000});
			}

			function reservationUrl(option) {
				const params = new URLSearchParams({placeId:option.id, name:option.name, address:option.address});
				return `paginaReserva.html?${params.toString()}`;
			}

			return (
				<div className="min-h-screen bg-white text-[#172749]">
					<DriverHeader
						query={query}
						onQueryChange={setQuery}
						onSearch={submitSearch}
						menuOpen={menuOpen}
						onToggleMenu={() => setMenuOpen(!menuOpen)}
					/>

					<main className="mx-auto grid max-w-[1500px] gap-7 px-4 py-6 sm:px-7 lg:grid-cols-[minmax(330px,0.78fr)_minmax(0,1.5fr)] lg:gap-10 lg:px-10 lg:py-8">
						<section aria-labelledby="results-title" className="order-2 flex min-w-0 flex-col lg:order-1">
							<div className="flex items-start justify-between border-b border-[#e5e7eb] pb-4">
								<div><p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#416cf2]">Busca inteligente</p><h1 id="results-title" className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Estacionamentos <span className="text-[#416cf2]">próximos</span></h1></div>
							</div>
							<button type="button" onClick={loadLocalParkings} className="mt-3 min-h-10 self-start rounded-lg border border-[#7c3aed] px-3 py-2 text-xs font-semibold text-[#6236bc] transition hover:bg-[#faf8ff] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30">Testar estacionamentos do json-server</button>
							<div className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs text-[#68738a]">
								<span>{shownOptions.length} {shownOptions.length === 1 ? "opção encontrada" : "opções encontradas"}</span>
								<label className="flex items-center gap-1.5 font-semibold text-[#34415c]" htmlFor="preview-sort">Ordenar por
									<select id="preview-sort" value={sort} onChange={event => setSort(event.target.value)} className="max-w-[140px] rounded-md border border-[#e1e4eb] bg-white px-2 py-1.5 text-xs text-[#34415c] outline-none focus:border-[#416cf2]">
										<option value="distance">Proximidade</option><option value="rating">Nota</option><option value="price">Preço</option>
									</select>
								</label>
							</div>
							<div className="grid gap-2.5">
								{shownOptions.map((option, index) => <ParkingCard
									key={option.id}
									option={option}
									index={index}
									isSelected={selected === option.id}
									onSelect={() => toggleSelection(option)}
									reservationHref={reservationUrl(option)}
								/>)}
								{shownOptions.length === 0 && <div className="rounded-xl border border-dashed border-[#d7dce6] px-4 py-9 text-center text-sm text-[#68738a]">Digite um destino acima para encontrar estacionamentos próximos.</div>}
							</div>
							<div className="mt-auto flex items-center gap-2 border-t border-[#e5e7eb] pt-3 text-[11px] text-[#758098]"><span className={`h-2 w-2 rounded-full ${mapReady ? "bg-[#17a66a]" : "bg-[#f5c84b]"}`}></span>{mapReady ? status : mapsError || status}</div>
						</section>

						<section aria-label="Mapa dos estacionamentos" className="order-1 min-w-0 lg:order-2">
							<div className="flex h-12 items-center justify-between rounded-t-xl border border-[#dedfe4] bg-[#f0eff0] px-4">
								<div className="flex items-center gap-2.5 font-display text-sm font-semibold text-[#303b50] sm:text-base"><span className="text-xl text-[#4285f4]">◆</span> Fornecido por Google Maps</div>
								<button type="button" onClick={useMyLocation} aria-label="Usar minha localização" title="Usar minha localização" className="grid h-8 w-8 place-items-center rounded-lg border border-[#d8dbe2] bg-white text-lg text-[#33415f] transition hover:border-[#416cf2] hover:text-[#416cf2]">◎</button>
							</div>
							<div className="map-grid relative h-[320px] overflow-hidden border-x border-b border-[#dedfe4] sm:h-[390px] lg:h-[min(60vh,570px)] lg:min-h-[430px]">
								<div className="absolute inset-0 bg-[#e9eee1]/25"></div><div className="map-river"></div><div className="map-road map-road-one"></div><div className="map-road map-road-two"></div><div className="map-road map-road-three"></div>
								<div id="google-map" ref={mapElement} className="google-map-canvas" aria-label="Mapa Google Maps"></div>
								{!mapReady && <><span className="pin pin-destination" aria-hidden="true"><span>●</span></span><span className="pin pin-one" aria-hidden="true"><span>1</span></span><span className="pin pin-two" aria-hidden="true"><span>2</span></span><span className="pin pin-three" aria-hidden="true"><span>3</span></span></>}
								<div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-lg border border-white/70 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-sm"><strong className="block font-display text-xs text-[#172749]">{destinationName || "Digite um destino para começar"}</strong><span className="mt-0.5 block text-[11px] text-[#68738a]">{destinationRef.current ? "Google Maps" : "Prévia ilustrativa do mapa"}</span></div>
								{!mapReady && <div className="absolute right-3 top-3 z-10 flex flex-col overflow-hidden rounded-lg border border-[#d6d8de] bg-white shadow-sm"><button type="button" aria-label="Aproximar mapa" className="h-9 w-9 border-b border-[#e5e7eb] text-xl text-[#46536d] hover:bg-[#f4f6fa]">+</button><button type="button" aria-label="Afastar mapa" className="h-9 w-9 text-xl text-[#46536d] hover:bg-[#f4f6fa]">−</button></div>}
							</div>
							<div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 text-[11px] text-[#68738a]"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#ef4444]"></i>Destino</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#416cf2]"></i>Estacionamento</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#7c3aed]"></i>Parceiro</span><span className="ml-auto text-[#9098a8]">{mapReady ? "Powered by Google" : "Mapa ilustrativo"}</span></div>
							{mapsError && <div role="status" className="rounded-lg bg-[#fff7e8] px-3 py-2 text-xs text-[#815b12]">{mapsError}</div>}
						</section>
					</main>
				</div>
			);
		}
		createRoot(document.getElementById("root")).render(<AppProviders><App /></AppProviders>);
