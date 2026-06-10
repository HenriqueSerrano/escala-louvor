import db from "../config/db.js";

export const listarCategorias = async () => {
  const res = await db.query("SELECT * FROM categorias ORDER BY tipo, nome");
  return res.rows;
};

export const criarCategoria = async (nome, tipo) => {
  const res = await db.query(
    `INSERT INTO categorias (nome, tipo) VALUES ($1, $2) RETURNING *`,
    [nome, tipo]
  );
  return res.rows[0];
};

export const excluirCategoria = async (id) => {
  await db.query(`DELETE FROM categorias WHERE id = $1`, [id]);
};

export const getCategoriaById = async (id) => {
  const res = await db.query(`SELECT * FROM categorias WHERE id = $1`, [id]);
  return res.rows[0];
};
