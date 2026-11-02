"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import styles from "../style/cadastrarCamera.module.css";
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
        body: JSON.stringify({ status: novoStatusNome })
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
        body: JSON.stringify({ status: nomeEditado })
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

            
            <div className={styles.imagemArea}>
              <h2>Imagem da câmera</h2>

              <label className={styles.uploadImagem}>
                {imagem ? (
                  <img
                    src={URL.createObjectURL(imagem)}
                    alt="Foto do equipamento"
                    className={styles.fotoCamera}
                  />
                ) : (
                  <div className={styles.conteudoUpload}>
                    <span className={styles.iconeUpload}>📷</span>
                    <strong>Adicionar imagem da câmera</strong>
                    <p>Clique para selecionar uma foto<br />do equipamento utilizado.</p>
                    <small>PNG, JPG ou JPEG</small>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  hidden
                  onChange={(e) => setImagem(e.target.files?.[0] || null)}
                />
              </label>

              <p className={styles.legenda}>Fotografia da câmera instalada no setor.</p>

              {imagem && (
                <button
                  type="button"
                  className={styles.removerImagem}
                  onClick={() => setImagem(null)}
                >
                  Remover imagem
                </button>
              )}

              <div className={styles.informacoes}>
                <h3>Informações</h3>
                <p>A imagem será utilizada para identificar o equipamento cadastrado.</p>
                <p>O monitoramento em tempo real será configurado separadamente.</p>
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
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#181f26',
              padding: '24px',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '450px',
              border: '1px solid #2a3441',
              color: '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Gerenciar Status das Câmeras</h3>
                <button 
                  type="button" 
                  onClick={() => setModalStatusAberto(false)}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}
                >
                  ✕
                </button>
              </div>

              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Novo status (ex: Manutenção)"
                  value={novoStatusNome}
                  onChange={(e) => setNovoStatusNome(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #303842',
                    backgroundColor: '#0f1419',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
                <button 
                  type="button" 
                  onClick={criarNovoStatus}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ff6b00',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Adicionar
                </button>
              </div>

              
              <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {statusLista.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: '#0f1419',
                    borderRadius: '4px',
                    border: '1px solid #232d38'
                  }}>
                    {statusEditandoId === item.id ? (
                      <input
                        type="text"
                        value={nomeEditado}
                        onChange={(e) => setNomeEditado(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          marginRight: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ff6b00',
                          backgroundColor: '#181f26',
                          color: '#fff',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <span>● {item.status || item.nome}</span>
                    )}

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {statusEditandoId === item.id ? (
                        <>
                          <button 
                            type="button" 
                            onClick={() => salvarEdicaoStatus(item.id)}
                            style={{ background: '#28a745', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Salvar
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setStatusEditandoId(null)}
                            style={{ background: '#6c757d', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
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
                            style={{ background: '#303842', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Editar
                          </button>
                          <button 
                            type="button" 
                            onClick={() => deletarStatus(item.id)}
                            style={{ background: '#dc3545', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button 
                  type="button" 
                  onClick={() => setModalStatusAberto(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#303842',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
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
          titulo="Câmera cadastrada!"
          textoBotao="Ir para câmeras"
          aoFechar={() => router.push("/cameras")}
        />
      </main>
    </Shell>
  );
}