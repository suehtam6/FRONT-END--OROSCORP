"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import Popup from "../components/Popup";
import styles from "../style/funcionario.module.css";

const ITENS_POR_PAGINA = 20;

function extrairLista(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.response?.dados)) return json.response.dados;
  if (Array.isArray(json?.response)) return json.response;
  if (Array.isArray(json?.dados)) return json.dados;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

export default function FuncionariosPage() {
  const router = useRouter();

  const [funcionarios, setFuncionarios] = useState([]);
  const [setores, setSetores] = useState([]);
  const [statusFuncionarioLista, setStatusFuncionarioLista] = useState([]);
  const [busca, setBusca] = useState("");
  const [setorFiltro, setSetorFiltro] = useState("");
  const [situacaoFiltro, setSituacaoFiltro] = useState("");
  const [somenteComOcorrencias, setSomenteComOcorrencias] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [resFunc, resSetor, resStat] = await Promise.all([
          fetch("/api/funcionario/dados", { headers }),
          fetch("/api/setor", { headers }),
          fetch("/api/funcionario/status_funcionario", { headers }),
        ]);

        if (resFunc.ok) {
          setFuncionarios(extrairLista(await resFunc.json()));
        } else if (resFunc.status === 404) {
          setFuncionarios([]);
        } else {
          const r = await resFunc.json().catch(() => ({}));
          setErro(
            r.message || `Erro ${resFunc.status} ao buscar funcionários.`
          );
        }

        if (resSetor.ok) setSetores(extrairLista(await resSetor.json()));
        if (resStat.ok)
          setStatusFuncionarioLista(extrairLista(await resStat.json()));
      } catch (e) {
        console.error("Erro ao carregar funcionários:", e);
        setErro("Não foi possível conectar ao servidor.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, setorFiltro, situacaoFiltro, somenteComOcorrencias]);

  const obterIniciais = (nome) => {
    if (!nome) return "?";
    const partes = nome.trim().split(" ");
    if (partes.length === 1) return partes[0][0].toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  const obterNomeCargo = (func) => {
    if (Array.isArray(func.cargo) && func.cargo.length > 0) {
      return func.cargo[0].cargo || func.cargo[0].nome || "Não informado";
    }
    if (typeof func.cargo === "string" && func.cargo.trim() !== "")
      return func.cargo;
    return func.funcao || "Não informado";
  };

  const obterNomeSetor = (func) => {
    if (Array.isArray(func.setor) && func.setor.length > 0) {
      return func.setor[0].nome || "Sem setor";
    }
    if (func.setor?.nome) return func.setor.nome;
    if (typeof func.setor === "string" && func.setor.trim() !== "")
      return func.setor;

    const setorEncontrado = setores.find(
      (s) => Number(s.id || s.id_setor) === Number(func.id_setor)
    );
    return setorEncontrado?.nome || setorEncontrado?.descricao || "Sem setor";
  };

  const obterStatusFuncionario = (func) => {
    let texto = "";
    let statusId = func.id_status_funcionario ?? null;

    if (
      Array.isArray(func.status_funcionario) &&
      func.status_funcionario.length > 0
    ) {
      const st = func.status_funcionario[0];
      texto = st.status || st.nome || "";
      statusId = st.id ?? statusId;
    } else if (
      func.status_funcionario &&
      typeof func.status_funcionario === "object"
    ) {
      texto =
        func.status_funcionario.status || func.status_funcionario.nome || "";
      statusId = func.status_funcionario.id ?? statusId;
    } else if (typeof func.status_funcionario === "string") {
      texto = func.status_funcionario;
    }

    if (!texto && statusId !== null) {
      const encontrado = statusFuncionarioLista.find(
        (s) => Number(s.id || s.id_status_funcionario) === Number(statusId)
      );
      texto = encontrado?.status || encontrado?.nome || "";
    }

    const textoFinal = String(texto || "Inativo").trim();
    const ativo =
      textoFinal.toLowerCase() === "ativo" || Number(statusId) === 1;

    return {
      texto: textoFinal,
      ativo,
    };
  };

  const obterQtdOcorrencias = (func) =>
    Number(
      func.ocorrencias_abertas ??
      func.total_ocorrencias ??
      func.ocorrencias ??
      0
    );

  const resumoGeral = useMemo(() => {
    return funcionarios.reduce(
      (acc, f) => {
        const st = obterStatusFuncionario(f);
        const oco = obterQtdOcorrencias(f);
        acc.total += 1;
        if (st.ativo) acc.ativos += 1;
        else acc.inativos += 1;
        if (oco > 0) acc.comOcorrencias += 1;
        return acc;
      },
      { total: 0, ativos: 0, inativos: 0, comOcorrencias: 0 }
    );
  }, [funcionarios, statusFuncionarioLista]);

  const opcoesSetores =
    setores.length > 0
      ? setores.map((s) => s.nome || s.descricao).filter(Boolean)
      : [
        ...new Set(
          funcionarios
            .map((f) => obterNomeSetor(f))
            .filter((n) => n !== "Sem setor")
        ),
      ];

  const opcoesSituacoes =
    statusFuncionarioLista.length > 0
      ? statusFuncionarioLista.map((st) => st.status || st.nome).filter(Boolean)
      : ["Ativo", "Inativo"];

  const funcionariosFiltrados = funcionarios.filter((func) => {
    const termo = busca.trim().toLowerCase();
    const nome = (func.nome || "").toLowerCase();
    const matricula = String(
      func.matricula || func.id || func.id_funcionario || ""
    ).toLowerCase();
    const cargo = obterNomeCargo(func).toLowerCase();
    const setor = obterNomeSetor(func).toLowerCase();

    const bateBusca =
      !termo ||
      nome.includes(termo) ||
      matricula.includes(termo) ||
      cargo.includes(termo) ||
      setor.includes(termo);

    const nomeSetor = obterNomeSetor(func);
    const bateSetor =
      !setorFiltro ||
      nomeSetor.trim().toLowerCase() === setorFiltro.trim().toLowerCase();

    const statusFunc = obterStatusFuncionario(func);
    const bateSituacao =
      !situacaoFiltro ||
      statusFunc.texto.trim().toLowerCase() ===
      situacaoFiltro.trim().toLowerCase();

    const bateOcorrencia =
      !somenteComOcorrencias || obterQtdOcorrencias(func) > 0;

    return bateBusca && bateSetor && bateSituacao && bateOcorrencia;
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(funcionariosFiltrados.length / ITENS_POR_PAGINA)
  );
  const indiceInicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const indiceFim = indiceInicio + ITENS_POR_PAGINA;
  const funcionariosPaginados = funcionariosFiltrados.slice(
    indiceInicio,
    indiceFim
  );

  const temFiltroAtivo =
    Boolean(busca) ||
    Boolean(setorFiltro) ||
    Boolean(situacaoFiltro) ||
    somenteComOcorrencias;

  const limparFiltros = () => {
    setBusca("");
    setSetorFiltro("");
    setSituacaoFiltro("");
    setSomenteComOcorrencias(false);
  };

  return (
    <Shell>
      <main className={styles.conteudo}>
        {/* TOPO DA PÁGINA */}
        <div className={styles.topoPagina}>
          <div>
            <h1 className={styles.titulo}>Funcionários</h1>
            <p className={styles.sub}>
              Cadastro de colaboradores, alocação por setor e acompanhamento de conformidade com EPIs.
            </p>
          </div>

          <button
            type="button"
            className={styles.botao}
            onClick={() => router.push("/cadastrarFuncionario")}
          >
            <span>+</span> Cadastrar funcionário
          </button>
        </div>

        {/* BARRA DE RESUMO */}
        <div className={styles.barraResumo}>
          <div className={styles.cardResumo}>
            <span>Total de colaboradores</span>
            <strong>{carregando ? "—" : resumoGeral.total}</strong>
          </div>

          <div className={`${styles.cardResumo} ${styles.resumoAtivos}`}>
            <span>Colaboradores ativos</span>
            <strong>{carregando ? "—" : resumoGeral.ativos}</strong>
          </div>

          <div className={styles.cardResumo}>
            <span>Inativos / Afastados</span>
            <strong>{carregando ? "—" : resumoGeral.inativos}</strong>
          </div>

          <div
            className={`${styles.cardResumo} ${resumoGeral.comOcorrencias > 0 ? styles.resumoAlerta : ""
              }`}
          >
            <span>Com ocorrências abertas</span>
            <strong>{carregando ? "—" : resumoGeral.comOcorrencias}</strong>
          </div>
        </div>

        {/* PAINEL DE BUSCA E FILTROS */}
        <div className={`${styles.painel} ${styles.painelTopo}`}>
          <div className={styles.barraFiltros}>
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
                className={styles.busca}
                placeholder="Buscar por nome, matrícula, cargo ou setor..."
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

            <select
              className={styles.filtroSelect}
              value={setorFiltro}
              onChange={(e) => setSetorFiltro(e.target.value)}
            >
              <option value="">Todos os setores</option>
              {opcoesSetores.map((nomeSetor, idx) => (
                <option key={idx} value={nomeSetor}>
                  {nomeSetor}
                </option>
              ))}
            </select>

            <select
              className={styles.filtroSelect}
              value={situacaoFiltro}
              onChange={(e) => setSituacaoFiltro(e.target.value)}
            >
              <option value="">Todas as situações</option>
              {opcoesSituacoes.map((nomeSituacao, idx) => (
                <option key={idx} value={nomeSituacao}>
                  {nomeSituacao}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filtrosRapidos}>
            <button
              type="button"
              className={`${styles.chipFiltro} ${!situacaoFiltro && !somenteComOcorrencias
                  ? styles.chipFiltroAtivo
                  : ""
                }`}
              onClick={() => {
                setSituacaoFiltro("");
                setSomenteComOcorrencias(false);
              }}
            >
              Todos ({resumoGeral.total})
            </button>

            <button
              type="button"
              className={`${styles.chipFiltro} ${situacaoFiltro.toLowerCase() === "ativo"
                  ? styles.chipFiltroAtivo
                  : ""
                }`}
              onClick={() => {
                setSituacaoFiltro("Ativo");
                setSomenteComOcorrencias(false);
              }}
            >
              Ativos ({resumoGeral.ativos})
            </button>

            <button
              type="button"
              className={`${styles.chipFiltro} ${somenteComOcorrencias ? styles.chipFiltroAtivo : ""
                }`}
              onClick={() => {
                setSomenteComOcorrencias(!somenteComOcorrencias);
                setSituacaoFiltro("");
              }}
            >
              Com ocorrências abertas ({resumoGeral.comOcorrencias})
            </button>

            {temFiltroAtivo && (
              <button
                type="button"
                className={styles.botaoLimparTudo}
                onClick={limparFiltros}
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* TABELA DE COLABORADORES */}
        <div className={styles.painel}>
          <div className={styles.cabecalhoTabela}>
            <span className={styles.contadorResultados}>
              {carregando ? (
                "Carregando..."
              ) : funcionariosFiltrados.length === 0 ? (
                "0 colaboradores"
              ) : (
                <>
                  Mostrando{" "}
                  <strong>
                    {indiceInicio + 1}–
                    {Math.min(indiceFim, funcionariosFiltrados.length)}
                  </strong>{" "}
                  de <strong>{funcionariosFiltrados.length}</strong>{" "}
                  {funcionariosFiltrados.length === 1
                    ? "colaborador"
                    : "colaboradores"}
                </>
              )}
            </span>

            {!carregando && funcionariosFiltrados.length > ITENS_POR_PAGINA && (
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

          <div className={styles.rolagem}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Matrícula</th>
                  <th>Cargo</th>
                  <th>Setor</th>
                  <th>Situação</th>
                  <th>Ocorr. Abertas</th>
                  <th style={{ width: "36px" }} />
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={7} className={styles.vazio}>
                      Carregando funcionários...
                    </td>
                  </tr>
                ) : funcionariosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.vazio}>
                      Nenhum funcionário encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  funcionariosPaginados.map((func) => {
                    const id = func.id || func.id_funcionario;
                    const cargoNome = obterNomeCargo(func);
                    const setorNome = obterNomeSetor(func);
                    const statusFunc = obterStatusFuncionario(func);
                    const ocorrenciasAbertas = obterQtdOcorrencias(func);

                    return (
                      <tr
                        key={id}
                        className={styles.linhaClicavel}
                        onClick={() => router.push(`/funcionarios/${id}`)}
                      >
                        <td>
                          <div className={styles.perfilRow}>
                            {func.foto ? (
                              <img
                                src={func.foto}
                                alt={func.nome}
                                className={styles.avatar}
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <span className={styles.avatar}>
                                {obterIniciais(func.nome)}
                              </span>
                            )}
                            <div className={styles.infoNome}>
                              <span className={styles.nomePrincipal}>
                                {func.nome}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.matriculaCodigo}>
                            #{func.matricula || id}
                          </span>
                        </td>
                        <td>{cargoNome}</td>
                        <td>
                          <span className={styles.badgePequeno}>
                            📍 {setorNome}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.badgeContainer} ${statusFunc.ativo
                                ? styles.badgeVerde
                                : styles.badgeVermelho
                              }`}
                          >
                            <span className={styles.dot} />
                            {statusFunc.texto}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.badgeOcorrencia} ${ocorrenciasAbertas > 0
                                ? styles.badgeOcorrenciaAlerta
                                : styles.badgeOcorrenciaZero
                              }`}
                          >
                            {ocorrenciasAbertas}
                          </span>
                        </td>
                        <td className={styles.colunaSeta}>→</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!carregando && funcionariosFiltrados.length > ITENS_POR_PAGINA && (
            <div className={styles.rodapePaginacao}>
              <span className={styles.contadorResultados}>
                Exibindo {ITENS_POR_PAGINA} colaboradores por página
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
      </main>
    </Shell>
  );
}