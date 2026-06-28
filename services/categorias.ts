import type { Categoria } from "@/types";
import { createCrudService } from "./base";

export const categoriasService = createCrudService<Categoria>("categorias");
