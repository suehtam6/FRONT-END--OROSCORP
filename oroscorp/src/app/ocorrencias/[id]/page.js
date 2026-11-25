/*
  Autor: Matheus Lucas
  Objetivo: Tela de detalhes da ocorrência, com vínculo de funcionário, responsável automático ao fechar, evidência e confiança da IA
  Data: 14/11/2026
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

  let registros = [];
  if (Array.isArray(r.ocorrencia)) {
    registros = r.ocorrencia;
  } else if (Array.isArray(r.dados)) {
    registros = r.dados;
  } else if (r.ocorrencia && typeof r.ocorrencia === "object") {
    registros = [r.ocorrencia];
  } else if (typeof r === "object" && (r.ID_ocorrencia || r.id)) {
    registros = [r];
  }

  if (registros.length === 0) return null;

  const base = { ...registros[0] };
  const mapaEpis = new Map();

  for (const reg of registros) {
    if (Array.isArray(reg.epis) || Array.isArray(reg.epi)) {
      const arr = reg.epis || reg.epi;
      for (const e of arr) {
        const chave = e.id || e.ID_EPI || e.nome || e.Nome_EPI;
        if (chave && !mapaEpis.has(chave)) {
          mapaEpis.set(chave, {
            id: e.id || e.ID_EPI || null,
            nome: e.nome || e.Nome_EPI || "",
            categoria: e.categoria || e.Categoria_EPI || "",
            cor: e.cor || e.Cor_EPI || "",
          });
        }
      }
    }

    const nomeEpi = reg.Nome_EPI || reg.nome_epi;
    if (nomeEpi) {
      const chave = reg.ID_EPI || nomeEpi;
      if (!mapaEpis.has(chave)) {
        mapaEpis.set(chave, {
          id: reg.ID_EPI || null,
          nome: nomeEpi,
          categoria: reg.Categoria_EPI || "",
          cor: reg.Cor_EPI || "",
        });
      }
    }
  }

  base.lista_epis = Array.from(mapaEpis.values());
  return base;
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
  const [usuarios, setUsuarios] = useState([]);
  const [idRegistroBruto, setIdRegistroBruto] = useState(null);

  const [editandoFunc, setEditandoFunc] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("");
  const [erroFotoResp, setErroFotoResp] = useState(false);

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
        const [resFunc, resUsers, resOcorrBruta] = await Promise.all([
          fetch("/api/funcionario/dados").catch(() => null),
          fetch("/api/usuario").catch(() => null),
          fetch("/api/ocorrencia").catch(() => null),
        ]);

        if (resFunc && resFunc.ok) {
          setFuncionarios(extrairLista(await resFunc.json()));
        }
        if (resUsers && resUsers.ok) {
          setUsuarios(extrairLista(await resUsers.json()));
        }
        if (resOcorrBruta && resOcorrBruta.ok) {
          const listaBruta = extrairLista(await resOcorrBruta.json());
          const reg = listaBruta.find(
            (item) => String(item.id ?? item.ID_ocorrencia) === String(id)
          );
          const idReg = reg?.id_usuario_registro ?? reg?.ID_usuario_registro;
          if (idReg) {
            setIdRegistroBruto(Number(idReg));
          }
        }
      } catch (e) {
        console.error("Erro ao carregar listas:", e);
      }
    }
    carregarListas();
  }, [id]);

  async function atualizarOcorrencia(camposAtualizados, msgSucesso) {
    setSalvando(true);
    setErro("");
    try {
      const [
        resBruta,
        resOcorrCam,
        resMotivos,
        resStatus,
        resOrigens,
        resPrioridades,
        resCameras,
        resEpis,
      ] = await Promise.all([
        fetch("/api/ocorrencia").catch(() => null),
        fetch("/api/ocorrencia-camera").catch(() => null),
        fetch("/api/ocorrencia/motivo_ocorrencia").catch(() => null),
        fetch("/api/ocorrencia/status-ocorrencia").catch(() => null),
        fetch("/api/ocorrencia/origem").catch(() => null),
        fetch("/api/ocorrencia/prioridade").catch(() => null),
        fetch("/api/camera").catch(() => null),
        fetch("/api/epi").catch(() => null),
      ]);

      const listaBruta = resBruta?.ok ? extrairLista(await resBruta.json()) : [];
      const registrosBrutos = listaBruta.filter(
        (item) => String(item.id ?? item.ID_ocorrencia) === String(id)
      );
      const regBruto = registrosBrutos[0] || {};

      const listaOcorrCam = resOcorrCam?.ok
        ? extrairLista(await resOcorrCam.json())
        : [];
      const vinculosCamExistentes = listaOcorrCam.filter(
        (item) => String(item.id_ocorrencia ?? item.ID_ocorrencia) === String(id)
      );

      const motivos = resMotivos?.ok ? extrairLista(await resMotivos.json()) : [];
      const statuses = resStatus?.ok ? extrairLista(await resStatus.json()) : [];
      const origens = resOrigens?.ok ? extrairLista(await resOrigens.json()) : [];
      const prioridades = resPrioridades?.ok ? extrairLista(await resPrioridades.json()) : [];
      const camerasLista = resCameras?.ok ? extrairLista(await resCameras.json()) : [];
      const episCatalogo = resEpis?.ok ? extrairLista(await resEpis.json()) : [];

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

      const idRespAtual =
        regBruto.id_usuario_registro ??
        ocorrencia.ID_usuario_registro ??
        ocorrencia.id_usuario_registro ??
        idRegistroBruto ??
        null;

      const camEncontrada = ocorrencia.Nome_camera
        ? camerasLista.find(
            (c) => normalizar(c.nome) === normalizar(ocorrencia.Nome_camera)
          )
        : null;

      const idCameraExistente =
        vinculosCamExistentes[0]?.id_camera ??
        regBruto.id_camera ??
        ocorrencia.ID_camera ??
        ocorrencia.id_camera ??
        camEncontrada?.id ??
        null;

      const idsEpiSet = new Set();
      if (Array.isArray(regBruto.id_epi)) {
        regBruto.id_epi.forEach((e) => idsEpiSet.add(Number(e.id ?? e)));
      }
      if (Array.isArray(regBruto.epi)) {
        regBruto.epi.forEach((e) => idsEpiSet.add(Number(e.id)));
      }
      registrosBrutos.forEach((r) => {
        if (r.ID_EPI) idsEpiSet.add(Number(r.ID_EPI));
      });
      if (Array.isArray(ocorrencia.lista_epis)) {
        ocorrencia.lista_epis.forEach((e) => {
          if (e.id) {
            idsEpiSet.add(Number(e.id));
          } else if (e.nome && episCatalogo.length > 0) {
            const achado = episCatalogo.find(
              (cat) => normalizar(cat.nome || cat.epi) === normalizar(e.nome)
            );
            if (achado?.id) idsEpiSet.add(Number(achado.id));
          }
        });
      }
      if (idsEpiSet.size === 0 && ocorrencia.ID_EPI) {
        idsEpiSet.add(Number(ocorrencia.ID_EPI));
      }

      const listaEpi = Array.from(idsEpiSet).map((epiId) => ({ id: epiId }));

      const confiancaBruta =
        vinculosCamExistentes[0]?.confianca_ia ??
        regBruto.confianca_ia ??
        ocorrencia.confianca_ia;
      const temConfianca =
        confiancaBruta !== null &&
        confiancaBruta !== undefined &&
        confiancaBruta !== "" &&
        !isNaN(Number(confiancaBruta));

      const fonteCameras =
        vinculosCamExistentes.length > 0
          ? vinculosCamExistentes
          : Array.isArray(regBruto.cameras) && regBruto.cameras.length > 0
          ? regBruto.cameras
          : [
              {
                id_camera: idCameraExistente,
                foto:
                  ocorrencia.foto_ocorrencia ??
                  ocorrencia.Foto_ocorrencia ??
                  "evidencia.png",
                confianca_ia: temConfianca ? Number(confiancaBruta) : null,
                data_hora: ocorrencia.data_hora ?? ocorrencia.Data_ocorrencia,
              },
            ];

      const listaCameras = fonteCameras.map((c) => {
        const idCamItem = c.id_camera ?? idCameraExistente ?? null;
        return {
          ...(c.id ? { id: Number(c.id) } : {}),
          id_camera: idCamItem ? Number(idCamItem) : null,
          foto:
            c.foto ??
            ocorrencia.foto_ocorrencia ??
            ocorrencia.Foto_ocorrencia ??
            "evidencia.png",
          confianca_ia:
            c.confianca_ia !== null && c.confianca_ia !== undefined
              ? Number(c.confianca_ia)
              : temConfianca
              ? Number(confiancaBruta)
              : null,
          data_hora: formatarDataSQL(
            c.data_hora ?? ocorrencia.data_hora ?? ocorrencia.Data_ocorrencia
          ),
        };
      });

      // 1º PASSO: Atualiza tbl_ocorrencia (e tbl_ocorrencia_epi)
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
        id_usuario_registro: idRespAtual ? Number(idRespAtual) : null,
        vincular_usuario_token: Boolean(
          camposAtualizados.vincular_usuario_token || !idRespAtual
        ),
        id_origem: Number(
          regBruto.id_origem ??
            encontrarIdPorTexto(origens, ocorrencia.origem_ocorrencia, 1)
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
        setErro(
          json.message ||
            json.response?.message ||
            "Não foi possível atualizar a ocorrência."
        );
        return false;
      }

      const resCheckCam = await fetch("/api/ocorrencia-camera").catch(() => null);
      const listaPosUpdate = resCheckCam?.ok
        ? extrairLista(await resCheckCam.json())
        : [];
      const aindaExisteVinculo = listaPosUpdate.some(
        (item) => String(item.id_ocorrencia ?? item.ID_ocorrencia) === String(id)
      );

      if (!aindaExisteVinculo) {
        for (const cam of listaCameras) {
          await fetch("/api/ocorrencia-camera", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_ocorrencia: Number(id),
              id_camera: cam.id_camera,
              foto: cam.foto,
              data_hora: cam.data_hora,
              confianca_ia: cam.confianca_ia,
            }),
          }).catch(() => null);
        }
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

  async function handleAlternarStatus() {
    const fechadaAtual = (ocorrencia?.Status_ocorrencia || "").toLowerCase().includes("fech");
    const novoStatusId = fechadaAtual ? 1 : 3;

    await atualizarOcorrencia(
      {
        id_status_ocorrencia: novoStatusId,
        vincular_usuario_token: !fechadaAtual,
      },
      fechadaAtual
        ? "Ocorrência reaberta com sucesso!"
        : "Ocorrência fechada e atribuída ao seu usuário!"
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
  const fechada = (o.Status_ocorrencia || "").toLowerCase().includes("fech");
  const idFormatado = String(o.ID_ocorrencia).padStart(5, "0");

  const isOrigemIA = String(o.origem_ocorrencia || "").trim().toUpperCase() === "IA";
  const confiancaNum = Number(o.confianca_ia);
  const porcentagemIA = !isNaN(confiancaNum)
    ? Math.min(100, Math.max(0, Math.round(confiancaNum)))
    : null;

  const fotoBruta = o.foto_ocorrencia || o.Foto_ocorrencia;
  const urlEvidencia = fotoBruta
    ? fotoBruta.startsWith("http") || fotoBruta.startsWith("/")
      ? fotoBruta
      : `/uploads/${fotoBruta}`
    : null;

  const listaEpis =
    Array.isArray(o.lista_epis) && o.lista_epis.length > 0
      ? o.lista_epis
      : o.Nome_EPI
        ? [{ nome: o.Nome_EPI, categoria: o.Categoria_EPI, cor: o.Cor_EPI }]
        : [];

  const nomesEpisUnidos = listaEpis.map((e) => e.nome).filter(Boolean).join(", ");
  const variosEpis = listaEpis.length > 1;

  const infos = [
    { rotulo: "Tipo", valor: o.Motivo_ocorrencia },
    ...(!variosEpis
      ? [
        { rotulo: "EPI", valor: listaEpis[0]?.nome },
        { rotulo: "Categoria do EPI", valor: listaEpis[0]?.categoria },
        { rotulo: "Cor do EPI", valor: listaEpis[0]?.cor },
      ]
      : []),
    { rotulo: "Setor", valor: o.Nome_setor },
    { rotulo: "Local do setor", valor: o.Local_setor },
    { rotulo: "Câmera", valor: o.Nome_camera },
    { rotulo: "Data", valor: data },
    { rotulo: "Horário", valor: hora },
  ].filter((i) => i.valor);

  const idAutor = Number(
    o.ID_usuario_registro || o.id_usuario_registro || idRegistroBruto || o.ID_responsavel || 0
  );

  const usuarioAutor =
    usuarios.find((u) => Number(u.id || u.id_usuario) === idAutor) || null;

  const nomeResponsavelExibicao = o.Nome_responsavel || usuarioAutor?.nome || "";
  const emailResponsavelExibicao = o.Email_responsavel || usuarioAutor?.email || "";
  const fotoResponsavelExibicao =
    o.Foto_responsavel || o.foto_responsavel || usuarioAutor?.foto || "";
  const temResponsavel = Boolean(nomeResponsavelExibicao || idAutor);

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
                      : isOrigemIA
                        ? "Detecção automática pela IA"
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
                    {isOrigemIA
                      ? "A inteligência artificial detectou uma possível irregularidade, mas não foi possível identificar automaticamente o funcionário."
                      : "Não foi possível identificar automaticamente o funcionário desta ocorrência."}
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

            {isOrigemIA && porcentagemIA !== null && (
              <div className={styles.card}>
                <h4
                  className={styles.cardTitulo}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f36f16"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  DETECÇÃO DA IA
                </h4>

                <span
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: "#8e96a0",
                    marginTop: "6px",
                    marginBottom: "4px",
                  }}
                >
                  Confiança da análise
                </span>

                <div
                  style={{
                    fontSize: "34px",
                    fontWeight: 800,
                    color: "#f36f16",
                    lineHeight: 1.1,
                    marginBottom: "12px",
                  }}
                >
                  {porcentagemIA}%
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "7px",
                    backgroundColor: "#262a30",
                    borderRadius: "999px",
                    overflow: "hidden",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      width: `${porcentagemIA}%`,
                      height: "100%",
                      backgroundColor: "#f36f16",
                      borderRadius: "999px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>

                <div style={{ fontSize: "13px", color: "#8e96a0" }}>
                  Detecção:{" "}
                  <strong style={{ color: "#e6edf3", fontWeight: 600 }}>
                    {nomesEpisUnidos
                      ? `Ausência de ${nomesEpisUnidos.toLowerCase()}`
                      : o.Motivo_ocorrencia || "Não conformidade de EPI"}
                  </strong>
                </div>
              </div>
            )}

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

              {variosEpis && (
                <div style={{ marginTop: "14px" }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      color: "#8e96a0",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    EPIs vinculados ({listaEpis.length})
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {listaEpis.map((epi, idx) => (
                      <div
                        key={epi.id || `${epi.nome}-${idx}`}
                        className={styles.infoItem}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "3px",
                        }}
                      >
                        <strong>{epi.nome}</strong>
                        {(epi.categoria || epi.cor) && (
                          <span style={{ fontSize: "12px", color: "#8e96a0" }}>
                            {[epi.categoria, epi.cor].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AQUI ESTARÁ O CARD DO RESPONSÁVEL*/}
            <div className={styles.card}>
              <h4 className={styles.cardTituloCinza}>
                {temResponsavel ? "RESPONSÁVEL" : "RESPONSÁVEL NÃO ATRIBUÍDO"}
              </h4>

             {temResponsavel ? (
                <div className={styles.perfil}>
                  {fotoResponsavelExibicao &&
                  fotoResponsavelExibicao.startsWith("http") &&
                  !erroFotoResp ? (
                    <img
                      src={fotoResponsavelExibicao}
                      alt={nomeResponsavelExibicao}
                      className={styles.avatar}
                      style={{ objectFit: "cover" }}
                      onError={() => setErroFotoResp(true)}
                    />
                  ) : (
                    <div className={styles.avatar}>
                      {iniciais(nomeResponsavelExibicao || `U${idAutor}`)}
                    </div>
                  )}
                  <div>
                    <strong>{nomeResponsavelExibicao || `Usuário #${idAutor}`}</strong>
                    <span>{emailResponsavelExibicao}</span>
                  </div>
                </div>
              ) : (
                <p className={styles.textoApoio}>
                  Nenhum responsável atribuído. Ao clicar em{" "}
                  <strong style={{ color: "#e6edf3" }}>Fechar ocorrência</strong>, o seu usuário
                  será registrado automaticamente como responsável pelo encerramento.
                </p>
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