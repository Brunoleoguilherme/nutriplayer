import type { Fornecedor } from "@/types";
import { createCrudService } from "./base";

export const fornecedoresService = createCrudService<Fornecedor>("fornecedores");
