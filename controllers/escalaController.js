import * as escalaModel from "../models/escalaModel.js";
import * as vinculoModel from "../models/vinculoModel.js";
import * as categoriaModel from "../models/categoriaModel.js";
import * as userModel from "../models/userModel.js";

export const salvarEscala = async (req, res) => {
  try {
    const dados = req.body;
    if (!dados.data || !dados.evento || !dados.mes)
      return res.status(400).json({ erro: "Data, mês e evento são obrigatórios" });

    const nova = await escalaModel.criarEscala(dados);
    res.json(nova);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ erro: "Já existe escala para este evento nesta data" });
    res.status(500).json({ erro: err.message });
  }
};

export const listarEscala = async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).json({ erro: "Informe o mês" });
    const lista = await escalaModel.buscarEscala(mes);
    res.json(lista);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

export const editarEscala = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;
    if (!dados.data || !dados.evento || !dados.mes)
      return res.status(400).json({ erro: "Data, mês e evento são obrigatórios" });
    const atualizada = await escalaModel.atualizarEscala(id, dados);
    res.json(atualizada);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

export const deletarEscala = async (req, res) => {
  try {
    const { id } = req.params;
    await escalaModel.excluirEscala(id);
    res.json({ mensagem: "Escala removida com sucesso" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

export const historicoPessoa = async (req, res) => {
  try {
    const { pessoa_id, mes } = req.query;
    if (!pessoa_id || !mes) return res.status(400).json({ erro: "Informe pessoa_id e mes" });
    const historico = await escalaModel.buscarHistorico(pessoa_id, mes);
    res.json(historico);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// ── GERAÇÃO AUTOMÁTICA ─────────────────────────────────────────────────────
export const gerarEscala = async (req, res) => {
  try {
    const { mes } = req.body; // ex: "2026-06"
    if (!mes) return res.status(400).json({ erro: "Informe o mês (YYYY-MM)" });

    const [ano, mesNum] = mes.split("-").map(Number);

    // 1. Gerar todas as datas do mês
    const eventos = gerarEventosDoMes(ano, mesNum);

    // 2. Listar categorias
    const categorias = await categoriaModel.listarCategorias();

    // 3. Para cada categoria, buscar integrantes ordenados por ultima_escala (quem foi há mais tempo primeiro)
    const filasPorCategoria = {};
    for (const cat of categorias) {
      const voluntarios = await vinculoModel.getVoluntariosPorCategoria(cat.id);
      // Ordena: null (nunca escalado) primeiro, depois por data mais antiga
      voluntarios.sort((a, b) => {
        if (!a.ultima_escala && !b.ultima_escala) return 0;
        if (!a.ultima_escala) return -1;
        if (!b.ultima_escala) return 1;
        return new Date(a.ultima_escala) - new Date(b.ultima_escala);
      });
      filasPorCategoria[cat.id] = { categoria: cat, fila: voluntarios };
    }

    // 4. Verificar categorias com equipe curta
    const alertas = [];
    for (const cat of categorias) {
      const qtd = filasPorCategoria[cat.id].fila.length;
      if (qtd < eventos.length) {
        alertas.push({ categoria: cat.nome, disponiveis: qtd, necessario: eventos.length });
      }
    }

    // 5. Montar escala evento a evento
    const escalaGerada = [];

    for (const ev of eventos) {
      const alocadosNoDia = new Set(); // controla quem já foi alocado neste dia
      const entradaEscala = {
        mes,
        data: ev.data,
        evento: ev.tipo,
        ministro_id: null,
        backs: [],
        instrumental: {},
        talkback_id: null
      };

      for (const cat of categorias) {
        const { fila } = filasPorCategoria[cat.id];
        if (fila.length === 0) continue;

        if (cat.tipo === "vocal") {
          if (cat.nome.toLowerCase().includes("ministro")) {
            // Pega o próximo ministro disponível que não está no dia
            const escolhido = proximoDisponivel(fila, alocadosNoDia);
            if (escolhido) {
              entradaEscala.ministro_id = escolhido.id;
              alocadosNoDia.add(escolhido.id);
              moverParaFim(fila, escolhido.id);
            }
          } else {
            // Backing: pega até 3
            const backs = [];
            for (let i = 0; i < 3; i++) {
              const escolhido = proximoDisponivel(fila, alocadosNoDia);
              if (!escolhido) break;
              backs.push(escolhido.id);
              alocadosNoDia.add(escolhido.id);
              moverParaFim(fila, escolhido.id);
            }
            entradaEscala.backs = backs;
          }
        } else {
          // Instrumental: 1 por categoria
          const escolhido = proximoDisponivel(fila, alocadosNoDia);
          if (escolhido) {
            entradaEscala.instrumental[cat.id] = escolhido.id;
            alocadosNoDia.add(escolhido.id);
            moverParaFim(fila, escolhido.id);
          }
        }
      }

      // 6. Escolher talkback: instrumentista com eh_talkback=true, priorizando quem foi talkback há mais tempo
      const candidatosTalkback = [];
      for (const cat of categorias.filter(c => c.tipo === "instrumental")) {
        const pessoaId = entradaEscala.instrumental[cat.id];
        if (!pessoaId) continue;
        const vinculo = filasPorCategoria[cat.id].fila.find(v => v.id === pessoaId)
          || (await vinculoModel.getVoluntariosPorCategoria(cat.id)).find(v => v.id === pessoaId);
        if (vinculo?.eh_talkback) {
          candidatosTalkback.push({ id: pessoaId, ultima_escala: vinculo.ultima_escala });
        }
      }
      if (candidatosTalkback.length > 0) {
        candidatosTalkback.sort((a, b) => {
          if (!a.ultima_escala) return -1;
          if (!b.ultima_escala) return 1;
          return new Date(a.ultima_escala) - new Date(b.ultima_escala);
        });
        entradaEscala.talkback_id = candidatosTalkback[0].id;
      }

      escalaGerada.push(entradaEscala);
    }

    // 7. Salvar no banco e atualizar ultima_escala
    const inseridas = [];
    for (const entrada of escalaGerada) {
      const nova = await escalaModel.criarEscala(entrada);
      inseridas.push(nova);

      // Atualiza ultima_escala de todos alocados
      const todasPessoas = [
        entrada.ministro_id,
        ...entrada.backs,
        ...Object.values(entrada.instrumental),
        entrada.talkback_id
      ].filter((id, idx, arr) => id && arr.indexOf(id) === idx);

      for (const pid of todasPessoas) {
        await userModel.atualizarUltimaEscala(pid, entrada.data);
      }
    }

    res.json({ escala: inseridas, alertas });
  } catch (err) {
    console.error("Erro ao gerar escala:", err);
    res.status(500).json({ erro: err.message });
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────
function gerarEventosDoMes(ano, mes) {
  const eventos = [];
  const diasNoMes = new Date(ano, mes, 0).getDate();

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dt = new Date(ano, mes - 1, dia);
    const dow = dt.getDay(); // 0=dom, 4=qui
    const dataStr = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    if (dow === 0) {
      eventos.push({ data: dataStr, tipo: "dom_manha" });
      eventos.push({ data: dataStr, tipo: "dom_noite" });
    } else if (dow === 4) {
      eventos.push({ data: dataStr, tipo: "quinta" });
    }
  }
  return eventos;
}

function proximoDisponivel(fila, alocadosNoDia) {
  return fila.find(p => !alocadosNoDia.has(p.id)) || null;
}

function moverParaFim(fila, id) {
  const idx = fila.findIndex(p => p.id === id);
  if (idx !== -1) {
    const [pessoa] = fila.splice(idx, 1);
    fila.push(pessoa);
  }
}
