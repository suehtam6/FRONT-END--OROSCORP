"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "../../components/Shell";
import Popup from "../../components/Popup";
import styles from "../../style/detalheFuncionario.module.css";
function extrairLista(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;

  const alvo = json.response && typeof json.response === "object" ? json.response : json;
  if (Array.isArray(alvo)) return alvo;

  if (typeof alvo === "object") {
    for (const chave of Object.keys(alvo)) {
      if (Array.isArray(alvo[chave])) {
        return alvo[chave];
      }
    }
  }
  return [];
}

export default function DetalheFuncionarioPage() {
  const params = useParams();
  const router = useRouter();
  const funcionarioId = params?.id;

  const [funcionario, setFuncionario] = useState(null);
  const [setorCompleto, setSetorCompleto] = useState(null);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroFoto, setErroFoto] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!funcionarioId) return;

    async function carregarDetalhes() {
      try {
        setCarregando(true);
        setErroFoto(false);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [resTodosFunc, resOcorrencias, resSetores] = await Promise.all([
          fetch("/api/funcionario/dados", { headers }),
          fetch("/api/ocorrencia/dados", { headers }),
          fetch("/api/setor", { headers }).catch(() => null),
        ]);

        let dadosFunc = null;

        if (resTodosFunc.ok) {
          const lista = extrairLista(await resTodosFunc.json());
          dadosFunc =
            lista.find((f) => String(f.id || f.id_funcionario) === String(funcionarioId)) || null;
        }

        if (dadosFunc) {
          setFuncionario(dadosFunc);

          // Completa dados do setor (descrição e local) via /api/setor
          const setorDoFunc = Array.isArray(dadosFunc.setor)
            ? dadosFunc.setor[0]
            : typeof dadosFunc.setor === "object"
            ? dadosFunc.setor
            : null;

          if (resSetores && resSetores.ok) {
            const listaSetores = extrairLista(await resSetores.json());
            const encontrado = listaSetores.find(
              (s) =>
                (setorDoFunc?.id && Number(s.id) === Number(setorDoFunc.id)) ||
                (setorDoFunc?.nome &&
                  String(s.nome).toLowerCase() === String(setorDoFunc.nome).toLowerCase()) ||
                (typeof dadosFunc.setor === "string" &&
                  String(s.nome).toLowerCase() === dadosFunc.setor.toLowerCase())
            );
            setSetorCompleto(encontrado || setorDoFunc);
          } else {
            setSetorCompleto(setorDoFunc);
          }
        } else {
          setErro("Funcionário não encontrado.");
        }

        if (resOcorrencias.ok) {
          const jsonOc = await resOcorrencias.json();
          const todasOcorrencias = extrairLista(jsonOc);

          const filtradas = todasOcorrencias.filter((oc) => {
            const idFuncOc =
              oc.ID_funcionario ??
              oc.id_funcionario ??
              oc.funcionario?.id ??
              (Array.isArray(oc.funcionario) ? oc.funcionario[0]?.id : null);

            const nomeFuncOc = oc.Nome_funcionario ?? oc.funcionario?.nome;

            return (
              String(idFuncOc) === String(funcionarioId) ||
              (dadosFunc?.nome &&
                nomeFuncOc &&
                String(nomeFuncOc).trim().toLowerCase() ===
                  String(dadosFunc.nome).trim().toLowerCase())
            );
          });

          setOcorrencias(filtradas);
        }
      } catch (e) {
        console.error("Erro ao carregar detalhes do funcionário:", e);
        setErro("Não foi possível carregar os dados do colaborador.");
      } finally {
        setCarregando(false);
      }
    }

    carregarDetalhes();
  }, [funcionarioId]);

  const obterIniciais = (nome) => {
    if (!nome) return "?";
    const partes = nome.trim().split(" ");
    if (partes.length === 1) return partes[0][0].toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  const formatarData = (dataIso) => {
    if (!dataIso) return "Não informada";
    const data = new Date(dataIso);
    if (isNaN(data.getTime())) return String(dataIso);
    return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  const formatarDataHora = (dataIso) => {
    if (!dataIso) return "—";
    const data = new Date(dataIso);
    if (isNaN(data.getTime())) return String(dataIso);
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calcularIdade = (dataIso) => {
    if (!dataIso) return null;
    const nasc = new Date(dataIso);
    if (isNaN(nasc.getTime())) return null;
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade >= 0 ? idade : null;
  };

  const obterClasseStatus = (texto) => {
    const normalizado = String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    if (normalizado === "ativo") return styles.badgeVerde;
    if (normalizado.includes("ferias") || normalizado.includes("afastad")) {
      return styles.badgeAmarelo;
    }
    return styles.badgeVermelho;
  };

  if (carregando) {
    return (
      <Shell>
        <main className={styles.conteudo}>
          <div className={styles.painel}>
            <p className={styles.vazio}>Carregando ficha do colaborador...</p>
          </div>
        </main>
      </Shell>
    );
  }

  if (!funcionario) {
    return (
      <Shell>
        <main className={styles.conteudo}>
          <div className={styles.barraTopo}>
            <button
              type="button"
              className={styles.botaoVoltar}
              onClick={() => router.push("/funcionarios")}
            >
              ← Voltar para Funcionários
            </button>
          </div>
          <div className={styles.painel}>
            <p className={styles.vazio}>Nenhum dado disponível para este colaborador.</p>
          </div>
          <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
        </main>
      </Shell>
    );
  }

  const cargoNome = Array.isArray(funcionario.cargo)
    ? funcionario.cargo[0]?.cargo || "Não informado"
    : funcionario.cargo?.cargo || funcionario.cargo || "Não informado";

  const setorBasico = Array.isArray(funcionario.setor)
    ? funcionario.setor[0]
    : typeof funcionario.setor === "object"
    ? funcionario.setor
    : { nome: funcionario.setor || "Sem setor" };

  const setorObj = {
    ...setorBasico,
    ...setorCompleto,
  };

  const statusSetorTexto = Array.isArray(setorObj?.status_setor)
    ? setorObj.status_setor[0]?.status || "Ativo"
    : setorObj?.status_setor || "Ativo";

  const statusFuncObj = Array.isArray(funcionario.status_funcionario)
    ? funcionario.status_funcionario[0]
    : typeof funcionario.status_funcionario === "object"
    ? funcionario.status_funcionario
    : null;

  const statusTexto = String(
    statusFuncObj?.status ||
      (typeof funcionario.status_funcionario === "string"
        ? funcionario.status_funcionario
        : "Ativo")
  ).trim();

  const idade = calcularIdade(funcionario.data_nascimento);

  const ocorrenciasAbertas = ocorrencias.filter((oc) => {
    const st =
      oc.Status_ocorrencia ??
      (Array.isArray(oc.status_ocorrencia)
        ? oc.status_ocorrencia[0]?.status
        : oc.status_ocorrencia?.status || oc.status_ocorrencia || oc.status || "");
    return String(st).toLowerCase().includes("abert");
  }).length;

  const ocorrenciasResolvidas = ocorrencias.length - ocorrenciasAbertas;

  const urlFotoValida =
    funcionario.foto &&
    !erroFoto &&
    (funcionario.foto.startsWith("http") || funcionario.foto.startsWith("/"));

  return (
    <Shell>
      <main className={styles.conteudo}>
        <div className={styles.barraTopo}>
          <button
            type="button"
            className={styles.botaoVoltar}
            onClick={() => router.push("/funcionarios")}
          >
            ← Voltar para Funcionários
          </button>
        </div>

        {/* CABEÇALHO DO PERFIL */}
        <div className={`${styles.painel} ${styles.painelTopo}`}>
          <div className={styles.cabecalhoPerfil}>
            <div className={styles.perfilEsquerda}>
              <div className={styles.avatarWrapper}>
                {urlFotoValida ? (
                  <img
                    src={funcionario.foto}
                    alt={funcionario.nome}
                    className={styles.avatarImagem}
                    onError={() => setErroFoto(true)}
                  />
                ) : (
                  <span className={styles.avatarIniciais}>
                    {obterIniciais(funcionario.nome)}
                  </span>
                )}
              </div>

              <div>
                <h1 className={styles.nomeFuncionario}>{funcionario.nome}</h1>
                <p className={styles.cargoSub}>
                  {cargoNome} • Matrícula #{funcionario.matricula || funcionario.id}
                </p>
                <div className={styles.tagsPerfil}>
                  <span className={`${styles.badgeContainer} ${obterClasseStatus(statusTexto)}`}>
                    <span className={styles.dot} />
                    {statusTexto}
                  </span>
                  <span className={styles.badgePequeno}>
                    Setor: {setorObj?.nome || "Sem setor"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARDS DE MÉTRICAS */}
        <div className={styles.cardsMetricas}>
          <div className={styles.cardMetrica}>
            <span className={styles.metricaTitulo}>Total de Ocorrências</span>
            <p className={styles.metricaValor}>{ocorrencias.length}</p>
          </div>
          <div className={styles.cardMetrica}>
            <span className={styles.metricaTitulo}>Ocorrências em Aberto</span>
            <p className={`${styles.metricaValor} ${ocorrenciasAbertas > 0 ? styles.laranja : ""}`}>
              {ocorrenciasAbertas}
            </p>
          </div>
          <div className={styles.cardMetrica}>
            <span className={styles.metricaTitulo}>Ocorrências Resolvidas</span>
            <p className={`${styles.metricaValor} ${styles.verde}`}>{ocorrenciasResolvidas}</p>
          </div>
        </div>

        {/* DADOS CADASTRAIS + ALOCAÇÃO E SETOR */}
        <div className={styles.gradePrincipal}>
          <div className={styles.painel} style={{ marginBottom: 0 }}>
            <h2 className={styles.secao}>| Dados Cadastrais</h2>
            <div className={styles.gradeDados}>
              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>Nome Completo</span>
                <span className={styles.valorDado}>{funcionario.nome}</span>
              </div>

              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>CPF</span>
                <span className={styles.valorDado}>{funcionario.cpf || "Não informado"}</span>
              </div>

              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>E-mail Corporativo</span>
                <span className={styles.valorDado}>{funcionario.email || "Não informado"}</span>
              </div>

              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>Data de Nascimento</span>
                <span className={styles.valorDado}>
                  {formatarData(funcionario.data_nascimento)}
                  {idade !== null ? ` (${idade} anos)` : ""}
                </span>
              </div>

              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>Cargo / Função</span>
                <span className={styles.valorDado}>{cargoNome}</span>
              </div>

              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>Matrícula / ID</span>
                <span className={styles.valorDado}>
                  #{funcionario.matricula || funcionario.id}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.painel} style={{ marginBottom: 0 }}>
            <h2 className={styles.secao}>| Alocação e Setor</h2>
            <div className={styles.cardSetor}>
              <div>
                <h3 className={styles.tituloSetor}>{setorObj?.nome || "Sem setor"}</h3>
                <p className={styles.descricaoSetor}>
                  {setorObj?.descricao || "Nenhuma descrição cadastrada para este setor."}
                </p>
              </div>

              <div className={styles.rodapeSetor}>
                <span>
                  <strong>Local:</strong> {setorObj?.local || "Não especificado"}
                </span>
                <span
                  className={`${styles.badgeContainer} ${obterClasseStatus(statusSetorTexto)}`}
                >
                  <span className={styles.dot} />
                  Setor {statusSetorTexto}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* HISTÓRICO DE OCORRÊNCIAS */}
        <div className={styles.painel}>
          <h2 className={styles.secao}>| Histórico de Ocorrências ({ocorrencias.length})</h2>

          <div className={styles.rolagem}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>EPI / Descrição</th>
                  <th>Motivo</th>
                  <th>Setor</th>
                  <th>Data e Hora</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ocorrencias.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.vazio}>
                      Este funcionário não possui ocorrências registradas.
                    </td>
                  </tr>
                ) : (
                  ocorrencias.map((oc) => {
                    const idOc = oc.ID_ocorrencia ?? oc.id;
                    const epiNome =
                      oc.Nome_EPI ||
                      (Array.isArray(oc.epi) ? oc.epi[0]?.nome : oc.epi?.nome) ||
                      "EPI não especificado";
                    const descricaoOc = oc.Descricao_Ocorrencia || oc.descricao || "";
                    const motivoOc = oc.Motivo_ocorrencia || oc.motivo || "—";
                    const setorOc =
                      oc.Nome_setor ||
                      (Array.isArray(oc.setor) ? oc.setor[0]?.nome : oc.setor?.nome) ||
                      setorObj?.nome ||
                      "—";
                    const stTexto =
                      oc.Status_ocorrencia ||
                      (Array.isArray(oc.status_ocorrencia)
                        ? oc.status_ocorrencia[0]?.status
                        : oc.status_ocorrencia?.status || oc.status) ||
                      "Aberta";

                    const isAberta = String(stTexto).toLowerCase().includes("abert");

                    return (
                      <tr key={idOc}>
                        <td>#{idOc}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: "#fff" }}>{epiNome}</div>
                          {descricaoOc && (
                            <div style={{ fontSize: "12px", color: "#8e96a0", marginTop: "4px" }}>
                              {descricaoOc}
                            </div>
                          )}
                        </td>
                        <td>{motivoOc}</td>
                        <td>
                          <span className={styles.badgePequeno}>{setorOc}</span>
                        </td>
                        <td>{formatarDataHora(oc.data_hora || oc.data || oc.created_at)}</td>
                        <td>
                          <span
                            className={`${styles.badgeContainer} ${
                              isAberta ? styles.badgeLaranja : styles.badgeVerde
                            }`}
                          >
                            <span className={styles.dot} />
                            {stTexto}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
      </main>
    </Shell>
  );
}