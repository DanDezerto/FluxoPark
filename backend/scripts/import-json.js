require("dotenv").config({path:require("node:path").join(__dirname, "..", ".env")});

const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const {PrismaClient} = require("@prisma/client");
const createPrismaRoutes = require("../prismaRoutes");

async function main() {
	if (!process.env.DATABASE_URL) throw new Error("Defina DATABASE_URL em backend/.env antes de importar os dados.");
	const sourceFile = process.env.DB_FILE
		? path.resolve(process.env.DB_FILE)
		: path.join(__dirname, "..", "db.json");
	const data = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
	const prisma = new PrismaClient();
	const {save, findOne} = createPrismaRoutes(express(), prisma);
	const order = ["users","administrators","parkingAccounts","parkings","spots","partnerRequests","reservations","reports","paymentMethods","reviews"];
	try {
		await prisma.$connect();
		for (const collection of order) {
			const records = data[collection] || [];
			for (const record of records) {
				const id = String(record.id ?? record.code);
				const existing = await findOne(collection,id);
				await save(collection,record,id,Boolean(existing),true);
				console.log(`${existing ? "Atualizado" : "Importado"} ${collection}/${id}`);
			}
		}
		console.log(`Importação concluída a partir de ${sourceFile}.`);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch(error => {
	console.error("Falha ao importar os dados JSON.", error);
	process.exitCode = 1;
});
