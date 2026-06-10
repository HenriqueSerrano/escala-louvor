import db from "../config/db.js";

export const listarSalas = async () => {
  const res = await db.query("SELECT * FROM salas ORDER BY nome");
  return res.rows;
};

// Retorna os nomes das salas onde a pessoa é líder (pelo pessoa_id)
export const getSalasOndeELider = async (pessoa_id) => {
  const res = await db.query(
    `SELECT nome FROM salas WHERE lider_sala_id = $1`,
    [pessoa_id]
  );
  return res.rows.map(r => r.nome);
};

// Define o líder de uma sala (apenas 1 por sala — constraint unique no BD)
export const definirLiderSala = async (sala_nome, pessoa_id) => {
  const res = await db.query(
    `UPDATE salas SET lider_sala_id = $1 WHERE nome = $2 RETURNING *`,
    [pessoa_id, sala_nome]
  );
  return res.rows[0];
};

// Remove o líder de uma sala pelo nome da sala
export const removerLiderSala = async (sala_nome) => {
  const res = await db.query(
    `UPDATE salas SET lider_sala_id = NULL WHERE nome = $1 RETURNING *`,
    [sala_nome]
  );
  return res.rows[0];
};

// Remove a liderança de sala de uma pessoa específica (em qualquer sala que ela seja líder)
export const removerLiderSalaPorPessoa = async (pessoa_id) => {
  await db.query(
    `UPDATE salas SET lider_sala_id = NULL WHERE lider_sala_id = $1`,
    [pessoa_id]
  );
};

// Busca o lider_sala_id atual de uma sala pelo nome
export const getLiderAtualDaSala = async (sala_nome) => {
  const res = await db.query(
    `SELECT lider_sala_id FROM salas WHERE nome = $1`,
    [sala_nome]
  );
  return res.rows[0]?.lider_sala_id || null;
};

// Atualiza eh_lider na tabela pessoas (usado ao remover um líder de sala)
export const atualizarEhLiderPessoa = async (pessoa_id, valor) => {
  await db.query(
    `UPDATE pessoas SET eh_lider = $1 WHERE id = $2`,
    [valor, pessoa_id]
  );
};
