const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const supertest = require("supertest");

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "fluxopark-api-"));
const databaseFile = path.join(tempDirectory, "db.json");
fs.writeFileSync(databaseFile, JSON.stringify({
	parkings: [{id: "park-test", name: "Estacionamento Teste", partner: true}],
	spots: [{id: "spot-test", parkingId: "park-test", code: "C01"}],
	reservations: [],
	administrators: []
}), "utf8");

process.env.DB_FILE = databaseFile;
const app = require("../server");
const request = supertest(app);

test("lista uma coleção existente", async () => {
	const response = await request.get("/parkings");
	assert.equal(response.status, 200);
	assert.equal(response.body.length, 1);
	assert.equal(response.body[0].name, "Estacionamento Teste");
});

test("filtra e busca registros", async () => {
	const filtered = await request.get("/parkings?partner=true");
	assert.equal(filtered.status, 200);
	assert.equal(filtered.body.length, 1);

	const searched = await request.get("/parkings?q=teste");
	assert.equal(searched.status, 200);
	assert.equal(searched.body.length, 1);
});

test("retorna 404 para registro inexistente", async () => {
	const response = await request.get("/parkings/park-inexistente");
	assert.equal(response.status, 404);
	assert.equal(response.body.error, "Registro não encontrado.");
});

test("cria, altera, consulta e remove uma reserva", async () => {
	const created = await request.post("/reservations").send({
		parkingId: "park-test",
		spotId: "spot-test",
		status: "active"
	});
	assert.equal(created.status, 201);
	assert.ok(created.body.id);

	const patched = await request.patch(`/reservations/${created.body.id}`).send({status: "cancelled"});
	assert.equal(patched.status, 200);
	assert.equal(patched.body.status, "cancelled");

	const listed = await request.get("/reservations");
	assert.equal(listed.status, 200);
	assert.equal(listed.body.length, 1);

	const removed = await request.delete(`/reservations/${created.body.id}`);
	assert.equal(removed.status, 200);

	const missing = await request.get(`/reservations/${created.body.id}`);
	assert.equal(missing.status, 404);
});

test("valida duplicidade e código no cadastro administrativo", async () => {
	const invalidCode = await request.post("/admin/register").send({
		account: {
			id: "admin-test",
			name: "Administrador",
			email: "admin@teste.test",
			cpf: "00000000000",
			passwordDigest: "digest"
		},
		registrationCode: "codigo-incorreto"
	});
	assert.equal(invalidCode.status, 403);

	const created = await request.post("/admin/register").send({
		account: {
			id: "admin-test",
			name: "Administrador",
			email: "admin@teste.test",
			cpf: "00000000000",
			passwordDigest: "digest"
		},
		registrationCode: "administrador123"
	});
	assert.equal(created.status, 201);
	assert.equal(created.body.passwordDigest, undefined);

	const duplicate = await request.post("/admin/register").send({
		account: {
			id: "admin-2",
			name: "Administrador 2",
			email: "admin@teste.test",
			cpf: "11111111111",
			passwordDigest: "digest"
		},
		registrationCode: "administrador123"
	});
	assert.equal(duplicate.status, 409);
});

test("rejeita coleções inexistentes", async () => {
	const response = await request.get("/colecao-inexistente");
	assert.equal(response.status, 404);
});
