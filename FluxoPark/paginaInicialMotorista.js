/* Configure uma chave real para ativar geocodificação, Places e Distance Matrix. */
const GOOGLE_MAPS_API_KEY = window.FLUXOPARK_CONFIG?.googleMapsApiKey || "";
const demoPlaces = [
  {name:"Estacionamento ABC",address:"Rua das Flores, 120",distance:"180 m",walking:"2 min",price:"R$XX,YY / h",rating:"4,8",lat:-23.561,lng:-46.655},
  {name:"Estacionamento DEF",address:"Av. Central, 845",distance:"420 m",walking:"5 min",price:"R$XX,YY / h",rating:"4,6",lat:-23.563,lng:-46.65},
  {name:"Estacionamento GHI",address:"Rua do Comércio, 42",distance:"650 m",walking:"8 min",price:"R$XX,YY / h",rating:"4,5",lat:-23.558,lng:-46.648},
  {name:"Estacionamento JKL",address:"Alameda Santos, 300",distance:"890 m",walking:"11 min",price:"R$XX,YY / h",rating:"4,3",lat:-23.566,lng:-46.66}
];
let map, targetMarker, markers = [], autocomplete, selectedPlace = null, currentPlaces = [], selectedIndex = -1, detailsService, directionsService, directionsRenderer, destinationLocation;
const form = document.querySelector("#destination-form");
const input = document.querySelector("#destination");
const list = document.querySelector("#results-list");
const count = document.querySelector("#result-count");
const status = document.querySelector("#form-status");
const toast = document.querySelector("#toast");
const sortSelect = document.querySelector("#sort-select");
const showToast = message => { toast.textContent = message; toast.classList.add("visible"); window.setTimeout(() => toast.classList.remove("visible"), 3200); };
const markerIcon = color => ({path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor:color, fillOpacity:1, strokeColor:"#fff", strokeWeight:3});
const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[character]));
const walkingValue = place => Number.parseInt(place.walking, 10) || 99999;
const ratingValue = place => Number.parseFloat(String(place.rating).replace(",", ".")) || 0;
const priceValue = place => place.price_level ?? 99;
const dayNames = {monday:"Seg",tuesday:"Ter",wednesday:"Qua",thursday:"Qui",friday:"Sex",saturday:"Sáb",sunday:"Dom",segunda:"Seg",terça:"Ter",quarta:"Qua",quinta:"Qui",sexta:"Sex",sábado:"Sáb",domingo:"Dom"};
function sortPlaces(places){
  const sorted = [...places];
  const mode = sortSelect.value;
  sorted.sort((a, b) => mode === "rating" ? ratingValue(b) - ratingValue(a) : mode === "price" ? priceValue(a) - priceValue(b) : walkingValue(a) - walkingValue(b));
  return sorted;
}
function renderCards(places){
  currentPlaces = places;
  count.textContent = `${places.length} ${places.length === 1 ? "opção encontrada" : "opções encontradas"}`;
  const sortedPlaces = sortPlaces(places);
  list.innerHTML = sortedPlaces.map((place, index) => `<article class="parking-card${place === currentPlaces[selectedIndex] ? " selected" : ""}" data-place-id="${escapeHTML(place.place_id || "")}" data-index="${index}" tabindex="0"><div class="card-top"><div><div class="parking-name">${place.expanded ? `<button class="collapse-button" type="button" data-collapse="true" aria-label="Comprimir destaque" title="Comprimir destaque"><img src="RefsVisuais/Vetor%20-%20Retornar.png" alt=""></button>` : ""}<h2>${escapeHTML(place.name)}</h2>${place.expanded ? `<a class="maps-link" href="${escapeHTML(place.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + place.address)}`)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir ${escapeHTML(place.name)} no Google Maps" title="Abrir no Google Maps"><img src="RefsVisuais/Vetor%20-%20Link.png" alt=""></a>` : ""}</div><p class="address">${escapeHTML(place.address)}</p></div><span class="rating-badge">★ ${escapeHTML(place.rating)}</span></div><div class="card-details"><span class="tag price">${escapeHTML(place.price)}</span><span class="tag walk"><img class="walk-icon" src="RefsVisuais/Vetor%20-%20Boneco%20Andando.png" alt="">${escapeHTML(place.walking)}</span></div>${place.expanded ? renderExpanded(place) : ""}</article>`).join("");
  document.querySelectorAll(".parking-card").forEach(card => { const select = () => { const place = sortedPlaces[Number(card.dataset.index)]; if(!place.expanded) selectPlace(Number(card.dataset.index), sortedPlaces); }; card.addEventListener("click", select); card.addEventListener("keydown", event => { if(event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); } }); });
  document.querySelectorAll("[data-collapse]").forEach(button => button.addEventListener("click", event => { event.stopPropagation(); const place = currentPlaces.find(item => item.expanded); if(place) { place.expanded = false; renderCards(currentPlaces); } }));
}
function renderExpanded(place){
  const photos = place.photos?.length ? place.photos.slice(0, 4).map(photo => `<img src="${escapeHTML(photo)}" alt="Imagem de ${escapeHTML(place.name)}" loading="lazy">`).join("") : `<div class="photo-placeholder">Imagens do estabelecimento indisponíveis</div>`;
  const hours = formatGroupedHours(place.opening_hours?.weekday_text);
  const reviews = place.reviews?.slice(0, 3).map(review => `<li><strong>${escapeHTML(review.author_name)}</strong><span>★ ${escapeHTML(review.rating)} · ${escapeHTML(review.text || "Comentário sem texto")}</span></li>`).join("") || "<li>Ainda não há comentários disponíveis.</li>";
  return `<div class="expanded-details"><section class="photo-gallery"><h3>▧ Imagens</h3><div>${photos}</div></section><p class="contact-row">Contato: <strong>${escapeHTML(place.phone || "Telefone não informado")}</strong></p><section class="hours"><h3>◷ Horário de Funcionamento</h3><ul>${hours}</ul></section><section class="reviews"><h3>▤ Comentários (${place.user_ratings_total || 0})</h3><ul>${reviews}</ul></section></div>`;
}
function formatGroupedHours(weekdayText){
  if(!weekdayText?.length) return "<li>Horário não informado pelo Google</li>";
  const entries = weekdayText.map(entry => { const separator = entry.indexOf(":"); const rawDay = separator >= 0 ? entry.slice(0, separator).trim().toLowerCase().replace(/-feira$/, "") : ""; const schedule = separator >= 0 ? entry.slice(separator + 1).trim() : entry.trim(); return {day:dayNames[rawDay] || rawDay, schedule}; });
  const groups = [];
  entries.forEach(entry => { const existing = groups.find(group => group.schedule === entry.schedule); if(existing) existing.days.push(entry.day); else groups.push({days:[entry.day], schedule:entry.schedule}); });
  return groups.map(group => `<li><strong>${escapeHTML(group.days.join(", "))}:</strong> ${escapeHTML(group.schedule)}</li>`).join("");
}
function selectPlace(index, places){
  const place = places[index]; selectedIndex = currentPlaces.indexOf(place); place.expanded = !place.expanded;
  renderCards(currentPlaces);
  const selectedCard = [...document.querySelectorAll(".parking-card")].find(card => card.dataset.placeId === place.place_id);
  if(selectedCard) selectedCard.scrollIntoView({block:"nearest"});
  const selectedMarker = markers.find(item => item.place === place)?.marker;
  if(selectedMarker){ map.panTo(selectedMarker.getPosition()); map.setZoom(16); }
  drawWalkingRoute(place);
  if(place.expanded && !place.detailsLoaded) loadPlaceDetails(place);
}
function drawWalkingRoute(place){
  if(!directionsService || !directionsRenderer || !destinationLocation) return;
  directionsService.route({origin:{lat:place.lat, lng:place.lng}, destination:destinationLocation, travelMode:google.maps.TravelMode.WALKING}, (result, statusCode) => {
    if(statusCode === google.maps.DirectionsStatus.OK) directionsRenderer.setDirections(result);
    else showToast("Não foi possível traçar a rota a pé");
  });
}
function loadPlaceDetails(place){
  if(!detailsService || !place.place_id) return;
  detailsService.getDetails({placeId:place.place_id, fields:["formatted_address","formatted_phone_number","opening_hours","photos","reviews","user_ratings_total","url"]}, (details, code) => {
    if(code !== google.maps.places.PlacesServiceStatus.OK) { showToast("Detalhes do estabelecimento indisponíveis"); return; }
    place.fullAddress = details.formatted_address || place.address; place.address = place.fullAddress; place.phone = details.formatted_phone_number; place.googleMapsUrl = details.url; place.opening_hours = details.opening_hours; place.user_ratings_total = details.user_ratings_total; place.reviews = details.reviews;
    place.photos = details.photos?.map(photo => photo.getUrl({maxWidth:240, maxHeight:110})); place.detailsLoaded = true; renderCards(currentPlaces);
  });
}
function renderMarkers(places, target){
  markers.forEach(item => item.marker.setMap(null)); markers = [];
  places.forEach((place, index) => { const marker = new google.maps.Marker({map, position:{lat:place.lat,lng:place.lng}, title:place.name, icon:markerIcon("#416cf2"), label:{text:String(index + 1), color:"#fff", fontWeight:"700"}}); marker.addListener("click", () => selectPlace(currentPlaces.indexOf(place), currentPlaces)); markers.push({marker, place}); });
  if(targetMarker) targetMarker.setMap(null); targetMarker = new google.maps.Marker({map, position:target, title:"Seu destino", icon:markerIcon("#f2684a")});
}
function useDemoSearch(){ renderCards(demoPlaces); status.textContent = "Modo demonstrativo: configure a chave do Google Maps para dados reais"; showToast("Resultados demonstrativos carregados"); }
async function searchGoogle(destination){
  const geocoder = new google.maps.Geocoder();
  const response = selectedPlace?.geometry?.location
    ? {results:[selectedPlace]}
    : await geocoder.geocode({address:destination, region:"br"});
  if(!response.results[0]) throw new Error("Destino não encontrado");
  const target = response.results[0].geometry.location;
  destinationLocation = target;
  map.setCenter(target); map.setZoom(14);
  const service = new google.maps.places.PlacesService(map);
  const nearby = await new Promise((resolve, reject) => service.nearbySearch({location:target, radius:4000, type:"parking"}, (results, code) => code === google.maps.places.PlacesServiceStatus.OK ? resolve(results) : reject(new Error("Nenhum estacionamento encontrado"))));
  const distanceService = new google.maps.DistanceMatrixService();
  const matrix = await distanceService.getDistanceMatrix({origins:nearby.map(place => place.geometry.location), destinations:[target], travelMode:google.maps.TravelMode.WALKING, unitSystem:google.maps.UnitSystem.METRIC});
  const places = nearby.map((place, index) => { const element = matrix.rows[index].elements[0]; return {name:place.name,address:place.vicinity || "Endereço indisponível",distance:element.distance?.text || "-",walking:element.duration?.text || "-",price:place.price_level ? "R$" + "$".repeat(place.price_level) : "Consultar",price_level:place.price_level,rating:place.rating ? place.rating.toFixed(1) : "Novo",lat:place.geometry.location.lat(),lng:place.geometry.location.lng(),place_id:place.place_id}; });
  renderCards(places); renderMarkers(places, target); status.textContent = `Resultados para ${response.results[0].formatted_address || destination}`; showToast(`${places.length} estacionamentos encontrados`);
}
input.addEventListener("input", () => { selectedPlace = null; });
sortSelect.addEventListener("change", () => { if(currentPlaces.length) renderCards(currentPlaces); });
document.querySelector("#filter-button").addEventListener("click", () => { sortSelect.focus(); });
form.addEventListener("submit", event => { event.preventDefault(); if(!input.value.trim()) return; status.textContent = "Procurando estacionamentos próximos..."; if(window.google?.maps && GOOGLE_MAPS_API_KEY && map) searchGoogle(input.value.trim()).catch(error => { status.textContent = error.message; showToast(error.message); }); else useDemoSearch(); });
document.querySelector("#locate-button").addEventListener("click", () => { if(!navigator.geolocation) return showToast("Geolocalização indisponível"); navigator.geolocation.getCurrentPosition(position => { input.value = "Minha localização"; map?.setCenter({lat:position.coords.latitude,lng:position.coords.longitude}); showToast("Localização encontrada"); }, () => showToast("Não foi possível acessar sua localização")); });
document.querySelector("#menu-button").addEventListener("click", event => { const expanded = event.currentTarget.getAttribute("aria-expanded") === "true"; event.currentTarget.setAttribute("aria-expanded", String(!expanded)); showToast(expanded ? "Menu fechado" : "Menu em breve"); });
function initMap(){
  map = new google.maps.Map(document.querySelector("#map"), {center:{lat:-23.561,lng:-46.655},zoom:14,disableDefaultUI:true,zoomControl:true,styles:[{featureType:"poi",stylers:[{visibility:"off"}]}]});
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({map, suppressMarkers:true, polylineOptions:{strokeColor:"#f2684a", strokeOpacity:.9, strokeWeight:5}});
  detailsService = new google.maps.places.PlacesService(map);
  autocomplete = new google.maps.places.Autocomplete(input, {types:["geocode","establishment"], componentRestrictions:{country:"br"}, fields:["formatted_address","geometry","name"]});
  autocomplete.addListener("place_changed", () => { selectedPlace = autocomplete.getPlace(); if(!selectedPlace.geometry) { status.textContent = "Escolha uma sugestão válida do Google Maps"; return; } input.value = selectedPlace.formatted_address || selectedPlace.name; status.textContent = "Destino selecionado. Pressione Enter para buscar."; });
}
if(GOOGLE_MAPS_API_KEY){ const script = document.createElement("script"); script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`; script.async = true; script.defer = true; script.onerror = () => { status.textContent = "Não foi possível carregar o Google Maps"; }; window.initMap = initMap; document.head.appendChild(script); }