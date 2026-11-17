"use client";

/*
Data: 9 de Outubro de 2026
Objetivo: Estilização da página de setores
Autor: João Pedro e Kaique Carvalho

Autor do JS: Matheus Lucas
Data: 16 de Novembro de 2026
Objetivo: Tela de setores dinâmica com resumo geral, busca, filtros e paginação
*/

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell.js";
import styles from "../style/setores.module.css";

const SETORES_POR_PAGINA = 12;

function Icone({ tipo }) {
  if (tipo === "funcionarios") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="7" r="3" />
        <path d="M3 19v-2a6 6 0 0 1 12 0v2H3Z" />
        <path d="M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5h-3" />
      </svg>
    );
  }

  if (tipo === "cameras") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="6" width="13" height="12" rx="2" />
        <path d="m16 10 5-3v10l-5-3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 22 20H2L12 3Z" />
      <path d="M12 9v5m0 3v.1" />
    </svg>
  );
}

function Indicador({ tipo, valor, legenda, destaque }) {
  return (
    <div
      className={`${styles.indicador} ${
        destaque ? styles.indicadorAlertaAtivo : ""
      }`}
    >
      <div className={styles.topoIndicador}>
        <span
          className={`${styles.icone} ${
            tipo === "alertas" ? styles.iconeAlerta : ""
          }`}
        >
          <Icone tipo={tipo} />
        </span>

        <strong
          className={tipo === "alertas" && destaque ? styles.valorAlerta : ""}
        >
          {valor}
        </strong>
      </div>

      <span className={styles.legenda}>{legenda}</span>
    </div>
  );
}

