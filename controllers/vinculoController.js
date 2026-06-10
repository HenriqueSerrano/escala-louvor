import * as vinculoModel from "../models/vinculoModel.js";

export const listarPorEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const lista = await vinculoModel.getVinculosPorEmail(email);
    res.json(lista);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

export const listarPorCategoria = async (req, res) => {
  try {
    const { categoria_id } = req.query;
    if (!categoria_id) return res.status(400).json({ erro: "Informe categoria_id" });
    const lista = await vinculoModel.getVoluntariosPorCategoria(categoria_id);
    res.json(lista);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};
