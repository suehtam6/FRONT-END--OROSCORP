"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadParaCloudinary } from "@/API/cloudinary";
import Shell from "../components/Shell";
import Popup from "../components/Popup";
import styles from "../style/cadastrarOcorrencia.module.css";
import modalStyles from "../style/modalGerenciador.module.css";

const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO_MB = 5;

export default function RegistrarOcorrencia() {
  const router = useRouter();
  const inputImagemRef = useRef(null);
  const uploadRef = useRef({ arquivo: null, url: "" });

  // Estados do Formulário
  const [idFuncionario, setIdFuncionario] = useState("");
  const [idSetor, setIdSetor] = useState("");
  const [idCamera, setIdCamera] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [idPrioridade, setIdPrioridade] = useState("");
  const [idStatusOcorrencia, setIdStatusOcorrencia] = useState("");
  const [episSelecionados, setEpisSelecionados] = useState([]);
  const [descricao, setDescricao] = useState("");
  const [imagem, setImagem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [IdMotivoOcorrencia, setIdMotivoOcorrencia] = useState("");

  // Listas vindas da API
  const [funcionarios, setFuncionarios] = useState([]);
  const [setores, setSetores] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [episLista, setEpisLista] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [statusLista, setStatusLista] = useState([]);
  const [listaMotivoOcorrencia, setMotivoOcorrencia] = useState([]);

  // Popups e Carregamento
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Para cadastrar, atualizar ou deletar o motivo da ocorrência
  const [modalNivelAberto, setModalNivelAberto] = useState(false);
  const [novoMotivoOcorrencia, setNovoMotivoOcorrencia] = useState("");
  const [motivoEditandoId, setMotivoEditandoId] = useState(null);
  const [nomeMotivoEditado, setNomeMotivoEditado] = useState("");

  const extrairLista = (resJson) => {
    if (!resJson) return [];
    const lista =
      resJson.response?.dados ||
      resJson.dados ||
      resJson.response ||
      resJson.content ||
      resJson;
    return Array.isArray(lista) ? lista : [];
  };

  const idDoMotivo = (motivo) => motivo.id ?? motivo.id_motivo_ocorrencia;

  const extrairNomeFuncionario = (item) => {
    if (!item) return "Funcionário sem nome";
    return (
      item.nome ||
      item.usuario?.[0]?.nome ||
      item.usuario?.nome ||
      item.id_usuario?.nome ||
      `Funcionário #${item.id || item.id_funcionario}`
    );
  };

  const extrairNomeCamera = (item) => {
    if (!item) return "Câmera sem nome";
    return (
      item.nome ||
      item.nome_camera ||
      item.descricao ||
      item.localizacao ||
      `Câmera #${item.id || item.id_camera}`
    );
  };

  const alternarEpi = (epiId) => {
    const idNum = Number(epiId);
    setEpisSelecionados((prev) =>
      prev.includes(idNum)
        ? prev.filter((item) => item !== idNum)
        : [...prev, idNum]
    );
  };

  // Gera o preview e libera a memória quando a imagem muda
  useEffect(() => {
    if (!imagem) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(imagem);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imagem]);

  const selecionarImagem = (arquivo) => {
    if (!arquivo) return;

    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      setErro("A foto deve ser JPG, PNG ou WebP.");
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
      setErro(`A foto deve ter no máximo ${TAMANHO_MAXIMO_MB} MB.`);
      return;
    }

    setErro("");
    setImagem(arquivo);
  };

  const aoEscolherArquivo = (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    selecionarImagem(arquivo);
  };

  useEffect(() => {
    async function carregarDependencias() {
      try {
        const [
          resFunc,
          resSetor,
          resCam,
          resEpi,
          resPrio,
          resStat,
          resMotivoOcorrencia,
        ] = await Promise.all([
          fetch("/api/funcionario"),
          fetch("/api/setor"),
          fetch("/api/camera"),
          fetch("/api/epi"),
          fetch("/api/ocorrencia/prioridade"),
          fetch("/api/ocorrencia/status-ocorrencia"),
          fetch("/api/ocorrencia/motivo_ocorrencia"),
        ]);

        if (resFunc.ok) setFuncionarios(extrairLista(await resFunc.json()));
        if (resSetor.ok) setSetores(extrairLista(await resSetor.json()));
        if (resCam.ok) setCameras(extrairLista(await resCam.json()));
        if (resEpi.ok) setEpisLista(extrairLista(await resEpi.json()));
        if (resMotivoOcorrencia.ok)
          setMotivoOcorrencia(extrairLista(await resMotivoOcorrencia.json()));

        if (resPrio.ok) {
          const listaPrio = extrairLista(await resPrio.json());
          setPrioridades(listaPrio);
          if (listaPrio.length > 0) setIdPrioridade(listaPrio[0].id || 1);
        }

        if (resStat.ok) {
          const listaStat = extrairLista(await resStat.json());
          setStatusLista(listaStat);
          if (listaStat.length > 0) setIdStatusOcorrencia(listaStat[0].id || 1);
        }
      } catch (err) {
        console.error("Erro ao carregar dependências da ocorrência:", err);
      }
    }
    carregarDependencias();
  }, []);

  const camerasDoSetor = cameras.filter((c) => {
    const setorCameraId = c.id_setor || c.setor?.[0]?.id || c.setor?.id;
    return Number(setorCameraId) === Number(idSetor);
  });

  async function registrar(e) {
    e.preventDefault();
    if (carregando) return;

    if (episSelecionados.length === 0) {
      setErro("Selecione pelo menos um EPI ausente para registrar a ocorrência.");
      return;
    }

    setCarregando(true);
    setErro("");
    setSucesso("");

    try {
      let fotoUrl = "";
      if (imagem) {
        if (uploadRef.current.arquivo !== imagem) {
          let url;
          try {
            url = await uploadParaCloudinary(imagem);
          } catch {
            setErro("Não foi possível enviar a foto. Tente novamente.");
            return;
          }
          uploadRef.current = { arquivo: imagem, url };
        }
        fotoUrl = uploadRef.current.url;
      }

      const dataHoraStr =
        data && hora
          ? `${data} ${hora}:00`
          : new Date().toISOString().replace("T", " ").substring(0, 19);

      const cameraAlvoId =
        idCamera ||
        (fotoUrl
          ? camerasDoSetor[0]?.id || camerasDoSetor[0]?.id_camera || cameras[0]?.id || 1
          : null);

      const payload = {
        descricao: descricao,
        id_setor: Number(idSetor),
        id_funcionario: Number(idFuncionario) || null,
        id_motivo_ocorrencia: Number(IdMotivoOcorrencia),
        id_status_ocorrencia: Number(idStatusOcorrencia),
        id_usuario_registro: null,
        id_origem: 1,
        id_prioridade: Number(idPrioridade),
        id_epi: episSelecionados.map((id) => ({ id: Number(id) })),
        cameras: cameraAlvoId
          ? [
            {
              id_camera: Number(cameraAlvoId),
              foto: fotoUrl || "sem-foto.png",
              confianca_ia: 95,
              data_hora: dataHoraStr,
            },
          ]
          : [],
      };

      const res = await fetch("/api/ocorrencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const retorno = await res.json().catch(() => ({}));

      if (res.ok) {
        setSucesso("Ocorrência registrada com sucesso!");
      } else {
        setErro(retorno.message || "Erro ao registrar ocorrência.");
      }
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarMotivos() {
    try {
      const res = await fetch("/api/ocorrencia/motivo_ocorrencia");
      const dadosAPI = await res.json().catch(() => null);

      if (res.ok) {
        setMotivoOcorrencia(extrairLista(dadosAPI));
      }
    } catch (error) {
      console.error("Falha de conexão ao buscar motivo ocorrencia:", error);
    }
  }

  async function criarMotivoOcorrencia(e) {
    e?.preventDefault();
    if (!novoMotivoOcorrencia.trim()) return;

    try {
      const res = await fetch("/api/ocorrencia/motivo_ocorrencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoMotivoOcorrencia.trim() }),
      });

      if (res.ok) {
        const criado = await res.json().catch(() => ({}));
        setNovoMotivoOcorrencia("");
        await carregarMotivos();

        const idNovo = criado.id || criado.response?.id;
        if (idNovo) {
          setIdMotivoOcorrencia(String(idNovo));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setErro(err.message || "Erro ao criar um novo motivo da ocorrência.");
      }
    } catch {
      setErro("Erro de conexão ao criar um motivo da ocorrência.");
    }
  }

  async function salvarEdicaoMotivo(id) {
    if (!nomeMotivoEditado.trim()) return;

    try {
      const res = await fetch(`/api/ocorrencia/motivo_ocorrencia/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nomeMotivoEditado.trim() }),
      });

      if (res.ok) {
        setMotivoEditandoId(null);
        setNomeMotivoEditado("");
        await carregarMotivos();
      } else {
        const erro = await res.json().catch(() => ({}));
        setErro(erro.message || "Erro ao atualizar o motivo da ocorrência.");
      }
    } catch {
      setErro("Erro de conexão ao atualizar o motivo da ocorrência.");
    }
  }

  async function deletarMotivo(id) {
    if (!confirm("Deseja realmente excluir este motivo da ocorrência?")) return;

    try {
      const res = await fetch(`/api/ocorrencia/motivo_ocorrencia/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (Number(IdMotivoOcorrencia) === Number(id)) {
          setIdMotivoOcorrencia("");
        }
        await carregarMotivos();
      } else {
        const err = await res.json().catch(() => ({}));
        setErro(err.message || "Erro ao deletar o motivo da ocorrência.");
      }
    } catch {
      setErro("Erro de conexão ao deletar o motivo da ocorrência.");
    }
  }

  return (
    <Shell>
      <div className={styles.pagina}>
        <section className={styles.conteudo}>
          <div className={styles.tituloPagina}>
            <h1>Registrar ocorrência</h1>
            <p>Registre manualmente uma não conformidade com EPIs identificada no chão de fábrica.</p>
          </div>

          <form onSubmit={registrar}>
            <div className={styles.painel}>
              <div className={styles.colunaEsquerda}>
                <div className={styles.campo}>
                  <label>
                    Funcionário <span>*</span>
                  </label>
                  <select
                    value={idFuncionario}
                    onChange={(e) => setIdFuncionario(e.target.value)}
                    required
                  >
                    <option value="">Selecione o funcionário</option>
                    {funcionarios.map((f) => {
                      const fId = f.id || f.id_funcionario;
                      return (
                        <option key={fId} value={fId}>
                          {extrairNomeFuncionario(f)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className={styles.linhaDupla}>
                  <div className={styles.campo}>
                    <label>
                      Setor <span>*</span>
                    </label>
                    <select
                      value={idSetor}
                      onChange={(e) => {
                        setIdSetor(e.target.value);
                        setIdCamera("");
                      }}
                      required
                    >
                      <option value="">Selecione o setor</option>
                      {setores.map((s) => {
                        const sId = s.id || s.id_setor;
                        return (
                          <option key={sId} value={sId}>
                            {s.nome || s.descricao || `Setor #${sId}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className={styles.campo}>
                    <label>Câmera</label>
                    <select
                      value={idCamera}
                      onChange={(e) => setIdCamera(e.target.value)}
                      disabled={!idSetor}
                    >
                      {!idSetor ? (
                        <option value="">Selecione um setor primeiro</option>
                      ) : camerasDoSetor.length > 0 ? (
                        <>
                          <option value="">Sem câmera associada</option>
                          {camerasDoSetor.map((c, index) => {
                            const cId = c.id || c.id_camera || index + 1;
                            return (
                              <option key={cId} value={cId}>
                                {extrairNomeCamera(c)}
                              </option>
                            );
                          })}
                        </>
                      ) : (
                        <option value="">Nenhuma câmera vinculada a este setor</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* DATA E HORA */}
                <div className={styles.linhaDupla}>
                  <div className={styles.campo}>
                    <label>
                      Data <span>*</span>
                    </label>
                    <input
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.campo}>
                    <label>
                      Hora <span>*</span>
                    </label>
                    <input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={styles.linhaDupla}>
                  <div className={styles.campo}>
                    <label>Prioridade</label>
                    <div className={styles.botoesPrioridade}>
                      {prioridades.map((prio) => {
                        const pId = prio.id || prio.id_prioridade;
                        const pNome = prio.prioridade || prio.nome || `Prio #${pId}`;
                        return (
                          <button
                            key={pId}
                            type="button"
                            className={`${styles.btnPrioridade} ${Number(idPrioridade) === Number(pId) ? styles.prioAtiva : ""
                              }`}
                            onClick={() => setIdPrioridade(pId)}
                          >
                            {pNome}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.campo}>
                    <label>Status inicial</label>
                    <select
                      value={idStatusOcorrencia}
                      onChange={(e) => setIdStatusOcorrencia(e.target.value)}
                    >
                      {statusLista.map((st) => {
                        const stId = st.id || st.id_status_ocorrencia;
                        const stNome = st.status || st.nome || `Status #${stId}`;
                        return (
                          <option key={stId} value={stId}>
                            {stNome}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className={styles.campo}>
                  <label>
                    Motivo Ocorrência <span>*</span>
                  </label>
                  <div className={styles.linhaMotivo}>
                    <select
                      value={IdMotivoOcorrencia}
                      onChange={(e) => setIdMotivoOcorrencia(e.target.value)}
                      required
                    >
                      <option value="">Selecione um motivo para a ocorrência</option>
                      {listaMotivoOcorrencia.map((motivo) => {
                        const motivoId = idDoMotivo(motivo);
                        return (
                          <option key={motivoId} value={motivoId}>
                            {motivo.nome}
                          </option>
                        );
                      })}
                    </select>

                    <button
                      type="button"
                      className={styles.btnGerenciarMotivo}
                      onClick={() => setModalNivelAberto(true)}
                    >
                      + Gerenciar
                    </button>
                  </div>
                </div>

                {/* SELEÇÃO DE EPIs AUSENTES */}
                <div className={styles.campo}>
                  <label>
                    EPIs ausentes <span>*</span>
                  </label>
                  {episLista.length > 0 ? (
                    <div className={styles.gradeEpis}>
                      {episLista.map((epi) => {
                        const epiId = Number(epi.id || epi.id_epi);
                        const epiNome = epi.nome || epi.epi || `EPI #${epiId}`;
                        const selecionado = episSelecionados.includes(epiId);

                        return (
                          <button
                            key={epiId}
                            type="button"
                            className={`${styles.btnEpi} ${selecionado ? styles.epiAtivo : ""
                              }`}
                            onClick={() => alternarEpi(epiId)}
                          >
                            <span className={styles.checkEpi}>
                              {selecionado ? "✓" : "+"}
                            </span>
                            {epiNome}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className={styles.avisoEpis}>
                      Nenhum EPI cadastrado no sistema.
                    </p>
                  )}
                </div>

                <div className={styles.campo}>
                  <label>Descrição</label>
                  <textarea
                    placeholder="Descreva o que foi observado, as circunstâncias e as ações tomadas..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div className={styles.colunaDireita}>
                <div
                  className={styles.uploadBox}
                  onClick={() => inputImagemRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    selecionarImagem(e.dataTransfer.files?.[0]);
                  }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Print da Ocorrência"
                      className={styles.previewPrint}
                    />
                  ) : (
                    <div className={styles.textoUpload}>
                      <span>♣</span>
                      <strong>Adicionar print</strong>
                      <p>Clique para enviar uma imagem ou arraste o arquivo aqui.</p>
                    </div>
                  )}
                  <input
                    ref={inputImagemRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={aoEscolherArquivo}
                  />
                </div>

                <button
                  type="button"
                  className={styles.btnAlterarImagem}
                  onClick={() => inputImagemRef.current?.click()}
                >
                  ↕ Alterar imagem
                </button>
              </div>
            </div>

            <div className={styles.acoes}>
              <button
                type="button"
                className={styles.btnCancelar}
                onClick={() => router.push("/ocorrencias")}
                disabled={carregando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.btnRegistrar}
                disabled={carregando || Boolean(sucesso)}
              >
                {carregando ? "Registrando..." : "Registrar ocorrência"}
              </button>
            </div>
          </form>

          {modalNivelAberto && (
            <div className={modalStyles.modalOverlay}>
              <div className={modalStyles.modalContainer}>
                <div className={modalStyles.modalCabecalho}>
                  <h3>Gerenciar Motivo da ocorrência</h3>
                  <button
                    type="button"
                    className={modalStyles.modalFechar}
                    onClick={() => setModalNivelAberto(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className={modalStyles.modalFormulario}>
                  <input
                    type="text"
                    placeholder="Novo motivo da ocorrência..."
                    value={novoMotivoOcorrencia}
                    onChange={(e) => setNovoMotivoOcorrencia(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") criarMotivoOcorrencia(e);
                    }}
                    className={modalStyles.modalInput}
                  />
                  <button
                    type="button"
                    onClick={criarMotivoOcorrencia}
                    className={modalStyles.modalBotaoAdicionar}
                  >
                    Adicionar
                  </button>
                </div>

                <div className={modalStyles.modalLista}>
                  {listaMotivoOcorrencia.map((item, index) => {
                    const itemId = idDoMotivo(item) ?? index;
                    const itemNome = item.nome || "Sem Motivo";

                    return (
                      <div key={itemId} className={modalStyles.modalItem}>
                        {motivoEditandoId === itemId ? (
                          <input
                            type="text"
                            value={nomeMotivoEditado}
                            onChange={(e) => setNomeMotivoEditado(e.target.value)}
                            className={modalStyles.modalInputEdicao}
                          />
                        ) : (
                          <span className={modalStyles.modalItemTexto}>● {itemNome}</span>
                        )}

                        <div className={modalStyles.modalAcoesItem}>
                          {motivoEditandoId === itemId ? (
                            <>
                              <button
                                type="button"
                                onClick={() => salvarEdicaoMotivo(itemId)}
                                className={modalStyles.modalBotaoSalvar}
                              >
                                Salvar
                              </button>
                              <button
                                type="button"
                                onClick={() => setMotivoEditandoId(null)}
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
                                  setMotivoEditandoId(itemId);
                                  setNomeMotivoEditado(itemNome);
                                }}
                                className={modalStyles.modalBotaoEditar}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => deletarMotivo(itemId)}
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
                    onClick={() => setModalNivelAberto(false)}
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
            titulo="Ocorrência Registrada!"
            textoBotao="Ir para Ocorrências"
            aoFechar={() => router.push("/ocorrencias")}
          />
        </section>
      </div>
    </Shell>
  );
}