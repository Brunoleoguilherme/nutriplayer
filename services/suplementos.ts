import type { Suplemento } from "@/types";
import { createCrudService } from "./base";

export const suplementosService = createCrudService<Suplemento>("suplementos");
