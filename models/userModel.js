import db from "../config/db.js";

export const getAllUsers = async () => {
  const res = await db.query(
    `SELECT id, nome, email, eh_lider, ultima_escala
     FROM pessoas
     WHERE COALESCE(is_admin, false) = false
     ORDER BY nome`
  );
  return res.rows;
};

export const createUser = async (user) => {
  const { nome, email, eh_lider, senha, is_admin = false } = user;
  const res = await db.query(
    `INSERT INTO pessoas (nome, email, eh_lider, senha, is_admin)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, nome, email, eh_lider, is_admin`,
    [nome, email, eh_lider, senha || null, is_admin]
  );
  return res.rows[0];
};

export const getUserByEmail = async (email) => {
  const res = await db.query(
    `SELECT id, nome, email, eh_lider, is_admin, senha, ultima_escala
     FROM pessoas
     WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`,
    [email]
  );
  return res.rows[0];
};

export const atualizarUsuario = async (email, user) => {
  const { nome, eh_lider, senha, email: novoEmail } = user;
  const res = await db.query(
    `UPDATE pessoas
     SET nome = $1,
         eh_lider = $2,
         senha = COALESCE(NULLIF($3, ''), senha),
         email = COALESCE(NULLIF($4, ''), email)
     WHERE email = $5
     RETURNING id, nome, email, eh_lider, is_admin`,
    [nome, eh_lider, senha || null, novoEmail || null, email]
  );
  return res.rows[0];
};

export const deletarUsuario = async (email) => {
  const res = await db.query(
    `DELETE FROM pessoas WHERE email = $1 RETURNING *`,
    [email]
  );
  return res.rows[0];
};

export const atualizarUltimaEscala = async (pessoa_id, data) => {
  await db.query(
    `UPDATE pessoas SET ultima_escala = $1 WHERE id = $2`,
    [data, pessoa_id]
  );
};
