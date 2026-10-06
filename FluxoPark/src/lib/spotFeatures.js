export const SPOT_FEATURES = ["Coberta", "Descoberta", "Especial"];

export function getSpotFeatures(spot) {
	const source = Array.isArray(spot.features)
		? spot.features
		: spot.type === "Acessível"
			? ["Comum", "Acessível"]
			: spot.type
				? [spot.type]
				: [];
	const features = new Set();
	if (source.includes("Coberta")) features.add("Coberta");
	else if (source.includes("Descoberta") || source.includes("Comum")) features.add("Descoberta");
	if (source.includes("Especial") || source.includes("Acessível")) features.add("Especial");
	return SPOT_FEATURES.filter(feature => features.has(feature));
}

export function toggleSpotFeature(features, feature, checked) {
	const current = new Set(features);
	if (!checked) current.delete(feature);
	else {
		current.add(feature);
		if (feature === "Coberta") current.delete("Descoberta");
		if (feature === "Descoberta") current.delete("Coberta");
	}
	return SPOT_FEATURES.filter(item => current.has(item));
}
