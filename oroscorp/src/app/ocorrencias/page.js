/*
  Objetivo: Tela de listagem de ocorrências com resumo, filtros, paginação (20 por vez) e acesso aos detalhes
  Data: 16/11/2026
*/

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import Popup from "../components/Popup";
import styles from "../style/ocorrencias.module.css";

const ITENS_POR_PAGINA = 20;

function obterNivelPrioridade(prioridade) {
  const p = String(prioridade || "").toLowerCase();
  if (p.includes("alt")) return "alta";
  if (p.includes("méd") || p.includes("med")) return "media";
  return "baixa";
}

function verificarAberta(status) {
  const s = String(status || "").toLowerCase();
  return !s.includes("fech") && !s.includes("resolv") && !s.includes("conclu");
}

export default function Ocorrencias() {
  const router = useRouter();

  const [ocorrencias, setOcorrencias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [atalhoFiltro, setAtalhoFiltro] = useState("todas");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [filtros, setFiltros] = useState({
    status: "",
    origem: "",
    setor: "",
    prioridade: "",
    tipo: "",
  });

  const formatarData = (dataStr) => {
    if (!dataStr) return "--/--/---- --:--";

    const data = new Date(dataStr);
    if (isNaN(data.getTime())) return dataStr;

    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();
    const horas = String(data.getHours()).padStart(2, "0");
    const minutos = String(data.getMinutes()).padStart(2, "0");

    return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
  };

  const mapearProcedure = (item) => {
    const nomeFunc = item.Nome_funcionario;
    return {
      id: item.ID_ocorrencia || item.id,
      funcionario: nomeFunc || "Aguardando identificação",
      identificado: Boolean(nomeFunc),
      tipo: item.Motivo_ocorrencia || "Não especificado",
      epi: item.Nome_EPI || "",
      setor: item.Nome_setor || "Não informado",
      origem: item.origem_ocorrencia || "MANUAL",
      prioridade: item.prioridade_ocorrencia || "MÉDIA",
      nivelPrioridade: obterNivelPrioridade(item.prioridade_ocorrencia),
      status: item.Status_ocorrencia || "Aberta",
      aberta: verificarAberta(item.Status_ocorrencia),
      descricao: item.Descricao_Ocorrencia || "",
      dataHora: formatarData(item.Data_ocorrencia || item.data_hora),
      raw: item,
    };
  };

  useEffect(() => {
    async function carregarOcorrencias() {
      setCarregando(true);
      setErro("");
      try {
        const res = await fetch("/api/ocorrencia/dados", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          const listaBruta = json.response?.dados || json.dados || [];

          const mapaUnico = new Map();
          listaBruta.forEach((item) => {
            const idItem = item.ID_ocorrencia || item.id;
            if (idItem !== undefined && !mapaUnico.has(String(idItem))) {
              mapaUnico.set(String(idItem), mapearProcedure(item));
            }
          });

          setOcorrencias(Array.from(mapaUnico.values()));
        } else {
          const err = await res.json().catch(() => ({}));
          setErro(err.message || "Erro ao carregar dados das ocorrências.");
        }
      } catch {
        setErro("Erro de conexão ao carregar ocorrências.");
      } finally {
        setCarregando(false);
      }
    }
    carregarOcorrencias();
  }, []);

  // Volta para a página 1 sempre que qualquer filtro ou busca mudar
  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, atalhoFiltro, filtros]);

  function alterarFiltro(e) {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  }

  function abrirDetalhes(id) {
    router.push(`/ocorrencias/${id}`);
  }

  const resumoGeral = useMemo(() => {
    return ocorrencias.reduce(
      (acc, o) => {
        acc.total += 1;
        if (o.aberta) acc.abertas += 1;
        if (o.nivelPrioridade === "alta") acc.altas += 1;
        if (String(o.origem).toUpperCase().includes("IA")) acc.porIa += 1;
        if (!o.identificado) acc.semId += 1;
        return acc;
      },
      { total: 0, abertas: 0, altas: 0, porIa: 0, semId: 0 }
    );
  }, [ocorrencias]);

  const opcoesStatus = [...new Set(ocorrencias.map((o) => o.status))].filter(Boolean);
  const opcoesOrigem = [...new Set(ocorrencias.map((o) => o.origem))].filter(Boolean);
  const opcoesSetor = [...new Set(ocorrencias.map((o) => o.setor))].filter(Boolean);
  const opcoesPrioridade = [...new Set(ocorrencias.map((o) => o.prioridade))].filter(Boolean);
  const opcoesTipo = [...new Set(ocorrencias.map((o) => o.tipo))].filter(Boolean);

  const listaFiltrada = ocorrencias.filter((item) => {
    const termo = busca.trim().toLowerCase();
    const texto = `${item.id} ${item.funcionario} ${item.tipo} ${item.epi} ${item.setor} ${item.descricao}`.toLowerCase();
    const correspondeBusca = !termo || texto.includes(termo);

    const correspondeStatus = !filtros.status || item.status === filtros.status;
    const correspondeOrigem = !filtros.origem || item.origem === filtros.origem;
    const correspondeSetor = !filtros.setor || item.setor === filtros.setor;
    const correspondePrioridade =
      !filtros.prioridade || item.prioridade === filtros.prioridade;
    const correspondeTipo = !filtros.tipo || item.tipo === filtros.tipo;

    let correspondeAtalho = true;
    if (atalhoFiltro === "abertas") correspondeAtalho = item.aberta;
    else if (atalhoFiltro === "alta")
      correspondeAtalho = item.nivelPrioridade === "alta";
    else if (atalhoFiltro === "ia")
      correspondeAtalho = String(item.origem).toUpperCase().includes("IA");
    else if (atalhoFiltro === "sem_id") correspondeAtalho = !item.identificado;

    return (
      correspondeBusca &&
      correspondeStatus &&
      correspondeOrigem &&
      correspondeSetor &&
      correspondePrioridade &&
      correspondeTipo &&
      correspondeAtalho
    );
  });

  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / ITENS_POR_PAGINA));
  const indiceInicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const indiceFim = indiceInicio + ITENS_POR_PAGINA;
  const listaPaginada = listaFiltrada.slice(indiceInicio, indiceFim);

  const temFiltroAtivo =
    Boolean(busca) ||
    atalhoFiltro !== "todas" ||
    Object.values(filtros).some(Boolean);

  const limparFiltros = () => {
    setBusca("");
    setAtalhoFiltro("todas");
    setFiltros({
      status: "",
      origem: "",
      setor: "",
      prioridade: "",
      tipo: "",
    });
  };

  return (
    <Shell>
      <section className={styles.conteudo}>
        {/* TOPO DA PÁGINA */}
        <div className={styles.tituloPagina}>
          <div>
            <h1>Ocorrências</h1>
            <p>
              Detecções automáticas de EPI por IA e registros manuais de não conformidade.
            </p>
          </div>
          <button
            type="button"
            className={styles.registrar}
            onClick={() => router.push("/cadastrarOcorrencia")}
          >
            <span>+</span> Registrar ocorrência
          </button>
        </div>

        {/* BARRA DE RESUMO */}
        <div className={styles.barraResumo}>
          <div className={styles.cardResumo}>
            <span>Total de ocorrências</span>
            <strong>{carregando ? "—" : resumoGeral.total}</strong>
          </div>

          <div className={`${styles.cardResumo} ${styles.resumoAbertas}`}>
            <span>Em aberto (pendentes)</span>
            <strong>{carregando ? "—" : resumoGeral.abertas}</strong>
          </div>

          <div
            className={`${styles.cardResumo} ${
              resumoGeral.altas > 0 ? styles.resumoAlta : ""
            }`}
          >
            <span>Prioridade alta</span>
            <strong>{carregando ? "—" : resumoGeral.altas}</strong>
          </div>

          <div className={styles.cardResumo}>
            <span>Detectadas por IA</span>
            <strong>{carregando ? "—" : resumoGeral.porIa}</strong>
          </div>
        </div>

        {/* PAINEL DE FILTROS */}
        <div className={styles.painelFiltros}>
          <div className={styles.filtrosRapidos}>
            {[
              { id: "todas", label: `Todas (${resumoGeral.total})` },
              { id: "abertas", label: `Em aberto (${resumoGeral.abertas})` },
              { id: "alta", label: `Prioridade alta (${resumoGeral.altas})` },
              { id: "ia", label: `Detectadas por IA (${resumoGeral.porIa})` },
              { id: "sem_id", label: `Aguardando ID (${resumoGeral.semId})` },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={`${styles.chipFiltro} ${
                  atalhoFiltro === chip.id ? styles.chipFiltroAtivo : ""
                }`}
                onClick={() => setAtalhoFiltro(chip.id)}
              >
                {chip.label}
              </button>
            ))}

            {temFiltroAtivo && (
              <button
                type="button"
                className={styles.botaoLimpar}
                onClick={limparFiltros}
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div className={styles.filtros}>
            <div className={styles.campoBuscaWrapper}>
              <svg
                className={styles.iconeBusca}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por ID, funcionário, EPI ou setor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              {busca && (
                <button
                  type="button"
                  className={styles.limparBusca}
                  onClick={() => setBusca("")}
                  title="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>

            <select name="status" value={filtros.status} onChange={alterarFiltro}>
              <option value="">Todos os status</option>
              {opcoesStatus.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>

            <select name="origem" value={filtros.origem} onChange={alterarFiltro}>
              <option value="">Todas as origens</option>
              {opcoesOrigem.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>

            <select name="setor" value={filtros.setor} onChange={alterarFiltro}>
              <option value="">Todos os setores</option>
              {opcoesSetor.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>

            <select
              name="prioridade"
              value={filtros.prioridade}
              onChange={alterarFiltro}
            >
              <option value="">Todas as prioridades</option>
              {opcoesPrioridade.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>

            <select name="tipo" value={filtros.tipo} onChange={alterarFiltro}>
              <option value="">Todos os tipos</option>
              {opcoesTipo.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABELA DE OCORRÊNCIAS */}
        <div className={styles.painelTabela}>
          <div className={styles.topoTabela}>
            <p className={styles.quantidade}>
              {carregando ? (
                "Carregando..."
              ) : listaFiltrada.length === 0 ? (
                "0 ocorrências"
              ) : (
                <>
                  Mostrando{" "}
                  <strong>
                    {indiceInicio + 1}–{Math.min(indiceFim, listaFiltrada.length)}
                  </strong>{" "}
                  de <strong>{listaFiltrada.length}</strong> ocorrências
                </>
              )}
            </p>

            {!carregando && listaFiltrada.length > ITENS_POR_PAGINA && (
              <div className={styles.paginacao}>
                <button
                  type="button"
                  className={styles.botaoPagina}
                  disabled={paginaAtual === 1}
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  aria-label="Página anterior"
                >
                  ←
                </button>
                <span className={styles.infoPagina}>
                  Página <strong>{paginaAtual}</strong> de{" "}
                  <strong>{totalPaginas}</strong>
                </span>
                <button
                  type="button"
                  className={styles.botaoPagina}
                  disabled={paginaAtual === totalPaginas}
                  onClick={() =>
                    setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                  }
                  aria-label="Próxima página"
                >
                  →
                </button>
              </div>
            )}
          </div>

          <div className={styles.tabelaScroll}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>FUNCIONÁRIO</th>
                  <th>OCORRÊNCIA / EPI</th>
                  <th>SETOR</th>
                  <th>ORIGEM</th>
                  <th>PRIORIDADE</th>
                  <th>STATUS</th>
                  <th>DATA / HORA</th>
                  <th style={{ width: "32px" }} />
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan="9" className={styles.vazio}>
                      Carregando ocorrências...
                    </td>
                  </tr>
                ) : listaPaginada.length > 0 ? (
                  listaPaginada.map((item) => (
                    <tr
                      key={item.id}
                      className={styles.linhaClicavel}
                      onClick={() => abrirDetalhes(item.id)}
                    >
                      <td className={styles.id}>
                        #{String(item.id).padStart(4, "0")}
                      </td>
                      <td>
                        <span
                          className={
                            item.identificado
                              ? styles.funcIdentificado
                              : styles.funcPendente
                          }
                        >
                          {item.funcionario}
                        </span>
                      </td>
                      <td>
                        <div className={styles.celulaTipo}>
                          <strong>{item.tipo}</strong>
                          {item.epi && (
                            <span className={styles.subEpi}>EPI: {item.epi}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={styles.badgeSetor}>📍 {item.setor}</span>
                      </td>
                      <td>
                        <span
                          className={`${styles.etiqueta} ${
                            String(item.origem).toUpperCase().includes("IA")
                              ? styles.origemIa
                              : styles.origemManual
                          }`}
                        >
                          {item.origem}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.etiqueta} ${
                            styles[`prio_${item.nivelPrioridade}`]
                          }`}
                        >
                          {item.prioridade}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.badgeStatus} ${
                            item.aberta ? styles.statusAberta : styles.statusFechada
                          }`}
                        >
                          <span className={styles.pontoStatus} />
                          {item.status}
                        </span>
                      </td>
                      <td className={styles.dataHora}>{item.dataHora}</td>
                      <td className={styles.colunaSeta}>→</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className={styles.vazio}>
                      Nenhuma ocorrência encontrada para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINAÇÃO NO RODAPÉ DA TABELA */}
          {!carregando && listaFiltrada.length > ITENS_POR_PAGINA && (
            <div className={styles.rodapePaginacao}>
              <span className={styles.quantidade}>
                Exibindo {ITENS_POR_PAGINA} registros por página
              </span>

              <div className={styles.paginacao}>
                <button
                  type="button"
                  className={styles.botaoPagina}
                  disabled={paginaAtual === 1}
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  aria-label="Página anterior"
                >
                  ← Anterior
                </button>
                <span className={styles.infoPagina}>
                  Página <strong>{paginaAtual}</strong> de{" "}
                  <strong>{totalPaginas}</strong>
                </span>
                <button
                  type="button"
                  className={styles.botaoPagina}
                  disabled={paginaAtual === totalPaginas}
                  onClick={() =>
                    setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                  }
                  aria-label="Próxima página"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>

        <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
      </section>
    </Shell>
  );
}