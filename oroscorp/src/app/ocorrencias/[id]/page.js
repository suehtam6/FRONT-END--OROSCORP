/*
  Autor: Matheus Lucas
  Objetivo: Tela de detalhes da ocorrência, com vínculo de funcionário, responsável e evidência
  Data: 13/11/2026
*/

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "../../components/Shell";
import Popup from "../../components/Popup";
import styles from "../../style/detalhesOcorrencia.module.css";

function formatarData(dataStr) {
  if (!dataStr) return { data: "--/--/----", hora: "--:--:--" };
  const d = new Date(dataStr);
  if (isNaN(d.getTime())) return { data: dataStr, hora: "--:--:--" };
  const p = (n) => String(n).padStart(2, "0");
  return {
    data: `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`,
    hora: `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`,
  };
}

function formatarDataSQL(dataStr) {
  const d = dataStr ? new Date(dataStr) : new Date();
  if (isNaN(d.getTime())) return "2026-01-01 00:00:00";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}`;
}

function iniciais(nome) {
  if (!nome) return "?";
  const partes = nome.trim().split(" ").filter(Boolean);
  const primeira = partes[0]?.[0] || "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

function classeStatus(status = "") {
  const s = status.toLowerCase();
  if (s.includes("fech")) return styles.statusFechada;
  if (s.includes("andamento") || s.includes("anális")) return styles.statusAnalise;
  return styles.statusAberta;
}

function classePrioridade(prioridade = "") {
  const p = prioridade.toUpperCase();
  if (p === "ALTA") return styles.prioAlta;
  if (p === "BAIXA") return styles.prioBaixa;
  return styles.prioMedia;
}

function formatarPrioridade(prioridade = "") {
  const p = prioridade.toLowerCase();
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function extrairOcorrencia(json) {
  const r = json?.response;
  if (!r) return null;
  if (Array.isArray(r.ocorrencia)) return r.ocorrencia[0] || null;
  if (Array.isArray(r.dados)) return r.dados[0] || null;
  if (r.ocorrencia && typeof r.ocorrencia === "object") return r.ocorrencia;
  return null;
}

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

export default function DetalhesOcorrencia() {
  const { id } = useParams();
  const router = useRouter();

  const [ocorrencia, setOcorrencia] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [erroEvidencia, setErroEvidencia] = useState(false);

  const [funcionarios, setFuncionarios] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);

  const [editandoFunc, setEditandoFunc] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("");

  const [editandoResp, setEditandoResp] = useState(false);
  const [responsavelSelecionado, setResponsavelSelecionado] = useState("");

  const carregarOcorrencia = useCallback(async () => {
    if (!id) return;
    setCarregando(true);
    setErro("");
    setErroEvidencia(false);
    try {
      const res = await fetch(`/api/ocorrencia/${id}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(json.message || "Erro ao carregar a ocorrência.");
        return;
      }

      const item = extrairOcorrencia(json);
      if (!item) {
        setErro("Ocorrência não encontrada.");
        return;
      }
      setOcorrencia(item);
    } catch {
      setErro("Erro de conexão ao carregar a ocorrência.");
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    carregarOcorrencia();
  }, [carregarOcorrencia]);

  useEffect(() => {
    async function carregarListas() {
      try {
        const [resFunc, resResp] = await Promise.all([
          fetch("/api/funcionario/dados").catch(() => null),
          fetch("/api/responsavel").catch(() => null),
        ]);

        if (resFunc && resFunc.ok) {
          setFuncionarios(extrairLista(await resFunc.json()));
        }
        if (resResp && resResp.ok) {
          setResponsaveis(extrairLista(await resResp.json()));
        }
      } catch (e) {
        console.error("Erro ao carregar funcionários/responsáveis:", e);
      }
    }
    carregarListas();
  }, []);

  async function atualizarOcorrencia(camposAtualizados, msgSucesso) {
    setSalvando(true);
    setErro("");
    try {
      const [resBruta, resMotivos, resStatus, resOrigens, resPrioridades, resCameras] =
        await Promise.all([
          fetch("/api/ocorrencia").catch(() => null),
          fetch("/api/ocorrencia/motivo_ocorrencia").catch(() => null),
          fetch("/api/ocorrencia/status-ocorrencia").catch(() => null),
          fetch("/api/ocorrencia/origem").catch(() => null),
          fetch("/api/ocorrencia/prioridade").catch(() => null),
          fetch("/api/camera").catch(() => null),
        ]);

      const listaBruta = resBruta?.ok ? extrairLista(await resBruta.json()) : [];
      const regBruto =
        listaBruta.find((item) => String(item.id ?? item.ID_ocorrencia) === String(id)) || {};

      const motivos = resMotivos?.ok ? extrairLista(await resMotivos.json()) : [];
      const statuses = resStatus?.ok ? extrairLista(await resStatus.json()) : [];
      const origens = resOrigens?.ok ? extrairLista(await resOrigens.json()) : [];
      const prioridades = resPrioridades?.ok ? extrairLista(await resPrioridades.json()) : [];
      const camerasLista = resCameras?.ok ? extrairLista(await resCameras.json()) : [];

      const normalizar = (str) =>
        String(str || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase();

      const encontrarIdPorTexto = (lista, texto, fallback = 1) => {
        if (!texto || !lista.length) return fallback;
        const alvo = normalizar(texto);
        const achado = lista.find((i) => {
          const val = i.motivo || i.status || i.origem || i.prioridade || i.nome || "";
          return normalizar(val) === alvo;
        });
        return achado?.id ?? fallback;
      };

      // Descobre o ID do responsável atual
      let idRespAtual =
        regBruto.id_usuario_registro ??
        ocorrencia.ID_usuario_registro ??
        ocorrencia.ID_responsavel ??
        null;

      if (!idRespAtual && ocorrencia.Email_responsavel && responsaveis.length > 0) {
        const respEncontrado = responsaveis.find(
          (r) =>
            String(r.email || "").toLowerCase() ===
            String(ocorrencia.Email_responsavel).toLowerCase()
        );
        idRespAtual = respEncontrado?.id ?? null;
      }

      if (!idRespAtual && responsaveis.length > 0) {
        idRespAtual = responsaveis[0].id;
      }

      // Descobre o ID da câmera
      const camEncontrada = camerasLista.find(
        (c) => normalizar(c.nome) === normalizar(ocorrencia.Nome_camera)
      );
      const idCamera = regBruto.id_camera ?? camEncontrada?.id ?? camerasLista[0]?.id ?? 1;

      // Formata id_epi como [{"id": 1}]
      let listaEpi = [];
      if (Array.isArray(regBruto.id_epi)) {
        listaEpi = regBruto.id_epi;
      } else if (Array.isArray(regBruto.epi)) {
        listaEpi = regBruto.epi.map((e) => ({ id: Number(e.id) }));
      } else if (ocorrencia.ID_EPI) {
        listaEpi = [{ id: Number(ocorrencia.ID_EPI) }];
      }

      // Formata cameras conforme o PUT do backend
      const listaCameras =
        Array.isArray(regBruto.cameras) && regBruto.cameras.length > 0
          ? regBruto.cameras.map((c) => ({
              id_camera: Number(c.id_camera ?? c.id ?? idCamera),
              foto: c.foto ?? ocorrencia.foto_ocorrencia ?? "evidencia.png",
              confianca_ia: Number(c.confianca_ia ?? 95.0),
              data_hora: formatarDataSQL(c.data_hora ?? ocorrencia.data_hora),
            }))
          : [
              {
                id_camera: Number(idCamera),
                foto:
                  ocorrencia.foto_ocorrencia ??
                  ocorrencia.Foto_ocorrencia ??
                  "evidencia.png",
                confianca_ia: 95.0,
                data_hora: formatarDataSQL(ocorrencia.data_hora),
              },
            ];

      const payload = {
        descricao: regBruto.descricao ?? ocorrencia.Descricao_Ocorrencia ?? "",
        id_setor: Number(regBruto.id_setor ?? ocorrencia.ID_setor ?? 1),
        id_funcionario:
          camposAtualizados.id_funcionario !== undefined
            ? camposAtualizados.id_funcionario
            : regBruto.id_funcionario ?? ocorrencia.ID_funcionario ?? null,
        id_motivo_ocorrencia: Number(
          regBruto.id_motivo_ocorrencia ??
            encontrarIdPorTexto(motivos, ocorrencia.Motivo_ocorrencia, 1)
        ),
        id_status_ocorrencia: Number(
          camposAtualizados.id_status_ocorrencia ??
            regBruto.id_status_ocorrencia ??
            encontrarIdPorTexto(statuses, ocorrencia.Status_ocorrencia, 1)
        ),
        id_usuario_registro: Number(
          camposAtualizados.id_usuario_registro ?? idRespAtual ?? 1
        ),
        id_origem: Number(
          regBruto.id_origem ?? encontrarIdPorTexto(origens, ocorrencia.origem_ocorrencia, 1)
        ),
        id_prioridade: Number(
          regBruto.id_prioridade ??
            encontrarIdPorTexto(prioridades, ocorrencia.prioridade_ocorrencia, 2)
        ),
        id_epi: listaEpi,
        cameras: listaCameras,
      };

      const res = await fetch(`/api/ocorrencia/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(json.message || "Não foi possível atualizar a ocorrência.");
        return false;
      }

      setSucesso(msgSucesso);
      await carregarOcorrencia();
      return true;
    } catch {
      setErro("Erro de conexão ao atualizar a ocorrência.");
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarFuncionario(e) {
    e.preventDefault();
    if (!funcionarioSelecionado) {
      setErro("Selecione um funcionário.");
      return;
    }
    const ok = await atualizarOcorrencia(
      { id_funcionario: Number(funcionarioSelecionado) },
      "Funcionário vinculado com sucesso!"
    );
    if (ok) {
      setEditandoFunc(false);
      setFuncionarioSelecionado("");
    }
  }

  async function handleSalvarResponsavel(e) {
    e.preventDefault();
    if (!responsavelSelecionado) {
      setErro("Selecione um responsável.");
      return;
    }
    const ok = await atualizarOcorrencia(
      { id_usuario_registro: Number(responsavelSelecionado) },
      "Responsável vinculado com sucesso!"
    );
    if (ok) {
      setEditandoResp(false);
      setResponsavelSelecionado("");
    }
  }

  async function handleAlternarStatus() {
    const fechadaAtual = (ocorrencia?.Status_ocorrencia || "").toLowerCase().includes("fech");
    const novoStatusId = fechadaAtual ? 1 : 3;
    await atualizarOcorrencia(
      { id_status_ocorrencia: novoStatusId },
      fechadaAtual ? "Ocorrência reaberta com sucesso!" : "Ocorrência fechada com sucesso!"
    );
  }

  if (carregando) {
    return (
      <Shell>
        <section className={styles.conteudo}>
          <p className={styles.carregando}>Carregando ocorrência...</p>
        </section>
      </Shell>
    );
  }

  if (!ocorrencia) {
    return (
      <Shell>
        <section className={styles.conteudo}>
          <button className={styles.botaoVoltar} onClick={() => router.push("/ocorrencias")}>
            ← Voltar para ocorrências
          </button>
          <p className={styles.carregando}>Ocorrência não encontrada.</p>
          <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
        </section>
      </Shell>
    );
  }

  const o = ocorrencia;
  const { data, hora } = formatarData(o.data_hora || o.Data_ocorrencia);
  const temFuncionario = Boolean(o.ID_funcionario);
  const temResponsavel = Boolean(o.Nome_responsavel || o.ID_responsavel);
  const fechada = (o.Status_ocorrencia || "").toLowerCase().includes("fech");
  const idFormatado = String(o.ID_ocorrencia).padStart(5, "0");

  const fotoBruta = o.foto_ocorrencia || o.Foto_ocorrencia;
  const urlEvidencia = fotoBruta
    ? fotoBruta.startsWith("http") || fotoBruta.startsWith("/")
      ? fotoBruta
      : `/uploads/${fotoBruta}`
    : null;

  const infos = [
    { rotulo: "Tipo", valor: o.Motivo_ocorrencia },
    { rotulo: "EPI", valor: o.Nome_EPI },
    { rotulo: "Categoria do EPI", valor: o.Categoria_EPI },
    { rotulo: "Cor do EPI", valor: o.Cor_EPI },
    { rotulo: "Setor", valor: o.Nome_setor },
    { rotulo: "Local do setor", valor: o.Local_setor },
    { rotulo: "Câmera", valor: o.Nome_camera },
    { rotulo: "Data", valor: data },
    { rotulo: "Horário", valor: hora },
  ].filter((i) => i.valor);

  return (
    <Shell>
      <section className={styles.conteudo}>
        <button className={styles.botaoVoltar} onClick={() => router.push("/ocorrencias")}>
          ← Voltar para ocorrências
        </button>

        <div className={styles.tituloPagina}>
          <h1>Detalhes da ocorrência</h1>
          <span className={styles.idOcorrencia}>#{idFormatado}</span>
        </div>

        <div className={styles.barraTags}>
          <span className={`${styles.tag} ${classeStatus(o.Status_ocorrencia)}`}>
            <i className={styles.ponto} /> {(o.Status_ocorrencia || "").toUpperCase()}
          </span>
          <span className={styles.tag}>{o.origem_ocorrencia}</span>
          <span className={`${styles.tagPrioridade} ${classePrioridade(o.prioridade_ocorrencia)}`}>
            <i className={styles.ponto} /> {formatarPrioridade(o.prioridade_ocorrencia)}
          </span>
        </div>

        <div className={styles.grade}>
          <div className={styles.colunaEsquerda}>
            {/* CARD FUNCIONÁRIO */}
            <div className={styles.card}>
              <h4 className={styles.cardTitulo}>
                {temFuncionario ? "FUNCIONÁRIO" : "FUNCIONÁRIO NÃO IDENTIFICADO"}
              </h4>

              <div className={styles.perfil}>
                {o.Foto_funcionario && o.Foto_funcionario.startsWith("http") ? (
                  <img
                    src={o.Foto_funcionario}
                    alt={o.Nome_funcionario}
                    className={styles.avatar}
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className={styles.avatar}>
                    {temFuncionario ? iniciais(o.Nome_funcionario) : "?"}
                  </div>
                )}
                <div>
                  <strong>{temFuncionario ? o.Nome_funcionario : "Não identificado"}</strong>
                  <span>
                    {temFuncionario
                      ? [
                          o.Cargo_funcionario,
                          o.ID_funcionario && `Mat. ${String(o.ID_funcionario).padStart(5, "0")}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : "Aguardando identificação"}
                  </span>
                </div>
              </div>

              {temFuncionario ? (
                <ul className={styles.listaPerfil}>
                  {o.Email_funcionario && (
                    <li>
                      <span>E-mail</span>
                      {o.Email_funcionario}
                    </li>
                  )}
                  {o.CPF_funcionario && (
                    <li>
                      <span>CPF</span>
                      {o.CPF_funcionario}
                    </li>
                  )}
                  {o.Data_nascimento_funcionario && (
                    <li>
                      <span>Nascimento</span>
                      {formatarData(o.Data_nascimento_funcionario).data}
                    </li>
                  )}
                  {o.Status_funcionario && (
                    <li>
                      <span>Status</span>
                      {o.Status_funcionario}
                    </li>
                  )}
                </ul>
              ) : (
                <>
                  <p className={styles.textoApoio}>
                    Não foi possível identificar automaticamente o funcionário desta ocorrência.
                  </p>

                  {!editandoFunc ? (
                    <button
                      type="button"
                      className={styles.botaoPrimario}
                      onClick={() => setEditandoFunc(true)}
                    >
                      + Adicionar funcionário
                    </button>
                  ) : (
                    <form onSubmit={handleSalvarFuncionario} style={{ marginTop: "12px" }}>
                      <select
                        value={funcionarioSelecionado}
                        onChange={(e) => setFuncionarioSelecionado(e.target.value)}
                        disabled={salvando}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          background: "#0f1113",
                          color: "#fff",
                          border: "1px solid #2c3138",
                          marginBottom: "10px",
                          fontSize: "14px",
                        }}
                      >
                        <option value="">Selecione um funcionário...</option>
                        {funcionarios.map((f) => {
                          const fId = f.id || f.ID_funcionario || f.id_funcionario;
                          return (
                            <option key={fId} value={fId}>
                              #{fId} - {f.nome}
                            </option>
                          );
                        })}
                      </select>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="submit"
                          className={styles.botaoPrimario}
                          disabled={salvando}
                        >
                          {salvando ? "Salvando..." : "Salvar"}
                        </button>
                        <button
                          type="button"
                          className={styles.botaoSecundario}
                          disabled={salvando}
                          onClick={() => {
                            setEditandoFunc(false);
                            setFuncionarioSelecionado("");
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>

            {/* CARD INFORMAÇÕES */}
            <div className={styles.card}>
              <h4 className={styles.cardTituloCinza}>INFORMAÇÕES</h4>
              <div className={styles.gradeInfo}>
                {infos.map((i) => (
                  <div key={i.rotulo} className={styles.infoItem}>
                    <span>{i.rotulo}</span>
                    <strong>{i.valor}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD RESPONSÁVEL */}
            <div className={styles.card}>
              <h4 className={styles.cardTituloCinza}>
                {temResponsavel ? "RESPONSÁVEL" : "RESPONSÁVEL NÃO ATRIBUÍDO"}
              </h4>

              {temResponsavel ? (
                <div className={styles.perfil}>
                  <div className={styles.avatar}>{iniciais(o.Nome_responsavel)}</div>
                  <div>
                    <strong>{o.Nome_responsavel}</strong>
                    <span>{o.Email_responsavel}</span>
                  </div>
                </div>
              ) : (
                <>
                  <p className={styles.textoApoio}>
                    Nenhum responsável está atribuído a esta ocorrência no momento.
                  </p>

                  {!editandoResp ? (
                    <button
                      type="button"
                      className={styles.botaoPrimario}
                      onClick={() => setEditandoResp(true)}
                    >
                      + Adicionar responsável
                    </button>
                  ) : (
                    <form onSubmit={handleSalvarResponsavel} style={{ marginTop: "12px" }}>
                      <select
                        value={responsavelSelecionado}
                        onChange={(e) => setResponsavelSelecionado(e.target.value)}
                        disabled={salvando}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          background: "#0f1113",
                          color: "#fff",
                          border: "1px solid #2c3138",
                          marginBottom: "10px",
                          fontSize: "14px",
                        }}
                      >
                        <option value="">Selecione um responsável...</option>
                        {responsaveis.map((r) => {
                          const rId = r.id || r.ID_responsavel || r.id_responsavel;
                          return (
                            <option key={rId} value={rId}>
                              #{rId} - {r.nome}
                            </option>
                          );
                        })}
                      </select>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="submit"
                          className={styles.botaoPrimario}
                          disabled={salvando}
                        >
                          {salvando ? "Salvando..." : "Salvar"}
                        </button>
                        <button
                          type="button"
                          className={styles.botaoSecundario}
                          disabled={salvando}
                          onClick={() => {
                            setEditandoResp(false);
                            setResponsavelSelecionado("");
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA */}
          <div className={styles.colunaDireita}>
            <div className={styles.card}>
              <h4 className={styles.cardTitulo}>DESCRIÇÃO</h4>
              <p className={styles.descricao}>{o.Descricao_Ocorrencia || "Sem descrição."}</p>
            </div>

            {/* QUADRO DA EVIDÊNCIA */}
            <div className={styles.card}>
              <h4 className={styles.cardTitulo}>EVIDÊNCIA</h4>
              <div
                className={styles.moldura}
                style={{
                  minHeight: "340px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#0f1113",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid #222529",
                }}
              >
                {urlEvidencia && !erroEvidencia ? (
                  <img
                    src={urlEvidencia}
                    alt="Evidência da ocorrência"
                    onError={() => setErroEvidencia(true)}
                    style={{
                      width: "100%",
                      maxHeight: "480px",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                ) : (
                  <span style={{ color: "#7d8590", fontSize: "14px" }}>
                    Nenhuma evidência fotográfica disponível{fotoBruta ? ` (${fotoBruta})` : ""}.
                  </span>
                )}
              </div>
            </div>

            {o.Descricao_setor && (
              <div className={styles.card}>
                <h4 className={styles.cardTitulo}>SETOR</h4>
                <p className={styles.descricao}>
                  <strong>{o.Nome_setor}</strong> — {o.Descricao_setor}
                </p>
              </div>
            )}

            <div className={styles.acoes}>
              <button
                type="button"
                className={fechada ? styles.botaoReabrir : styles.botaoFechar}
                onClick={handleAlternarStatus}
                disabled={salvando}
              >
                {fechada ? "Reabrir ocorrência" : "Fechar ocorrência"}
              </button>
              <button
                type="button"
                className={styles.botaoSecundario}
                onClick={() => window.print()}
              >
                Exportar PDF
              </button>
            </div>
          </div>
        </div>

        <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
        <Popup mensagem={sucesso} tipo="sucesso" aoFechar={() => setSucesso("")} />
      </section>
    </Shell>
  );
}