-- Migration: Adicionar líder por sala
-- Execute no Supabase (SQL Editor) antes de fazer o deploy

-- 1. Adiciona coluna lider_sala_id na tabela salas
ALTER TABLE salas
  ADD COLUMN IF NOT EXISTS lider_sala_id int4 REFERENCES pessoas(id) ON DELETE SET NULL;

-- 2. Garante que somente 1 líder por sala (unique constraint)
ALTER TABLE salas
  ADD CONSTRAINT IF NOT EXISTS salas_lider_sala_id_unique UNIQUE (lider_sala_id);

-- Resultado esperado:
-- Cada sala pode ter NULL (sem líder definido) ou um pessoa_id único como líder da sala.
-- O campo eh_lider em pessoas NÃO é mais usado para controle de salas — apenas is_admin permanece com acesso total.
-- Um usuário pode ser lider_sala_id de uma sala E ter vínculo normal em outra sala.
