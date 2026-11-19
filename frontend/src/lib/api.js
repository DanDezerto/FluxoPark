export const apiBaseUrl = window.location.origin === "null"
	? "http://localhost:3000"
	: window.location.origin;

export async function readCollection(path) {
	const response = await fetch(`${apiBaseUrl}/${path}`);
	if (!response.ok) throw new Error(`Falha ao consultar ${path} (${response.status}).`);
	return response.json();
}

export async function createReservation(reservation) {
	const response = await fetch(`${apiBaseUrl}/reservations`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(reservation)
	});
	if (!response.ok) throw new Error(`A API recusou o registro da reserva (${response.status}).`);
	return response.json();
}
