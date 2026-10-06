export function digitsOnly(value) {
	return value.replace(/\D/g, "");
}

export function formatCardNumber(value) {
	return digitsOnly(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatCardExpiry(value) {
	const digits = digitsOnly(value).slice(0, 4);
	return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function identifyCardBrand(number) {
	const digits = digitsOnly(number);
	if (/^(4011|4312|4389)/.test(digits)) return "Elo";
	if (/^4/.test(digits)) return "Visa";
	if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
	if (/^3[47]/.test(digits)) return "American Express";
	return "Cartão";
}

export function cardExpiryIsValid(value) {
	const match = /^(\d{2})\/(\d{2})$/.exec(value);
	if (!match) return false;
	const month = Number(match[1]);
	const year = 2000 + Number(match[2]);
	if (month < 1 || month > 12) return false;
	const now = new Date();
	return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}
