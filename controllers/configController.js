import * as configModel from "../models/configModel.js";

export const obterConfig = async (req, res) => {
  const config = await configModel.getConfig();
  res.json(config);
};

export const travarMes = async (req, res) => {
  const { mes } = req.body;
  if (!mes) {
    return res.status(400).json({ erro: "Informe o mês a travar" });
  }

  await configModel.travarMes(Number(mes));
  res.json({ mensagem: "Mês travado" });
};

export const destravarMes = async (req, res) => {
  await configModel.destravarMes();
  res.json({ mensagem: "Mês destravado" });
};

export const limparMes = async (req, res) => {
  await configModel.limparEscala();
  res.json({ mensagem: "Escala limpa" });
};