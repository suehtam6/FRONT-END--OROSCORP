"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { uploadParaCloudinary } from "@/API/cloudinary";
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

function formatarCpfInput(valor) {
  const nums = String(valor ?? "").replace(/\D/g, "").slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9)
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
}

export default function DetalheResponsavelPage() {
  const params = useParams();
  const router = useRouter();
  const responsavelId = params?.id;
  const inputFotoRef = useRef(null);

  const [dados, setDados] = useState(null);
  const [statusContaLista, setStatusContaLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroFoto, setErroFoto] = useState(false);

  // Estados de Edição
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [novaFotoArquivo, setNovaFotoArquivo] = useState(null);
  const [previewNovaFoto, setPreviewNovaFoto] = useState("");
  const [formEdicao, setFormEdicao] = useState({
    nome: "",
    cpf: "",
    email: "",
    senha: "",
    data_nascimento: "",
    id_nivel_acesso: 2,
    id_status_conta: 1,
  });

  // Popups
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function carregarDetalhes() {
    if (!responsavelId) return;

    try {
      setCarregando(true);
      setErroFoto(false);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [res, resStatus] = await Promise.all([
        fetch(`/api/responsavel/dados/${responsavelId}`, { headers }),
        fetch("/api/status-conta", { headers }).catch(() => null),
      ]);

      const json = await res.json().catch(() => ({}));

      if (resStatus && resStatus.ok) {
        const listaSt = extrairLista(await resStatus.json());
        listaSt.sort((a, b) => Number(a.id ?? 0) - Number(b.id ?? 0));
        setStatusContaLista(listaSt);
      }

      if (res.ok && json?.response?.dados) {
        const d = json.response.dados;
        setDados(d);

        const dataIso = d.data_nascimento
          ? String(d.data_nascimento).slice(0, 10)
          : "";

        setFormEdicao({
          nome: d.nome ?? "",
          cpf: formatarCpfInput(d.cpf ?? ""),
          email: d.email ?? "",
          senha: "",
          data_nascimento: dataIso,
          id_nivel_acesso: Number(d.id_nivel_acesso ?? 2),
          id_status_conta: Number(d.id_status_conta ?? 1),
        });
      } else if (json?.message) {
        setErro(json.message);
      } else if (res.status === 404) {
        setErro("Responsável não encontrado.");
      } else {
        setErro(`Erro ${res.status} ao carregar dados do responsável.`);
      }
    } catch (e) {
      console.error("Erro ao carregar detalhes do responsável:", e);
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDetalhes();
  }, [responsavelId]);

  useEffect(() => {
    if (!novaFotoArquivo) {
      setPreviewNovaFoto("");
      return;
    }
    const url = URL.createObjectURL(novaFotoArquivo);
    setPreviewNovaFoto(url);
    return () => URL.revokeObjectURL(url);
  }, [novaFotoArquivo]);

  function iniciarEdicao() {
    if (!dados) return;
    const dataIso = dados.data_nascimento
      ? String(dados.data_nascimento).slice(0, 10)
      : "";

    setFormEdicao({
      nome: dados.nome ?? "",
      cpf: formatarCpfInput(dados.cpf ?? ""),
      email: dados.email ?? "",
      senha: "",
      data_nascimento: dataIso,
      id_nivel_acesso: Number(dados.id_nivel_acesso ?? 2),
      id_status_conta: Number(dados.id_status_conta ?? 1),
    });
    setNovaFotoArquivo(null);
    setEditando(true);
  }

  function cancelarEdicao() {
    setEditando(false);
    setNovaFotoArquivo(null);
  }

  // PUT encadeado: 1º atualiza tbl_usuario, 2º atualiza tbl_responsavel
  async function salvarEdicaoResponsavel(e) {
    e.preventDefault();
    if (salvando || !dados) return;

    const idUsuario = dados.id_usuario;
    const idResp = dados.id_responsavel ?? responsavelId;

    if (!idUsuario) {
      setErro("ID do usuário vinculado não encontrado.");
      return;
    }

    if (!formEdicao.nome.trim() || !formEdicao.email.trim()) {
      setErro("Nome e e-mail são obrigatórios.");
      return;
    }

    if (!formEdicao.cpf.trim()) {
      setErro("O CPF do responsável é obrigatório.");
      return;
    }

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // Upload da nova foto se o usuário selecionou outra imagem
      let fotoFinal = dados.foto ?? "sem-foto.png";
      if (novaFotoArquivo) {
        try {
          fotoFinal = await uploadParaCloudinary(novaFotoArquivo);
        } catch {
          setErro("Não foi possível enviar a nova foto para o Cloudinary.");
          setSalvando(false);
          return;
        }
      }

      // 1º PASSO: PUT em /api/usuario/[id]
      const payloadUsuario = {
        nome: formEdicao.nome.trim(),
        foto: fotoFinal,
        email: formEdicao.email.trim(),
        data_nascimento: formEdicao.data_nascimento,
        id_nivel_acesso: Number(formEdicao.id_nivel_acesso) || 2,
        id_status_conta: Number(formEdicao.id_status_conta) || 1,
        ...(formEdicao.senha.trim() ? { senha: formEdicao.senha.trim() } : {}),
      };

      const resUsuario = await fetch(`/api/usuario/${idUsuario}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payloadUsuario),
      });

      const retornoUsuario = await resUsuario.json().catch(() => ({}));

      if (!resUsuario.ok) {
        setErro(
          retornoUsuario?.message ??
            retornoUsuario?.field ??
            "Erro ao atualizar os dados do usuário."
        );
        setSalvando(false);
        return;
      }

      // 2º PASSO: PUT em /api/responsavel/[id]
      const payloadResponsavel = {
        cpf: formEdicao.cpf.trim(),
        id_usuario: Number(idUsuario),
      };

      const resResponsavel = await fetch(`/api/responsavel/${idResp}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payloadResponsavel),
      });

      const retornoResponsavel = await resResponsavel.json().catch(() => ({}));

      if (!resResponsavel.ok) {
        setErro(
          retornoResponsavel?.message ??
            retornoResponsavel?.field ??
            "Usuário atualizado, mas houve erro ao atualizar o responsável."
        );
        setSalvando(false);
        return;
      }

      setEditando(false);
      setNovaFotoArquivo(null);
      setSucesso("Dados do responsável atualizados com sucesso!");
      await carregarDetalhes();
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
      setErro("Erro de conexão ao atualizar os dados.");
    } finally {
      setSalvando(false);
    }
  }

  const obterIniciais = (nome) => {
    if (!nome) return "?";
    const partes = nome.trim().split(" ").filter(Boolean);
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
    const normalizado = String(texto ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    if (normalizado === "ativo") return styles.badgeVerde;
    if (normalizado.includes("inativ") || normalizado.includes("manutencao")) {
      return styles.badgeAmarelo;
    }
    return styles.badgeVermelho;
  };

  if (carregando) {
    return (
      <Shell>
        <main className={styles.conteudo}>
          <div className={styles.painel}>
            <p className={styles.vazio}>Carregando ficha do responsável...</p>
          </div>
        </main>
      </Shell>
    );
  }

  if (!dados) {
    return (
      <Shell>
        <main className={styles.conteudo}>
          <div className={styles.barraTopo}>
            <button
              type="button"
              className={styles.botaoVoltar}
              onClick={() => router.push("/responsavel")}
            >
              ← Voltar para Responsáveis
            </button>
          </div>
          <div className={styles.painel}>
            <p className={styles.vazio}>
              Nenhum dado disponível para este responsável.
            </p>
          </div>
          <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
        </main>
      </Shell>
    );
  }

  const setores = Array.isArray(dados.setores) ? dados.setores : [];
  const ocorrencias = Array.isArray(dados.ocorrencias) ? dados.ocorrencias : [];

  const totalSetores = Number(dados.total_setores ?? setores.length);
  const ocorrenciasAbertas = Number(dados.ocorrencias_abertas ?? 0);
  const ocorrenciasResolvidas = Number(dados.ocorrencias_resolvidas ?? 0);

  const statusTexto = String(dados.status_conta ?? "Ativo").trim();
  const nivelNome = String(dados.nivel_acesso ?? "GESTOR").trim();
  const idade = calcularIdade(dados.data_nascimento);

  const urlFotoValida =
    dados.foto &&
    !erroFoto &&
    dados.foto !== "sem-foto.png" &&
    (dados.foto.startsWith("http") || dados.foto.startsWith("/"));

  const inputEstilo = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    background: "#141619",
    color: "#fff",
    fontSize: "14px",
    marginTop: "6px",
  };

  return (
    <Shell>
      <main className={styles.conteudo}>
        <div
          className={styles.barraTopo}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className={styles.botaoVoltar}
            onClick={() => router.push("/responsavel")}
          >
            ← Voltar para Responsáveis
          </button>

          {!editando && (
            <button
              type="button"
              onClick={iniciarEdicao}
              style={{
                background: "#ff7a00",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 18px",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              ✏️ Editar Responsável
            </button>
          )}
        </div>

        {/* CABEÇALHO DO PERFIL */}
        <div className={`${styles.painel} ${styles.painelTopo}`}>
          <div className={styles.cabecalhoPerfil}>
            <div className={styles.perfilEsquerda}>
              <div
                className={styles.avatarWrapper}
                style={editando ? { cursor: "pointer", position: "relative" } : {}}
                onClick={() => editando && inputFotoRef.current?.click()}
                title={editando ? "Clique para alterar a foto" : undefined}
              >
                {previewNovaFoto ? (
                  <img
                    src={previewNovaFoto}
                    alt="Nova foto"
                    className={styles.avatarImagem}
                  />
                ) : urlFotoValida ? (
                  <img
                    src={dados.foto}
                    alt={dados.nome}
                    className={styles.avatarImagem}
                    onError={() => setErroFoto(true)}
                  />
                ) : (
                  <span className={styles.avatarIniciais}>
                    {obterIniciais(dados.nome)}
                  </span>
                )}
              </div>

              <input
                ref={inputFotoRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setNovaFotoArquivo(file);
                }}
              />

              <div>
                <h1 className={styles.nomeFuncionario}>{dados.nome}</h1>
                <p className={styles.cargoSub}>
                  {nivelNome} • ID #{dados.id_responsavel ?? responsavelId}
                </p>
                <div className={styles.tagsPerfil}>
                  <span
                    className={`${styles.badgeContainer} ${obterClasseStatus(
                      statusTexto
                    )}`}
                  >
                    <span className={styles.dot} />
                    {statusTexto}
                  </span>
                  <span className={styles.badgePequeno}>
                    {totalSetores}{" "}
                    {totalSetores === 1
                      ? "setor supervisionado"
                      : "setores supervisionados"}
                  </span>
                  {editando && (
                    <button
                      type="button"
                      onClick={() => inputFotoRef.current?.click()}
                      style={{
                        background: "rgba(255, 122, 0, 0.15)",
                        color: "#ff7a00",
                        border: "1px solid rgba(255, 122, 0, 0.4)",
                        borderRadius: "999px",
                        padding: "4px 12px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      📷 Alterar foto
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FORMULÁRIO DE EDIÇÃO (EXIBIDO AO CLICAR EM EDITAR) */}
        {editando && (
          <form onSubmit={salvarEdicaoResponsavel} className={styles.painel}>
            <h2 className={styles.secao}>| Editar Dados do Responsável</h2>

            <div className={styles.gradeDados}>
              <div className={styles.campoDado}>
                <label className={styles.rotuloDado}>Nome Completo *</label>
                <input
                  type="text"
                  required
                  style={inputEstilo}
                  value={formEdicao.nome}
                  onChange={(e) =>
                    setFormEdicao({ ...formEdicao, nome: e.target.value })
                  }
                />
              </div>

              <div className={styles.campoDado}>
                <label className={styles.rotuloDado}>CPF *</label>
                <input
                  type="text"
                  required
                  maxLength={14}
                  style={inputEstilo}
                  value={formEdicao.cpf}
                  onChange={(e) =>
                    setFormEdicao({
                      ...formEdicao,
                      cpf: formatarCpfInput(e.target.value),
                    })
                  }
                />
              </div>

              <div className={styles.campoDado}>
                <label className={styles.rotuloDado}>E-mail Corporativo *</label>
                <input
                  type="email"
                  required
                  style={inputEstilo}
                  value={formEdicao.email}
                  onChange={(e) =>
                    setFormEdicao({ ...formEdicao, email: e.target.value })
                  }
                />
              </div>

              <div className={styles.campoDado}>
                <label className={styles.rotuloDado}>Data de Nascimento *</label>
                <input
                  type="date"
                  required
                  style={inputEstilo}
                  value={formEdicao.data_nascimento}
                  onChange={(e) =>
                    setFormEdicao({
                      ...formEdicao,
                      data_nascimento: e.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.campoDado}>
                <label className={styles.rotuloDado}>Situação da Conta</label>
                <select
                  style={inputEstilo}
                  value={formEdicao.id_status_conta}
                  onChange={(e) =>
                    setFormEdicao({
                      ...formEdicao,
                      id_status_conta: Number(e.target.value),
                    })
                  }
                >
                  {statusContaLista.length > 0 ? (
                    statusContaLista.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.status ?? st.nome}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value={1}>Ativo</option>
                      <option value={2}>Inativo</option>
                      <option value={3}>Bloqueado</option>
                    </>
                  )}
                </select>
              </div>

              <div className={styles.campoDado}>
                <label className={styles.rotuloDado}>
                  Nova Senha (deixe em branco para manter)
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  style={inputEstilo}
                  value={formEdicao.senha}
                  onChange={(e) =>
                    setFormEdicao({ ...formEdicao, senha: e.target.value })
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              <button
                type="button"
                onClick={cancelarEdicao}
                disabled={salvando}
                style={{
                  background: "transparent",
                  color: "#c5cbd3",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                style={{
                  background: "#22c55e",
                  color: "#0b140e",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 22px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {salvando ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        )}

        {/* CARDS DE MÉTRICAS */}
        <div className={styles.cardsMetricas}>
          <div className={styles.cardMetrica}>
            <span className={styles.metricaTitulo}>Setores Sob Gestão</span>
            <p className={styles.metricaValor}>{totalSetores}</p>
          </div>
          <div className={styles.cardMetrica}>
            <span className={styles.metricaTitulo}>Ocorrências em Aberto</span>
            <p
              className={`${styles.metricaValor} ${
                ocorrenciasAbertas > 0 ? styles.laranja : ""
              }`}
            >
              {ocorrenciasAbertas}
            </p>
          </div>
          <div className={styles.cardMetrica}>
            <span className={styles.metricaTitulo}>Ocorrências Resolvidas</span>
            <p className={`${styles.metricaValor} ${styles.verde}`}>
              {ocorrenciasResolvidas}
            </p>
          </div>
        </div>

        {/* DADOS CADASTRAIS + SETORES SUPERVISIONADOS */}
        <div className={styles.gradePrincipal}>
          <div className={styles.painel} style={{ marginBottom: 0 }}>
            <h2 className={styles.secao}>| Dados Cadastrais</h2>
            <div className={styles.gradeDados}>
              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>Nome Completo</span>
                <span className={styles.valorDado}>{dados.nome}</span>
              </div>

              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>CPF</span>
                <span className={styles.valorDado}>
                  {dados.cpf ?? "Não informado"}
                </span>
              </div>

              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>E-mail Corporativo</span>
                <span className={styles.valorDado}>
                  {dados.email ?? "Não informado"}
                </span>
              </div>

              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>Data de Nascimento</span>
                <span className={styles.valorDado}>
                  {formatarData(dados.data_nascimento)}
                  {idade !== null ? ` (${idade} anos)` : ""}
                </span>
              </div>

              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>Nível de Acesso</span>
                <span className={styles.valorDado}>{nivelNome}</span>
              </div>

              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>Identificador</span>
                <span className={styles.valorDado}>
                  #{dados.id_responsavel ?? responsavelId}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.painel} style={{ marginBottom: 0 }}>
            <h2 className={styles.secao}>
              | Setores Supervisionados ({setores.length})
            </h2>

            {setores.length === 0 ? (
              <div className={styles.cardSetor}>
                <div>
                  <h3 className={styles.tituloSetor}>Nenhum setor vinculado</h3>
                  <p className={styles.descricaoSetor}>
                    Este gestor ainda não está vinculado como responsável direto
                    de nenhum setor cadastrado.
                  </p>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {setores.map((setorItem) => {
                  const statusSetorTexto = setorItem.status_setor ?? "Ativo";
                  const qtdFunc = Number(setorItem.total_funcionarios ?? 0);

                  return (
                    <div
                      key={setorItem.id_setor}
                      className={styles.cardSetor}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        router.push(`/setores/${setorItem.id_setor}`)
                      }
                    >
                      <div>
                        <h3 className={styles.tituloSetor}>{setorItem.nome}</h3>
                        <p className={styles.descricaoSetor}>
                          {setorItem.descricao ??
                            "Nenhuma descrição cadastrada para este setor."}
                        </p>
                      </div>

                      <div className={styles.rodapeSetor}>
                        <span>
                          <strong>Local:</strong>{" "}
                          {setorItem.local ?? "Não especificado"} •{" "}
                          <strong>Colaboradores:</strong> {qtdFunc}
                        </span>
                        <span
                          className={`${
                            styles.badgeContainer
                          } ${obterClasseStatus(statusSetorTexto)}`}
                        >
                          <span className={styles.dot} />
                          Setor {statusSetorTexto}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* HISTÓRICO DE OCORRÊNCIAS */}
        <div className={styles.painel}>
          <h2 className={styles.secao}>
            | Ocorrências Relacionadas ({ocorrencias.length})
          </h2>

          <div className={styles.rolagem}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>EPI / Descrição</th>
                  <th>Colaborador</th>
                  <th>Setor</th>
                  <th>Data e Hora</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ocorrencias.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.vazio}>
                      Nenhuma ocorrência encontrada nos setores deste responsável.
                    </td>
                  </tr>
                ) : (
                  ocorrencias.map((oc) => {
                    const isAberta = String(oc.Status_ocorrencia ?? "")
                      .toLowerCase()
                      .includes("abert");

                    return (
                      <tr
                        key={oc.ID_ocorrencia}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          router.push(`/ocorrencias/${oc.ID_ocorrencia}`)
                        }
                      >
                        <td>#{oc.ID_ocorrencia}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: "#fff" }}>
                            {oc.Nome_EPI ?? "EPI não especificado"}
                          </div>
                          {oc.Descricao_Ocorrencia && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#8e96a0",
                                marginTop: "4px",
                              }}
                            >
                              {oc.Descricao_Ocorrencia}
                            </div>
                          )}
                        </td>
                        <td>{oc.Nome_funcionario ?? "Não identificado"}</td>
                        <td>
                          <span className={styles.badgePequeno}>
                            {oc.Nome_setor ?? "—"}
                          </span>
                        </td>
                        <td>{formatarDataHora(oc.data_hora)}</td>
                        <td>
                          <span
                            className={`${styles.badgeContainer} ${
                              isAberta
                                ? styles.badgeLaranja
                                : styles.badgeVerde
                            }`}
                          >
                            <span className={styles.dot} />
                            {oc.Status_ocorrencia ?? "Aberta"}
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
        <Popup
          mensagem={sucesso}
          tipo="sucesso"
          titulo="Atualizado!"
          aoFechar={() => setSucesso("")}
        />
      </main>
    </Shell>
  );
}