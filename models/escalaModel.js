import db from "../config/db.js";

export const criarEscala = async (dados) => {
  const { mes, data, evento, turno, ministro_id, backs, instrumental, talkback_id } = dados;
  const res = await db.query(
    `INSERT INTO escala (mes, data, evento, turno, ministro_id, backs, instrumental, talkback_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [mes, data, evento, turno||null, ministro_id||null, backs||[], instrumental||{}, talkback_id||null]
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
  const { mes, data, evento, turno, ministro_id, backs, instrumental, talkback_id } = dados;
  const res = await db.query(
    `UPDATE escala SET
       mes=$1, data=$2, evento=$3, turno=$4,
       ministro_id=$5, backs=$6, instrumental=$7, talkback_id=$8
     WHERE id=$9 RETURNING *`,
    [mes, data, evento, turno||null, ministro_id||null, backs||[], instrumental||{}, talkback_id||null, id]
  );
  return res.rows[0];
};

export const excluirEscala = async (id) => {
  await db.query(`DELETE FROM escala WHERE id = $1`, [id]);
};

export const buscarHistorico = async (pessoa_id, mes) => {
  // Busca as escalas onde a pessoa participa
  const res = await db.query(
    `SELECT e.data, e.evento, e.ministro_id, e.talkback_id, e.backs, e.instrumental
     FROM escala e
     WHERE e.mes = $2
       AND (e.ministro_id=$1 OR e.talkback_id=$1 OR $1=ANY(e.backs)
            OR e.instrumental::text LIKE '%' || $1::text || '%')
     ORDER BY e.data`,
    [pessoa_id, mes]
  );

  // Para cada entrada, descobrir a função exata
  const rows = await Promise.all(res.rows.map(async e => {
    let funcao = 'Instrumental';

    if (e.ministro_id == pessoa_id) {
      funcao = 'Ministro';
    } else if (e.talkback_id == pessoa_id) {
      funcao = 'Talkback';
    } else if (e.backs && e.backs.includes(Number(pessoa_id))) {
      funcao = 'Backing Vocal';
    } else if (e.instrumental) {
      // Descobrir qual categoria (instrumento) essa pessoa está tocando
      const instrObj = typeof e.instrumental === 'string' ? JSON.parse(e.instrumental) : e.instrumental;
      const catId = Object.keys(instrObj).find(k => instrObj[k] == pessoa_id);
      if (catId) {
        const catRes = await db.query(`SELECT nome FROM categorias WHERE id = $1`, [catId]);
        if (catRes.rows[0]) funcao = catRes.rows[0].nome;
      }
    }

    return { data: e.data, evento: e.evento, funcao };
  }));

  return rows;
};

export const limparEscalaDoMes = async (mes) => {
  await db.query(`DELETE FROM escala WHERE mes = $1`, [mes]);
};