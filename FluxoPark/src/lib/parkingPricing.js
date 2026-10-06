export const RATE_TIER_KEYS = ["upTo1Hour", "upTo4Hours", "over4Hours"];

export const RATE_TIER_LABELS = {
	upTo1Hour: "Até 1 hora",
	upTo4Hours: "Mais de 1 até 4 horas",
	over4Hours: "Mais de 4 horas (inclui períodos acima de 12 h)"
};

const LEGACY_FEATURE_KEYS = {
	Coberta: ["Coberta"],
	Descoberta: ["Descoberta", "Comum"],
	Especial: ["Especial", "Acessível"]
};

function numericRate(value) {
	if (value === "" || value === null || value === undefined) return null;
	const rate = Number(value);
	return Number.isFinite(rate) && rate > 0 ? rate : null;
}

export function normalizeHourlyRates(hourlyRates = {}) {
	return Object.fromEntries(Object.entries(LEGACY_FEATURE_KEYS).map(([feature, legacyKeys]) => {
		const value = legacyKeys.map(key => hourlyRates[key]).find(rate => rate !== undefined && rate !== null);
		const tiers = typeof value === "object" && value !== null
			? Object.fromEntries(RATE_TIER_KEYS.map(key => [key, numericRate(value[key])]))
			: Object.fromEntries(RATE_TIER_KEYS.map(key => [key, numericRate(value)]));
		return [feature, tiers];
	}));
}

export function getHourlyRate(hourlyRates, feature, durationHours) {
	const rates = normalizeHourlyRates(hourlyRates)[feature];
	const tier = durationHours <= 1 ? "upTo1Hour" : durationHours <= 4 ? "upTo4Hours" : "over4Hours";
	return rates?.[tier] ?? null;
}

export function getEffectiveHourlyRate(hourlyRates, features, durationHours) {
	const rates = features.map(feature => getHourlyRate(hourlyRates, feature, durationHours))
		.filter(rate => rate !== null);
	return rates.length ? Math.max(...rates) : 0;
}

export function getRateTierLabel(durationHours) {
	if (durationHours <= 1) return RATE_TIER_LABELS.upTo1Hour;
	if (durationHours <= 4) return RATE_TIER_LABELS.upTo4Hours;
	return RATE_TIER_LABELS.over4Hours;
}

export function calculateReservationPrice(hourlyRates, features, durationHours) {
	const hourlyRate = getEffectiveHourlyRate(hourlyRates, features, durationHours);
	return {
		hourlyRate,
		total: Math.round(hourlyRate * durationHours * 100) / 100
	};
}
