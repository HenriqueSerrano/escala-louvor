import { verificarToken } from "../utils/auth.js";
import * as salaModel from "../models/salaModel.js";

export const validarToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token não informado" });
  }

  const token = authHeader.split(" ")[1];
  const payload = verificarToken(token);
  if (!payload) {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }

  req.user = payload;
  next();
};

export const apenasLider = async (req, res, next) => {
  return validarToken(req, res, () => {
    const user = req.user;

    if (!user || (!user.eh_lider && !user.is_admin)) {
      return res.status(403).json({ erro: "Apenas líderes ou administradores podem fazer isso" });
    }

    next();
  });
};

// Middleware para operações de escala:
// - admin: passa sempre
// - lider de sala: passa apenas se for líder da sala informada no body ou query
// - demais: bloqueado
export const liderDaSalaOuAdmin = async (req, res, next) => {
  return validarToken(req, res, async () => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ erro: "Token não informado" });
    }

    // Admin tem acesso total
    if (user.is_admin) {
      return next();
    }

    // Determina a sala da operação (body para POST/PUT, query para GET/DELETE via id)
    const sala = req.body?.sala || req.query?.sala;

    if (!sala) {
      return res.status(400).json({ erro: "Sala não informada na requisição" });
    }

    try {
      const salasLider = await salaModel.getSalasOndeELider(user.id);
      if (salasLider.includes(sala)) {
        return next();
      }
      return res.status(403).json({ erro: "Você não é líder desta sala" });
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  });
};
