import db from "../config/db.js";

export const getConfig = async () => {
  const res = await db.query(`SELECT * FROM configuracoes LIMIT 1`);
  return res.rows[0];
};

export const travarMes = async (mes) => {
  await db.query(`UPDATE configuracoes SET travado = true, mes_atual = $1`, [mes]);
};

export const destravarMes = async () => {
  await db.query(`UPDATE configuracoes SET travado = false, mes_atual = NULL`);
};

export const limparEscala = async () => {
  await destravarMes();
};
