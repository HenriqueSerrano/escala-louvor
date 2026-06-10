import { verificarToken } from "../utils/auth.js";

export const validarToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ erro: "Token não informado" });

  const token = authHeader.split(" ")[1];
  const payload = verificarToken(token);
  if (!payload) return res.status(401).json({ erro: "Token inválido ou expirado" });

  req.user = payload;
  next();
};

export const apenasLider = async (req, res, next) => {
  return validarToken(req, res, () => {
    if (!req.user || (!req.user.eh_lider && !req.user.is_admin))
      return res.status(403).json({ erro: "Apenas líderes ou administradores podem fazer isso" });
    next();
  });
};
