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

export default function EpisPage() {
  const router = useRouter();

  const [epis, setEpis] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [corFiltro, setCorFiltro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [resEpis, resCategorias] = await Promise.all([
          fetch("/api/epi", { headers }),
          fetch("/api/categoria-epi", { headers }).catch(() => null),
        ]);

        if (resEpis.ok) {
          setEpis(extrairLista(await resEpis.json()));
        } else if (resEpis.status === 404) {
          setEpis([]);
        } else {
          const r = await resEpis.json().catch(() => ({}));
          setErro(r.message ?? `Erro ${resEpis.status} ao buscar EPIs.`);
        }

        if (resCategorias && resCategorias.ok) {
          setCategorias(extrairLista(await resCategorias.json()));
        }
      } catch (e) {
        console.error("Erro ao carregar EPIs:", e);
        setErro("Não foi possível conectar ao servidor.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, categoriaFiltro, corFiltro]);

  const obterCategoriaNome = (epi) => {
    if (Array.isArray(epi.categoria) && epi.categoria.length > 0) {
      return (
        epi.categoria[0].categoria ??
        epi.categoria[0].nome ??
        "Sem categoria"
      );
    }
    if (epi.categoria && typeof epi.categoria === "object") {
      return epi.categoria.categoria ?? epi.categoria.nome ?? "Sem categoria";
    }
    if (typeof epi.categoria === "string" && epi.categoria.trim() !== "") {
      return epi.categoria;
    }
    if (epi.categoria_epi) {
      return String(epi.categoria_epi);
    }

    const idCat = epi.id_categoria ?? epi.ID_categoria;
    if (idCat && categorias.length > 0) {
      const encontrada = categorias.find(
        (c) => Number(c.id ?? c.id_categoria) === Number(idCat)
      );
      if (encontrada) {
        return encontrada.categoria ?? encontrada.nome ?? "Sem categoria";
      }
    }

    return "Geral";
  };

  const obterFoto = (epi) => {
    const foto = epi.foto ?? epi.imagem;
    if (
      foto &&
      typeof foto === "string" &&
      foto !== "sem-foto.png" &&
      (foto.startsWith("http") || foto.startsWith("/"))
    ) {
      return foto;
    }
    return null;
  };

  const opcoesCategorias = useMemo(() => {
    const lista =
      categorias.length > 0
        ? categorias
            .map((c) => c.categoria ?? c.nome)
            .filter(Boolean)
        : [...new Set(epis.map((e) => obterCategoriaNome(e)).filter(Boolean))];

    return [...new Set(lista)];
  }, [categorias, epis]);

  const opcoesCores = useMemo(() => {
    return [
      ...new Set(
        epis
          .map((e) => String(e.cor ?? "").trim())
          .filter(Boolean)
      ),
    ];
  }, [epis]);

  const episFiltradas = epis.filter((epi) => {
    const termo = busca.trim().toLowerCase();
    const nome = String(epi.nome ?? "").toLowerCase();
    const descricao = String(epi.descricao ?? "").toLowerCase();
    const cor = String(epi.cor ?? "").toLowerCase();
    const idStr = String(epi.id ?? epi.id_epi ?? "").toLowerCase();
    const categoriaNome = obterCategoriaNome(epi);

    const bateBusca =
      !termo ||
      nome.includes(termo) ||
      descricao.includes(termo) ||
      cor.includes(termo) ||
      idStr.includes(termo) ||
      categoriaNome.toLowerCase().includes(termo);

    const bateCategoria =
      !categoriaFiltro ||
      categoriaNome.trim().toLowerCase() ===
        categoriaFiltro.trim().toLowerCase();

    const bateCor =
      !corFiltro ||
      cor.trim().toLowerCase() === corFiltro.trim().toLowerCase();

    return bateBusca && bateCategoria && bateCor;
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(episFiltradas.length / ITENS_POR_PAGINA)
  );
  const indiceInicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const indiceFim = indiceInicio + ITENS_POR_PAGINA;
  const episPaginadas = episFiltradas.slice(indiceInicio, indiceFim);

  const temFiltroAtivo =
    Boolean(busca) || Boolean(categoriaFiltro) || Boolean(corFiltro);

  const limparFiltros = () => {
    setBusca("");
    setCategoriaFiltro("");
    setCorFiltro("");
  };

  return (
    <Shell>
      <main className={styles.conteudo}>
        {/* TOPO DA PÁGINA */}
        <div className={styles.topoPagina}>
          <div>
            <h1 className={styles.titulo}>Equipamentos (EPIs)</h1>
            <p className={styles.sub}>
              Equipamentos de Proteção Individual cadastrados para monitoramento e segurança nos setores.
            </p>
          </div>

          <button
            type="button"
            className={styles.botao}
            onClick={() => router.push("/cadastroEPI")}
          >
            <span>+</span> Cadastrar EPI
          </button>
        </div>

        {/* BARRA DE RESUMO */}
        <div className={styles.barraResumo}>
          <div className={styles.cardResumo}>
            <span>Total de EPIs</span>
            <strong>{carregando ? "—" : epis.length}</strong>
          </div>

          <div className={`${styles.cardResumo} ${styles.resumoAtivos}`}>
            <span>Categorias cadastradas</span>
            <strong>{carregando ? "—" : opcoesCategorias.length}</strong>
          </div>

          <div className={styles.cardResumo}>
            <span>Exibindo na busca</span>
            <strong>{carregando ? "—" : episFiltradas.length}</strong>
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
                placeholder="Buscar por nome do EPI, descrição, cor ou categoria..."
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
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {opcoesCategorias.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className={styles.filtroSelect}
              value={corFiltro}
              onChange={(e) => setCorFiltro(e.target.value)}
            >
              <option value="">Todas as cores</option>
              {opcoesCores.map((cor, idx) => (
                <option key={idx} value={cor}>
                  {cor}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filtrosRapidos}>
            <button
              type="button"
              className={`${styles.chipFiltro} ${
                !categoriaFiltro && !corFiltro ? styles.chipFiltroAtivo : ""
              }`}
              onClick={limparFiltros}
            >
              Todos ({epis.length})
            </button>

            {opcoesCategorias.map((cat, idx) => {
              const ativoChip =
                categoriaFiltro.trim().toLowerCase() ===
                cat.trim().toLowerCase();
              const qtd = epis.filter(
                (e) =>
                  obterCategoriaNome(e).trim().toLowerCase() ===
                  cat.trim().toLowerCase()
              ).length;

              return (
                <button
                  key={idx}
                  type="button"
                  className={`${styles.chipFiltro} ${
                    ativoChip ? styles.chipFiltroAtivo : ""
                  }`}
                  onClick={() => {
                    setCategoriaFiltro(ativoChip ? "" : cat);
                    setCorFiltro("");
                  }}
                >
                  {cat} ({qtd})
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

        {/* TABELA DE EPIS */}
        <div className={styles.painel}>
          <div className={styles.cabecalhoTabela}>
            <span className={styles.contadorResultados}>
              {carregando ? (
                "Carregando..."
              ) : episFiltradas.length === 0 ? (
                "0 EPIs"
              ) : (
                <>
                  Mostrando{" "}
                  <strong>
                    {indiceInicio + 1}–
                    {Math.min(indiceFim, episFiltradas.length)}
                  </strong>{" "}
                  de <strong>{episFiltradas.length}</strong>{" "}
                  {episFiltradas.length === 1 ? "EPI" : "EPIs"}
                </>
              )}
            </span>

            {!carregando && episFiltradas.length > ITENS_POR_PAGINA && (
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
                  <th>Equipamento (EPI)</th>
                  <th>ID</th>
                  <th>Categoria</th>
                  <th>Cor</th>
                  <th>Descrição</th>
                  <th style={{ width: "36px" }} />
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={6} className={styles.vazio}>
                      Carregando EPIs...
                    </td>
                  </tr>
                ) : episPaginadas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.vazio}>
                      Nenhum EPI encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  episPaginadas.map((epi) => {
                    const id = epi.id ?? epi.id_epi;
                    const nome = epi.nome ?? `EPI #${id}`;
                    const foto = obterFoto(epi);
                    const categoria = obterCategoriaNome(epi);
                    const cor = epi.cor ?? "Não informada";
                    const descricao = epi.descricao ?? "—";

                    return (
                      <tr
                        key={id}
                        className={styles.linhaClicavel}
                        onClick={() => router.push(`/epis/${id}`)}
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
                              <span className={styles.avatar}>🦺</span>
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
                        <td>
                          <span className={styles.badgePequeno}>
                            🏷️ {categoria}
                          </span>
                        </td>
                        <td>
                          <span className={styles.badgePequeno}>🎨 {cor}</span>
                        </td>
                        <td
                          style={{
                            maxWidth: "320px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            color: "#9aa2ac",
                          }}
                          title={descricao}
                        >
                          {descricao}
                        </td>
                        <td className={styles.colunaSeta}>→</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!carregando && episFiltradas.length > ITENS_POR_PAGINA && (
            <div className={styles.rodapePaginacao}>
              <span className={styles.contadorResultados}>
                Exibindo {ITENS_POR_PAGINA} EPIs por página
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