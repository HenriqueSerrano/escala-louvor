import db from "../config/db.js";

export const criarEscala = async (dados) => {
  const { mes, data, evento, ministro_id, backs, instrumental, talkback_id } = dados;
  const res = await db.query(
    `INSERT INTO escala (mes, data, evento, ministro_id, backs, instrumental, talkback_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [mes, data, evento, ministro_id || null, backs || [], instrumental || {}, talkback_id || null]
  );
  return res.rows[0];
};

export const buscarEscala = async (mes) => {
  const res = await db.query(
    `SELECT * FROM escala WHERE mes = $1 ORDER BY data, evento`,
    [mes]
  );
  return res.rows;
};

export const atualizarEscala = async (id, dados) => {
  const { mes, data, evento, ministro_id, backs, instrumental, talkback_id } = dados;
  const res = await db.query(
    `UPDATE escala SET
       mes = $1, data = $2, evento = $3,
       ministro_id = $4, backs = $5, instrumental = $6, talkback_id = $7
     WHERE id = $8
     RETURNING *`,
    [mes, data, evento, ministro_id || null, backs || [], instrumental || {}, talkback_id || null, id]
  );
  return res.rows[0];
};

export const excluirEscala = async (id) => {
  await db.query(`DELETE FROM escala WHERE id = $1`, [id]);
};

export const buscarHistorico = async (pessoa_id, mes) => {
  const res = await db.query(
    `SELECT data, evento,
       CASE WHEN ministro_id = $1 THEN 'Ministro'
            WHEN talkback_id = $1 THEN 'Talkback'
            WHEN $1 = ANY(backs) THEN 'Backing Vocal'
            ELSE 'Instrumental'
       END as funcao
     FROM escala
     WHERE mes = $2
       AND (ministro_id = $1 OR talkback_id = $1 OR $1 = ANY(backs)
            OR instrumental::text LIKE '%' || $1::text || '%')
     ORDER BY data`,
    [pessoa_id, mes]
  );
  return res.rows;
};

export const verificarPessoaNoDia = async (data, pessoa_id, ignoreId = null) => {
  let query = `
    SELECT id FROM escala
    WHERE data = $1
    AND (ministro_id = $2 OR talkback_id = $2 OR $2 = ANY(backs)
         OR instrumental::text LIKE '%' || $2::text || '%')
  `;
  const params = [data, pessoa_id];
  if (ignoreId) {
    query += ` AND id != $3`;
    params.push(ignoreId);
  }
  const res = await db.query(query, params);
  return res.rows;
};

export const limparEscalaDoMes = async (mes) => {
  await db.query(`DELETE FROM escala WHERE mes = $1`, [mes]);
};
