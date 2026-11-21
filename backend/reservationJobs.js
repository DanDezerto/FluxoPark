async function completeElapsedReservations(prisma, now = new Date()) {
	const result = await prisma.reservation.updateMany({
		where:{status:"CONFIRMED",endAt:{lte:now}},
		data:{status:"COMPLETED",completedAt:now}
	});
	return result.count;
}

module.exports = {completeElapsedReservations};
