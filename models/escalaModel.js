import db from "../config/db.js";

// 🔥 CRIAR ESCALA
export const criarEscala = async (dados) => {
  const {
    mes,
    data,
    dia_semana,
    evento,
    sala,
    professor_id,
    monitor1_id,
    monitor2_id,
    monitor3_id,
    monitor4_id
  } = dados;

  const res = await db.query(
    `
    INSERT INTO escala 
    (mes, data, dia_semana, evento, sala, professor_id, monitor1_id, monitor2_id, monitor3_id, monitor4_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
    `,
    [
      mes,
      data,
      dia_semana,
      evento,
      sala,
      professor_id,
      monitor1_id,
      monitor2_id,
      monitor3_id,
      monitor4_id
    ]
  );

  return res.rows[0];
};

// 🔥 BUSCAR ESCALA POR MÊS + SALA
export const buscarEscala = async (mes, sala) => {
  const res = await db.query(
    `
    SELECT * 
    FROM escala 
    WHERE mes = $1 AND sala = $2 
    ORDER BY data
    `,
    [mes, sala]
  );

  return res.rows;
};

// 🔥 VERIFICAR CONFLITO (MESMO DIA)
export const verificarConflito = async (data, pessoaId, ignoreId = null) => {
  let query = `
    SELECT * 
    FROM escala
    WHERE data = $1
    AND (
      professor_id = $2 OR
      monitor1_id = $2 OR
      monitor2_id = $2 OR
      monitor3_id = $2 OR
      monitor4_id = $2
    )
  `;

  const params = [data, pessoaId];
  if (ignoreId) {
    query += ` AND id != $3 `;
    params.push(ignoreId);
  }

  const res = await db.query(query, params);
  return res.rows;
};

// 🔥 HISTÓRICO DA PESSOA NO MÊS
export const buscarHistorico = async (pessoaId, mes) => {
  const res = await db.query(
    `
    SELECT 
      data, 
      evento, 
      sala,
      CASE 
        WHEN professor_id = $1 THEN 'Professor'
        ELSE 'Monitor'
      END as funcao
    FROM escala
    WHERE mes = $2
    AND (
      professor_id = $1 OR
      monitor1_id = $1 OR
      monitor2_id = $1 OR
      monitor3_id = $1 OR
      monitor4_id = $1
    )
    ORDER BY data
    `,
    [pessoaId, mes]
  );

  return res.rows;
};

export const atualizarEscala = async (id, dados) => {
  const {
    mes,
    data,
    dia_semana,
    evento,
    sala,
    professor_id,
    monitor1_id,
    monitor2_id,
    monitor3_id,
    monitor4_id
  } = dados;

  const res = await db.query(
    `
    UPDATE escala SET
      mes = $1,
      data = $2,
      dia_semana = $3,
      evento = $4,
      sala = $5,
      professor_id = $6,
      monitor1_id = $7,
      monitor2_id = $8,
      monitor3_id = $9,
      monitor4_id = $10
    WHERE id = $11
    RETURNING *
    `,
    [
      mes,
      data,
      dia_semana,
      evento,
      sala,
      professor_id,
      monitor1_id,
      monitor2_id,
      monitor3_id,
      monitor4_id,
      id
    ]
  );

  return res.rows[0];
};

export const excluirEscala = async (id) => {
  await db.query(`DELETE FROM escala WHERE id = $1`, [id]);
};