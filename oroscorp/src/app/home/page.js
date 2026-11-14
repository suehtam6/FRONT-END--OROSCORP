"use client";

/*
Data: 9 de Outubro de 2026
Objetivo: Página Home
Autor: João Pedro e Kaique Carvalho

Autor JS: Matheus Lucas
Data: 14 de Novembro de 2026
Objetivo: Transformar a tela em dinâmica consumindo /api/ocorrencia/dados e /api/camera
*/

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "../style/home.module.css";
import Menu from "@/app/components/menu.js";

function extrairLista(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  const alvo = json.response && typeof json.response === "object" ? json.response : json;
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
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} às ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function Home() {
  const router = useRouter();

  const [menuAberto, setMenuAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState("Semana");

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
          // Remove duplicações causadas por joins no banco
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
        valor: carregando ? "—" : String(ocorrenciasHoje),
        icone: "⚠",
      },
      {
        titulo: "Aguardando identificação",
        valor: carregando ? "—" : String(aguardandoId),
        icone: "◉",
      },
      {
        titulo: "Câmeras online",
        valor: carregando ? "—/—" : `${camerasOnline}/${totalCameras}`,
        icone: "▣",
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
    const teto = Math.ceil(maxBruto / 4) * 4; // múltiplo de 4 para escala limpa
    const escalaY = [teto, (teto * 3) / 4, teto / 2, teto / 4, 0];

    const largura = 600;
    const altura = 180;
    const pontos = buckets.map((b, i) => {
      const x = buckets.length > 1 ? (i / (buckets.length - 1)) * largura : largura / 2;
      const y = altura - (b.valor / teto) * (altura - 20) - 10;
      return { x, y, valor: b.valor, label: b.label };
    });


    let pathD = "";
    if (pontos.length > 0) {
      pathD = `M ${pontos[0].x} ${pontos[0].y}`;
      for (let i = 0; i < pontos.length - 1; i++) {
        const p0 = pontos[i];
        const p1 = pontos[i + 1];
        const midX = (p0.x + p1.x) / 2;
        pathD += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
      }
    }

    return { buckets, escalaY, pontos, pathD };
  }, [listaOcorrencias, periodo]);

  const ocorrenciasRecentes = useMemo(() => {
    return listaOcorrencias.slice(0, 6).map((o) => ({
      idReal: o.ID_ocorrencia ?? o.id,
      idFormatado: `#${String(o.ID_ocorrencia ?? o.id).padStart(4, "0")}`,
      funcionario: o.Nome_funcionario || "Não identificado",
      tipo: o.Motivo_ocorrencia || "—",
      setor: o.Nome_setor || "—",
      origem: o.origem_ocorrencia || "—",
      prioridade: o.prioridade_ocorrencia || "—",
    }));
  }, [listaOcorrencias]);


  const alertasRecentes = useMemo(() => {
    return listaOcorrencias
      .filter((o) => {
        const st = String(o.Status_ocorrencia || "").toLowerCase();
        return !st.includes("fech");
      })
      .slice(0, 5)
      .map((o) => ({
        id: o.ID_ocorrencia ?? o.id,
        titulo: o.Nome_EPI
          ? `${o.Motivo_ocorrencia || "Irregularidade"} — ${o.Nome_EPI}`
          : o.Motivo_ocorrencia || "Ocorrência registrada",
        detalhe: `${o.Nome_setor || "Setor não informado"}${
          o.data_hora ? ` · ${formatarHoraCurta(o.data_hora)}` : ""
        }`,
        prioridade: o.prioridade_ocorrencia || "Média",
      }));
  }, [listaOcorrencias]);

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
        <h1>Dashboard</h1>

        <p className={styles.subtitulo}>
          Visão geral do monitoramento de segurança e conformidade com EPIs em tempo real.
        </p>

        <section
          className={styles.indicadores}
          style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        >
          {indicadores.map((item) => (
            <article className={styles.card} key={item.titulo}>
              <span className={styles.icone}>{item.icone}</span>
              <h2>{item.valor}</h2>
              <p>{item.titulo}</p>
            </article>
          ))}
        </section>

        <section className={styles.grade}>
          <div className={styles.coluna}>
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
                  {dadosGrafico.pathD && (
                    <path
                      d={dadosGrafico.pathD}
                      fill="none"
                      stroke="#ffad78"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  )}
                  {dadosGrafico.pontos.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill="#ff7900"
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
                          onClick={() => router.push(`/ocorrencias/${item.idReal}`)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{item.idFormatado}</td>
                          <td>{item.funcionario}</td>
                          <td>{item.tipo}</td>
                          <td>{item.setor}</td>
                          <td>{item.origem}</td>
                          <td>{item.prioridade}</td>
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

          <article className={`${styles.painel} ${styles.painelAlertas}`}>
            <h2>Alertas recentes</h2>
            <p>Ocorrências em aberto</p>

            {carregando ? (
              <p className={styles.vazio}>Carregando alertas...</p>
            ) : alertasRecentes.length > 0 ? (
              alertasRecentes.map((alerta) => (
                <div
                  className={styles.alerta}
                  key={alerta.id}
                  onClick={() => router.push(`/ocorrencias/${alerta.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <span>⚠</span>

                  <div>
                    <strong>{alerta.titulo}</strong>
                    <small>{alerta.detalhe}</small>
                  </div>

                  <label>{alerta.prioridade}</label>
                </div>
              ))
            ) : (
              <p className={styles.vazio}>Nenhum alerta pendente no momento.</p>
            )}
          </article>
        </section>
      </section>
    </main>
  );
}