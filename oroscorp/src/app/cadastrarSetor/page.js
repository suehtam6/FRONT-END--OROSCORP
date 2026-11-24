"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { uploadParaCloudinary } from "@/API/cloudinary";
import Shell from "../components/Shell";
import Popup from "../components/Popup";
import styles from "../style/cadastrarsetor.module.css";
import modalStyles from "../style/modalGerenciador.module.css";

/*
Data: 9 de Outubro de 2026
Objetivo: Cadastro de Setor
Autor: João Pedro e Kaique Carvalho

Autor do JS: Matheus Lucas
Objetivo: Possibilitar o cadastro de setores corretamente
*/

function Icone({ tipo, className = "" }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    className,
  };

  switch (tipo) {
    case "menu":
      return <svg {...props}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
    case "voltar":
      return <svg {...props}><path d="M10 5 3 12l7 7v-4h11V9H10V5Z" fill="currentColor" /></svg>;
    case "imagem":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      );
    case "escudo":
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "funcionarios":
      return (
        <svg {...props}>
          <circle cx="9" cy="7" r="3" />
          <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
          <path d="M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5" />
        </svg>
      );
    case "camera":
      return (
        <svg {...props}>
          <rect x="3" y="6" width="13" height="12" rx="2" />
          <path d="m16 10 5-3v10l-5-3" />
        </svg>
      );
    case "alerta":
      return (
        <svg {...props}>
          <path d="M12 3 22 20H2L12 3Z" />
          <path d="M12 9v5m0 3v.1" />
        </svg>
      );
    case "capacete":
      return (
        <svg {...props}>
          <path d="M3 14a9 9 0 0 1 18 0v2H3v-2Z" fill="currentColor" />
          <path d="M12 5v9M2 18h20M5 16v2m14-2v2" />
        </svg>
      );
    case "seta":
      return <svg {...props}><path d="m7 10 5 5 5-5" /></svg>;
    case "upload":
      return (
        <svg {...props}>
          <path d="M12 16V4m-5 5 5-5 5 5" />
          <path d="M5 15v5h14v-5" />
        </svg>
      );
    default:
      return null;
  }
}

