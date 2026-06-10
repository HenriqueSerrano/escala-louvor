import * as userModel from "../models/userModel.js";
import * as vinculoModel from "../models/vinculoModel.js";
import * as salaModel from "../models/salaModel.js";
import { criarToken, hashSenha } from "../utils/auth.js";

// LISTAR
export const listarUsuarios = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();

    const usersWithVinculos = await Promise.all(
      users.map(async user => {
        const vinculos = await vinculoModel.getVinculosPorEmail(user.email);
        const salasLider = await salaModel.getSalasOndeELider(user.id);
        return {
          ...user,
          vinculos: Array.isArray(vinculos) ? vinculos : [],
          lider_sala: salasLider.length > 0 ? salasLider[0] : null
        };
      })
    );

    res.json(usersWithVinculos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// CRIAR
export const criarUsuario = async (req, res) => {
  try {
    const { nome, email, eh_lider, senha, vinculos, lider_sala } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios" });
    }

    // eh_lider = true se tiver sala de liderança definida ou flag explícita
    const ehLiderFinal = !!(lider_sala || eh_lider);

    const novo = await userModel.createUser({
      nome,
      email,
      eh_lider: ehLiderFinal,
      senha: hashSenha(senha),
      is_admin: false
    });

    const pessoa_id = novo.id;

    // Define liderança de sala se informada
    if (lider_sala) {
      await salaModel.removerLiderSalaPorPessoa(pessoa_id);
      await salaModel.definirLiderSala(lider_sala, pessoa_id);
    }

    if (Array.isArray(vinculos) && vinculos.length > 0) {
      for (let v of vinculos) {
        await vinculoModel.inserirVinculo(pessoa_id, v.sala, v.funcao);
      }
    }

    res.json({ mensagem: "Usuário criado com vínculos" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// ATUALIZAR
export const atualizarUsuario = async (req, res) => {
  try {
    const { email } = req.params;
    const { nome, eh_lider, senha, vinculos, email: novoEmail, lider_sala } = req.body;

    const usuario = await userModel.getUserByEmail(email);
    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const pessoa_id = usuario.id;

    // Regras de eh_lider:
    // 1. lider_sala veio na requisição (login.html) → derivar de lider_sala
    // 2. eh_lider veio explícito → usar esse valor
    // 3. Nenhum dos dois veio (index.html editando apenas vínculos) → preservar valor atual do banco
    let ehLiderFinal;
    if (lider_sala !== undefined) {
      ehLiderFinal = !!(lider_sala);
    } else if (eh_lider !== undefined) {
      ehLiderFinal = !!eh_lider;
    } else {
      // Não veio nenhum campo de liderança — preserva o que está no banco
      ehLiderFinal = usuario.eh_lider;
    }

    await userModel.atualizarUsuario(email, {
      nome,
      eh_lider: ehLiderFinal,
      senha: senha ? hashSenha(senha) : undefined,
      email: novoEmail
    });

    // Gerencia liderança de sala (apenas quando lider_sala veio na requisição)
    if (lider_sala !== undefined) {
      // Antes de trocar, identifica quem era o líder anterior da sala destino
      // para poder atualizar o eh_lider dele após a troca
      let liderAnteriorId = null;
      if (lider_sala) {
        liderAnteriorId = await salaModel.getLiderAtualDaSala(lider_sala);
      }

      // Remove liderança anterior desta pessoa em qualquer sala
      await salaModel.removerLiderSalaPorPessoa(pessoa_id);

      // Se veio uma sala, define esta pessoa como líder dela
      if (lider_sala) {
        await salaModel.definirLiderSala(lider_sala, pessoa_id);
      }

      // Se havia um líder anterior diferente desta pessoa,
      // verifica se ele ainda é líder de alguma outra sala.
      // Se não for, atualiza eh_lider = false no banco.
      if (liderAnteriorId && liderAnteriorId !== pessoa_id) {
        const aindaELider = await salaModel.getSalasOndeELider(liderAnteriorId);
        if (aindaELider.length === 0) {
          await salaModel.atualizarEhLiderPessoa(liderAnteriorId, false);
        }
      }
    }

    // Só atualiza vínculos se o campo "vinculos" veio explicitamente na requisição.
    // login.html não envia vinculos → preserva os vínculos existentes intactos.
    // index.html sempre envia vinculos (mesmo array vazio) → substitui normalmente.
    if (vinculos !== undefined) {
      await vinculoModel.deletarPorPessoa(pessoa_id);
      if (Array.isArray(vinculos) && vinculos.length > 0) {
        for (let v of vinculos) {
          await vinculoModel.inserirVinculo(pessoa_id, v.sala, v.funcao);
        }
      }
    }

    res.json({ mensagem: "Usuário atualizado com vínculos" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// DELETAR
export const deletarUsuario = async (req, res) => {
  try {
    const { email } = req.params;

    const usuario = await userModel.getUserByEmail(email);
    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    // Remove liderança de sala antes de excluir
    await salaModel.removerLiderSalaPorPessoa(usuario.id);
    await vinculoModel.deletarPorPessoa(usuario.id);
    await userModel.deletarUsuario(email);

    res.json({ mensagem: "Usuário excluído" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: "Informe e-mail e senha" });
    }

    const user = await userModel.getUserByEmail(email);

    if (!user || !user.senha) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const senhaHash = hashSenha(senha);

    // 🔥 aceita texto OU hash
    if (user.senha !== senha && user.senha !== senhaHash) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const token = criarToken({
      id: user.id,
      nome: user.nome,
      email: user.email,
      eh_lider: user.eh_lider,
      is_admin: user.is_admin
    });

    // Busca salas onde o usuário é líder de sala para incluir no token
    const salasLider = await salaModel.getSalasOndeELider(user.id);

    res.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        eh_lider: user.eh_lider,
        is_admin: user.is_admin,
        salas_lider: salasLider
      },
      token
    });

  } catch (err) {
    console.error("🔥 ERRO LOGIN:", err);
    res.status(500).json({ erro: err.message });
  }
};