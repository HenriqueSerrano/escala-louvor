import * as userModel from "../models/userModel.js";
import * as vinculoModel from "../models/vinculoModel.js";
import { criarToken, hashSenha } from "../utils/auth.js";

export const listarUsuarios = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    const usersWithVinculos = await Promise.all(
      users.map(async user => {
        const vinculos = await vinculoModel.getVinculosPorPessoa(user.id);
        return { ...user, vinculos: Array.isArray(vinculos) ? vinculos : [] };
      })
    );
    res.json(usersWithVinculos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

export const criarUsuario = async (req, res) => {
  try {
    const { nome, email, eh_lider, senha, vinculos } = req.body;
    if (!nome || !email || !senha)
      return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios" });

    const novo = await userModel.createUser({
      nome, email,
      eh_lider: !!eh_lider,
      senha: hashSenha(senha),
      is_admin: false
    });

    if (Array.isArray(vinculos) && vinculos.length > 0) {
      for (const v of vinculos) {
        await vinculoModel.inserirVinculo(novo.id, v.categoria_id, v.eh_talkback || false);
      }
    }

    res.json({ mensagem: "Integrante criado com sucesso" });
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ erro: "E-mail já cadastrado" });
    res.status(500).json({ erro: err.message });
  }
};

export const atualizarUsuario = async (req, res) => {
  try {
    const { email } = req.params;
    const { nome, eh_lider, senha, vinculos, email: novoEmail } = req.body;

    const usuario = await userModel.getUserByEmail(email);
    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });

    await userModel.atualizarUsuario(email, {
      nome,
      eh_lider: eh_lider !== undefined ? !!eh_lider : usuario.eh_lider,
      senha: senha ? hashSenha(senha) : undefined,
      email: novoEmail
    });

    if (vinculos !== undefined) {
      await vinculoModel.deletarPorPessoa(usuario.id);
      if (Array.isArray(vinculos) && vinculos.length > 0) {
        for (const v of vinculos) {
          await vinculoModel.inserirVinculo(usuario.id, v.categoria_id, v.eh_talkback || false);
        }
      }
    }

    res.json({ mensagem: "Integrante atualizado com sucesso" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

export const deletarUsuario = async (req, res) => {
  try {
    const { email } = req.params;
    const usuario = await userModel.getUserByEmail(email);
    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });

    await vinculoModel.deletarPorPessoa(usuario.id);
    await userModel.deletarUsuario(email);
    res.json({ mensagem: "Integrante excluído" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: "Informe e-mail e senha" });

    const user = await userModel.getUserByEmail(email);
    if (!user || !user.senha) return res.status(404).json({ erro: "Usuário não encontrado" });

    const senhaHash = hashSenha(senha);
    if (user.senha !== senha && user.senha !== senhaHash)
      return res.status(401).json({ erro: "Credenciais inválidas" });

    const token = criarToken({
      id: user.id,
      nome: user.nome,
      email: user.email,
      eh_lider: user.eh_lider,
      is_admin: user.is_admin
    });

    res.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        eh_lider: user.eh_lider,
        is_admin: user.is_admin
      },
      token
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};
