"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "../../components/Shell";
import Popup from "../../components/Popup";
import styles from "../../style/detalheFuncionario.module.css";

function extrairLista(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.response?.dados)) return json.response.dados;
  if (Array.isArray(json?.response)) return json.response;
  if (Array.isArray(json?.dados)) return json.dados;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

function extrairObjeto(json) {
  if (!json) return null;
  if (Array.isArray(json?.response?.dados)) return json.response.dados[0] || null;
  if (json?.response?.dados && typeof json.response.dados === "object") {
    return json.response.dados;
  }
  if (Array.isArray(json?.dados)) return json.dados[0] || null;
  if (json?.dados && typeof json.dados === "object") return json.dados;
  if (Array.isArray(json)) return json[0] || null;
  return json;
}

export default function DetalheFuncionarioPage() {
  const params = useParams();
  const router = useRouter();
  const funcionarioId = params?.id;

  const [funcionario, setFuncionario] = useState(null);
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

        const [resDetalhe, resTodosFunc, resOcorrencias] = await Promise.all([
          fetch(`/api/funcionario/${funcionarioId}`, { headers }).catch(() => null),
          fetch("/api/funcionario/dados", { headers }).catch(() => null),
          fetch("/api/ocorrencia", { headers }).catch(() => null),
        ]);

        let dadosFunc = null;

        if (resDetalhe && resDetalhe.ok) {
          dadosFunc = extrairObjeto(await resDetalhe.json());
        }

        if (!dadosFunc && resTodosFunc && resTodosFunc.ok) {
          const lista = extrairLista(await resTodosFunc.json());
          dadosFunc =
            lista.find((f) => String(f.id || f.id_funcionario) === String(funcionarioId)) || null;
        }

        if (dadosFunc) {
          setFuncionario(dadosFunc);
        } else {
          setErro("Funcionário não encontrado.");
        }

        if (Array.isArray(dadosFunc?.ocorrencias)) {
          setOcorrencias(dadosFunc.ocorrencias);
        } else if (resOcorrencias && resOcorrencias.ok) {
          const todasOcorrencias = extrairLista(await resOcorrencias.json());
          const filtradas = todasOcorrencias.filter((oc) => {
            const idFuncOc =
              oc.id_funcionario ??
              oc.funcionario?.id ??
              (Array.isArray(oc.funcionario) ? oc.funcionario[0]?.id : null);
            return String(idFuncOc) === String(funcionarioId);
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
    return data.toLocaleString("pt-BR");
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
  console.log(funcionario)
    ? funcionario.cargo[0]?.cargo || "Não informado"
    : funcionario.cargo?.cargo || funcionario.cargo || "Não informado";

  const setorObj = Array.isArray(funcionario.setor)
    ? funcionario.setor[0]
    : typeof funcionario.setor === "object"
    ? funcionario.setor
    : { nome: funcionario.setor || "Sem setor" };

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
    const st = Array.isArray(oc.status_ocorrencia)
      ? oc.status_ocorrencia[0]?.status
      : oc.status_ocorrencia?.status || oc.status_ocorrencia || oc.status || "";
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
                  {setorObj?.descricao_setor || "Nenhuma descrição cadastrada para este setor."}
                </p>
              </div>

              <div className={styles.rodapeSetor}>
                <span>
                  <strong>Local:</strong> {setorObj?.local_setor || "Não especificado"}
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
                  <th>Infração / EPI</th>
                  <th>Setor / Câmera</th>
                  <th>Data e Hora</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ocorrencias.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.vazio}>
                      Este funcionário não possui ocorrências registradas.
                    </td>
                  </tr>
                ) : (
                  ocorrencias.map((oc) => {
                    const tituloOc =
                      oc.titulo ||
                      oc.descricao ||
                      (Array.isArray(oc.epi) ? oc.epi[0]?.nome : oc.epi?.nome) ||
                      "Infração de EPI detectada";

                    const localOc =
                      (Array.isArray(oc.setor) ? oc.setor[0]?.nome : oc.setor?.nome) ||
                      (Array.isArray(oc.camera) ? oc.camera[0]?.nome : oc.camera?.nome) ||
                      setorObj?.nome ||
                      "—";

                    const stTexto = Array.isArray(oc.status_ocorrencia)
                      ? oc.status_ocorrencia[0]?.status || "Aberta"
                      : oc.status_ocorrencia?.status ||
                        oc.status_ocorrencia ||
                        oc.status ||
                        "Aberta";

                    const isAberta = String(stTexto).toLowerCase().includes("abert");

                    return (
                      <tr key={oc.id}>
                        <td>#{oc.id}</td>
                        <td style={{ fontWeight: 600, color: "#fff" }}>{tituloOc}</td>
                        <td>{localOc}</td>
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