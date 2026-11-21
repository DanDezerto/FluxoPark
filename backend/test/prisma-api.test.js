const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const supertest = require("supertest");
const {completeElapsedReservations} = require("../reservationJobs");

const databaseUrl = process.env.PRISMA_TEST_DATABASE_URL;

test("API Prisma mantém o contrato e aplica regras de persistência", {skip:!databaseUrl}, async t => {
	process.env.DATABASE_URL = databaseUrl;
	const app = require("../server");
	const request = supertest(app);
	const db = app.locals.prisma;
	const prefix = `api-test-${crypto.randomUUID()}`;
	const ids = {
		account:`${prefix}-user`,
		vehicle:`${prefix}-vehicle`,
		readdedVehicle:`${prefix}-vehicle-readded`,
		parking:`${prefix}-parking`,
		spot:`${prefix}-spot`,
		reservation:`${prefix}-reservation`,
		completedReservation:`${prefix}-completed-reservation`,
		review:`${prefix}-review`,
		report:`${prefix}-report`,
		partnerRequest:`${prefix}-partner-request`,
		paymentMethod:`${prefix}-payment-method`
	};

	t.after(async () => {
		await db.paymentMethod.deleteMany({where:{id:ids.paymentMethod}});
		await db.report.deleteMany({where:{id:ids.report}});
		await db.partnerRequest.deleteMany({where:{id:ids.partnerRequest}});
		await db.review.deleteMany({where:{id:ids.review}});
		await db.paymentTransaction.deleteMany({where:{reservationId:{in:[ids.reservation,ids.completedReservation]}}});
		await db.reservation.deleteMany({where:{id:{in:[ids.reservation,ids.completedReservation]}}});
		await db.parkingSpot.deleteMany({where:{id:ids.spot}});
		await db.parking.deleteMany({where:{id:ids.parking}});
		await db.vehicle.deleteMany({where:{accountId:ids.account}});
		await db.driverProfile.deleteMany({where:{accountId:ids.account}});
		await db.accountRole.deleteMany({where:{accountId:ids.account}});
		await db.account.deleteMany({where:{id:ids.account}});
		await db.$disconnect();
	});

	const createdUser = await request.post("/users").send({
		id:ids.account,
		name:"API Prisma",
		email:`${prefix}@example.test`,
		passwordDigest:"test-digest",
		vehicles:[{id:ids.vehicle,plate:"TEST123",model:"Veículo de teste",color:"Azul"}]
	});
	assert.equal(createdUser.status,201,JSON.stringify(createdUser.body));
	assert.equal(createdUser.body.vehicles[0].id,ids.vehicle);

	const createdParking = await request.post("/parkings").send({
		id:ids.parking,
		name:"Estacionamento de teste",
		address:"Rua de teste",
		hourlyRates:{Coberta:{upTo1Hour:5,upTo4Hours:4,over4Hours:3}},
		rateTierLimits:{first:1,second:4},
		openingHours:{0:{open:"08:00",close:"22:00"}}
	});
	assert.equal(createdParking.status,201,JSON.stringify(createdParking.body));

	const createdSpot = await request.post("/spots").send({
		id:ids.spot,
		parkingId:ids.parking,
		label:"T01",
		type:"Coberta",
		features:["Coberta"]
	});
	assert.equal(createdSpot.status,201,JSON.stringify(createdSpot.body));

	const startAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
	startAt.setMinutes(0,0,0);
	const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
	const reservationPayload = {
		id:ids.reservation,
		code:prefix.toUpperCase(),
		driverId:ids.account,
		vehicleId:ids.vehicle,
		parkingId:ids.parking,
		parkingName:"Estacionamento de teste",
		spotId:ids.spot,
		spotLabel:"T01",
		spotType:"Coberta",
		spotFeatures:["Coberta"],
		vehiclePlate:"TEST123",
		vehicleModel:"Veículo de teste",
		startAt:startAt.toISOString(),
		endAt:endAt.toISOString(),
		durationHours:1,
		paymentMethod:"Pix",
		hourlyRate:5,
		totalAmount:5,
		status:"confirmed"
	};
	const createdReservation = await request.post("/reservations").send(reservationPayload);
	assert.equal(createdReservation.status,201,JSON.stringify(createdReservation.body));
	assert.equal(createdReservation.body.driverId,ids.account);
	assert.equal(createdReservation.body.driverEmail,`${prefix}@example.test`);
	const storedReservation = await db.reservation.findUnique({where:{id:ids.reservation},select:{legacyData:true}});
	assert.equal(storedReservation.legacyData.driverEmail,undefined);

	const conflictingReservation = await request.post("/reservations").send({...reservationPayload,id:`${ids.reservation}-conflict`,code:`${prefix.toUpperCase()}-CONFLICT`});
	assert.equal(conflictingReservation.status,409);

	const refund = {id:`${prefix}-refund`,type:"simulated_refund",amount:5,paymentMethod:"Pix",createdAt:new Date().toISOString()};
	const cancelledReservation = await request.patch(`/reservations/${ids.reservation}`).send({
		status:"cancelled",
		cancelledAt:new Date().toISOString(),
		paymentAdjustments:[refund]
	});
	assert.equal(cancelledReservation.status,200,JSON.stringify(cancelledReservation.body));
	assert.equal(cancelledReservation.body.paymentAdjustments.length,1);
	assert.equal(await db.paymentTransaction.count({where:{reservationId:ids.reservation}}),2);

	const completedStart = new Date(endAt.getTime() + 60 * 60 * 1000);
	const completedEnd = new Date(completedStart.getTime() + 60 * 60 * 1000);
	const completed = await request.post("/reservations").send({
		...reservationPayload,
		id:ids.completedReservation,
		code:`${prefix.toUpperCase()}-COMPLETED`,
		startAt:completedStart.toISOString(),
		endAt:completedEnd.toISOString()
	});
	assert.equal(completed.status,201,JSON.stringify(completed.body));
	await completeElapsedReservations(db,new Date(completedEnd.getTime() + 1000));
	const review = await request.post("/reviews").send({id:ids.review,reservationId:ids.completedReservation,rating:5,comment:"Ótimo"});
	assert.equal(review.status,201,JSON.stringify(review.body));

	const paymentMethod = await request.post("/paymentMethods").send({
		id:ids.paymentMethod,
		userId:ids.account,
		holder:"TESTE",
		expiry:"12/50",
		type:"credit",
		brand:"Visa",
		last4:"4242"
	});
	assert.equal(paymentMethod.status,201,JSON.stringify(paymentMethod.body));

	const report = await request.post("/reports").send({
		id:ids.report,
		driverId:ids.account,
		parkingId:ids.parking,
		category:"Outros",
		details:"Teste da API Prisma",
		status:"pending"
	});
	assert.equal(report.status,201,JSON.stringify(report.body));

	const partnerRequest = await request.post("/partnerRequests").send({
		id:ids.partnerRequest,
		email:`${prefix}@partner.test`,
		cnpj:crypto.randomUUID().replace(/\D/g,"").padEnd(14,"1").slice(0,14),
		passwordDigest:"test-digest",
		parking:{name:"Unidade de teste",address:"Rua de teste",hourlyRates:{Coberta:{upTo1Hour:5}},openingHours:{0:{open:"08:00",close:"22:00"}}},
		spots:[{label:"P01",type:"Coberta",features:["Coberta"]}],
		status:"pending"
	});
	assert.equal(partnerRequest.status,201,JSON.stringify(partnerRequest.body));
	assert.equal(await db.requestedSpot.count({where:{partnerRequestId:ids.partnerRequest}}),1);

	const account = await request.get(`/users/${ids.account}`);
	const archivedVehicles = await request.patch(`/users/${ids.account}`).send({...account.body,vehicles:[]});
	assert.equal(archivedVehicles.status,200,JSON.stringify(archivedVehicles.body));
	const readdedVehicle = await request.patch(`/users/${ids.account}`).send({
		...archivedVehicles.body,
		vehicles:[{id:ids.readdedVehicle,plate:"TEST123",model:"Veículo re-adicionado",color:"Azul"}]
	});
	assert.equal(readdedVehicle.status,200,JSON.stringify(readdedVehicle.body));
	assert.equal(readdedVehicle.body.vehicles[0].id,ids.readdedVehicle);
});
