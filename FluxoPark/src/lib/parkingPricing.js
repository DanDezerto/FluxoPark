export const RATE_TIER_KEYS = ["upTo1Hour", "upTo4Hours", "over4Hours"];
export const DEFAULT_RATE_TIER_LIMITS = {first:1, second:4};

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

export function normalizeRateTierLimits(limits = {}) {
	const first = Number(limits.first);
	const second = Number(limits.second);
	if (!Number.isInteger(first) || !Number.isInteger(second) || first < 1 || first >= second || second > 24) {
		return DEFAULT_RATE_TIER_LIMITS;
	}
	return {first, second};
}

export function getRateTierLabels(limits) {
	const {first, second} = normalizeRateTierLimits(limits);
	return {
		upTo1Hour: `Até ${first} ${first === 1 ? "hora" : "horas"}`,
		upTo4Hours: `Mais de ${first} até ${second} horas`,
		over4Hours: `Mais de ${second} horas`
	};
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

export function getHourlyRate(hourlyRates, feature, durationHours, rateTierLimits) {
	const rates = normalizeHourlyRates(hourlyRates)[feature];
	const {first, second} = normalizeRateTierLimits(rateTierLimits);
	const tier = durationHours <= first ? "upTo1Hour" : durationHours <= second ? "upTo4Hours" : "over4Hours";
	return rates?.[tier] ?? null;
}

export function getEffectiveHourlyRate(hourlyRates, features, durationHours, rateTierLimits) {
	const rates = features.map(feature => getHourlyRate(hourlyRates, feature, durationHours, rateTierLimits))
		.filter(rate => rate !== null);
	return rates.length ? Math.max(...rates) : 0;
}

export function getRateTierLabel(durationHours, rateTierLimits) {
	const {first, second} = normalizeRateTierLimits(rateTierLimits);
	const labels = getRateTierLabels({first, second});
	if (durationHours <= first) return labels.upTo1Hour;
	if (durationHours <= second) return labels.upTo4Hours;
	return labels.over4Hours;
}

export function calculateReservationPrice(hourlyRates, features, durationHours, rateTierLimits) {
	const hourlyRate = getEffectiveHourlyRate(hourlyRates, features, durationHours, rateTierLimits);
	return {
		hourlyRate,
		total: Math.round(hourlyRate * durationHours * 100) / 100
	};
}
