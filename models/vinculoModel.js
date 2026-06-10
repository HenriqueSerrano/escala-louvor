import db from "../config/db.js";

export const getVinculosPorPessoa = async (pessoa_id) => {
  const res = await db.query(
    `SELECT v.id, v.categoria_id, v.eh_talkback, c.nome as categoria_nome, c.tipo
     FROM vinculos v
     JOIN categorias c ON c.id = v.categoria_id
     WHERE v.pessoa_id = $1
     ORDER BY c.tipo, c.nome`,
    [pessoa_id]
  );
  return res.rows;
};

export const getVinculosPorEmail = async (email) => {
  const res = await db.query(
    `SELECT v.id, v.categoria_id, v.eh_talkback, c.nome as categoria_nome, c.tipo
     FROM vinculos v
     JOIN categorias c ON c.id = v.categoria_id
     JOIN pessoas p ON p.id = v.pessoa_id
     WHERE LOWER(TRIM(p.email)) = LOWER(TRIM($1))
     ORDER BY c.tipo, c.nome`,
    [email]
  );
  return res.rows;
};

export const getVoluntariosPorCategoria = async (categoria_id) => {
  const res = await db.query(
    `SELECT p.id, p.nome, p.ultima_escala, v.eh_talkback
     FROM vinculos v
     JOIN pessoas p ON p.id = v.pessoa_id
     WHERE v.categoria_id = $1
     ORDER BY p.nome`,
    [categoria_id]
  );
  return res.rows;
};

export const inserirVinculo = async (pessoa_id, categoria_id, eh_talkback = false) => {
  await db.query(
    `INSERT INTO vinculos (pessoa_id, categoria_id, eh_talkback)
     VALUES ($1, $2, $3)
     ON CONFLICT (pessoa_id, categoria_id) DO UPDATE SET eh_talkback = $3`,
    [pessoa_id, categoria_id, eh_talkback]
  );
};

export const deletarPorPessoa = async (pessoa_id) => {
  await db.query(`DELETE FROM vinculos WHERE pessoa_id = $1`, [pessoa_id]);
};

export const deletarVinculo = async (pessoa_id, categoria_id) => {
  await db.query(
    `DELETE FROM vinculos WHERE pessoa_id = $1 AND categoria_id = $2`,
    [pessoa_id, categoria_id]
  );
};
