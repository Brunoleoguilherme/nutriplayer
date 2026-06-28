import type { Protocolo } from "@/types";
import { createCrudService } from "./base";

export const protocolosService = createCrudService<Protocolo>("protocolos");
