export function createReservationInterval(date, startTime, endTime, allowsOvernight, selectedEndDate = "") {
	if (!date || !startTime || !endTime) return null;
	const start = new Date(`${date}T${startTime}:00`);
	const endDate = selectedEndDate || date;
	if (endDate < date || (endDate !== date && !allowsOvernight)) return null;
	const end = new Date(`${endDate}T${endTime}:00`);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
	if (!selectedEndDate && end <= start) {
		if (!allowsOvernight) return null;
		end.setDate(end.getDate() + 1);
	}
	if (selectedEndDate && end <= start) return null;
	const durationHours = (end.getTime() - start.getTime()) / 3600000;
	if (durationHours <= 0 || durationHours > 24) return null;
	return {startAt:start.toISOString(), endAt:end.toISOString(), durationHours};
}

export function isWithinParkingHours(parking, interval) {
	if (!interval) return false;
	const start = new Date(interval.startAt);
	const end = new Date(interval.endAt);
	const openingHours = parking.openingHours;
	if (start.toDateString() !== end.toDateString() && !parking.allowsOvernight) return false;
	if (!openingHours) {
		const startMinutes = start.getHours() * 60 + start.getMinutes();
		const endMinutes = end.getHours() * 60 + end.getMinutes();
		return startMinutes >= 360 && startMinutes < 1380 && endMinutes >= 360 && endMinutes <= 1380 &&
			(start.toDateString() === end.toDateString() || parking.allowsOvernight);
	}
	const toMinutes = value => {
		const [hours, minutes] = value.split(":").map(Number);
		return hours * 60 + minutes;
	};
	function isDuringOpeningHours(date) {
		const time = date.getHours() * 60 + date.getMinutes();
		const current = openingHours[date.getDay()];
		const previous = openingHours[(date.getDay() + 6) % 7];
		if (current && time >= toMinutes(current.open) && time < toMinutes(current.close)) return true;
		if (current && toMinutes(current.close) <= toMinutes(current.open) && time >= toMinutes(current.open)) return true;
		return Boolean(previous && toMinutes(previous.close) <= toMinutes(previous.open) && time < toMinutes(previous.close));
	}
	function isAtClosingTime(date) {
		const time = date.getHours() * 60 + date.getMinutes();
		const current = openingHours[date.getDay()];
		const previous = openingHours[(date.getDay() + 6) % 7];
		return Boolean(
			current && time === toMinutes(current.close) ||
			previous && toMinutes(previous.close) <= toMinutes(previous.open) && time === toMinutes(previous.close)
		);
	}
	return isDuringOpeningHours(start) && (isDuringOpeningHours(end) || isAtClosingTime(end));
}
