import * as salaModel from "../models/salaModel.js";
import * as userModel from "../models/userModel.js";

export const getSalas = async (req, res) => {
  try {
    const salas = await salaModel.listarSalas();
    res.json(salas);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// Define o líder de uma sala (apenas admin)
export const definirLiderSala = async (req, res) => {
  try {
    const { sala_nome, email_lider } = req.body;

    if (!sala_nome || !email_lider) {
      return res.status(400).json({ erro: "Informe sala_nome e email_lider" });
    }

    const pessoa = await userModel.getUserByEmail(email_lider);
    if (!pessoa) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const atualizada = await salaModel.definirLiderSala(sala_nome, pessoa.id);
    if (!atualizada) {
      return res.status(404).json({ erro: "Sala não encontrada" });
    }

    res.json({ mensagem: "Líder de sala definido com sucesso", sala: atualizada });
  } catch (err) {
    // Violação da constraint unique (lider_sala_id já usado em outra sala)
    if (err.code === "23505") {
      return res.status(400).json({ erro: "Este usuário já é líder de outra sala" });
    }
    res.status(500).json({ erro: err.message });
  }
};

// Remove o líder de uma sala (apenas admin)
export const removerLiderSala = async (req, res) => {
  try {
    const { sala_nome } = req.body;

    if (!sala_nome) {
      return res.status(400).json({ erro: "Informe sala_nome" });
    }

    const atualizada = await salaModel.removerLiderSala(sala_nome);
    if (!atualizada) {
      return res.status(404).json({ erro: "Sala não encontrada" });
    }

    res.json({ mensagem: "Líder de sala removido com sucesso", sala: atualizada });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};