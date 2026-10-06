const crypto = require("node:crypto");
const jsonServer = require("json-server");

const server = jsonServer.create();
const router = jsonServer.router("db.json");
const port = Number(process.env.PORT) || 3000;
const administratorRegistrationCode = process.env.ADMIN_REGISTRATION_CODE || "administrador123";

server.use(jsonServer.defaults(process.argv.includes("--static") ? {static: "dist"} : {}));
server.use(jsonServer.bodyParser);

server.post("/admin/register", (request, response) => {
	const {account, registrationCode} = request.body || {};
	const suppliedCode = Buffer.from(typeof registrationCode === "string" ? registrationCode : "");
	const expectedCode = Buffer.from(administratorRegistrationCode);
	const validCode = suppliedCode.length === expectedCode.length && crypto.timingSafeEqual(suppliedCode, expectedCode);
	if (!validCode) {
		return response.status(403).json({error: "Código de administrador inválido."});
	}
	if (!account || typeof account.id !== "string" || typeof account.name !== "string" ||
		typeof account.email !== "string" || typeof account.cpf !== "string" ||
		typeof account.passwordDigest !== "string") {
		return response.status(400).json({error: "Dados de administrador incompletos."});
	}
	const administrators = router.db.get("administrators");
	if (administrators.value().some(item => item.email.toLowerCase() === account.email.toLowerCase() || item.cpf === account.cpf)) {
		return response.status(409).json({error: "Já existe um administrador com este e-mail ou CPF."});
	}
	administrators.push(account).write();
	return response.status(201).json({...account, passwordDigest: undefined});
});

server.use(router);
server.listen(port, () => {
	console.log(`FluxoPark API disponível em http://localhost:${port}`);
});
