import * as configModel from "../models/configModel.js";
import * as escalaModel from "../models/escalaModel.js";

export const obterConfig = async (req, res) => {
  const config = await configModel.getConfig();
  res.json(config);
};

export const travarMes = async (req, res) => {
  const { mes } = req.body;
  if (!mes) return res.status(400).json({ erro: "Informe o mês a travar" });
  await configModel.travarMes(mes);
  res.json({ mensagem: "Mês travado" });
};

export const destravarMes = async (req, res) => {
  await configModel.destravarMes();
  res.json({ mensagem: "Mês destravado" });
};

export const limparMes = async (req, res) => {
  const { mes } = req.body;
  if (mes) {
    await escalaModel.limparEscalaDoMes(mes);
  }
  await configModel.limparEscala();
  res.json({ mensagem: "Escala limpa" });
};
