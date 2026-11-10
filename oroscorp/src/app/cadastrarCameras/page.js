"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import styles from "../style/cadastrarCamera.module.css";
import modalStyles from "../style/modalGerenciador.module.css";
import Popup from "../components/Popup";

export default function CadastrarCamera() {
  const router = useRouter();

  const [imagem, setImagem] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [modalStatusAberto, setModalStatusAberto] = useState(false);
  const [novoStatusNome, setNovoStatusNome] = useState("");
  const [statusEditandoId, setStatusEditandoId] = useState(null);
  const [nomeEditado, setNomeEditado] = useState("");

  const [dados, setDados] = useState({
    nome: "",
    ip: "", 
    id_setor: "",
    localizacao: "",
    descricao: "",
    id_status_camera: ""
  });

  const [setores, setSetores] = useState([]);
  const [statusLista, setStatusLista] = useState([]);

  async function carregarStatus() {
    try {
      const resStatus = await fetch("/api/status-camera");
      if (resStatus.ok) {
        const json = await resStatus.json();
        const listaStatus = json.response?.dados || json.dados || json;
        if (Array.isArray(listaStatus)) {
          setStatusLista(listaStatus);

          if (listaStatus.length > 0 && !dados.id_status_camera) {
            setDados((prev) => ({ ...prev, id_status_camera: listaStatus[0].id }));
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar os status:", error);
    }
  }

  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        const resSetores = await fetch("/api/setor");
        if (resSetores.ok) {
          const json = await resSetores.json();
          const listaSetores = json.response?.dados || json.dados || json;
          if (Array.isArray(listaSetores)) {
            setSetores(listaSetores);
          }
        }

        await carregarStatus();
      } catch (error) {
        console.error("Erro ao carregar dados do formulário:", error);
      }
    }
    carregarDadosIniciais();
  }, []);

  function atualizar(e) {
    setDados({
      ...dados,
      [e.target.name]: e.target.value
    });
  }

  async function criarNovoStatus(e) {
    e.preventDefault();
    if (!novoStatusNome.trim()) return;

    try {
      const res = await fetch("/api/status-camera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatusNome.trim() })
      });

      if (res.ok) {
        setNovoStatusNome("");
        await carregarStatus();
      } else {
        const err = await res.json();
        setErro(err.message || "Erro ao criar status.");
      }
    } catch (error) {
      setErro("Falha de conexão ao criar status.");
    }
  }

  async function salvarEdicaoStatus(id) {
    if (!nomeEditado.trim()) return;

    try {
      const res = await fetch(`/api/status-camera/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nomeEditado.trim() })
      });

      if (res.ok) {
        setStatusEditandoId(null);
        setNomeEditado("");
        await carregarStatus();
      } else {
        const err = await res.json();
        setErro(err.message || "Erro ao atualizar status.");
      }
    } catch (error) {
      setErro("Falha de conexão ao atualizar status.");
    }
  }

  async function deletarStatus(id) {
    if (!confirm("Tem certeza que deseja excluir este status?")) return;

    try {
      const res = await fetch(`/api/status-camera/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        if (Number(dados.id_status_camera) === id) {
          setDados((prev) => ({ ...prev, id_status_camera: "" }));
        }
        await carregarStatus();
      } else {
        const err = await res.json();
        setErro(err.message || "Erro ao deletar status.");
      }
    } catch (error) {
      setErro("Falha de conexão ao deletar status.");
    }
  }

  async function registrar(e) {
    e.preventDefault();
    setCarregando(true);
    setErro("");
    setSucesso("");

    let urlDaImagem = "";

    if (imagem) {
      urlDaImagem = "https://res.cloudinary.com/deuflqtkr/image/upload/v1/sua_imagem.png"; 
    }

    try {
      const resposta = await fetch("/api/camera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dados,
          id_setor: Number(dados.id_setor),
          id_status_camera: Number(dados.id_status_camera),
          imagem: urlDaImagem || "sem-foto.png"
        })
      });

      const resultado = await resposta.json();

      if (resposta.ok) {
        setSucesso("Câmera cadastrada com sucesso!");
      } else {
        setErro(resultado.message || "Erro ao cadastrar a câmera.");
      }
    } catch (error) {
      setErro("Erro de conexão ao tentar cadastrar a câmera.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Shell>
      <main className={styles.pagina}>
        <div className={styles.titulo}>
          <h1>Cadastrar Câmera</h1>
          <p>Preencha as informações para cadastrar uma nova câmera de monitoramento.</p>
        </div>

        <form className={styles.painel} onSubmit={registrar}>
          <div className={styles.layout}>
            <div className={styles.campos}>
              <h2>Informações da câmera</h2>

              <div className={styles.campo}>
                <label>Nome da câmera <span>*</span></label>
                <input
                  type="text"
                  name="nome"
                  placeholder="Ex: Câmera 01"
                  value={dados.nome}
                  onChange={atualizar}
                  required
                />
              </div>

              <div className={styles.campo}>
                <label>Endereço IP <span>*</span></label>
                <input
                  type="text"
                  name="ip" 
                  placeholder="Ex: 192.168.0.10"
                  value={dados.ip}
                  onChange={atualizar}
                  required
                />
              </div>

              <div className={styles.campo}>
                <label>Setor <span>*</span></label>
                <select
                  name="id_setor" 
                  value={dados.id_setor}
                  onChange={atualizar}
                  required
                >
                  <option value="">Selecione o setor</option>
                  {setores.length > 0 ? (
                    setores.map((setor) => (
                      <option key={setor.id} value={setor.id}>
                        {setor.nome || setor.descricao || `Setor ${setor.id}`}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Nenhum setor encontrado</option>
                  )}
                </select>
              </div>

              <div className={styles.campo}>
                <label>Descrição</label>
                <textarea
                  name="descricao"
                  placeholder="Descreva a localização e a finalidade da câmera..."
                  value={dados.descricao}
                  onChange={atualizar}
                  rows={4}
                />
              </div>

              <div className={styles.campo}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Status inicial</label>
                  <button 
                    type="button" 
                    style={{ background: 'transparent', border: 'none', color: '#ff6b00', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                    onClick={() => setModalStatusAberto(true)}
                  >
                    + Gerenciar Status
                  </button>
                </div>

                <div className={styles.status}>
                  {statusLista.map((opcao) => (
                    <button
                      type="button"
                      key={opcao.id}
                      className={
                        Number(dados.id_status_camera) === opcao.id
                          ? styles.statusAtivo
                          : ""
                      }
                      onClick={() =>
                        setDados({ ...dados, id_status_camera: opcao.id })
                      }
                    >
                      ● {opcao.status || opcao.nome}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.acoes}>
            <button
              type="button"
              className={styles.cancelar}
              onClick={() => router.push("/cameras")}
              disabled={carregando}
            >
              CANCELAR
            </button>

            <button
              type="submit"
              className={styles.cadastrar}
              disabled={carregando}
            >
              {carregando ? "CADASTRANDO..." : "CADASTRAR CÂMERA"}
            </button>
          </div>
        </form>

        {modalStatusAberto && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContainer}>
              <div className={modalStyles.modalCabecalho}>
                <h3>Gerenciar Status das Câmeras</h3>
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
                  placeholder="Novo status (ex: Manutenção)..."
                  value={novoStatusNome}
                  onChange={(e) => setNovoStatusNome(e.target.value)}
                  className={modalStyles.modalInput}
                />
                <button
                  type="button"
                  onClick={criarNovoStatus}
                  className={modalStyles.modalBotaoAdicionar}
                >
                  Adicionar
                </button>
              </div>

              <div className={modalStyles.modalLista}>
                {statusLista.map((item) => (
                  <div key={item.id} className={modalStyles.modalItem}>
                    {statusEditandoId === item.id ? (
                      <input
                        type="text"
                        value={nomeEditado}
                        onChange={(e) => setNomeEditado(e.target.value)}
                        className={modalStyles.modalInputEdicao}
                      />
                    ) : (
                      <span className={modalStyles.modalItemTexto}>● {item.status || item.nome}</span>
                    )}

                    <div className={modalStyles.modalAcoesItem}>
                      {statusEditandoId === item.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => salvarEdicaoStatus(item.id)}
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
                              setStatusEditandoId(item.id);
                              setNomeEditado(item.status || item.nome);
                            }}
                            className={modalStyles.modalBotaoEditar}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deletarStatus(item.id)}
                            className={modalStyles.modalBotaoExcluir}
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
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

        {/* POPUPS DE NOTIFICAÇÃO */}
        <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />

        <Popup
          mensagem={sucesso}
          tipo="sucesso"
          titulo="Câmera cadastrada!"
          textoBotao="Ir para câmeras"
          aoFechar={() => router.push("/cameras")}
        />
      </main>
    </Shell>
  );
}