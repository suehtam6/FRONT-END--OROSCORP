"use client";

/*
Data: 9 de Outubro de 2026
Objetivo: Página Home
Autor: João Pedro e Kaique Carvalho

Autor JS: Matheus Lucas
Data: 16 de Novembro de 2026
Objetivo: Dashboard dinâmico com visual aprimorado e painel lateral de alertas expandido
*/

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "../style/home.module.css";
import Menu from "@/app/components/menu.js";

function extrairLista(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  const alvo =
    json.response && typeof json.response === "object" ? json.response : json;
  if (Array.isArray(alvo)) return alvo;
  if (typeof alvo === "object") {
    for (const chave of Object.keys(alvo)) {
      if (Array.isArray(alvo[chave])) return alvo[chave];
    }
  }
  return [];
}

function mesmaData(dataA, dataB) {
  return (
    dataA.getFullYear() === dataB.getFullYear() &&
    dataA.getMonth() === dataB.getMonth() &&
    dataA.getDate() === dataB.getDate()
  );
}

function formatarHoraCurta(dataStr) {
  if (!dataStr) return "";
  const d = new Date(dataStr);
  if (isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} às ${p(d.getHours())}:${p(
    d.getMinutes()
  )}`;
}

function obterClassePrioridade(prioridade) {
  const p = String(prioridade || "").toLowerCase();
  if (p.includes("alt")) return "alta";
  if (p.includes("méd") || p.includes("med")) return "media";
  return "baixa";
}

export default function Home() {
  const router = useRouter();

  const [menuAberto, setMenuAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState("Semana");
  const [filtroPrioridade, setFiltroPrioridade] = useState("Todas");

  const [listaOcorrencias, setListaOcorrencias] = useState([]);
  const [listaCameras, setListaCameras] = useState([]);

  useEffect(() => {
    async function carregarDashboard() {
      setCarregando(true);
      try {
        const [resOcorrencias, resCameras] = await Promise.all([
          fetch("/api/ocorrencia/dados").catch(() => null),
          fetch("/api/camera").catch(() => null),
        ]);

        if (resOcorrencias && resOcorrencias.ok) {
          const bruta = extrairLista(await resOcorrencias.json());
          const mapaUnico = new Map();
          bruta.forEach((item) => {
            const idItem = item.ID_ocorrencia ?? item.id;
            if (idItem !== undefined && !mapaUnico.has(String(idItem))) {
              mapaUnico.set(String(idItem), item);
            }
          });
          setListaOcorrencias(Array.from(mapaUnico.values()));
        }

        if (resCameras && resCameras.ok) {
          setListaCameras(extrairLista(await resCameras.json()));
        }
      } catch (e) {
        console.error("Erro ao carregar dados do Dashboard:", e);
      } finally {
        setCarregando(false);
      }
    }

    carregarDashboard();
  }, []);

  const indicadores = useMemo(() => {
    const hoje = new Date();

    const ocorrenciasHoje = listaOcorrencias.filter((o) => {
      const raw = o.data_hora || o.Data_ocorrencia;
      if (!raw) return false;
      const d = new Date(raw);
      return !isNaN(d.getTime()) && mesmaData(d, hoje);
    }).length;

    const aguardandoId = listaOcorrencias.filter(
      (o) => !o.ID_funcionario && !o.Nome_funcionario
    ).length;

    const totalCameras = listaCameras.length;
    const camerasOnline = listaCameras.filter((c) => {
      const infoStatus = Array.isArray(c.status_camera)
        ? c.status_camera[0]
        : c.status_camera;

      const st = String(infoStatus?.status || c.status || "").toLowerCase();
      const idSt = Number(infoStatus?.id ?? c.id_status_camera);

      return st.includes("online") || st.includes("ativ") || idSt === 1;
    }).length;

    return [
      {
        titulo: "Ocorrências hoje",
        subtexto: "Registros nas últimas 24h",
        valor: carregando ? "—" : String(ocorrenciasHoje),
        icone: "⚠",
        destaque: "laranja",
      },
      {
        titulo: "Aguardando identificação",
        subtexto: "Colaboradores não reconhecidos",
        valor: carregando ? "—" : String(aguardandoId),
        icone: "◉",
        destaque: "amarelo",
      },
      {
        titulo: "Câmeras online",
        subtexto: "Dispositivos ativos na planta",
        valor: carregando ? "—/—" : `${camerasOnline}/${totalCameras}`,
        icone: "▣",
        destaque: "verde",
      },
    ];
  }, [listaOcorrencias, listaCameras, carregando]);

  const dadosGrafico = useMemo(() => {
    const agora = new Date();
    const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    let buckets = [];

    if (periodo === "Hoje") {
      const faixas = ["00h", "04h", "08h", "12h", "16h", "20h"];
      buckets = faixas.map((label, idx) => {
        const inicioHora = idx * 4;
        const fimHora = inicioHora + 4;
        const qtd = listaOcorrencias.filter((o) => {
          const d = new Date(o.data_hora || o.Data_ocorrencia);
          if (isNaN(d.getTime()) || !mesmaData(d, agora)) return false;
          const h = d.getHours();
          return h >= inicioHora && h < fimHora;
        }).length;
        return { label, valor: qtd };
      });
    } else if (periodo === "Mês") {
      buckets = [3, 2, 1, 0].map((semanasAtras, idx) => {
        const fim = new Date(agora);
        fim.setDate(agora.getDate() - semanasAtras * 7);
        const inicio = new Date(fim);
        inicio.setDate(fim.getDate() - 6);

        const qtd = listaOcorrencias.filter((o) => {
          const d = new Date(o.data_hora || o.Data_ocorrencia);
          if (isNaN(d.getTime())) return false;
          return d >= inicio && d <= fim;
        }).length;

        return { label: `Sem ${idx + 1}`, valor: qtd };
      });
    } else {
      buckets = [6, 5, 4, 3, 2, 1, 0].map((diasAtras) => {
        const alvo = new Date(agora);
        alvo.setDate(agora.getDate() - diasAtras);
        const qtd = listaOcorrencias.filter((o) => {
          const d = new Date(o.data_hora || o.Data_ocorrencia);
          return !isNaN(d.getTime()) && mesmaData(d, alvo);
        }).length;
        return { label: diasSemana[alvo.getDay()], valor: qtd };
      });
    }

    const maxBruto = Math.max(...buckets.map((b) => b.valor), 4);
    const teto = Math.ceil(maxBruto / 4) * 4;
    const escalaY = [teto, (teto * 3) / 4, teto / 2, teto / 4, 0];

    const largura = 600;
    const altura = 180;
    const pontos = buckets.map((b, i) => {
      const x =
        buckets.length > 1 ? (i / (buckets.length - 1)) * largura : largura / 2;
      const y = altura - (b.valor / teto) * (altura - 20) - 10;
      return { x, y, valor: b.valor, label: b.label };
    });

    let pathD = "";
    let areaD = "";
    if (pontos.length > 0) {
      pathD = `M ${pontos[0].x} ${pontos[0].y}`;
      for (let i = 0; i < pontos.length - 1; i++) {
        const p0 = pontos[i];
        const p1 = pontos[i + 1];
        const midX = (p0.x + p1.x) / 2;
        pathD += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
      }
      areaD = `${pathD} L ${pontos[pontos.length - 1].x} ${altura} L ${pontos[0].x} ${altura} Z`;
    }

    return { buckets, escalaY, pontos, pathD, areaD };
  }, [listaOcorrencias, periodo]);

  const ocorrenciasRecentes = useMemo(() => {
    return listaOcorrencias.slice(0, 7).map((o) => ({
      idReal: o.ID_ocorrencia ?? o.id,
      idFormatado: `#${String(o.ID_ocorrencia ?? o.id).padStart(4, "0")}`,
      funcionario: o.Nome_funcionario || "Não identificado",
      identificado: Boolean(o.Nome_funcionario),
      tipo: o.Motivo_ocorrencia || "—",
      setor: o.Nome_setor || "—",
      origem: o.origem_ocorrencia || "—",
      prioridade: o.prioridade_ocorrencia || "Baixa",
      nivelPrioridade: obterClassePrioridade(o.prioridade_ocorrencia),
    }));
  }, [listaOcorrencias]);

  const alertasEmAberto = useMemo(() => {
    return listaOcorrencias
      .filter((o) => {
        const st = String(o.Status_ocorrencia || "").toLowerCase();
        return !st.includes("fech") && !st.includes("resolv");
      })
      .map((o) => {
        const nivel = obterClassePrioridade(o.prioridade_ocorrencia);
        return {
          id: o.ID_ocorrencia ?? o.id,
          idFormatado: `#${String(o.ID_ocorrencia ?? o.id).padStart(3, "0")}`,
          titulo: o.Nome_EPI
            ? `${o.Motivo_ocorrencia || "Irregularidade"} — ${o.Nome_EPI}`
            : o.Motivo_ocorrencia || "Ocorrência registrada",
          setor: o.Nome_setor || "Setor não informado",
          dataHora: o.data_hora ? formatarHoraCurta(o.data_hora) : "Recente",
          funcionario: o.Nome_funcionario || "Aguardando identificação",
          identificado: Boolean(o.Nome_funcionario),
          origem: o.origem_ocorrencia || "IA",
          prioridade: o.prioridade_ocorrencia || "Média",
          nivel,
        };
      });
  }, [listaOcorrencias]);

  const alertasFiltrados = useMemo(() => {
    const base =
      filtroPrioridade === "Todas"
        ? alertasEmAberto
        : alertasEmAberto.filter(
            (a) => a.nivel === filtroPrioridade.toLowerCase()
          );
    return base.slice(0, 15);
  }, [alertasEmAberto, filtroPrioridade]);

  return (
    <main className={styles.pagina}>
      <header className={styles.topo}>
        <button
          className={styles.menu}
          aria-label="Abrir ou fechar menu"
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto(!menuAberto)}
        >
          ☰
        </button>

        <img
          src="/logo-oroscorp.png"
          alt="Oroscorp"
          className={styles.logo}
        />
      </header>

      <Menu aberto={menuAberto} aoFechar={() => setMenuAberto(false)} />

      <section className={styles.conteudo}>
        <div className={styles.cabecalhoPagina}>
          <div>
            <h1>Dashboard</h1>
            <p className={styles.subtitulo}>
              Visão geral do monitoramento de segurança e conformidade com EPIs em tempo real.
            </p>
          </div>

          <div className={styles.statusLive}>
            <span className={styles.pontoVerde} />
            Sistema ativo
          </div>
        </div>

        {/* CARDS DE INDICADORES */}
        <section className={styles.indicadores}>
          {indicadores.map((item) => (
            <article
              className={`${styles.card} ${styles[`card_${item.destaque}`]}`}
              key={item.titulo}
            >
              <div className={styles.topoCardIndicador}>
                <span className={styles.icone}>{item.icone}</span>
                <span className={styles.subtextoCard}>{item.subtexto}</span>
              </div>
              <h2>{item.valor}</h2>
              <p>{item.titulo}</p>
            </article>
          ))}
        </section>

        {/* GRADE PRINCIPAL: GRÁFICO + TABELA À ESQUERDA | ALERTAS À DIREITA */}
        <section className={styles.grade}>
          <div className={styles.coluna}>
            {/* GRÁFICO */}
            <article className={styles.painel}>
              <div className={styles.tituloPainel}>
                <div>
                  <h2>Ocorrências ao longo do tempo</h2>
                  <p>Detecções de IA e registros manuais</p>
                </div>

                <select
                  aria-label="Período"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                >
                  <option value="Semana">Semana</option>
                  <option value="Hoje">Hoje</option>
                  <option value="Mês">Mês</option>
                </select>
              </div>

              <div className={styles.grafico}>
                <div className={styles.linhas}>
                  {dadosGrafico.escalaY.map((val) => (
                    <span key={val}>{val}</span>
                  ))}
                </div>

                <svg
                  viewBox="0 0 600 180"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Gráfico de ocorrências"
                >
                  <defs>
                    <linearGradient
                      id="gradienteLinha"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#ff9500" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#ff9500" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {dadosGrafico.areaD && (
                    <path d={dadosGrafico.areaD} fill="url(#gradienteLinha)" />
                  )}

                  {dadosGrafico.pathD && (
                    <path
                      d={dadosGrafico.pathD}
                      fill="none"
                      stroke="#ff9500"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  )}
                  {dadosGrafico.pontos.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill="#111315"
                      stroke="#ff9500"
                      strokeWidth="3"
                    />
                  ))}
                </svg>

                <div className={styles.dias}>
                  {dadosGrafico.buckets.map((b) => (
                    <span key={b.label}>{b.label}</span>
                  ))}
                </div>
              </div>
            </article>

            {/* TABELA DE OCORRÊNCIAS RECENTES */}
            <article className={styles.painel}>
              <div className={styles.tituloPainel}>
                <div>
                  <h2>Ocorrências recentes</h2>
                  <p>Últimos registros de IA e manuais</p>
                </div>

                <a href="/ocorrencias">Ver todas →</a>
              </div>

              <div className={styles.tabelaRolagem}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Funcionário</th>
                      <th>Tipo</th>
                      <th>Setor</th>
                      <th>Origem</th>
                      <th>Prioridade</th>
                    </tr>
                  </thead>

                  <tbody>
                    {carregando ? (
                      <tr>
                        <td colSpan={6} className={styles.vazio}>
                          Carregando ocorrências...
                        </td>
                      </tr>
                    ) : ocorrenciasRecentes.length > 0 ? (
                      ocorrenciasRecentes.map((item) => (
                        <tr
                          key={item.idReal}
                          className={styles.linhaTabelaClicavel}
                          onClick={() =>
                            router.push(`/ocorrencias/${item.idReal}`)
                          }
                        >
                          <td className={styles.idTabela}>{item.idFormatado}</td>
                          <td>
                            <span
                              className={
                                item.identificado
                                  ? styles.nomeIdentificado
                                  : styles.nomeNaoIdentificado
                              }
                            >
                              {item.funcionario}
                            </span>
                          </td>
                          <td>{item.tipo}</td>
                          <td>{item.setor}</td>
                          <td>
                            <span className={styles.badgeOrigem}>
                              {item.origem}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${styles.badgePrioridade} ${
                                styles[`prio_${item.nivelPrioridade}`]
                              }`}
                            >
                              {item.prioridade}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className={styles.vazio}>
                          Nenhuma ocorrência registrada até o momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </div>

          {/* PAINEL LATERAL DE ALERTAS EXPANDIDO */}
          <article className={`${styles.painel} ${styles.painelAlertas}`}>
            <div className={styles.topoAlertas}>
              <div>
                <div className={styles.tituloComBadge}>
                  <h2>Alertas recentes</h2>
                  <span className={styles.contadorAlertas}>
                    {alertasEmAberto.length} abertos
                  </span>
                </div>
                <p>Ocorrências pendentes de tratativa</p>
              </div>
            </div>

            {/* FILTRO RÁPIDO DE PRIORIDADE */}
            <div className={styles.filtrosAlerta}>
              {["Todas", "Alta", "Media", "Baixa"].map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  className={`${styles.botaoFiltro} ${
                    filtroPrioridade === opcao ? styles.botaoFiltroAtivo : ""
                  }`}
                  onClick={() => setFiltroPrioridade(opcao)}
                >
                  {opcao === "Media" ? "Média" : opcao}
                </button>
              ))}
            </div>

            <div className={styles.listaAlertasScroll}>
              {carregando ? (
                <p className={styles.vazio}>Carregando alertas...</p>
              ) : alertasFiltrados.length > 0 ? (
                alertasFiltrados.map((alerta) => (
                  <div
                    className={`${styles.alertaCard} ${
                      styles[`borda_${alerta.nivel}`]
                    }`}
                    key={alerta.id}
                    onClick={() => router.push(`/ocorrencias/${alerta.id}`)}
                  >
                    <div className={styles.topoCardAlerta}>
                      <div className={styles.metaEsquerda}>
                        <span className={styles.idAlerta}>
                          {alerta.idFormatado}
                        </span>
                        <span className={styles.origemAlerta}>
                          {alerta.origem}
                        </span>
                      </div>

                      <span
                        className={`${styles.badgePrioridade} ${
                          styles[`prio_${alerta.nivel}`]
                        }`}
                      >
                        {alerta.prioridade}
                      </span>
                    </div>

                    <strong className={styles.tituloAlerta}>
                      {alerta.titulo}
                    </strong>

                    <div className={styles.rodapeCardAlerta}>
                      <span className={styles.setorAlerta}>
                        📍 {alerta.setor}
                      </span>
                      <span className={styles.horaAlerta}>
                        🕒 {alerta.dataHora}
                      </span>
                    </div>

                    <div className={styles.colaboradorAlerta}>
                      <span
                        className={
                          alerta.identificado
                            ? styles.colabOk
                            : styles.colabPendente
                        }
                      >
                        👤 {alerta.funcionario}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.vazio}>
                  Nenhum alerta em aberto para este filtro.
                </p>
              )}
            </div>

            <a href="/ocorrencias" className={styles.rodapeVerTodos}>
              Gerenciar todas as ocorrências →
            </a>
          </article>
        </section>
      </section>
    </main>
  );
}