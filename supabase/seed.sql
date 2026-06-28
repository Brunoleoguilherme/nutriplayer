-- =====================================================================
-- NUTRIPLAY — SEED DE DESENVOLVIMENTO
-- Rode DEPOIS de schema.sql. Apenas para ambiente de testes.
-- =====================================================================

-- As tabelas vivem no schema isolado "nutriplay".
set search_path = nutriplay, public;

-- Clube base
insert into clubes (id, nome, nome_fantasia, cidade, estado, plano, status)
values ('00000000-0000-0000-0000-000000000001',
        'BH Wolves', 'BH Wolves Football', 'Belo Horizonte', 'MG', 'Elite', 'Ativo')
on conflict (id) do nothing;

-- Categorias
insert into categorias (clube_id, nome, ordem) values
('00000000-0000-0000-0000-000000000001', 'Adulto', 1),
('00000000-0000-0000-0000-000000000001', 'Flag Masculino', 2),
('00000000-0000-0000-0000-000000000001', 'Flag Feminino', 3)
on conflict do nothing;

-- Alimentos base (valores por 100g, fonte TACO de referência)
insert into alimentos (clube_id, nome, categoria, fonte, porcao_padrao_g, medida_caseira,
                       calorias, proteinas, carboidratos, gorduras, fibras, sodio)
values
(null, 'Arroz branco cozido', 'Cereais', 'TACO', 100, '4 colheres de sopa', 128, 2.5, 28.1, 0.2, 1.6, 1),
(null, 'Feijão carioca cozido', 'Leguminosas', 'TACO', 100, '1 concha', 76, 4.8, 13.6, 0.5, 8.5, 2),
(null, 'Peito de frango grelhado', 'Carnes', 'TACO', 100, '1 filé médio', 159, 32.0, 0.0, 2.5, 0.0, 50),
(null, 'Banana prata', 'Frutas', 'TACO', 100, '1 unidade', 98, 1.3, 26.0, 0.1, 2.0, 0),
(null, 'Aveia em flocos', 'Cereais', 'TACO', 100, '5 colheres de sopa', 394, 13.9, 66.6, 8.5, 9.1, 5),
(null, 'Ovo de galinha cozido', 'Ovos', 'TACO', 100, '2 unidades', 146, 13.3, 0.6, 9.5, 0.0, 140)
on conflict do nothing;

-- Suplementos base
insert into suplementos (clube_id, nome, categoria, dose, horario, objetivo) values
('00000000-0000-0000-0000-000000000001', 'Creatina', 'Performance', '5 g', 'Diário', 'Força e potência'),
('00000000-0000-0000-0000-000000000001', 'Whey Protein', 'Proteína', '30 g', 'Pós-treino', 'Recuperação muscular')
on conflict do nothing;
