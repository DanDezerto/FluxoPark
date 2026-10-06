import { z } from "zod";

export const reservationSchema = z.object({
	reservationDate: z.string().min(1, "Selecione a data da reserva."),
	driverName: z.string().trim().min(2, "Informe seu nome completo.").max(100, "O nome pode ter até 100 caracteres."),
	driverEmail: z.string().trim().email("Informe um e-mail válido.").max(160, "O e-mail pode ter até 160 caracteres."),
	driverPhone: z.string().trim().min(8, "Informe um celular válido.").max(20, "O celular pode ter até 20 caracteres.")
});
