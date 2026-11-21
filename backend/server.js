const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
require("dotenv").config({path:path.join(__dirname, ".env")});

const app = express();
const port = Number(process.env.PORT) || 3000;
const databaseFile = process.env.DB_FILE
	? path.resolve(process.env.DB_FILE)
	: path.join(__dirname, "db.json");
const administratorRegistrationCode = process.env.ADMIN_REGISTRATION_CODE || "administrador123";
let reservationCompletionTimer;

app.use(express.json());

if (process.argv.includes("--static")) {
	app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));
}

let prisma;
if (!process.env.DB_FILE) {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL não foi definida. Copie backend/.env.example para backend/.env ou defina a variável de ambiente.");
	}
	const {PrismaClient} = require("@prisma/client");
	prisma = new PrismaClient();
	app.locals.prisma = prisma;
	require("./prismaRoutes")(app, prisma);
} else {
function readDatabase() {
	return JSON.parse(fs.readFileSync(databaseFile, "utf8"));
}

function writeDatabase(database) {
	fs.writeFileSync(databaseFile, `${JSON.stringify(database, null, 2)}\n`, "utf8");
}

function generateId(collection) {
	return `${collection}-${crypto.randomUUID()}`;
}

function matchesFilter(item, query) {
	return Object.entries(query).every(([key, value]) => {
		if (key.startsWith("_") || key === "q") return true;
		if (typeof item[key] === "boolean") return String(item[key]) === String(value);
		if (typeof item[key] === "number") return String(item[key]) === String(value);
		return item[key] != null && String(item[key]).toLowerCase() === String(value).toLowerCase();
	});
}

app.post("/admin/register", (request, response) => {
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
	const database = readDatabase();
	if (!Array.isArray(database.administrators)) database.administrators = [];
	if (database.administrators.some(item => item.email.toLowerCase() === account.email.toLowerCase() || item.cpf === account.cpf)) {
		return response.status(409).json({error: "Já existe um administrador com este e-mail ou CPF."});
	}
	database.administrators.push(account);
	writeDatabase(database);
	return response.status(201).json({...account, passwordDigest: undefined});
});

app.get("/:collection", (request, response) => {
	const database = readDatabase();
	const items = database[request.params.collection];
	if (!Array.isArray(items)) return response.status(404).json({error: "Coleção não encontrada."});

	let result = items.filter(item => matchesFilter(item, request.query));
	if (typeof request.query.q === "string") {
		const term = request.query.q.toLowerCase();
		result = result.filter(item => Object.values(item).some(value =>
			typeof value === "string" && value.toLowerCase().includes(term)
		));
	}
	if (typeof request.query._sort === "string") {
		const order = request.query._order === "desc" ? -1 : 1;
		result = [...result].sort((left, right) => {
			const leftValue = left[request.query._sort];
			const rightValue = right[request.query._sort];
			return String(leftValue ?? "").localeCompare(String(rightValue ?? ""), "pt-BR", {numeric: true}) * order;
		});
	}
	const page = Number(request.query._page);
	const limit = Number(request.query._limit);
	if (Number.isInteger(page) && page > 0 && Number.isInteger(limit) && limit > 0) {
		result = result.slice((page - 1) * limit, page * limit);
	}
	response.json(result);
});

app.get("/:collection/:id", (request, response) => {
	const database = readDatabase();
	const items = database[request.params.collection];
	if (!Array.isArray(items)) return response.status(404).json({error: "Coleção não encontrada."});
	const item = items.find(entry => String(entry.id) === request.params.id);
	if (!item) return response.status(404).json({error: "Registro não encontrado."});
	response.json(item);
});

app.post("/:collection", (request, response) => {
	const database = readDatabase();
	const collection = request.params.collection;
	if (!Array.isArray(database[collection])) database[collection] = [];
	const item = {...request.body, id: request.body.id || generateId(collection)};
	database[collection].push(item);
	writeDatabase(database);
	response.status(201).json(item);
});

app.put("/:collection/:id", (request, response) => {
	const database = readDatabase();
	const items = database[request.params.collection];
	if (!Array.isArray(items)) return response.status(404).json({error: "Coleção não encontrada."});
	const index = items.findIndex(entry => String(entry.id) === request.params.id);
	if (index === -1) return response.status(404).json({error: "Registro não encontrado."});
	const item = {...request.body, id: request.params.id};
	items[index] = item;
	writeDatabase(database);
	response.json(item);
});

app.patch("/:collection/:id", (request, response) => {
	const database = readDatabase();
	const items = database[request.params.collection];
	if (!Array.isArray(items)) return response.status(404).json({error: "Coleção não encontrada."});
	const index = items.findIndex(entry => String(entry.id) === request.params.id);
	if (index === -1) return response.status(404).json({error: "Registro não encontrado."});
	const item = {...items[index], ...request.body, id: request.params.id};
	items[index] = item;
	writeDatabase(database);
	response.json(item);
});

app.delete("/:collection/:id", (request, response) => {
	const database = readDatabase();
	const items = database[request.params.collection];
	if (!Array.isArray(items)) return response.status(404).json({error: "Coleção não encontrada."});
	const index = items.findIndex(entry => String(entry.id) === request.params.id);
	if (index === -1) return response.status(404).json({error: "Registro não encontrado."});
	const [removed] = items.splice(index, 1);
	writeDatabase(database);
	response.json(removed);
});
}

