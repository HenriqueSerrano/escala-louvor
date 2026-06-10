import * as vinculoModel from "../models/vinculoModel.js";
import * as salaModel from "../models/salaModel.js";

export const listarPorSala = async (req, res) => {
  try {
    const { sala } = req.query;

    if (!sala) {
      return res.status(400).json({ erro: "Informe a sala" });
    }

    if (!req.user) {
      return res.status(401).json({ erro: "Token não informado" });
    }

    // Admin vê qualquer sala; demais (incluindo líderes de sala) só veem suas salas
    if (!req.user.is_admin) {
      const vinculos = await vinculoModel.getVinculosPorEmail(req.user.email);
      const salasVinculadas = (vinculos || []).map(v => v.sala);
      const salasLider = await salaModel.getSalasOndeELider(req.user.id);
      const salasPermitidas = [...new Set([...salasVinculadas, ...salasLider])];
      if (!salasPermitidas.includes(sala)) {
        return res.status(403).json({ erro: "Acesso negado a esta sala" });
      }
    }

    const lista = await vinculoModel.getVoluntariosPorSala(sala);
    res.json(lista);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

export const listarPorEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!req.user) {
      return res.status(401).json({ erro: "Token não informado" });
    }

    const requestedEmail = String(email || "").trim().toLowerCase();
    const tokenEmail = String(req.user.email || "").trim().toLowerCase();

    // Admin, o próprio usuário, ou líder de alguma sala pode consultar vínculos
    const salasLider = req.user.is_admin ? [] : await salaModel.getSalasOndeELider(req.user.id);
    const eLiderDeAlgumaSala = salasLider.length > 0;

    if (!req.user.is_admin && !eLiderDeAlgumaSala && tokenEmail !== requestedEmail) {
      return res.status(403).json({ erro: "Acesso negado a este usuário" });
    }

    const lista = await vinculoModel.getVinculosPorEmail(email);
    res.json(lista);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};