export default function CadastroSetor() {
  const router = useRouter();
  const inputImagem = useRef(null);
  const uploadRef = useRef({ arquivo: null, url: "" });

  // Estados do Formulário
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [imagem, setImagem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Status (gerenciado por ID numérico)
  const [idStatusSetor, setIdStatusSetor] = useState("");
  const [statusLista, setStatusLista] = useState([]);

  // Modal Gerenciador de Status do Setor
  const [modalStatusAberto, setModalStatusAberto] = useState(false);
  const [novoStatusNome, setNovoStatusNome] = useState("");
  const [statusEditandoId, setStatusEditandoId] = useState(null);
  const [nomeStatusEditado, setNomeStatusEditado] = useState("");

  // Estados de Seleção Múltipla
  const [responsaveis, setResponsaveis] = useState([]);
  const [epis, setEpis] = useState([]);

  // Listas vindas da API
  const [responsaveisDisponiveis, setResponsaveisDisponiveis] = useState([]);
  const [episDisponiveis, setEpisDisponiveis] = useState([]);

  // Estados dos Popups de Notificação
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!imagem) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(imagem);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imagem]);

  const extrairNome = (item) => {
    if (!item) return "Sem Nome";
    if (typeof item.nome === "string") return item.nome;

    if (Array.isArray(item.usuario) && item.usuario.length > 0) {
      if (item.usuario[0]?.nome) return item.usuario[0].nome;
    }

    if (item.usuario && typeof item.usuario === "object" && !Array.isArray(item.usuario)) {
      if (item.usuario.nome) return item.usuario.nome;
    }

    const nomeAlt = item.nome_responsavel || item.nome_epi || item.categoria;
    if (nomeAlt) return nomeAlt;

    return `Item #${item.id || 1}`;
  };

  const extrairFoto = (item) => {
    if (!item) return null;
    let foto = null;

    if (Array.isArray(item.usuario) && item.usuario.length > 0) {
      foto = item.usuario[0]?.foto;
    } else if (item.usuario && typeof item.usuario === "object") {
      foto = item.usuario.foto;
    } else {
      foto = item.foto;
    }

    if (foto && typeof foto === "string" && foto !== "sem-foto.png" && foto.startsWith("http")) {
      return foto;
    }

    return null;
  };

  async function carregarStatusSetor() {
    try {
      const res = await fetch("/api/status-setor");
      if (res.ok) {
        const json = await res.json().catch(() => []);
        const lista =
          json.response?.dados ||
          json.dados ||
          json.response ||
          json.content ||
          (Array.isArray(json) ? json : []);
        setStatusLista(lista);

        if (lista.length > 0 && !idStatusSetor) {
          const primeiroId = lista[0].id || lista[0].id_status_setor || lista[0].idStatusSetor || 1;
          setIdStatusSetor(primeiroId);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar status de setor:", error);
    }
  }

  useEffect(() => {
    async function carregarDados() {
      try {
        const [resResp, resEpi] = await Promise.all([
          fetch("/api/responsavel"),
          fetch("/api/epi"),
        ]);

        const extrair = async (res) => {
          if (!res.ok) return [];
          const json = await res.json().catch(() => []);
          return (
            json.response?.dados ||
            json.dados ||
            json.response ||
            json.content ||
            (Array.isArray(json) ? json : [])
          );
        };

        const listaResp = await extrair(resResp);
        const listaEpi = await extrair(resEpi);

        setResponsaveisDisponiveis(
          listaResp.map((r) => ({
            value: r.id || r.id_responsavel || r.idResponsavel,
            label: extrairNome(r),
            foto: extrairFoto(r),
          }))
        );

        setEpisDisponiveis(
          listaEpi.map((e) => ({
            value: e.id || e.id_epi || e.idEpi,
            label: extrairNome(e),
          }))
        );

        await carregarStatusSetor();
      } catch (error) {
        console.error("Erro ao carregar dependências do setor:", error);
      }
    }
    carregarDados();
  }, []);

  async function criarStatusSetor(e) {
    e.preventDefault();
    if (!novoStatusNome.trim()) return;

    try {
      const res = await fetch("/api/status-setor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatusNome.trim(), nome: novoStatusNome.trim() }),
      });

      if (res.ok) {
        const criado = await res.json().catch(() => ({}));
        setNovoStatusNome("");
        await carregarStatusSetor();

        const idNovo = criado.id || criado.id_status_setor || criado.response?.id;
        if (idNovo) setIdStatusSetor(idNovo);
      } else {
        const err = await res.json().catch(() => ({}));
        setErro(err.message || "Erro ao criar status de setor.");
      }
    } catch {
      setErro("Erro de conexão ao criar status.");
    }
  }

  async function salvarEdicaoStatus(id) {
    if (!nomeStatusEditado.trim()) return;

    try {
      const res = await fetch(`/api/status-setor/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nomeStatusEditado.trim(), nome: nomeStatusEditado.trim() }),
      });

      if (res.ok) {
        setStatusEditandoId(null);
        setNomeStatusEditado("");
        await carregarStatusSetor();
      } else {
        const err = await res.json().catch(() => ({}));
        setErro(err.message || "Erro ao atualizar status.");
      }
    } catch {
      setErro("Erro de conexão ao atualizar status.");
    }
  }

  async function deletarStatus(id) {
    if (!confirm("Deseja realmente excluir este status de setor?")) return;

    try {
      const res = await fetch(`/api/status-setor/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (Number(idStatusSetor) === id) {
          setIdStatusSetor("");
        }
        await carregarStatusSetor();
      } else {
        const err = await res.json().catch(() => ({}));
        setErro(err.message || "Erro ao deletar status.");
      }
    } catch {
      setErro("Erro de conexão ao deletar status.");
    }
  }

  function alternarSelecao(valorStr, lista, atualizar) {
    const valorNum = Number(valorStr);
    if (isNaN(valorNum)) return;

    atualizar(
      lista.includes(valorNum)
        ? lista.filter((item) => item !== valorNum)
        : [...lista, valorNum]
    );
  }

  function cancelar(e) {
    e.preventDefault();
    router.push("/setores");
  }

  async function cadastrarSetor(event) {
    event.preventDefault();
    if (carregando) return;

    setCarregando(true);
    setErro("");
    setSucesso("");

    try {
      let fotoUrl = "";
      if (imagem) {
        if (uploadRef.current.arquivo !== imagem) {
          try {
            const url = await uploadParaCloudinary(imagem);
            uploadRef.current = { arquivo: imagem, url };
          } catch {
            setErro("Não foi possível enviar a foto para o Cloudinary. Tente novamente.");
            return;
          }
        }
        fotoUrl = uploadRef.current.url;
      }

      const mapearParaObjetosId = (arrayDeIds) => arrayDeIds.map((id) => ({ id }));

      const payload = {
        nome: nome,
        foto: fotoUrl || "sem-foto.png",
        descricao: descricao,
        local: localizacao,
        id_status_setor: Number(idStatusSetor) || 1,
        id_epi: mapearParaObjetosId(epis),
        id_responsavel: mapearParaObjetosId(responsaveis),
        id_funcionario: [],
      };

      const resposta = await fetch("/api/setor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const retorno = await resposta.json().catch(() => ({}));

      if (resposta.ok) {
        setSucesso("Setor cadastrado com sucesso!");
      } else {
        setErro(retorno.message || retorno.response?.message || "Erro ao cadastrar o Setor.");
      }
    } catch {
      setErro("Erro de conexão ao comunicar com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Shell>
      <div className={styles.pagina}>
        <section className={styles.conteudo}>
          <div className={styles.tituloPagina}>
            <h1>Cadastro de Setor</h1>
            <p>Preencha as informações do novo setor da empresa.</p>
          </div>

          <form onSubmit={cadastrarSetor}>
            <div className={styles.painel}>
              <div className={styles.areaSuperior}>
                {/* UPLOAD DE IMAGEM */}
                <button
                  type="button"
                  className={styles.uploadImagem}
                  onClick={() => inputImagem.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const arquivo = event.dataTransfer.files?.[0];
                    if (arquivo?.type.startsWith("image/")) {
                      setImagem(arquivo);
                    }
                  }}
                >
                  {previewUrl ? (
                    <img
                      className={styles.previewImagem}
                      src={previewUrl}
                      alt="Pré-visualização do setor"
                    />
                  ) : (
                    <>
                      <span className={styles.caixaImagem}>
                        <Icone tipo="imagem" />
                        <span className={styles.seloUpload}>
                          <Icone tipo="upload" />
                        </span>
                      </span>
                      <span className={styles.textoUpload}>
                        Clique para enviar uma imagem ou
                        <br />
                        arraste o arquivo aqui.
                      </span>
                    </>
                  )}
                </button>
                <input
                  ref={inputImagem}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => {
                    const arquivo = event.target.files?.[0];
                    if (arquivo) setImagem(arquivo);
                  }}
                />

                {/* CARD DE RESUMO */}
                <div className={styles.resumo}>
                  <div className={styles.resumoCabecalho}>
                    <span className={styles.iconeEscudo}>
                      <Icone tipo="escudo" />
                    </span>
                    <div>
                      <h2>Informações do setor</h2>
                      <p>
                        Cadastre um novo setor para
                        <br />
                        organizar os responsáveis,
                        <br />
                        câmeras e EPIs obrigatórios.
                      </p>
                    </div>
                  </div>
                  <div className={styles.resumoLinha}>
                    <span>
                      <Icone tipo="funcionarios" />
                      Responsáveis
                    </span>
                    <strong>{responsaveis.length}</strong>
                  </div>
                  <div className={styles.resumoLinha}>
                    <span>
                      <Icone tipo="capacete" />
                      EPIs obrigatórios
                    </span>
                    <strong>{epis.length}</strong>
                  </div>
                  <div className={styles.resumoLinha}>
                    <span>
                      <Icone tipo="camera" />
                      Câmeras
                    </span>
                    <strong>0</strong>
                  </div>
                </div>
              </div>

              {/* DADOS DO FORMULÁRIO */}
              <div className={styles.formulario}>
                <div className={styles.coluna}>
                  <div className={styles.campo}>
                    <label htmlFor="nome">
                      NOME DO SETOR <span className={styles.obrigatorio}>*</span>
                    </label>
                    <input
                      id="nome"
                      type="text"
                      placeholder="Digite o nome do setor"
                      value={nome}
                      onChange={(event) => setNome(event.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className={styles.campo}>
                    <label htmlFor="descricao">DESCRIÇÃO</label>
                    <div className={styles.textareaWrapper}>
                      <textarea
                        id="descricao"
                        placeholder="Descreva o setor, suas atividades e observações..."
                        value={descricao}
                        onChange={(event) => setDescricao(event.target.value)}
                        maxLength={500}
                      />
                      <span className={styles.contador}>{descricao.length}/500</span>
                    </div>
                  </div>
                </div>

                <div className={styles.coluna}>
                  {/* RESPONSÁVEL DO SETOR */}
                  <div className={styles.campo}>
                    <label>RESPONSÁVEL</label>
                    <div className={styles.selectWrapper}>
                      <select
                        value=""
                        className={styles.selectComIcone}
                        onChange={(event) => {
                          if (event.target.value) {
                            alternarSelecao(event.target.value, responsaveis, setResponsaveis);
                          }
                        }}
                      >
                        <option value="">
                          {responsaveis.length
                            ? `${responsaveis.length} responsável(is) selecionado(s)`
                            : "Selecione os responsáveis"}
                        </option>
                        {responsaveisDisponiveis.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <Icone tipo="seta" className={styles.setaSelect} />
                    </div>
                    {responsaveis.length > 0 && (
                      <div className={styles.selecionados}>
                        {responsaveis.map((id) => {
                          const item = responsaveisDisponiveis.find((r) => r.value === id);
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => alternarSelecao(id, responsaveis, setResponsaveis)}
                              className={styles.tag}
                              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                            >
                              {item?.foto ? (
                                <img
                                  src={item.foto}
                                  alt=""
                                  style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <span>👤</span>
                              )}
                              {item?.label || `ID #${id}`} ×
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* LOCALIZAÇÃO */}
                  <div className={styles.campo}>
                    <label htmlFor="localizacao">LOCALIZAÇÃO</label>
                    <input
                      id="localizacao"
                      type="text"
                      placeholder="Ex: Galpão A, Piso 1"
                      value={localizacao}
                      onChange={(event) => setLocalizacao(event.target.value)}
                    />
                  </div>

                  {/* EPIS DO SETOR */}
                  <div className={styles.campo}>
                    <label>EPI DO SETOR</label>
                    <div className={styles.selectWrapper}>
                      <Icone tipo="capacete" className={styles.iconeCapacete} />
                      <select
                        value=""
                        className={styles.selectComIcone}
                        onChange={(event) => {
                          if (event.target.value) alternarSelecao(event.target.value, epis, setEpis);
                        }}
                      >
                        <option value="">
                          {epis.length ? `${epis.length} EPI(s) selecionado(s)` : "Selecione os EPIs"}
                        </option>
                        {episDisponiveis.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <Icone tipo="seta" className={styles.setaSelect} />
                    </div>
                    {epis.length > 0 && (
                      <div className={styles.selecionados}>
                        {epis.map((id) => {
                          const item = episDisponiveis.find((e) => e.value === id);
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => alternarSelecao(id, epis, setEpis)}
                              className={styles.tag}
                            >
                              {item?.label || `ID #${id}`} ×
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CONFIGURAÇÕES DE SEGURANÇA (STATUS DO SETOR) */}
              <div className={styles.seguranca}>
                <div
                  className={styles.cabecalhoCampoStatus}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div className={styles.tituloSeguranca}>
                    <Icone tipo="escudo" />
                    <h2>Configurações de segurança</h2>
                  </div>
                  <button
                    type="button"
                    className={styles.botaoGerenciar}
                    onClick={() => setModalStatusAberto(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ff7a00",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    + Gerenciar Status
                  </button>
                </div>

                <p>Status do setor</p>
                <div className={styles.opcoesStatus}>
                  {statusLista.length > 0 ? (
                    statusLista.map((status) => {
                      const sId = status.id || status.id_status_setor || status.idStatusSetor;
                      const sNome = status.nome || status.status || (sId === 1 ? "Ativo" : "Inativo");

                      return (
                        <button
                          key={sId}
                          type="button"
                          className={`${styles.statusBotao} ${
                            Number(idStatusSetor) === Number(sId)
                              ? Number(sId) === 1
                                ? styles.statusAtivo
                                : styles.statusInativo
                              : ""
                          }`}
                          onClick={() => setIdStatusSetor(sId)}
                        >
                          <span />
                          {sNome}
                        </button>
                      );
                    })
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`${styles.statusBotao} ${
                          Number(idStatusSetor) === 1 ? styles.statusAtivo : ""
                        }`}
                        onClick={() => setIdStatusSetor(1)}
                      >
                        <span />
                        Ativo
                      </button>
                      <button
                        type="button"
                        className={`${styles.statusBotao} ${
                          Number(idStatusSetor) === 2 ? styles.statusInativo : ""
                        }`}
                        onClick={() => setIdStatusSetor(2)}
                      >
                        <span />
                        Inativo
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className={styles.acoes}>
              <button
                type="button"
                className={styles.botaoCancelar}
                onClick={cancelar}
                disabled={carregando}
              >
                CANCELAR
              </button>
              <button type="submit" className={styles.botaoCadastrar} disabled={carregando}>
                {carregando ? "CADASTRANDO..." : "CADASTRAR SETOR"}
              </button>
            </div>
          </form>

          {/* MODAL DE GERENCIAMENTO DE STATUS DO SETOR */}
          {modalStatusAberto && (
            <div className={modalStyles.modalOverlay}>
              <div className={modalStyles.modalContainer}>
                <div className={modalStyles.modalCabecalho}>
                  <h3>Gerenciar Status do Setor</h3>
                  <button
                    type="button"
                    className={modalStyles.modalFechar}
                    onClick={() => setModalStatusAberto(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className={modalStyles.modalFormulario}>
                  <input
                    type="text"
                    placeholder="Novo Status (ex: Manutenção)..."
                    value={novoStatusNome}
                    onChange={(e) => setNovoStatusNome(e.target.value)}
                    className={modalStyles.modalInput}
                  />
                  <button
                    type="button"
                    onClick={criarStatusSetor}
                    className={modalStyles.modalBotaoAdicionar}
                  >
                    Adicionar
                  </button>
                </div>

                <div className={modalStyles.modalLista}>
                  {statusLista.map((item, index) => {
                    const itemId = item.id || item.id_status_setor || index;
                    const itemNome = item.nome || item.status || "Sem Nome";

                    return (
                      <div key={itemId} className={modalStyles.modalItem}>
                        {statusEditandoId === itemId ? (
                          <input
                            type="text"
                            value={nomeStatusEditado}
                            onChange={(e) => setNomeStatusEditado(e.target.value)}
                            className={modalStyles.modalInputEdicao}
                          />
                        ) : (
                          <span className={modalStyles.modalItemTexto}>● {itemNome}</span>
                        )}

                        <div className={modalStyles.modalAcoesItem}>
                          {statusEditandoId === itemId ? (
                            <>
                              <button
                                type="button"
                                onClick={() => salvarEdicaoStatus(itemId)}
                                className={modalStyles.modalBotaoSalvar}
                              >
                                Salvar
                              </button>
                              <button
                                type="button"
                                onClick={() => setStatusEditandoId(null)}
                                className={modalStyles.modalBotaoCancelarItem}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setStatusEditandoId(itemId);
                                  setNomeStatusEditado(itemNome);
                                }}
                                className={modalStyles.modalBotaoEditar}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => deletarStatus(itemId)}
                                className={modalStyles.modalBotaoExcluir}
                              >
                                Excluir
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={modalStyles.modalRodape}>
                  <button
                    type="button"
                    onClick={() => setModalStatusAberto(false)}
                    className={modalStyles.modalBotaoConcluido}
                  >
                    Concluído
                  </button>
                </div>
              </div>
            </div>
          )}

          <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
          <Popup
            mensagem={sucesso}
            tipo="sucesso"
            titulo="Setor Cadastrado!"
            textoBotao="Ir para Setores"
            aoFechar={() => router.push("/setores")}
          />
        </section>
      </div>
    </Shell>
  );
}