function ImagemSetor({ foto, nome, status, abertas }) {
  const [falhou, setFalhou] = useState(false);

  const srcValido =
    foto && !falhou
      ? foto.startsWith("http") ||
        foto.startsWith("/") ||
        foto.startsWith("data:")
        ? foto
        : `/${foto}`
      : null;

  const isInativo = String(status || "").toLowerCase().includes("inativ");

  return (
    <div className={styles.capaSetor}>
      {srcValido ? (
        <img
          src={srcValido}
          alt={`Setor ${nome}`}
          onError={() => setFalhou(true)}
          className={styles.imagemCapa}
        />
      ) : (
        <div className={styles.placeholderCapa}>
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          </svg>
          <span>Sem imagem do setor</span>
        </div>
      )}

      <div className={styles.gradienteCapa} />

      <div className={styles.badgesCapa}>
        <span
          className={`${styles.badgeStatus} ${
            isInativo ? styles.badgeInativo : styles.badgeAtivo
          }`}
        >
          <span className={styles.pontoStatus} />
          {isInativo ? "Inativo" : "Ativo"}
        </span>

        {abertas > 0 && (
          <span className={styles.badgeAlertaCapa}>
            {abertas} {abertas === 1 ? "alerta" : "alertas"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Setores() {
  const router = useRouter();

  const [listaSetores, setListaSetores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const mapearSetorBD = (item) => ({
    id: item.ID_setor || item.id,
    nome: item.Nome_setor || item.nome || "Sem nome",
    descricao:
      item.Descricao_setor || item.descricao || "Sem descrição disponível.",
    local: item.Local_setor || item.local || "",
    status: item.Status_setor || item.status || "Ativo",
    foto: item.Foto_setor || item.foto || null,
    funcionarios: Number(item.Total_funcionarios ?? 0),
    cameras: Number(item.Total_cameras ?? 0),
    abertas: Number(item.Total_ocorrencias_abertas ?? 0),
  });

  useEffect(() => {
    async function carregarSetores() {
      setCarregando(true);
      setErro("");
      try {
        const res = await fetch("/api/setor/dados", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();

          let dadosBrutos = [];
          if (Array.isArray(json)) {
            dadosBrutos = json;
          } else if (json.response?.ocorrencia) {
            dadosBrutos = json.response.ocorrencia;
          } else if (json.response?.setor) {
            dadosBrutos = json.response.setor;
          } else if (json.response?.dados) {
            dadosBrutos = json.response.dados;
          } else if (json.dados) {
            dadosBrutos = json.dados;
          }

          const dadosFormatados = dadosBrutos.map(mapearSetorBD);

          const setoresUnicos = Array.from(
            new Map(dadosFormatados.map((item) => [item.id, item])).values()
          );

          setListaSetores(setoresUnicos);
        } else {
          setErro("Nenhum setor cadastrado até o momento.");
        }
      } catch {
        setErro("Erro na comunicação com a API de setores.");
      } finally {
        setCarregando(false);
      }
    }

    carregarSetores();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, filtro]);

  const resumoGeral = useMemo(() => {
    return listaSetores.reduce(
      (acc, s) => {
        acc.totalSetores += 1;
        acc.totalFuncionarios += s.funcionarios;
        acc.totalCameras += s.cameras;
        acc.totalAbertas += s.abertas;
        return acc;
      },
      {
        totalSetores: 0,
        totalFuncionarios: 0,
        totalCameras: 0,
        totalAbertas: 0,
      }
    );
  }, [listaSetores]);

  const setoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return listaSetores.filter((setor) => {
      const matchBusca =
        !termo ||
        setor.nome.toLowerCase().includes(termo) ||
        setor.descricao.toLowerCase().includes(termo) ||
        setor.local.toLowerCase().includes(termo);

      if (!matchBusca) return false;

      const isInativo = String(setor.status || "")
        .toLowerCase()
        .includes("inativ");

      if (filtro === "alertas") return setor.abertas > 0;
      if (filtro === "ativos") return !isInativo;
      if (filtro === "inativos") return isInativo;
      return true;
    });
  }, [listaSetores, busca, filtro]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(setoresFiltrados.length / SETORES_POR_PAGINA)
  );
  const indiceInicio = (paginaAtual - 1) * SETORES_POR_PAGINA;
  const indiceFim = indiceInicio + SETORES_POR_PAGINA;
  const setoresPaginados = setoresFiltrados.slice(indiceInicio, indiceFim);

  const registrar = (e) => {
    e.preventDefault();
    router.push("/cadastrarSetor");
  };

  const verDetalhesSetor = (id) => {
    router.push(`/setores/${id}`);
  };

  return (
    <Shell>
      <section className={styles.conteudo}>
        {/* TOPO DA PÁGINA */}
        <div className={styles.topoConteudo}>
          <div>
            <h1>Setores</h1>
            <p>
              Áreas monitoradas da planta industrial, alocação de equipes e indicadores de segurança.
            </p>
          </div>

          <button onClick={registrar} className={styles.botaoCadastrar}>
            <span>+</span> Registrar novo setor
          </button>
        </div>

        {/* RESUMO CONSOLIDADO DA PLANTA */}
        {!carregando && !erro && listaSetores.length > 0 && (
          <div className={styles.barraResumo}>
            <div className={styles.cardResumo}>
              <span>Setores mapeados</span>
              <strong>{resumoGeral.totalSetores}</strong>
            </div>
            <div className={styles.cardResumo}>
              <span>Colaboradores alocados</span>
              <strong>{resumoGeral.totalFuncionarios}</strong>
            </div>
            <div className={styles.cardResumo}>
              <span>Câmeras instaladas</span>
              <strong>{resumoGeral.totalCameras}</strong>
            </div>
            <div className={`${styles.cardResumo} ${styles.cardResumoAlerta}`}>
              <span>Ocorrências em aberto</span>
              <strong>{resumoGeral.totalAbertas}</strong>
            </div>
          </div>
        )}

        {/* BARRA DE BUSCA E FILTROS */}
        {!carregando && !erro && listaSetores.length > 0 && (
          <div className={styles.barraControles}>
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
                className={styles.inputBusca}
                placeholder="Buscar por nome do setor, galpão ou descrição..."
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

            <div className={styles.grupoFiltros}>
              {[
                { id: "todos", label: `Todos (${listaSetores.length})` },
                {
                  id: "alertas",
                  label: `Com alertas (${
                    listaSetores.filter((s) => s.abertas > 0).length
                  })`,
                },
                { id: "ativos", label: "Ativos" },
                { id: "inativos", label: "Inativos" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.botaoFiltro} ${
                    filtro === item.id ? styles.botaoFiltroAtivo : ""
                  }`}
                  onClick={() => setFiltro(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CABEÇALHO DE PAGINAÇÃO */}
        {!carregando && !erro && setoresFiltrados.length > 0 && (
          <div className={styles.barraPaginacao}>
            <span className={styles.textoPaginacao}>
              Mostrando{" "}
              <strong>
                {indiceInicio + 1}–{Math.min(indiceFim, setoresFiltrados.length)}
              </strong>{" "}
              de <strong>{setoresFiltrados.length}</strong> setores
            </span>

            {setoresFiltrados.length > SETORES_POR_PAGINA && (
              <div className={styles.controlesPaginacao}>
                <button
                  type="button"
                  className={styles.botaoPagina}
                  disabled={paginaAtual === 1}
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  aria-label="Página anterior"
                >
                  ←
                </button>
                <span className={styles.textoPaginacao}>
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
        )}

        {/* LISTAGEM DE CARDS */}
        {carregando ? (
          <div className={styles.estado}>Carregando setores...</div>
        ) : erro ? (
          <div className={`${styles.estado} ${styles.estadoErro}`}>{erro}</div>
        ) : (
          <>
            <div className={styles.grade}>
              {setoresPaginados.length > 0 ? (
                setoresPaginados.map((setor) => (
                  <article
                    className={`${styles.card} ${
                      setor.abertas > 0 ? styles.cardComAlerta : ""
                    }`}
                    key={setor.id}
                    onClick={() => verDetalhesSetor(setor.id)}
                  >
                    <ImagemSetor
                      foto={setor.foto}
                      nome={setor.nome}
                      status={setor.status}
                      abertas={setor.abertas}
                    />

                    <div className={styles.corpoCard}>
                      <div className={styles.cabecalhoCard}>
                        <h2>{setor.nome}</h2>
                        {setor.local && (
                          <span className={styles.localTag}>📍 {setor.local}</span>
                        )}
                      </div>

                      <p className={styles.descricao}>{setor.descricao}</p>

                      <div className={styles.indicadores}>
                        <Indicador
                          tipo="funcionarios"
                          valor={setor.funcionarios}
                          legenda="Funcionários"
                        />

                        <Indicador
                          tipo="cameras"
                          valor={setor.cameras}
                          legenda="Câmeras"
                        />

                        <Indicador
                          tipo="alertas"
                          valor={setor.abertas}
                          legenda="Abertas"
                          destaque={setor.abertas > 0}
                        />
                      </div>

                      <button
                        type="button"
                        className={styles.botaoVer}
                        onClick={(e) => {
                          e.stopPropagation();
                          verDetalhesSetor(setor.id);
                        }}
                      >
                        Ver detalhes do setor <span>→</span>
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className={styles.estado}>
                  Nenhum setor encontrado para os filtros selecionados.
                </div>
              )}
            </div>

            {/* PAGINAÇÃO NO RODAPÉ */}
            {setoresFiltrados.length > SETORES_POR_PAGINA && (
              <div className={`${styles.barraPaginacao} ${styles.rodapePaginacao}`}>
                <span className={styles.textoPaginacao}>
                  Exibindo {SETORES_POR_PAGINA} setores por página
                </span>

                <div className={styles.controlesPaginacao}>
                  <button
                    type="button"
                    className={styles.botaoPagina}
                    disabled={paginaAtual === 1}
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  >
                    ← Anterior
                  </button>
                  <span className={styles.textoPaginacao}>
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
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </Shell>
  );
}