app.use((request, response) => {
	response.status(404).json({error: "Rota não encontrada."});
});

app.use((error, request, response, next) => {
	if (error instanceof SyntaxError) {
		return response.status(400).json({error: "JSON inválido na requisição."});
	}
	if (Number.isInteger(error.statusCode)) {
		return response.status(error.statusCode).json({error:error.message});
	}
	if (error.code === "P2002") {
		return response.status(409).json({error:"Já existe um registro com esses dados únicos."});
	}
	if (error.code === "P2004" && String(error.message).includes("reviews_rating_range_check")) {
		return response.status(400).json({error:"A nota da avaliação deve ser um número inteiro entre 1 e 5."});
	}
	if (error.code === "P2025") {
		return response.status(404).json({error:"Registro não encontrado."});
	}
	if (String(error.message).includes("reservations_no_confirmed_overlap")) {
		return response.status(409).json({error:"A vaga já tem uma reserva confirmada neste intervalo."});
	}
	if (String(error.message).includes("reservations_valid_interval_check") ||
		String(error.message).includes("reviews_rating_range_check")) {
		return response.status(400).json({error:"Os dados enviados não atendem às regras de intervalo ou avaliação."});
	}
	if (error.code === "P2003" || error.code === "P2004" || error.code === "P2014" || error.code === "23P01") {
		return response.status(409).json({error:"A operação viola uma regra de integridade do banco de dados."});
	}
	console.error(error);
	response.status(500).json({error: "Erro interno do servidor."});
});

if (require.main === module) {
	const start = () => app.listen(port, () => {
		console.log(`FluxoPark API disponível em http://localhost:${port}`);
	});
	if (prisma) {
		prisma.$connect().then(() => {
			const {completeElapsedReservations} = require("./reservationJobs");
			completeElapsedReservations(prisma).then(completed => {
				if (completed) console.log(`${completed} reserva(s) concluída(s) automaticamente.`);
			}).catch(error => console.error("Falha na conclusão automática inicial das reservas.", error));
			reservationCompletionTimer = setInterval(() => {
				completeElapsedReservations(prisma).catch(error => console.error("Falha ao concluir reservas expiradas.", error));
			}, 60_000);
			reservationCompletionTimer.unref();
			start();
		}).catch(error => {
			console.error("Não foi possível conectar a API ao PostgreSQL.", error);
			process.exitCode = 1;
		});
	} else {
		start();
	}
}

module.exports = app;
