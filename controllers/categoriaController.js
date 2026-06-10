import * as categoriaModel from "../models/categoriaModel.js";

export const getCategorias = async (req, res) => {
  try {
    const categorias = await categoriaModel.listarCategorias();
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

export const criarCategoria = async (req, res) => {
  try {
    const { nome, tipo } = req.body;
    if (!nome || !tipo) return res.status(400).json({ erro: "Informe nome e tipo (vocal/instrumental)" });
    if (!["vocal", "instrumental"].includes(tipo))
      return res.status(400).json({ erro: "Tipo deve ser 'vocal' ou 'instrumental'" });
    const nova = await categoriaModel.criarCategoria(nome, tipo);
    res.json(nova);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ erro: "Categoria já existe" });
    res.status(500).json({ erro: err.message });
  }
};

export const excluirCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    await categoriaModel.excluirCategoria(id);
    res.json({ mensagem: "Categoria excluída" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};
