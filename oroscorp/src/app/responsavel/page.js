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

export default function ResponsaveisPage() {
  const router = useRouter();

  const [responsaveis, setResponsaveis] = useState([]);
  const [niveisAcesso, setNiveisAcesso] = useState([]);
  const [setores, setSetores] = useState([]);
  const [statusContaLista, setStatusContaLista] = useState([]);

  const [busca, setBusca] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState("");
  const [situacaoFiltro, setSituacaoFiltro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [resResp, resNiveis, resSetores, resStatusConta] =
          await Promise.all([
            fetch("/api/responsavel", { headers }),
            fetch("/api/nivel-acesso", { headers }).catch(() => null),
            fetch("/api/setor", { headers }).catch(() => null),
            fetch("/api/status-conta", { headers }).catch(() => null),
          ]);

        if (resResp.ok) {
          setResponsaveis(extrairLista(await resResp.json()));
        } else if (resResp.status === 404) {
          setResponsaveis([]);
        } else {
          const r = await resResp.json().catch(() => ({}));
          setErro(
            r.message || `Erro ${resResp.status} ao buscar responsáveis.`
          );
        }

        if (resNiveis && resNiveis.ok) {
          setNiveisAcesso(extrairLista(await resNiveis.json()));
        }
        if (resSetores && resSetores.ok) {
          setSetores(extrairLista(await resSetores.json()));
        }
        if (resStatusConta && resStatusConta.ok) {
          const listaStatus = extrairLista(await resStatusConta.json());
          listaStatus.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
          setStatusContaLista(listaStatus);
        }
      } catch (e) {
        console.error("Erro ao carregar responsáveis:", e);
        setErro("Não foi possível conectar ao servidor.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, nivelFiltro, situacaoFiltro]);

  // Helper para ler dados aninhados em `usuario` ou na raiz do objeto
  const obterUsuarioBase = (resp) => {
    if (Array.isArray(resp?.usuario) && resp.usuario.length > 0) {
      return resp.usuario[0];
    }
    if (resp?.usuario && typeof resp.usuario === "object") {
      return resp.usuario;
    }
    return resp || {};
  };

  const obterNome = (resp) => {
    const u = obterUsuarioBase(resp);
    return (
      u.nome ||
      resp.nome_responsavel ||
      `Responsável #${resp.id || resp.id_responsavel || ""}`
    );
  };

  const obterEmail = (resp) => {
    const u = obterUsuarioBase(resp);
    return u.email || resp.email_responsavel || "Não informado";
  };

  const obterCpf = (resp) => {
    const u = obterUsuarioBase(resp);
    return u.cpf || resp.cpf_responsavel || "—";
  };

  const obterFoto = (resp) => {
    const u = obterUsuarioBase(resp);
    const foto = u.foto || resp.foto_responsavel || resp.foto;
    if (
      foto &&
      typeof foto === "string" &&
      foto !== "sem-foto.png" &&
      foto.startsWith("http")
    ) {
      return foto;
    }
    return null;
  };

  const obterIniciais = (nome) => {
    if (!nome) return "?";
    const partes = nome.trim().split(" ").filter(Boolean);
    if (partes.length === 1) return partes[0][0].toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  const obterNivelAcesso = (resp) => {
    const u = obterUsuarioBase(resp);

    if (Array.isArray(u.nivel_acesso) && u.nivel_acesso.length > 0) {
      return u.nivel_acesso[0].nome || "Gestor";
    }
    if (u.nivel_acesso?.nome) return u.nivel_acesso.nome;
    if (typeof u.nivel_acesso === "string" && u.nivel_acesso.trim() !== "") {
      return u.nivel_acesso;
    }
    if (typeof resp.nivel_acesso === "string" && resp.nivel_acesso.trim() !== "") {
      return resp.nivel_acesso;
    }

    const idNivel = u.id_nivel_acesso ?? resp.id_nivel_acesso;
    if (idNivel) {
      const encontrado = niveisAcesso.find(
        (n) => Number(n.id || n.id_nivel_acesso) === Number(idNivel)
      );
      if (encontrado?.nome) return encontrado.nome;
    }

    return "Gestor";
  };

  const obterSetoresVinculados = (resp) => {
    const idResp = Number(resp.id || resp.id_responsavel);

    if (Array.isArray(resp.setor) && resp.setor.length > 0) {
      return resp.setor.map((s) => s.nome).filter(Boolean).join(", ");
    }
    if (resp.setor?.nome) return resp.setor.nome;

    const vinculados = setores
      .filter((s) => {
        if (Array.isArray(s.responsavel)) {
          return s.responsavel.some(
            (r) => Number(r.id || r.id_responsavel) === idResp
          );
        }
        return Number(s.id_responsavel) === idResp;
      })
      .map((s) => s.nome)
      .filter(Boolean);

    return vinculados.length > 0 ? vinculados.join(", ") : "Geral";
  };

  const obterStatusResponsavel = (resp) => {
    const u = obterUsuarioBase(resp);
    let texto = "";
    let statusId =
      u.id_status_conta ??
      resp.id_status_conta ??
      u.id_status_usuario ??
      resp.id_status_usuario ??
      null;

    if (Array.isArray(u.status_conta) && u.status_conta.length > 0) {
      texto = u.status_conta[0].status || u.status_conta[0].nome || "";
      statusId = u.status_conta[0].id ?? statusId;
    } else if (u.status_conta && typeof u.status_conta === "object") {
      texto = u.status_conta.status || u.status_conta.nome || "";
      statusId = u.status_conta.id ?? statusId;
    } else if (typeof u.status_conta === "string") {
      texto = u.status_conta;
    } else if (typeof resp.status_conta === "string") {
      texto = resp.status_conta;
    } else if (typeof u.status === "string") {
      texto = u.status;
    }

    // Cruza com a lista vinda de /api/status-conta caso só venha o ID
    if (!texto && statusId !== null && statusContaLista.length > 0) {
      const encontrado = statusContaLista.find(
        (s) => Number(s.id || s.id_status_conta) === Number(statusId)
      );
      texto = encontrado?.status || encontrado?.nome || "";
    }

    const textoFinal = String(
      texto || (Number(statusId) === 2 ? "Inativo" : Number(statusId) === 3 ? "Bloqueado" : "Ativo")
    ).trim();

    const ativo =
      textoFinal.toLowerCase() === "ativo" ||
      (statusId !== null && Number(statusId) === 1);

    return {
      texto: textoFinal,
      ativo,
    };
  };

  // Garante que nenhum ADM apareça na lista nem nos cálculos
  const responsaveisSemAdm = useMemo(() => {
    return responsaveis.filter(
      (r) => obterNivelAcesso(r).trim().toUpperCase() !== "ADM"
    );
  }, [responsaveis, niveisAcesso]);

  const resumoGeral = useMemo(() => {
    return responsaveisSemAdm.reduce(
      (acc, r) => {
        const st = obterStatusResponsavel(r);
        acc.total += 1;
        if (st.ativo) acc.ativos += 1;
        else acc.inativos += 1;
        return acc;
      },
      { total: 0, ativos: 0, inativos: 0 }
    );
  }, [responsaveisSemAdm, statusContaLista]);

  // Remove "ADM" das opções do select de filtro
  const opcoesNiveis = (
    niveisAcesso.length > 0
      ? niveisAcesso.map((n) => n.nome).filter(Boolean)
      : [
          ...new Set(
            responsaveisSemAdm.map((r) => obterNivelAcesso(r)).filter(Boolean)
          ),
        ]
  ).filter((nome) => nome.trim().toUpperCase() !== "ADM");

  // Opções dinâmicas de situação vindas de /api/status-conta
  const opcoesSituacoes =
    statusContaLista.length > 0
      ? statusContaLista.map((st) => st.status || st.nome).filter(Boolean)
      : ["Ativo", "Inativo", "Bloqueado"];

  const responsaveisFiltrados = responsaveisSemAdm.filter((resp) => {
    const termo = busca.trim().toLowerCase();
    const nome = obterNome(resp).toLowerCase();
    const email = obterEmail(resp).toLowerCase();
    const cpf = obterCpf(resp).toLowerCase();
    const idStr = String(resp.id || resp.id_responsavel || "").toLowerCase();
    const nivel = obterNivelAcesso(resp);
    const setor = obterSetoresVinculados(resp).toLowerCase();

    const bateBusca =
      !termo ||
      nome.includes(termo) ||
      email.includes(termo) ||
      cpf.includes(termo) ||
      idStr.includes(termo) ||
      nivel.toLowerCase().includes(termo) ||
      setor.includes(termo);

    const bateNivel =
      !nivelFiltro ||
      nivel.trim().toLowerCase() === nivelFiltro.trim().toLowerCase();

    const statusResp = obterStatusResponsavel(resp);
    const bateSituacao =
      !situacaoFiltro ||
      statusResp.texto.trim().toLowerCase() ===
        situacaoFiltro.trim().toLowerCase();

    return bateBusca && bateNivel && bateSituacao;
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(responsaveisFiltrados.length / ITENS_POR_PAGINA)
  );
  const indiceInicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const indiceFim = indiceInicio + ITENS_POR_PAGINA;
  const responsaveisPaginados = responsaveisFiltrados.slice(
    indiceInicio,
    indiceFim
  );

  const temFiltroAtivo =
    Boolean(busca) || Boolean(nivelFiltro) || Boolean(situacaoFiltro);

  const limparFiltros = () => {
    setBusca("");
    setNivelFiltro("");
    setSituacaoFiltro("");
  };

  return (
    <Shell>
      <main className={styles.conteudo}>
        {/* TOPO DA PÁGINA */}
        <div className={styles.topoPagina}>
          <div>
            <h1 className={styles.titulo}>Responsáveis</h1>
            <p className={styles.sub}>
              Gestores cadastrados para supervisão de setores e acompanhamento de ocorrências.
            </p>
          </div>

          <button
            type="button"
            className={styles.botao}
            onClick={() => router.push("/cadastrarGestor")}
          >
            <span>+</span> Cadastrar gestor
          </button>
        </div>

        {/* BARRA DE RESUMO */}
        <div className={styles.barraResumo}>
          <div className={styles.cardResumo}>
            <span>Total de responsáveis</span>
            <strong>{carregando ? "—" : resumoGeral.total}</strong>
          </div>

          <div className={`${styles.cardResumo} ${styles.resumoAtivos}`}>
            <span>Contas ativas</span>
            <strong>{carregando ? "—" : resumoGeral.ativos}</strong>
          </div>

          <div className={styles.cardResumo}>
            <span>Inativas / Bloqueadas</span>
            <strong>{carregando ? "—" : resumoGeral.inativos}</strong>
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
                placeholder="Buscar por nome, e-mail, CPF, nível de acesso ou setor..."
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
              value={nivelFiltro}
              onChange={(e) => setNivelFiltro(e.target.value)}
            >
              <option value="">Todos os níveis de acesso</option>
              {opcoesNiveis.map((nomeNivel, idx) => (
                <option key={idx} value={nomeNivel}>
                  {nomeNivel}
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
              className={`${styles.chipFiltro} ${
                !situacaoFiltro && !nivelFiltro ? styles.chipFiltroAtivo : ""
              }`}
              onClick={limparFiltros}
            >
              Todos ({resumoGeral.total})
            </button>

            {opcoesSituacoes.map((nomeSituacao, idx) => {
              const ativoChip =
                situacaoFiltro.trim().toLowerCase() ===
                nomeSituacao.trim().toLowerCase();
              const qtd = responsaveisSemAdm.filter(
                (r) =>
                  obterStatusResponsavel(r).texto.trim().toLowerCase() ===
                  nomeSituacao.trim().toLowerCase()
              ).length;

              return (
                <button
                  key={idx}
                  type="button"
                  className={`${styles.chipFiltro} ${
                    ativoChip ? styles.chipFiltroAtivo : ""
                  }`}
                  onClick={() => {
                    setSituacaoFiltro(ativoChip ? "" : nomeSituacao);
                    setNivelFiltro("");
                  }}
                >
                  {nomeSituacao} ({qtd})
                </button>
              );
            })}

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

        {/* TABELA DE RESPONSÁVEIS */}
        <div className={styles.painel}>
          <div className={styles.cabecalhoTabela}>
            <span className={styles.contadorResultados}>
              {carregando ? (
                "Carregando..."
              ) : responsaveisFiltrados.length === 0 ? (
                "0 responsáveis"
              ) : (
                <>
                  Mostrando{" "}
                  <strong>
                    {indiceInicio + 1}–
                    {Math.min(indiceFim, responsaveisFiltrados.length)}
                  </strong>{" "}
                  de <strong>{responsaveisFiltrados.length}</strong>{" "}
                  {responsaveisFiltrados.length === 1
                    ? "responsável"
                    : "responsáveis"}
                </>
              )}
            </span>

            {!carregando && responsaveisFiltrados.length > ITENS_POR_PAGINA && (
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
                  <th>Responsável</th>
                  <th>ID</th>
                  <th>E-mail</th>
                  <th>Nível de Acesso</th>
                  <th>Setores</th>
                  <th>Situação</th>
                  <th style={{ width: "36px" }} />
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={7} className={styles.vazio}>
                      Carregando responsáveis...
                    </td>
                  </tr>
                ) : responsaveisPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.vazio}>
                      Nenhum responsável encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  responsaveisPaginados.map((resp) => {
                    const id = resp.id || resp.id_responsavel;
                    const nome = obterNome(resp);
                    const foto = obterFoto(resp);
                    const email = obterEmail(resp);
                    const nivel = obterNivelAcesso(resp);
                    const setoresResp = obterSetoresVinculados(resp);
                    const statusResp = obterStatusResponsavel(resp);

                    return (
                      <tr
                        key={id}
                        className={styles.linhaClicavel}
                        onClick={() => router.push(`/responsavel/${id}`)}
                      >
                        <td>
                          <div className={styles.perfilRow}>
                            {foto ? (
                              <img
                                src={foto}
                                alt={nome}
                                className={styles.avatar}
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <span className={styles.avatar}>
                                {obterIniciais(nome)}
                              </span>
                            )}
                            <div className={styles.infoNome}>
                              <span className={styles.nomePrincipal}>
                                {nome}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.matriculaCodigo}>#{id}</span>
                        </td>
                        <td>{email}</td>
                        <td>
                          <span className={styles.badgePequeno}>
                            🛡️ {nivel}
                          </span>
                        </td>
                        <td>
                          <span className={styles.badgePequeno}>
                            📍 {setoresResp}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.badgeContainer} ${
                              statusResp.ativo
                                ? styles.badgeVerde
                                : styles.badgeVermelho
                            }`}
                          >
                            <span className={styles.dot} />
                            {statusResp.texto}
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

          {!carregando && responsaveisFiltrados.length > ITENS_POR_PAGINA && (
            <div className={styles.rodapePaginacao}>
              <span className={styles.contadorResultados}>
                Exibindo {ITENS_POR_PAGINA} responsáveis por página
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