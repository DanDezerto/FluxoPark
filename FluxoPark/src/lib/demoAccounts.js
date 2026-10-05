const demoSessionKey = "fluxopark-demo-session";

async function passwordDigest(password) {
	const bytes = new TextEncoder().encode(password);
	const digest = await window.crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function createId(prefix) {
	return `${prefix}-${window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 12)}`;
}

async function request(path, options) {
	const response = await fetch(`/${path}`, options);
	if (!response.ok) throw new Error(`Falha na API local (${response.status}).`);
	return response.status === 204 ? null : response.json();
}

export async function registerDemoAccount(collection, details, password) {
	const accounts = await request(collection);
	if (accounts.some(account => account.email.toLowerCase() === details.email.toLowerCase())) {
		throw new Error("Já existe uma conta com este e-mail.");
	}
	const account = {
		...details,
		id: createId(collection === "users" ? "user" : "partner"),
		passwordDigest: await passwordDigest(password),
		createdAt: new Date().toISOString()
	};
	await request(collection, {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify(account)
	});
	return account;
}

export async function authenticateDemoAccount(collection, email, password) {
	const accounts = await request(collection);
	const digest = await passwordDigest(password);
	const account = accounts.find(item => item.email.toLowerCase() === email.trim().toLowerCase() && item.passwordDigest === digest);
	if (!account) throw new Error("E-mail ou senha incorretos.");
	const accountType = collection === "users" ? "driver" : "parking";
	window.localStorage.setItem(demoSessionKey, JSON.stringify({id: account.id, type: accountType}));
	return account;
}

export function readDemoSession(expectedType) {
	const value = window.localStorage.getItem(demoSessionKey);
	if (!value) return null;
	try {
		const session = JSON.parse(value);
		if (!session.id || !["driver", "parking"].includes(session.type) || (expectedType && session.type !== expectedType)) return null;
		return session;
	} catch (error) {
		console.error("A sessão demonstrativa salva está inválida.", error);
		return null;
	}
}

export function endDemoSession() {
	window.localStorage.removeItem(demoSessionKey);
}

export function startDemoSession(account, type) {
	window.localStorage.setItem(demoSessionKey, JSON.stringify({id: account.id, type}));
}

export {createId as createDemoId, request as demoRequest};
