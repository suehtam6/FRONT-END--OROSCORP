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

export default function DetalheEpiPage() {
  const params = useParams();
  const router = useRouter();
  const epiId = params?.id;
  const inputFotoRef = useRef(null);

  const [epi, setEpi] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [setoresVinculados, setSetoresVinculados] = useState([]);
  const [ocorrenciasVinculadas, setOcorrenciasVinculadas] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erroFoto, setErroFoto] = useState(false);

  // Estados de Edição
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [novaFotoArquivo, setNovaFotoArquivo] = useState(null);
  const [previewNovaFoto, setPreviewNovaFoto] = useState("");
  const [formEdicao, setFormEdicao] = useState({
    nome: "",
    cor: "",
    descricao: "",
    id_categoria: "",
  });

  // Popups
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

async function carregarDados() {
    if (!epiId) return;

    try {
      setCarregando(true);
      setErroFoto(false);

      const [resEpi, resCategorias] = await Promise.all([
        fetch(`/api/epi/dados/${epiId}`),
        fetch("/api/categoria-epi").catch(() => null),
      ]);

      let listaCats = [];
      if (resCategorias && resCategorias.ok) {
        listaCats = extrairLista(await resCategorias.json());
        setCategorias(listaCats);
      }

      if (!resEpi.ok) {
        const errJson = await resEpi.json().catch(() => ({}));
        setErro(
          errJson?.message ??
            (resEpi.status === 404
              ? "EPI não encontrado."
              : `Erro ${resEpi.status} ao carregar detalhes do EPI.`)
        );
        return;
      }

      const jsonEpi = await resEpi.json().catch(() => ({}));
      const itemEpi = jsonEpi?.response?.dados ?? jsonEpi?.dados ?? jsonEpi;

      if (!itemEpi || (!itemEpi.id_epi && !itemEpi.id && !itemEpi.nome)) {
        setErro("EPI não encontrado.");
        return;
      }

      setEpi(itemEpi);
      setSetoresVinculados(Array.isArray(itemEpi.setores) ? itemEpi.setores : []);
      setOcorrenciasVinculadas(
        Array.isArray(itemEpi.ocorrencias) ? itemEpi.ocorrencias : []
      );

      setFormEdicao({
        nome: itemEpi.nome ?? "",
        cor: itemEpi.cor ?? "",
        descricao: itemEpi.descricao ?? "",
        id_categoria: String(itemEpi.id_categoria ?? listaCats[0]?.id ?? ""),
      });
    } catch (e) {
      console.error("Erro ao carregar detalhes do EPI:", e);
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [epiId]);

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
    if (!epi) return;
    const idCatAtual =
      (Array.isArray(epi.categoria) && epi.categoria[0]?.id) ||
      epi.categoria?.id ||
      epi.id_categoria ||
      (categorias[0]?.id ?? "");

    setFormEdicao({
      nome: epi.nome ?? "",
      cor: epi.cor ?? "",
      descricao: epi.descricao ?? "",
      id_categoria: String(idCatAtual),
    });
    setNovaFotoArquivo(null);
    setEditando(true);
  }

  function cancelarEdicao() {
    setEditando(false);
    setNovaFotoArquivo(null);
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    if (salvando || !epi) return;

    if (!formEdicao.nome.trim()) {
      setErro("O nome do EPI é obrigatório.");
      return;
    }

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      let fotoFinal = epi.foto ?? "sem-foto.png";
      if (novaFotoArquivo) {
        try {
          fotoFinal = await uploadParaCloudinary(novaFotoArquivo);
        } catch {
          setErro("Não foi possível enviar a nova imagem para o Cloudinary.");
          setSalvando(false);
          return;
        }
      }

      const idReal = epi.id ?? epi.id_epi ?? epiId;

      const payload = {
        nome: formEdicao.nome.trim(),
        foto: fotoFinal,
        cor: formEdicao.cor.trim(),
        descricao: formEdicao.descricao.trim(),
        id_categoria: Number(formEdicao.id_categoria) || 1,
      };

      const res = await fetch(`/api/epi/${idReal}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(
          json?.message ?? json?.field ?? "Erro ao atualizar os dados do EPI."
        );
        setSalvando(false);
        return;
      }

      setEditando(false);
      setNovaFotoArquivo(null);
      setSucesso("Equipamento (EPI) atualizado com sucesso!");
      await carregarDados();
    } catch (error) {
      console.error("Erro ao atualizar EPI:", error);
      setErro("Erro de conexão ao salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  const obterCategoriaNome = () => {
    if (!epi) return "Geral";
    if (Array.isArray(epi.categoria) && epi.categoria.length > 0) {
      return epi.categoria[0].categoria ?? epi.categoria[0].nome ?? "Geral";
    }
    if (epi.categoria && typeof epi.categoria === "object") {
      return epi.categoria.categoria ?? epi.categoria.nome ?? "Geral";
    }
    if (typeof epi.categoria === "string" && epi.categoria.trim() !== "") {
      return epi.categoria;
    }
    const idCat = epi.id_categoria ?? epi.ID_categoria;
    if (idCat && categorias.length > 0) {
      const enc = categorias.find(
        (c) => Number(c.id ?? c.id_categoria) === Number(idCat)
      );
      if (enc) return enc.categoria ?? enc.nome ?? "Geral";
    }
    return "Geral";
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
            <p className={styles.vazio}>Carregando ficha do equipamento...</p>
          </div>
        </main>
      </Shell>
    );
  }

  if (!epi) {
    return (
      <Shell>
        <main className={styles.conteudo}>
          <div className={styles.barraTopo}>
            <button
              type="button"
              className={styles.botaoVoltar}
              onClick={() => router.push("/epis")}
            >
              ← Voltar para EPIs
            </button>
          </div>
          <div className={styles.painel}>
            <p className={styles.vazio}>
              Nenhum dado disponível para este equipamento.
            </p>
          </div>
          <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
        </main>
      </Shell>
    );
  }

  const idExibicao = epi.id ?? epi.id_epi ?? epiId;
  const categoriaNome = obterCategoriaNome();
  const ocorrenciasAbertas = ocorrenciasVinculadas.filter((oc) =>
    String(oc.Status_ocorrencia ?? oc.status ?? "")
      .toLowerCase()
      .includes("abert")
  ).length;

  const urlFotoValida =
    epi.foto &&
    !erroFoto &&
    epi.foto !== "sem-foto.png" &&
    (epi.foto.startsWith("http") || epi.foto.startsWith("/"));

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
        {/* BARRA SUPERIOR */}
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
            onClick={() => router.push("/epis")}
          >
            ← Voltar para EPIs
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
              ✏️ Editar EPI
            </button>
          )}
        </div>

        {/* CABEÇALHO DO EPI */}
        <div className={`${styles.painel} ${styles.painelTopo}`}>
          <div className={styles.cabecalhoPerfil}>
            <div className={styles.perfilEsquerda}>
              <div
                className={styles.avatarWrapper}
                style={editando ? { cursor: "pointer" } : {}}
                onClick={() => editando && inputFotoRef.current?.click()}
                title={editando ? "Clique para alterar a imagem" : undefined}
              >
                {previewNovaFoto ? (
                  <img
                    src={previewNovaFoto}
                    alt="Nova foto do EPI"
                    className={styles.avatarImagem}
                  />
                ) : urlFotoValida ? (
                  <img
                    src={epi.foto}
                    alt={epi.nome}
                    className={styles.avatarImagem}
                    onError={() => setErroFoto(true)}
                  />
                ) : (
                  <span className={styles.avatarIniciais}>🦺</span>
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
                <h1 className={styles.nomeFuncionario}>{epi.nome}</h1>
                <p className={styles.cargoSub}>
                  {categoriaNome} • ID #{idExibicao}
                </p>
                <div className={styles.tagsPerfil}>
                  <span className={styles.badgePequeno}>
                    🏷️ {categoriaNome}
                  </span>
                  {epi.cor && (
                    <span className={styles.badgePequeno}>🎨 {epi.cor}</span>
                  )}
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
                      📷 Alterar imagem
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FORMULÁRIO DE EDIÇÃO */}
        {editando && (
          <form onSubmit={salvarEdicao} className={styles.painel}>
            <h2 className={styles.secao}>| Editar Equipamento (EPI)</h2>

            <div className={styles.gradeDados}>
              <div className={styles.campoDado}>
                <label className={styles.rotuloDado}>Nome do EPI *</label>
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
                <label className={styles.rotuloDado}>Categoria *</label>
                <select
                  style={inputEstilo}
                  value={formEdicao.id_categoria}
                  onChange={(e) =>
                    setFormEdicao({
                      ...formEdicao,
                      id_categoria: e.target.value,
                    })
                  }
                >
                  {categorias.length > 0 ? (
                    categorias.map((cat) => (
                      <option
                        key={cat.id ?? cat.id_categoria}
                        value={cat.id ?? cat.id_categoria}
                      >
                        {cat.categoria ?? cat.nome}
                      </option>
                    ))
                  ) : (
                    <option value={formEdicao.id_categoria || "1"}>
                      {categoriaNome}
                    </option>
                  )}
                </select>
              </div>

              <div className={styles.campoDado}>
                <label className={styles.rotuloDado}>Cor</label>
                <input
                  type="text"
                  placeholder="Ex: Amarelo, Transparente, Preto..."
                  style={inputEstilo}
                  value={formEdicao.cor}
                  onChange={(e) =>
                    setFormEdicao({ ...formEdicao, cor: e.target.value })
                  }
                />
              </div>

              <div className={styles.campoDado} style={{ gridColumn: "1 / -1" }}>
                <label className={styles.rotuloDado}>Descrição / Especificação</label>
                <textarea
                  rows={3}
                  style={{ ...inputEstilo, resize: "vertical" }}
                  value={formEdicao.descricao}
                  onChange={(e) =>
                    setFormEdicao({ ...formEdicao, descricao: e.target.value })
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
            <span className={styles.metricaTitulo}>Setores Obrigatórios</span>
            <p className={styles.metricaValor}>{setoresVinculados.length}</p>
          </div>
          <div className={styles.cardMetrica}>
            <span className={styles.metricaTitulo}>Ocorrências Totais</span>
            <p className={styles.metricaValor}>
              {ocorrenciasVinculadas.length}
            </p>
          </div>
          <div className={styles.cardMetrica}>
            <span className={styles.metricaTitulo}>Ocorrências em Aberto</span>
            <p
              className={`${styles.metricaValor} ${
                ocorrenciasAbertas > 0 ? styles.laranja : styles.verde
              }`}
            >
              {ocorrenciasAbertas}
            </p>
          </div>
        </div>

        {/* DADOS DO EQUIPAMENTO + SETORES VINCULADOS */}
        <div className={styles.gradePrincipal}>
          <div className={styles.painel} style={{ marginBottom: 0 }}>
            <h2 className={styles.secao}>| Especificações do Equipamento</h2>
            <div className={styles.gradeDados}>
              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>Nome do EPI</span>
                <span className={styles.valorDado}>{epi.nome}</span>
              </div>

              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>Categoria</span>
                <span className={styles.valorDado}>{categoriaNome}</span>
              </div>

              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>Cor</span>
                <span className={styles.valorDado}>
                  {epi.cor || "Não informada"}
                </span>
              </div>

              <div className={styles.campoDado}>
                <span className={styles.rotuloDado}>Identificador</span>
                <span className={styles.valorDado}>#{idExibicao}</span>
              </div>

              <div className={styles.campoDado} style={{ gridColumn: "1 / -1" }}>
                <span className={styles.rotuloDado}>Descrição</span>
                <span className={styles.valorDado}>
                  {epi.descricao || "Nenhuma descrição cadastrada para este EPI."}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.painel} style={{ marginBottom: 0 }}>
            <h2 className={styles.secao}>
              | Setores onde é Obrigatório ({setoresVinculados.length})
            </h2>

            {setoresVinculados.length === 0 ? (
              <div className={styles.cardSetor}>
                <div>
                  <h3 className={styles.tituloSetor}>Nenhum setor vinculado</h3>
                  <p className={styles.descricaoSetor}>
                    Este EPI ainda não está vinculado como obrigatório em nenhum setor cadastrado.
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
                {setoresVinculados.map((setorItem) => {
                  const idSetor = setorItem.id ?? setorItem.id_setor;
                  const statusSetorTexto = Array.isArray(setorItem.status_setor)
                    ? setorItem.status_setor[0]?.status
                    : setorItem.status_setor ?? "Ativo";

                  return (
                    <div
                      key={idSetor}
                      className={styles.cardSetor}
                      style={{ cursor: "pointer" }}
                      onClick={() => router.push(`/setores/${idSetor}`)}
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
                          {setorItem.local ?? "Não especificado"}
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

        {/* HISTÓRICO DE OCORRÊNCIAS COM ESTE EPI */}
        <div className={styles.painel}>
          <h2 className={styles.secao}>
            | Ocorrências Relacionadas ({ocorrenciasVinculadas.length})
          </h2>

          <div className={styles.rolagem}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Motivo / Descrição</th>
                  <th>Colaborador</th>
                  <th>Setor</th>
                  <th>Data e Hora</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ocorrenciasVinculadas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.vazio}>
                      Nenhuma ocorrência registrada envolvendo este EPI.
                    </td>
                  </tr>
                ) : (
                  ocorrenciasVinculadas.map((oc) => {
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
                            {oc.Motivo_ocorrencia ?? "Ocorrência de EPI"}
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