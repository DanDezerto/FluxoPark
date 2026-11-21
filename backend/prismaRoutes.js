const crypto = require("node:crypto");
const {completeElapsedReservations} = require("./reservationJobs");

const collectionModels = {
	users: "user",
	administrators: "administrator",
	parkingAccounts: "parkingAccount",
	parkings: "parking",
	spots: "spot",
	reservations: "reservation",
	reviews: "review",
	reports: "report",
	partnerRequests: "partnerRequest",
	paymentMethods: "paymentMethod"
};

function asyncRoute(handler) {
	return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

function idOf(value) {
	return String(value);
}

function safeDate(value, fallback = new Date()) {
	const date = value ? new Date(value) : fallback;
	return Number.isNaN(date.getTime()) ? fallback : date;
}

function enumValue(value, fallback) {
	const normalized = String(value || fallback).toUpperCase();
	return normalized === "ACTIVE" ? "CONFIRMED" : normalized;
}

function asJson(value) {
	return value && typeof value === "object" ? value : {};
}

function legacy(record) {
	return asJson(record.legacyData);
}

function publicAccount(account, role) {
	const profile = role === "users" ? account.driverProfile : account.adminProfile;
	const data = {...legacy(account), id:profile?.legacyId || account.id, name:account.name, email:account.email, phone:account.phone, passwordDigest:profile?.passwordDigest || account.passwordDigest, createdAt:account.createdAt?.toISOString?.() || account.createdAt};
	if (role === "users") {
		data.vehicles = account.vehicles.map(vehicle => ({
			id:vehicle.id,
			plate:vehicle.plate,
			model:vehicle.model,
			color:vehicle.color
		}));
	}
	if (role === "administrators") data.cpf = account.adminProfile?.cpf || account.cpf || data.cpf;
	return data;
}

function publicParking(record) {
	const data = legacy(record);
	const location = record.latitude == null || record.longitude == null
		? data.location
		: {lat:record.latitude, lng:record.longitude};
	return {
		...data,
		id:record.id,
		name:record.name,
		address:record.address,
		googlePlaceId:record.googlePlaceId,
		phone:record.phone,
		location,
		rating:record.rating ?? data.rating ?? 0,
		reviewCount:record.reviewCount ?? data.reviewCount,
		partner:record.partner,
		toleranceMinutes:record.toleranceMinutes,
		allowsOvernight:record.allowsOvernight,
		banned:record.banned,
		banUntil:record.banUntil?.toISOString?.() || record.banUntil,
		banReason:record.banReason
	};
}

function publicSpot(record) {
	return {...record, id:record.id, parkingId:record.parkingId, label:record.label, type:record.type, features:record.features};
}

function publicReservation(record) {
	const data = legacy(record);
	const paymentAdjustments = (record.transactions || [])
		.filter(transaction => transaction.type !== "CHARGE")
		.map(transaction => ({
			...asJson(transaction.legacyData),
			id:transaction.id,
			type:transaction.type === "REFUND" ? "simulated_refund" : "simulated_charge",
			status:"simulated",
			amount:Number(transaction.amount),
			paymentMethod:transaction.paymentMethod,
			createdAt:transaction.createdAt.toISOString()
		}));
	return {
		...data,
		id:record.id,
		code:record.code,
		driverId:data.driverId ?? record.driverAccountId,
		driverName:data.driverName || record.driver?.name,
		driverEmail:data.driverEmail || record.driver?.email,
		driverPhone:data.driverPhone || record.driver?.phone,
		vehicleId:record.vehicleId ?? data.vehicleId,
		spotId:record.spotId ?? data.spotId,
		parkingName:record.parkingNameSnapshot,
		parkingAddress:record.parkingAddressSnapshot ?? data.parkingAddress,
		spotLabel:record.spotLabelSnapshot,
		spotType:record.spotTypeSnapshot,
		spotFeatures:record.spotFeaturesSnapshot,
		vehiclePlate:record.vehiclePlateSnapshot ?? data.vehiclePlate,
		vehicleModel:record.vehicleModelSnapshot ?? data.vehicleModel,
		startAt:record.startAt.toISOString(),
		endAt:record.endAt.toISOString(),
		status:record.status.toLowerCase(),
		hourlyRate:Number(record.hourlyRateSnapshot),
		totalAmount:Number(record.currentTotalAmount),
		paymentAdjustments,
		createdAt:record.createdAt.toISOString(),
		updatedAt:record.updatedAt.toISOString(),
		cancelledAt:record.cancelledAt?.toISOString() || data.cancelledAt,
		completedAt:record.completedAt?.toISOString() || data.completedAt
	};
}

function publicReport(record, administratorLegacyId) {
	const data = legacy(record);
	return {
		...data,
		id:record.id,
		driverId:record.driverAccountId ?? data.driverId,
		parkingId:record.parkingId ?? data.parkingId,
		reservationId:record.reservationId ?? data.reservationId,
		category:record.category,
		details:record.details,
		status:record.status.toLowerCase(),
		adminResponse:record.adminResponse,
		administratorId:administratorLegacyId || record.administratorId || data.administratorId,
		answeredAt:record.answeredAt?.toISOString() || undefined,
		penalty:record.penalty,
		createdAt:record.createdAt.toISOString()
	};
}

function publicPartnerRequest(record, administratorLegacyId) {
	return {
		...legacy(record),
		id:record.id,
		companyName:record.companyName,
		cnpj:record.cnpj,
		email:record.email,
		phone:record.phone,
		passwordDigest:record.passwordDigest,
		status:record.status.toLowerCase(),
		rejectionReason:record.rejectionReason,
		reviewedAt:record.reviewedAt?.toISOString() || undefined,
		reviewedBy:administratorLegacyId || record.administratorId || legacy(record).reviewedBy
	};
}

function publicPaymentMethod(record) {
	return {...legacy(record), id:record.id, userId:record.accountId, holder:record.holder, expiry:record.expiry, type:record.type, brand:record.brand, last4:record.last4, isDefault:record.isDefault, createdAt:record.createdAt.toISOString()};
}

function applyFilters(items, query) {
	let result = items.filter(item => Object.entries(query).every(([key, value]) => {
		if (key.startsWith("_") || key === "q") return true;
		const actual = item[key];
		if (actual == null) return false;
		if (typeof actual === "boolean" || typeof actual === "number") return String(actual) === String(value);
		return String(actual).toLowerCase() === String(value).toLowerCase();
	}));
	if (typeof query.q === "string") {
		const term = query.q.toLowerCase();
		result = result.filter(item => Object.values(item).some(value => typeof value === "string" && value.toLowerCase().includes(term)));
	}
	if (typeof query._sort === "string") {
		const order = query._order === "desc" ? -1 : 1;
		result = [...result].sort((a, b) => String(a[query._sort] ?? "").localeCompare(String(b[query._sort] ?? ""), "pt-BR", {numeric:true}) * order);
	}
	const page = Number(query._page);
	const limit = Number(query._limit);
	if (Number.isInteger(page) && page > 0 && Number.isInteger(limit) && limit > 0) result = result.slice((page - 1) * limit, page * limit);
	return result;
}

function createPrismaRoutes(app, prisma) {
	async function serialize(collection, record) {
		switch (collection) {
			case "users":
				return publicAccount(record, collection);
			case "administrators":
				return publicAccount(record, collection);
			case "parkingAccounts": {
				const memberships = await prisma.companyMembership.findMany({
					where:{accountId:record.accountId},
					include:{company:{include:{parkings:{select:{id:true}}}}}
				});
				const membership = memberships.find(item => item.id === record.id) || memberships[0];
				const data = asJson(record.legacyData);
				return {
					...data,
					id:record.id,
					email:record.account.email,
					cnpj:membership?.company.cnpj,
					passwordDigest:data.passwordDigest || record.account.passwordDigest,
					parkingIds:membership?.company.parkings.map(item => item.id) || data.parkingIds || [],
					createdAt:record.createdAt.toISOString()
				};
			}
			case "parkings": return publicParking(record);
			case "spots": return publicSpot(record);
			case "reservations": return publicReservation(record);
			case "reviews":
				return {...record, id:record.id, reservationId:record.reservationId, createdAt:record.createdAt.toISOString(), updatedAt:record.updatedAt.toISOString(), removedAt:record.removedAt?.toISOString()};
			case "reports": {
				const admin = record.administratorId ? await prisma.adminProfile.findUnique({where:{accountId:record.administratorId}}) : null;
				return publicReport(record,admin?.legacyId);
			}
			case "partnerRequests": {
				const admin = record.administratorId ? await prisma.adminProfile.findUnique({where:{accountId:record.administratorId}}) : null;
				return publicPartnerRequest(record,admin?.legacyId);
			}
			case "paymentMethods": return publicPaymentMethod(record);
			default: throw Object.assign(new Error("Coleção não encontrada."), {statusCode:404});
		}
	}

	async function findOne(collection, id) {
		const key = idOf(id);
		switch (collection) {
			case "users":
				return prisma.account.findFirst({where:{active:true,OR:[{id:key},{driverProfile:{is:{legacyId:key}}}], driverProfile:{isNot:null}}, include:{vehicles:true,driverProfile:true}});
			case "administrators":
				return prisma.account.findFirst({where:{active:true,OR:[{id:key},{adminProfile:{is:{legacyId:key}}}], adminProfile:{isNot:null}}, include:{adminProfile:true}});
			case "parkingAccounts":
				return prisma.companyMembership.findFirst({where:{id:key,status:"ACTIVE"}, include:{account:true}});
			case "parkings": return prisma.parking.findFirst({where:{id:key,active:true}});
			case "spots": return prisma.parkingSpot.findFirst({where:{id:key,active:true}});
			case "reservations": 						return prisma.reservation.findUnique({where:{id:key},include:{transactions:true,driver:{select:{name:true,email:true,phone:true}}}});
			case "reviews": return prisma.review.findUnique({where:{id:key}});
			case "reports": return prisma.report.findUnique({where:{id:key}});
			case "partnerRequests": return prisma.partnerRequest.findUnique({where:{id:key}});
			case "paymentMethods": return prisma.paymentMethod.findUnique({where:{id:key}});
			default: throw Object.assign(new Error("Coleção não encontrada."), {statusCode:404});
		}
	}

	async function list(collection) {
		if (collection === "reservations") await completeElapsedReservations(prisma);
		let records;
		switch (collection) {
			case "users": records = await prisma.account.findMany({where:{active:true,driverProfile:{isNot:null}}, include:{vehicles:{where:{active:true}},driverProfile:true}}); break;
			case "administrators": records = await prisma.account.findMany({where:{active:true,adminProfile:{isNot:null}}, include:{adminProfile:true}}); break;
			case "parkingAccounts": records = await prisma.companyMembership.findMany({where:{role:"OWNER",status:"ACTIVE"}, include:{account:true}}); break;
			case "parkings": records = await prisma.parking.findMany({where:{active:true}}); break;
			case "spots": records = await prisma.parkingSpot.findMany({where:{active:true}}); break;
			case "reservations": records = await prisma.reservation.findMany({include:{transactions:true,driver:{select:{name:true,email:true,phone:true}}}}); break;
			case "reviews": records = await prisma.review.findMany({where:{removedAt:null}}); break;
			case "reports": records = await prisma.report.findMany(); break;
			case "partnerRequests": records = await prisma.partnerRequest.findMany(); break;
			case "paymentMethods": records = await prisma.paymentMethod.findMany(); break;
			default: throw Object.assign(new Error("Coleção não encontrada."), {statusCode:404});
		}
		const publicItems = await Promise.all(records.map(record => serialize(collection, record)));
		return publicItems;
	}

	function parkingFields(item, legacyData) {
		const location = asJson(item.location);
		return {
			id:idOf(item.id || `park-${crypto.randomUUID()}`),
			name:String(item.name || ""),
			address:String(item.address || ""),
			googlePlaceId:item.googlePlaceId || null,
			phone:item.phone || null,
			latitude:location.lat != null && Number.isFinite(Number(location.lat)) ? Number(location.lat) : null,
			longitude:location.lng != null && Number.isFinite(Number(location.lng)) ? Number(location.lng) : null,
			rating:item.rating == null ? null : Number(item.rating),
			reviewCount:item.reviewCount == null ? null : Number(item.reviewCount),
			partner:Boolean(item.partner),
			toleranceMinutes:Number(item.toleranceMinutes) || 0,
			allowsOvernight:Boolean(item.allowsOvernight),
			banned:Boolean(item.banned),
			banUntil:item.banUntil ? safeDate(item.banUntil) : null,
			banReason:item.banReason || null,
			legacyData
		};
	}

	async function parkingNestedData(item) {
		const openingHours = Object.entries(asJson(item.openingHours)).flatMap(([weekday, hours]) => {
			if (!hours || !hours.open || !hours.close) return [];
			return [{weekday:Number(weekday), opensAt:new Date(`1970-01-01T${hours.open}:00Z`), closesAt:new Date(`1970-01-01T${hours.close}:00Z`)}];
		});
		const limits = asJson(item.rateTierLimits);
		const first = Number(limits.first) || 1;
		const second = Number(limits.second) || 4;
		const tiers = [["upTo1Hour",0,first],["upTo4Hours",first,second],["over4Hours",second,null]];
		const rates = Object.entries(asJson(item.hourlyRates)).flatMap(([featureType, prices]) =>
			tiers.flatMap(([key,min,max]) => Number(prices?.[key]) > 0
				? [{featureType,minDurationMinutes:min*60,maxDurationMinutes:max == null ? null : max*60,hourlyRate:Number(prices[key])}]
				: [])
		);
		return {openingHours:{create:openingHours}, rates:{create:rates}};
	}

	async function save(collection, input, id, patch, preserveLegacy = false) {
		const item = {...input};
		const key = idOf(id || item.id || `${collection}-${crypto.randomUUID()}`);
		if (collection === "users" || collection === "administrators") {
			const profileWhere = collection === "users" ? {driverProfile:{is:{legacyId:key}}} : {adminProfile:{is:{legacyId:key}}};
			const existing = await prisma.account.findFirst({where:{OR:[{id:key},profileWhere]}, include:{vehicles:true,driverProfile:true,adminProfile:true}});
			if (patch && !existing) throw Object.assign(new Error("Registro não encontrado."), {statusCode:404});
			const accountByEmail = !existing && item.email
				? await prisma.account.findUnique({where:{email:String(item.email).trim().toLowerCase()},include:{vehicles:true,driverProfile:true,adminProfile:true}})
				: null;
			const target = existing || accountByEmail;
			const common = {
				name:item.name ?? target?.name ?? "",
				email:item.email ? String(item.email).trim().toLowerCase() : target?.email,
				phone:item.phone === undefined ? target?.phone : item.phone || null,
				passwordDigest:target?.passwordDigest || String(item.passwordDigest || ""),
				cpf:null
			};
			if (collection === "users") {
				const vehicles = Array.isArray(item.vehicles) ? item.vehicles : target?.vehicles.map(vehicle => ({...vehicle})) || [];
				const account = await prisma.$transaction(async tx => {
					const row = target
						? await tx.account.update({where:{id:target.id}, data:common})
						: await tx.account.create({data:{...common,id:key,createdAt:safeDate(item.createdAt)}});
					await tx.accountRole.upsert({where:{accountId_role:{accountId:row.id,role:"DRIVER"}},create:{accountId:row.id,role:"DRIVER"},update:{}});
					await tx.driverProfile.upsert({
						where:{accountId:row.id},
						create:{accountId:row.id,legacyId:key,passwordDigest:item.passwordDigest || null},
						update:{legacyId:key,passwordDigest:item.passwordDigest ?? target?.driverProfile?.passwordDigest}
					});
					for (const vehicle of vehicles) {
						const vehicleId = idOf(vehicle.id || `vehicle-${crypto.randomUUID()}`);
						const previousVehicle = await tx.vehicle.findUnique({where:{id:vehicleId}});
						if (previousVehicle && previousVehicle.accountId !== row.id) {
							throw Object.assign(new Error("O veículo não pertence à conta informada."), {statusCode:400});
						}
						await tx.vehicle.upsert({
							where:{id:vehicleId},
							create:{id:vehicleId,accountId:row.id,plate:String(vehicle.plate || "").toUpperCase(),model:String(vehicle.model || ""),color:vehicle.color || null},
							update:{plate:String(vehicle.plate || "").toUpperCase(),model:String(vehicle.model || ""),color:vehicle.color || null,active:true,archivedAt:null}
						});
					}
					if (Array.isArray(item.vehicles)) {
						const keep = vehicles.map(vehicle => idOf(vehicle.id));
						await tx.vehicle.updateMany({where:{accountId:row.id, id:{notIn:keep}}, data:{active:false,archivedAt:new Date()}});
					}
					return tx.account.findUnique({where:{id:row.id}, include:{vehicles:{where:{active:true}},driverProfile:true}});
				});
				return publicAccount(account, collection);
			}
			const account = await prisma.$transaction(async tx => {
				const row = target
					? await tx.account.update({where:{id:target.id}, data:common})
					: await tx.account.create({data:{...common,id:key,createdAt:safeDate(item.createdAt)}});
				await tx.accountRole.upsert({where:{accountId_role:{accountId:row.id,role:"ADMIN"}},create:{accountId:row.id,role:"ADMIN"},update:{}});
				await tx.adminProfile.upsert({
					where:{accountId:row.id},
					create:{accountId:row.id,legacyId:key,cpf:item.cpf || null,passwordDigest:item.passwordDigest || null},
					update:{legacyId:key,cpf:item.cpf ?? target?.adminProfile?.cpf,passwordDigest:item.passwordDigest ?? target?.adminProfile?.passwordDigest}
				});
				return tx.account.findUnique({where:{id:row.id},include:{adminProfile:true}});
			});
			return publicAccount(account, collection);
		}

		if (collection === "parkingAccounts") {
			const email = String(item.email || "").trim().toLowerCase();
			if (!email || !item.cnpj || !item.passwordDigest) throw Object.assign(new Error("Dados de parceiro incompletos."), {statusCode:400});
			if (!patch && await prisma.companyMembership.findFirst({where:{status:"ACTIVE",account:{email:{equals:email,mode:"insensitive"}}}})) {
				throw Object.assign(new Error("Já existe uma conta de parceiro com este e-mail."), {statusCode:409});
			}
			const result = await prisma.$transaction(async tx => {
				const account = await tx.account.upsert({
					where:{email},
					create:{id:idOf(item.accountId || `user-${crypto.randomUUID()}`),name:item.name || email,email,passwordDigest:item.passwordDigest,roles:{create:{role:"PARTNER"}}},
					update:{}
				});
				await tx.accountRole.upsert({
					where:{accountId_role:{accountId:account.id,role:"PARTNER"}},
					create:{accountId:account.id,role:"PARTNER"},
					update:{}
				});
				const company = await tx.company.upsert({
					where:{cnpj:String(item.cnpj)},
					create:{id:`company-${crypto.randomUUID()}`,name:item.name || email,cnpj:String(item.cnpj)},
					update:{}
				});
				const membershipId = key;
				await tx.companyMembership.upsert({
					where:{id:membershipId},
					create:{id:membershipId,accountId:account.id,companyId:company.id,role:"OWNER",legacyData:item},
					update:{companyId:company.id,legacyData:item,status:"ACTIVE"}
				});
				for (const parkingId of item.parkingIds || []) {
					await tx.parking.updateMany({where:{id:idOf(parkingId)},data:{companyId:company.id}});
				}
				return tx.companyMembership.findUnique({where:{id:membershipId},include:{account:true}});
			});
			return serialize(collection,result);
		}

		if (collection === "parkings") {
			const old = patch ? await prisma.parking.findUnique({where:{id:key}}) : null;
			if (patch && !old) throw Object.assign(new Error("Registro não encontrado."), {statusCode:404});
			const merged = {...legacy(old || {}), ...item};
			const fields = parkingFields(merged,merged);
			const nested = await parkingNestedData(merged);
			const associatedMembership = await prisma.companyMembership.findMany({include:{company:true}});
			const owner = associatedMembership.find(membership => (asJson(membership.legacyData).parkingIds || []).map(idOf).includes(key));
			if (owner) fields.companyId = owner.companyId;
			const record = await prisma.$transaction(async tx => {
				const result = old
					? await tx.parking.update({where:{id:key},data:{...fields,openingHours:{deleteMany:{},...nested.openingHours},rates:{deleteMany:{},...nested.rates}}})
					: await tx.parking.create({data:{...fields,...nested}});
				return result;
			});
			return publicParking(record);
		}

		if (collection === "spots") {
			const old = patch ? await prisma.parkingSpot.findUnique({where:{id:key}}) : null;
			if (patch && !old) throw Object.assign(new Error("Registro não encontrado."), {statusCode:404});
			const data = {
				id:key,
				parkingId:idOf(item.parkingId ?? old?.parkingId),
				label:String(item.label ?? old?.label ?? ""),
				type:String(item.type ?? old?.type ?? ""),
				features:Array.isArray(item.features) ? item.features : old?.features || []
			};
			const record = old ? await prisma.parkingSpot.update({where:{id:key},data}) : await prisma.parkingSpot.create({data});
			return publicSpot(record);
		}

		if (collection === "reservations") {
			await completeElapsedReservations(prisma);
			const old = patch ? await prisma.reservation.findUnique({where:{id:key}}) : null;
			if (patch && !old) throw Object.assign(new Error("Registro não encontrado."), {statusCode:404});
			const merged = {...legacy(old || {}),...item};
			const startAt = safeDate(merged.startAt,old?.startAt);
			const endAt = safeDate(merged.endAt,old?.endAt);
			if (!merged.code || !Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime())) throw Object.assign(new Error("Código e período da reserva são obrigatórios."), {statusCode:400});
			if (!old && !preserveLegacy && startAt <= new Date()) throw Object.assign(new Error("O início da reserva deve estar no futuro."), {statusCode:400});
			const [driver, vehicle, spot] = await Promise.all([
				merged.driverId ? prisma.account.findFirst({where:{OR:[{id:idOf(merged.driverId)},{driverProfile:{is:{legacyId:idOf(merged.driverId)}}}]}}) : Promise.resolve(null),
				merged.vehicleId ? prisma.vehicle.findUnique({where:{id:idOf(merged.vehicleId)}}) : Promise.resolve(null),
				merged.spotId ? prisma.parkingSpot.findUnique({where:{id:idOf(merged.spotId)}}) : Promise.resolve(null)
			]);
			if (!old && !preserveLegacy && (!driver || !vehicle || !spot)) {
				throw Object.assign(new Error("Uma nova reserva exige motorista, veículo e vaga válidos."), {statusCode:400});
			}
			if (merged.vehicleId && (!vehicle || !vehicle.active)) {
				throw Object.assign(new Error("O veículo selecionado não está ativo ou não existe."), {statusCode:400});
			}
			if (vehicle && driver && vehicle.accountId !== driver.id) {
				throw Object.assign(new Error("O veículo selecionado não pertence ao motorista da reserva."), {statusCode:400});
			}
			if (merged.spotId && (!spot || !spot.active)) {
				throw Object.assign(new Error("A vaga selecionada não está ativa ou não existe."), {statusCode:400});
			}
			if (spot && merged.parkingId && spot.parkingId !== idOf(merged.parkingId)) {
				throw Object.assign(new Error("A vaga não pertence ao estacionamento selecionado."), {statusCode:400});
			}
			if (spot) {
				const parking = await prisma.parking.findUnique({where:{id:spot.parkingId}});
				if (!parking?.active || (parking.banned && (!parking.banUntil || parking.banUntil > new Date()))) {
					throw Object.assign(new Error("O estacionamento está indisponível para novas reservas."), {statusCode:409});
				}
			}
			const amount = Number(merged.totalAmount ?? old?.currentTotalAmount ?? 0);
			const requestedStatus = enumValue(merged.status,old?.status || "CONFIRMED");
			const status = preserveLegacy && old?.status === "COMPLETED" && requestedStatus === "CONFIRMED"
				? "COMPLETED"
				: requestedStatus;
			if (!old && !preserveLegacy && status !== "CONFIRMED") {
				throw Object.assign(new Error("Uma nova reserva deve iniciar como confirmada."), {statusCode:400});
			}
			if (old && old.status !== "CONFIRMED" && status !== old.status) {
				throw Object.assign(new Error("Reservas canceladas ou concluídas não podem mudar de estado."), {statusCode:409});
			}
			if (old && old.status === "CONFIRMED" && status === "COMPLETED") {
				throw Object.assign(new Error("A conclusão da reserva é controlada automaticamente pelo servidor."), {statusCode:409});
			}
			if (old && old.status === "CONFIRMED") {
				const hasChanged = startAt.getTime() !== old.startAt.getTime() ||
					endAt.getTime() !== old.endAt.getTime() ||
					status !== old.status ||
					amount !== Number(old.currentTotalAmount);
				if (hasChanged && old.startAt.getTime() - Date.now() < 24 * 60 * 60 * 1000) {
					throw Object.assign(new Error("Só é possível alterar ou cancelar a reserva com pelo menos 24 horas de antecedência."), {statusCode:409});
				}
			}
			const data = {
				code:String(merged.code),
				driverAccountId:driver?.id || null,
				vehicleId:vehicle?.id || null,
				spotId:spot?.id || null,
				startAt,
				endAt,
				status,
				parkingNameSnapshot:String(merged.parkingName || old?.parkingNameSnapshot || "Estacionamento"),
				parkingAddressSnapshot:merged.parkingAddress || null,
				spotLabelSnapshot:String(merged.spotLabel || old?.spotLabelSnapshot || "—"),
				spotTypeSnapshot:String(merged.spotType || old?.spotTypeSnapshot || "—"),
				spotFeaturesSnapshot:Array.isArray(merged.spotFeatures) ? merged.spotFeatures : [],
				vehiclePlateSnapshot:merged.vehiclePlate || null,
				vehicleModelSnapshot:merged.vehicleModel || null,
				tariffFeatureSnapshot:String(merged.spotType || "—"),
				tariffBandSnapshot:merged.durationHours ? `${merged.durationHours} horas` : null,
				hourlyRateSnapshot:Number(merged.hourlyRate || 0),
				initialTotalAmount:Number(old?.initialTotalAmount ?? amount),
				currentTotalAmount:amount,
				createdAt:safeDate(merged.createdAt,old?.createdAt),
				cancelledAt:merged.cancelledAt ? safeDate(merged.cancelledAt) : null,
				completedAt:merged.completedAt ? safeDate(merged.completedAt) : null,
				legacyData:(() => {
					const snapshot = {...merged};
					if (!preserveLegacy) {
						const previous = legacy(old || {});
						for (const field of ["driverName","driverEmail","driverPhone"]) {
							if (!previous[field]) delete snapshot[field];
						}
					}
					return snapshot;
				})()
			};
			const record = await prisma.$transaction(async tx => {
				const saved = old
					? await tx.reservation.update({where:{id:key},data})
					: await tx.reservation.create({data:{...data,id:key}});
				const transactions = await tx.paymentTransaction.findMany({where:{reservationId:saved.id}});
				let initialCharge = transactions.find(transaction => transaction.type === "CHARGE");
				if (!initialCharge && amount > 0 && merged.paymentMethod) {
					initialCharge = await tx.paymentTransaction.create({
						data:{
							id:`initial-charge-${saved.id}`,
							reservationId:saved.id,
							type:"CHARGE",
							amount:Number(data.initialTotalAmount),
							currency:"BRL",
							paymentMethod:String(merged.paymentMethod),
							description:"Pagamento inicial da reserva"
						}
					});
				}
				for (const adjustment of Array.isArray(merged.paymentAdjustments) ? merged.paymentAdjustments : []) {
					const transactionId = idOf(adjustment.id || `adjustment-${crypto.randomUUID()}`);
					if (transactions.some(transaction => transaction.id === transactionId)) continue;
					const type = adjustment.type === "simulated_refund" ? "REFUND" : "ADDITIONAL_CHARGE";
					const adjustmentAmount = Number(adjustment.amount);
					if (!(adjustmentAmount > 0)) continue;
					await tx.paymentTransaction.create({
						data:{
							id:transactionId,
							reservationId:saved.id,
							type,
							amount:adjustmentAmount,
							currency:"BRL",
							paymentMethod:String(adjustment.paymentMethod || merged.paymentMethod || "Não informado"),
							description:adjustment.reason || adjustment.description || null,
							relatedTransactionId:type === "REFUND" ? initialCharge?.id || null : null,
							createdAt:safeDate(adjustment.createdAt),
							legacyData:adjustment
						}
					});
				}
				return tx.reservation.findUnique({where:{id:saved.id},include:{transactions:true,driver:{select:{name:true,email:true,phone:true}}}});
			});
			return publicReservation(record);
		}

		if (collection === "reports") {
			const old = patch ? await prisma.report.findUnique({where:{id:key}}) : null;
			if (patch && !old) throw Object.assign(new Error("Registro não encontrado."), {statusCode:404});
			const merged = {...legacy(old || {}),...item};
			const [driver, parking, reservation, admin] = await Promise.all([
				merged.driverId ? prisma.account.findFirst({where:{OR:[{id:idOf(merged.driverId)},{driverProfile:{is:{legacyId:idOf(merged.driverId)}}}]}}) : Promise.resolve(null),
				merged.parkingId ? prisma.parking.findUnique({where:{id:idOf(merged.parkingId)}}) : Promise.resolve(null),
				merged.reservationId ? prisma.reservation.findUnique({where:{id:idOf(merged.reservationId)}}) : Promise.resolve(null),
				merged.administratorId ? prisma.adminProfile.findFirst({where:{OR:[{accountId:idOf(merged.administratorId)},{legacyId:idOf(merged.administratorId)}]}}) : Promise.resolve(null)
			]);
			const data = {
				driverAccountId:driver?.id || null,
				parkingId:parking?.id || null,
				reservationId:reservation?.id || null,
				category:String(merged.category || "Outros"),
				details:String(merged.details || ""),
				status:enumValue(merged.status,old?.status || "PENDING"),
				driverNameSnapshot:merged.driverName || null,
				driverEmailSnapshot:merged.driverEmail || null,
				parkingNameSnapshot:merged.parkingName || null,
				adminResponse:merged.adminResponse || null,
				administratorId:admin?.accountId || null,
				answeredAt:merged.answeredAt ? safeDate(merged.answeredAt) : null,
				penalty:merged.penalty || null,
				createdAt:safeDate(merged.createdAt,old?.createdAt),
				legacyData:merged
			};
			const record = old ? await prisma.report.update({where:{id:key},data}) : await prisma.report.create({data:{...data,id:key}});
			return publicReport(record);
		}

		if (collection === "partnerRequests") {
			const old = patch ? await prisma.partnerRequest.findUnique({where:{id:key}}) : null;
			if (patch && !old) throw Object.assign(new Error("Registro não encontrado."), {statusCode:404});
			const merged = {...legacy(old || {}),...item};
			if (!old) {
				const parkingData = asJson(merged.parking);
				if (!merged.email || !merged.cnpj || !merged.passwordDigest || !parkingData.name || !parkingData.address) {
					throw Object.assign(new Error("E-mail, CNPJ, senha e dados da unidade são obrigatórios."), {statusCode:400});
				}
				const duplicatePendingRequest = await prisma.partnerRequest.findFirst({
					where:{status:"PENDING",OR:[{email:{equals:String(merged.email || "").trim().toLowerCase(),mode:"insensitive"}},{cnpj:String(merged.cnpj || "")}]}
				});
				if (duplicatePendingRequest) throw Object.assign(new Error("Já existe uma solicitação pendente com este e-mail ou CNPJ."), {statusCode:409});
			}
			const parking = asJson(merged.parking);
			const reviewedBy = merged.reviewedBy || merged.administratorId;
			const admin = reviewedBy ? await prisma.adminProfile.findFirst({where:{OR:[{accountId:idOf(reviewedBy)},{legacyId:idOf(reviewedBy)}]}}) : null;
			const resultingCompany = merged.status === "approved"
				? await prisma.company.findUnique({where:{cnpj:String(merged.cnpj)}})
				: null;
			const data = {
				companyName:merged.companyName || parking.name || null,
				cnpj:String(merged.cnpj || ""),
				email:String(merged.email || "").trim().toLowerCase(),
				phone:merged.phone || null,
				passwordDigest:String(merged.passwordDigest || ""),
				parkingName:String(parking.name || merged.parkingName || "Unidade proposta"),
				parkingAddress:String(parking.address || merged.parkingAddress || "Endereço não informado"),
				googlePlaceId:parking.googlePlaceId || null,
				parkingPhone:parking.phone || null,
				latitude:parking.location?.lat ?? null,
				longitude:parking.location?.lng ?? null,
				toleranceMinutes:Number(parking.toleranceMinutes) || 0,
				allowsOvernight:Boolean(parking.allowsOvernight),
				status:enumValue(merged.status,old?.status || "PENDING"),
				rejectionReason:merged.rejectionReason || null,
				administratorId:admin?.accountId || null,
				resultingCompanyId:resultingCompany?.id || old?.resultingCompanyId || null,
				reviewedAt:merged.reviewedAt ? safeDate(merged.reviewedAt) : null,
				createdAt:safeDate(merged.createdAt,old?.createdAt),
				legacyData:merged
			};
			const requestedSpots = (Array.isArray(merged.spots) ? merged.spots : []).map(spot => ({
				label:String(spot.label || ""),
				type:String(spot.type || "Comum"),
				features:Array.isArray(spot.features) ? spot.features : []
			}));
			const requestedHours = Object.entries(asJson(parking.openingHours)).flatMap(([weekday,hours]) =>
				hours?.open && hours?.close
					? [{weekday:Number(weekday),opensAt:new Date(`1970-01-01T${hours.open}:00Z`),closesAt:new Date(`1970-01-01T${hours.close}:00Z`)}]
					: []
			);
			const rateLimits = asJson(parking.rateTierLimits);
			const rateFirst = Number(rateLimits.first) || 1;
			const rateSecond = Number(rateLimits.second) || 4;
			const rateTiers = [["upTo1Hour",0,rateFirst],["upTo4Hours",rateFirst,rateSecond],["over4Hours",rateSecond,null]];
			const requestedRates = Object.entries(asJson(parking.hourlyRates)).flatMap(([featureType,prices]) =>
				rateTiers.flatMap(([tier,min,max]) => Number(prices?.[tier]) > 0
					? [{featureType,minDurationMinutes:min*60,maxDurationMinutes:max == null ? null : max*60,hourlyRate:Number(prices[tier])}]
					: [])
			);
			const nested = {
				requestedSpots:{deleteMany:{},create:requestedSpots},
				requestedHours:{deleteMany:{},create:requestedHours},
				requestedRates:{deleteMany:{},create:requestedRates}
			};
			const record = old
				? await prisma.partnerRequest.update({where:{id:key},data:{...data,...nested}})
				: await prisma.partnerRequest.create({data:{...data,id:key,requestedSpots:{create:requestedSpots},requestedHours:{create:requestedHours},requestedRates:{create:requestedRates}}});
			return publicPartnerRequest(record);
		}

		if (collection === "paymentMethods") {
			const old = patch ? await prisma.paymentMethod.findUnique({where:{id:key}}) : null;
			if (patch && !old) throw Object.assign(new Error("Registro não encontrado."), {statusCode:404});
			const ownerId = idOf(item.userId ?? old?.accountId);
			const data = {
				accountId:ownerId,
				holder:String(item.holder ?? old?.holder ?? ""),
				expiry:String(item.expiry ?? old?.expiry ?? ""),
				type:String(item.type ?? old?.type ?? "credit"),
				brand:item.brand ?? old?.brand ?? null,
				last4:item.last4 ?? old?.last4 ?? null,
				isDefault:item.isDefault ?? old?.isDefault ?? false,
				createdAt:safeDate(item.createdAt,old?.createdAt),
				legacyData:{...legacy(old || {}),...item}
			};
			const record = old ? await prisma.paymentMethod.update({where:{id:key},data}) : await prisma.paymentMethod.create({data:{...data,id:key}});
			return publicPaymentMethod(record);
		}

		if (collection === "reviews") {
			await completeElapsedReservations(prisma);
			const data = {reservationId:idOf(item.reservationId),rating:Number(item.rating),comment:item.comment || null,removedAt:item.removedAt ? safeDate(item.removedAt) : null};
			if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
				throw Object.assign(new Error("A nota da avaliação deve ser um número inteiro entre 1 e 5."), {statusCode:400});
			}
			const reservation = await prisma.reservation.findUnique({where:{id:data.reservationId}});
			if (!reservation) throw Object.assign(new Error("Reserva não encontrada."), {statusCode:404});
			if (reservation.status !== "COMPLETED") throw Object.assign(new Error("Só é possível avaliar uma reserva concluída."), {statusCode:409});
			const record = patch
				? await prisma.review.update({where:{id:key},data})
				: await prisma.review.create({data:{...data,id:key}});
			return record;
		}

		throw Object.assign(new Error("Coleção não encontrada."), {statusCode:404});
	}

	async function remove(collection, id) {
		const record = await findOne(collection,id);
		if (!record) throw Object.assign(new Error("Registro não encontrado."), {statusCode:404});
		switch (collection) {
			case "users":
			case "administrators":
				await prisma.account.update({where:{id:record.id},data:{active:false,archivedAt:new Date()}});
				return publicAccount(record,collection);
			case "parkingAccounts":
				await prisma.companyMembership.update({where:{id:idOf(id)},data:{status:"INACTIVE"}});
				return serialize(collection,record);
			case "parkings": await prisma.parking.update({where:{id:idOf(id)},data:{active:false,archivedAt:new Date()}}); return publicParking({...record,active:false});
			case "spots": await prisma.parkingSpot.update({where:{id:idOf(id)},data:{active:false,archivedAt:new Date()}}); return publicSpot({...record,active:false});
			case "reservations": throw Object.assign(new Error("Reservas são mantidas no histórico; cancele em vez de excluir."), {statusCode:409});
			case "reviews": {
				const updated = await prisma.review.update({where:{id:idOf(id)},data:{removedAt:new Date()}});
				return updated;
			}
			case "reports":
			case "partnerRequests": throw Object.assign(new Error("Este registro faz parte do histórico e não pode ser excluído."), {statusCode:409});
			case "paymentMethods": return prisma.paymentMethod.delete({where:{id:idOf(id)}}).then(publicPaymentMethod);
			default: throw Object.assign(new Error("Coleção não encontrada."), {statusCode:404});
		}
	}

	app.post("/admin/register", asyncRoute(async (request, response) => {
		const {account, registrationCode} = request.body || {};
		const suppliedCode = Buffer.from(typeof registrationCode === "string" ? registrationCode : "");
		const expectedCode = Buffer.from(process.env.ADMIN_REGISTRATION_CODE || "administrador123");
		const validCode = suppliedCode.length === expectedCode.length && crypto.timingSafeEqual(suppliedCode,expectedCode);
		if (!validCode) return response.status(403).json({error:"Código de administrador inválido."});
		if (!account || typeof account.id !== "string" || typeof account.name !== "string" || typeof account.email !== "string" || typeof account.cpf !== "string" || typeof account.passwordDigest !== "string") {
			return response.status(400).json({error:"Dados de administrador incompletos."});
		}
		const duplicate = await prisma.adminProfile.findFirst({where:{OR:[{cpf:account.cpf},{account:{email:{equals:account.email,mode:"insensitive"}}}]}});
		if (duplicate) return response.status(409).json({error:"Já existe um administrador com este e-mail ou CPF."});
		const created = await save("administrators",account,account.id,false);
		const {passwordDigest,...publicData} = created;
		return response.status(201).json(publicData);
	}));

	app.get("/:collection", asyncRoute(async (request, response) => {
		if (!collectionModels[request.params.collection]) return response.status(404).json({error:"Coleção não encontrada."});
		const items = await list(request.params.collection);
		response.json(applyFilters(items,request.query));
	}));

	app.get("/:collection/:id", asyncRoute(async (request, response) => {
		if (!collectionModels[request.params.collection]) return response.status(404).json({error:"Coleção não encontrada."});
		const record = await findOne(request.params.collection,request.params.id);
		if (!record) return response.status(404).json({error:"Registro não encontrado."});
		response.json(await serialize(request.params.collection,record));
	}));

	app.post("/:collection", asyncRoute(async (request, response) => {
		const collection = request.params.collection;
		if (!collectionModels[collection]) return response.status(404).json({error:"Coleção não encontrada."});
		const item = await save(collection,request.body || {},request.body?.id,false);
		response.status(201).json(item);
	}));

	app.put("/:collection/:id", asyncRoute(async (request, response) => {
		const collection = request.params.collection;
		if (!collectionModels[collection]) return response.status(404).json({error:"Coleção não encontrada."});
		const item = await save(collection,request.body || {},request.params.id,true);
		response.json(item);
	}));

	app.patch("/:collection/:id", asyncRoute(async (request, response) => {
		const collection = request.params.collection;
		if (!collectionModels[collection]) return response.status(404).json({error:"Coleção não encontrada."});
		const existing = await findOne(collection,request.params.id);
		if (!existing) return response.status(404).json({error:"Registro não encontrado."});
		const current = await serialize(collection,existing);
		const item = await save(collection,{...current,...request.body},request.params.id,true);
		response.json(item);
	}));

	app.delete("/:collection/:id", asyncRoute(async (request, response) => {
		const collection = request.params.collection;
		if (!collectionModels[collection]) return response.status(404).json({error:"Coleção não encontrada."});
		response.json(await remove(collection,request.params.id));
	}));
	return {save, findOne};
}

module.exports = createPrismaRoutes;
