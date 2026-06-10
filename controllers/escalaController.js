import * as escalaModel from "../models/escalaModel.js";
import * as vinculoModel from "../models/vinculoModel.js";
import * as salaModel from "../models/salaModel.js";

function obterMesDaData(data) {
  const valor = String(data || "").trim();

  const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return Number(iso[2]);

  const br = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return Number(br[2]);

  const dataJs = new Date(valor);
  if (Number.isNaN(dataJs.getTime())) return null;
  return dataJs.getUTCMonth() + 1;
}

export const salvarEscala = async (req, res) => {
  try {
    const dados = req.body;

    const mesData = obterMesDaData(dados.data);
    if (!mesData) {
      return res.status(400).json({ erro: "Data inválida" });
    }

    if (mesData !== Number(dados.mes)) {
      return res.status(400).json({ erro: "Data não pertence ao mês selecionado" });
    }

    if (!dados.professor_id) {
      return res.status(400).json({ erro: "É obrigatório informar um professor" });
    }

    const conflitoProfessor = await escalaModel.verificarConflito(
      dados.data,
      dados.professor_id
    );

    if (conflitoProfessor.length > 0) {
      return res.status(400).json({ erro: "Professor já está escalado neste dia" });
    }

    const monitores = [
      dados.monitor1_id,
      dados.monitor2_id,
      dados.monitor3_id,
      dados.monitor4_id
    ];

    for (let monitor of monitores) {
      if (monitor) {
        const conflito = await escalaModel.verificarConflito(dados.data, monitor);

        if (conflito.length > 0) {
          return res.status(400).json({ erro: "Um dos monitores já está escalado neste dia" });
        }
      }
    }

    const nova = await escalaModel.criarEscala(dados);
    res.json(nova);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

export const listarEscala = async (req, res) => {
  try {
    const { mes, sala } = req.query;

    if (!mes || !sala) {
      return res.status(400).json({ erro: "Informe mes e sala" });
    }

    if (!req.user) {
      return res.status(401).json({ erro: "Token não informado" });
    }

    // Admin vê qualquer sala; demais usuários (incluindo líderes de sala) só veem salas vinculadas
    if (!req.user.is_admin) {
      const vinculos = await vinculoModel.getVinculosPorEmail(req.user.email);
      const salasVinculadas = (vinculos || []).map(v => v.sala);
      const salasLider = await salaModel.getSalasOndeELider(req.user.id);
      const salasPermitidas = [...new Set([...salasVinculadas, ...salasLider])];
      if (!salasPermitidas.includes(sala)) {
        return res.status(403).json({ erro: "Acesso negado a esta sala" });
      }
    }

    const lista = await escalaModel.buscarEscala(mes, sala);
    res.json(lista);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

export const historicoPessoa = async (req, res) => {
  try {
    const { pessoa_id, mes } = req.query;

    if (!pessoa_id || !mes) {
      return res.status(400).json({ erro: "Informe pessoa_id e mes" });
    }

    if (!req.user) {
      return res.status(401).json({ erro: "Token não informado" });
    }

    // Admin ou o próprio usuário podem ver; líderes de sala também podem
    const ehOProprio = String(req.user.id) === String(pessoa_id);
    const salasLider = req.user.is_admin ? [] : await salaModel.getSalasOndeELider(req.user.id);
    const eLiderDeAlgumaSala = salasLider.length > 0;

    if (!req.user.is_admin && !eLiderDeAlgumaSala && !ehOProprio) {
      return res.status(403).json({ erro: "Acesso negado ao histórico desta pessoa" });
    }

    const historico = await escalaModel.buscarHistorico(pessoa_id, mes);
    res.json(historico);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

export const editarEscala = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;

    const mesData = obterMesDaData(dados.data);
    if (!mesData) {
      return res.status(400).json({ erro: "Data inválida" });
    }

    if (mesData !== Number(dados.mes)) {
      return res.status(400).json({ erro: "Data não pertence ao mês selecionado" });
    }

    if (!dados.professor_id) {
      return res.status(400).json({ erro: "É obrigatório informar um professor" });
    }

    const conflitoProfessor = await escalaModel.verificarConflito(dados.data, dados.professor_id, id);
    if (conflitoProfessor.length > 0) {
      return res.status(400).json({ erro: "Professor já está escalado neste dia" });
    }

    const monitores = [
      dados.monitor1_id,
      dados.monitor2_id,
      dados.monitor3_id,
      dados.monitor4_id
    ];

    for (let monitor of monitores) {
      if (monitor) {
        const conflito = await escalaModel.verificarConflito(dados.data, monitor, id);
        if (conflito.length > 0) {
          return res.status(400).json({ erro: "Um dos monitores já está escalado neste dia" });
        }
      }
    }

    const atualizada = await escalaModel.atualizarEscala(id, dados);
    res.json(atualizada);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

export const deletarEscala = async (req, res) => {
  try {
    const { id } = req.params;

    // Busca a sala da escala para verificar permissão (já feito no middleware liderDaSalaOuAdmin via req.body.sala)
    // O middleware já garantiu a permissão via sala informada no body pelo front
    await escalaModel.excluirEscala(id);
    res.json({ mensagem: "Escala removida com sucesso" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};
