import db from "../config/db.js";

export const getVoluntariosPorSala = async (sala) => {
  const res = await db.query(
    `
    SELECT p.id, p.nome, v.funcao
    FROM vinculos v
    JOIN pessoas p ON p.id = v.pessoa_id
    WHERE v.sala = $1
    ORDER BY p.nome
    `,
    [sala]
  );

  return res.rows;
};

export const getVinculosPorEmail = async (email) => {
  const res = await db.query(
    `
    SELECT v.sala, v.funcao
    FROM vinculos v
    JOIN pessoas p ON p.id = v.pessoa_id
    WHERE LOWER(TRIM(p.email)) = LOWER(TRIM($1))
    `,
    [email]
  );

  return res.rows;
};

export const deletarPorPessoa = async (pessoa_id) => {
  await db.query(
    `DELETE FROM vinculos WHERE pessoa_id = $1`,
    [pessoa_id]
  );
};

export const inserirVinculo = async (pessoa_id, sala, funcao) => {
  await db.query(
    `
    INSERT INTO vinculos (pessoa_id, sala, funcao)
    VALUES ($1, $2, $3)
    `,
    [pessoa_id, sala, funcao]
  );
};