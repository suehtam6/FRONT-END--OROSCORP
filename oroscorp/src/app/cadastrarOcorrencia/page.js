"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import Popup from "../components/Popup";
import styles from "../style/cadastrarOcorrencia.module.css";

export default function RegistrarOcorrencia() {
  const router = useRouter();
  const inputImagemRef = useRef(null);

  // Estados do Formulário
  const [idFuncionario, setIdFuncionario] = useState("");
  const [idSetor, setIdSetor] = useState("");
  const [idCamera, setIdCamera] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [idPrioridade, setIdPrioridade] = useState("");
  const [idStatusOcorrencia, setIdStatusOcorrencia] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagem, setImagem] = useState(null);

  // Listas vindas da API
  const [funcionarios, setFuncionarios] = useState([]);
  const [setores, setSetores] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [statusLista, setStatusLista] = useState([]);

  // Popups e Carregamento
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Extração resiliente de arrays
  const extrairLista = (resJson) => {
    if (!resJson) return [];
    return (
      resJson.response?.dados ||
      resJson.dados ||
      resJson.response ||
      resJson.content ||
      (Array.isArray(resJson) ? resJson : [])
    );
  };

  // Extração inteligente do nome do funcionário
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

  // Extração inteligente do nome da câmera
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

  useEffect(() => {
    async function carregarDependencias() {
      try {
        const [resFunc, resSetor, resCam, resPrio, resStat] = await Promise.all([
          fetch("/api/funcionario"),
          fetch("/api/setor"),
          fetch("/api/camera"),
          fetch("/api/ocorrencia/prioridade"),
          fetch("/api/ocorrencia/status-ocorrencia")
        ]);

        if (resFunc.ok) setFuncionarios(extrairLista(await resFunc.json()));
        if (resSetor.ok) setSetores(extrairLista(await resSetor.json()));
        if (resCam.ok) setCameras(extrairLista(await resCam.json()));

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

  // Filtra as câmeras pertencentes ao setor selecionado no formulário
  const camerasDoSetor = cameras.filter((c) => {
    const setorCameraId = c.id_setor || c.setor?.[0]?.id || c.setor?.id;
    return Number(setorCameraId) === Number(idSetor);
  });

  async function registrar(e) {
    e.preventDefault();
    setCarregando(true);
    setErro("");
    setSucesso("");

    const dataHoraStr = data && hora 
      ? `${data} ${hora}:00` 
      : new Date().toISOString().replace('T', ' ').substring(0, 19);

    const payload = {
      descricao: descricao,
      id_setor: Number(idSetor),
      id_funcionario: Number(idFuncionario),
      id_motivo_ocorrencia: 1,
      id_status_ocorrencia: Number(idStatusOcorrencia),
      id_usuario_registro: 1,
      id_origem: 1, // Registo manual fixo vindo do formulário front-end
      id_prioridade: Number(idPrioridade),
      id_epi: [{ id: 1 }],
      cameras: idCamera ? [
        {
          id_camera: Number(idCamera),
          foto: imagem ? imagem.name : "sem-foto.png",
          confianca_ia: 95,
          data_hora: dataHoraStr
        }
      ] : []
    };

    try {
      const res = await fetch("/api/ocorrencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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

  return (
    <Shell>
      <section className={styles.conteudo}>
        <div className={styles.tituloPagina}>
          <h1>Registrar ocorrência</h1>
          <p>Registre manualmente uma não conformidade com EPIs identificada no chão de fábrica.</p>
        </div>

        <form onSubmit={registrar}>
          <div className={styles.painel}>
            <div className={styles.colunaEsquerda}>
              
              {/* FUNCIONÁRIO */}
              <div className={styles.campo}>
                <label>Funcionário <span>*</span></label>
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

              {/* SETOR E CÂMERA (FILTRADA PELO SETOR) */}
              <div className={styles.linhaDupla}>
                <div className={styles.campo}>
                  <label>Setor <span>*</span></label>
                  <select 
                    value={idSetor} 
                    onChange={(e) => {
                      setIdSetor(e.target.value);
                      setIdCamera(""); // Limpa a câmera ao mudar de setor
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
                  <label>Data <span>*</span></label>
                  <input 
                    type="date" 
                    value={data} 
                    onChange={(e) => setData(e.target.value)} 
                    required 
                  />
                </div>

                <div className={styles.campo}>
                  <label>Hora <span>*</span></label>
                  <input 
                    type="time" 
                    value={hora} 
                    onChange={(e) => setHora(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              {/* PRIORIDADE E STATUS INICIAL */}
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
                          className={`${styles.btnPrioridade} ${Number(idPrioridade) === Number(pId) ? styles.prioAtiva : ''}`}
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
                        <option key={stId} value={stId}>{stNome}</option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* DESCRIÇÃO */}
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

            {/* UPLOAD DE PRINT */}
            <div className={styles.colunaDireita}>
              <div 
                className={styles.uploadBox}
                onClick={() => inputImagemRef.current?.click()}
              >
                {imagem ? (
                  <img 
                    src={URL.createObjectURL(imagem)} 
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
                  accept="image/*" 
                  hidden 
                  onChange={(e) => setImagem(e.target.files?.[0] || null)} 
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

          {/* BOTÕES DE AÇÃO */}
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
              disabled={carregando}
            >
              {carregando ? "Registrando..." : "Registrar ocorrência"}
            </button>
          </div>
        </form>

        {/* POPUPS DE NOTIFICAÇÃO */}
        <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
        <Popup
          mensagem={sucesso}
          tipo="sucesso"
          titulo="Ocorrência Registrada!"
          textoBotao="Ir para Ocorrências"
          aoFechar={() => router.push("/ocorrencias")}
        />
      </section>
    </Shell>
  );
}