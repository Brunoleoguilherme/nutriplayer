import type { Atleta } from "@/types";
import { createCrudService } from "./base";

/** Serviço de Atletas. Estende o CRUD base com consultas específicas. */
export const atletasService = {
  ...createCrudService<Atleta>("atletas"),
};
