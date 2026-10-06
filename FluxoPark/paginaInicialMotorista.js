/* Configure uma chave real para ativar geocodificação, Places e Distance Matrix. */
const GOOGLE_MAPS_API_KEY = window.FLUXOPARK_CONFIG?.googleMapsApiKey || "";
const demoPlaces = [
  {name:"Estacionamento ABC",address:"Rua das Flores, 120",distance:"180 m",walking:"2 min",price:"R$XX,YY / h",rating:"4,8",lat:-23.561,lng:-46.655},
  {name:"Estacionamento DEF",address:"Av. Central, 845",distance:"420 m",walking:"5 min",price:"R$XX,YY / h",rating:"4,6",lat:-23.563,lng:-46.65},
  {name:"Estacionamento GHI",address:"Rua do Comércio, 42",distance:"650 m",walking:"8 min",price:"R$XX,YY / h",rating:"4,5",lat:-23.558,lng:-46.648},
  {name:"Estacionamento JKL",address:"Alameda Santos, 300",distance:"890 m",walking:"11 min",price:"R$XX,YY / h",rating:"4,3",lat:-23.566,lng:-46.66}
];
let map, targetMarker, markers = [], currentPlaces = [], selectedIndex = -1, Place, Route, destinationLocation;
const walkingRoutes = new Map();
let walkingPolylines = [];
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
  walkingPolylines.forEach(polyline => polyline.setMap(null));
  walkingPolylines = [];
  const route = walkingRoutes.get(place);
  if(!route) return;
  walkingPolylines = route.createPolylines();
  walkingPolylines.forEach(polyline => {
    polyline.setOptions({strokeColor:"#f2684a", strokeOpacity:.9, strokeWeight:5});
    polyline.setMap(map);
  });
}
async function loadPlaceDetails(place){
  if(!place.googlePlace) return;
  try {
    await place.googlePlace.fetchFields({fields:["formattedAddress","nationalPhoneNumber","regularOpeningHours","photos","reviews","userRatingCount","googleMapsURI"]});
    const details = place.googlePlace;
    place.address = details.formattedAddress || place.address;
    place.phone = details.nationalPhoneNumber;
    place.googleMapsUrl = details.googleMapsURI;
    place.opening_hours = {weekday_text:details.regularOpeningHours?.weekdayDescriptions};
    place.user_ratings_total = details.userRatingCount;
    place.reviews = details.reviews?.map(review => ({author_name:review.authorAttribution?.displayName || "Usuário do Google", rating:review.rating, text:review.text?.text || ""}));
    place.photos = details.photos?.slice(0, 4).map(photo => photo.getURI({maxWidth:240, maxHeight:110}));
    place.detailsLoaded = true;
    renderCards(currentPlaces);
  } catch(error) {
    showToast("Detalhes do estacionamento indisponíveis: " + error.message);
  }
}
function renderMarkers(places, target){
  markers.forEach(item => item.marker.setMap(null)); markers = [];
  places.forEach((place, index) => { const marker = new google.maps.Marker({map, position:{lat:place.lat,lng:place.lng}, title:place.name, icon:markerIcon("#416cf2"), label:{text:String(index + 1), color:"#fff", fontWeight:"700"}}); marker.addListener("click", () => selectPlace(currentPlaces.indexOf(place), currentPlaces)); markers.push({marker, place}); });
  if(targetMarker) targetMarker.setMap(null); targetMarker = new google.maps.Marker({map, position:target, title:"Seu destino", icon:markerIcon("#f2684a")});
}
function useDemoSearch(){ renderCards(demoPlaces); status.textContent = "Modo demonstrativo: configure a chave do Google Maps para dados reais"; showToast("Resultados demonstrativos carregados"); }
async function searchGoogle(destination){
  if(!Place || !Route) throw new Error("As APIs Places (New) e Routes precisam estar habilitadas no Google Cloud.");
  const {places:destinations} = await Place.searchByText({textQuery:destination, fields:["displayName","formattedAddress","location"], maxResultCount:1, region:"br"});
  const destinationPlace = destinations?.[0];
  if(!destinationPlace?.location) throw new Error("Destino não encontrado. Tente informar o endereço completo ou a cidade.");
  const target = destinationPlace.location;
  destinationLocation = target;
  map.setCenter(target); map.setZoom(14);
  const {places:nearby} = await Place.searchNearby({
    fields:["displayName","formattedAddress","location","rating","priceLevel","id","googleMapsURI"],
    locationRestriction:{center:target, radius:4000},
    includedPrimaryTypes:["parking"],
    maxResultCount:10,
    rankPreference:"DISTANCE"
  });
  if(!nearby?.length) throw new Error("Nenhum estacionamento encontrado em até 4 km do destino.");
  walkingRoutes.clear();
  const places = await Promise.all(nearby.filter(place => place.location).map(async place => {
    let distance = "-", walking = "-";
    try {
      const result = await Route.computeRoutes({origin:place.location, destination:target, travelMode:"WALKING", fields:["distanceMeters","durationMillis","path"]});
      const route = result.routes?.[0];
      if(route) {
        walkingRoutes.set(place, route);
        distance = route.distanceMeters < 1000 ? `${route.distanceMeters} m` : `${(route.distanceMeters / 1000).toFixed(1)} km`;
        walking = `${Math.max(1, Math.round(route.durationMillis / 60000))} min`;
      }
    } catch(error) {
      console.warn("Não foi possível calcular a rota a pé para um estacionamento.", error);
    }
    const priceLevels = {PRICE_LEVEL_INEXPENSIVE:1,PRICE_LEVEL_MODERATE:2,PRICE_LEVEL_EXPENSIVE:3,PRICE_LEVEL_VERY_EXPENSIVE:4};
    const price_level = priceLevels[place.priceLevel] || 0;
    return {
      name:place.displayName || "Estacionamento",
      address:place.formattedAddress || "Endereço indisponível",
      distance,
      walking,
      price:price_level ? "R$" + "$".repeat(price_level) : "Consultar",
      price_level,
      rating:place.rating ? place.rating.toFixed(1) : "Novo",
      lat:place.location.lat(),
      lng:place.location.lng(),
      place_id:place.id,
      googleMapsUrl:place.googleMapsURI,
      googlePlace:place
    };
  }));
  renderCards(places); renderMarkers(places, target); status.textContent = `Resultados para ${destinationPlace.formattedAddress || destination}`; showToast(`${places.length} estacionamentos encontrados`);
}
sortSelect.addEventListener("change", () => { if(currentPlaces.length) renderCards(currentPlaces); });
document.querySelector("#filter-button").addEventListener("click", () => { sortSelect.focus(); });
form.addEventListener("submit", async event => {
  event.preventDefault();
  const destination = input.value.trim();
  if(!destination) return;
  status.textContent = "Procurando o destino e estacionamentos próximos...";
  if(!GOOGLE_MAPS_API_KEY) { useDemoSearch(); return; }
  if(!window.google?.maps || !map) {
    status.textContent = "Google Maps não carregou. Verifique a chave, as restrições e as APIs habilitadas no Google Cloud.";
    showToast("Não foi possível carregar o Google Maps");
    return;
  }
  try {
    await searchGoogle(destination);
  } catch(error) {
    status.textContent = error.message;
    showToast(error.message);
  }
});
document.querySelector("#locate-button").addEventListener("click", () => { if(!navigator.geolocation) return showToast("Geolocalização indisponível"); navigator.geolocation.getCurrentPosition(position => { input.value = "Minha localização"; map?.setCenter({lat:position.coords.latitude,lng:position.coords.longitude}); showToast("Localização encontrada"); }, () => showToast("Não foi possível acessar sua localização")); });
document.querySelector("#menu-button").addEventListener("click", event => { const expanded = event.currentTarget.getAttribute("aria-expanded") === "true"; event.currentTarget.setAttribute("aria-expanded", String(!expanded)); showToast(expanded ? "Menu fechado" : "Menu em breve"); });
async function initMap(){
  map = new google.maps.Map(document.querySelector("#map"), {center:{lat:-23.561,lng:-46.655},zoom:14,disableDefaultUI:true,zoomControl:true,styles:[{featureType:"poi",stylers:[{visibility:"off"}]}]});
  try {
    [{Place}, {Route}] = await Promise.all([google.maps.importLibrary("places"), google.maps.importLibrary("routes")]);
  } catch(error) {
    status.textContent = "Não foi possível iniciar a busca. Habilite Places API (New) e Routes API no Google Cloud.";
    showToast(status.textContent);
    console.error("Falha ao iniciar as bibliotecas Places e Routes do Google Maps.", error);
  }
}
if(GOOGLE_MAPS_API_KEY){ const script = document.createElement("script"); script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&loading=async&callback=initMap`; script.async = true; script.onerror = () => { status.textContent = "Não foi possível carregar o Google Maps. Verifique a chave e a conexão."; showToast("Não foi possível carregar o Google Maps"); }; window.initMap = initMap; window.gm_authFailure = () => { status.textContent = "Chave do Google Maps recusada. Verifique as restrições, faturamento e APIs habilitadas."; showToast("A chave do Google Maps não foi autorizada"); }; document.head.appendChild(script); } else { status.textContent = "Google Maps sem configuração. A busca demonstrativa continuará disponível."; }