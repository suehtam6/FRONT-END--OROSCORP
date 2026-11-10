"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import styles from "../style/cadastrarFuncionario.module.css";
import Popup from "../components/Popup";
import modalStyles from "../style/modalGerenciador.module.css";

export default function CadastrarFuncionario() {
  const router = useRouter();

  const [setores, setSetores] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [status, setStatus] = useState([]);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState("");

  // Modal de cargos
  const [modalCargoAberto, setModalCargoAberto] = useState(false);
  const [novoCargo, setNovoCargo] = useState("");
  const [cargoEditandoId, setCargoEditandoId] = useState(null);
  const [nomeCargoEditado, setNomeCargoEditado] = useState("");

  const [dados, setDados] = useState({
    nome: "",
    email: "",
    confirmarEmail: "",
    cpf: "",
    nascimento: "",
    id_cargo: "",
    id_setor: "",
    id_status_funcionario: "",
  });

  function mascaraCPF(valor) {
    let v = valor.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);

    if (v.length > 9) {
      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    } else if (v.length > 6) {
      v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    } else if (v.length > 3) {
      v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    }
    return v;
  }

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

  // Carrega cargos, setores e status
  useEffect(() => {
    async function carregarDependencias() {
      try {
        const [resCrg, resSetor, resStat] = await Promise.all([
          fetch("/api/funcionario/cargos"),
          fetch("/api/setor"),
          fetch("/api/funcionario/status_funcionario"),
        ]);

        if (resCrg.ok) setCargos(extrairLista(await resCrg.json()));
        if (resSetor.ok) setSetores(extrairLista(await resSetor.json()));

        if (resStat.ok) {
          const listaStat = extrairLista(await resStat.json());
          setStatus(listaStat);

          // CORREÇÃO: preenche o status dentro de "dados"
          if (listaStat.length > 0) {
            setDados((d) => ({
              ...d,
              id_status_funcionario: listaStat[0].id || 1,
            }));
          }
        }
      } catch (e) {
        console.error("Erro ao carregar dependências:", e);
      }
    }
    carregarDependencias();
  }, []);

  // Preview da foto
  useEffect(() => {
    if (!foto) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(foto);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  function atualizar(evento) {
    const { name, value } = evento.target;
    const novoValor = name === "cpf" ? mascaraCPF(value) : value;

    setDados((d) => ({ ...d, [name]: novoValor }));
    setErro("");
  }

  async function cadastrar(evento) {
    evento.preventDefault();

    if (carregando) return;

    if (dados.email !== dados.confirmarEmail) {
      setErro("Os e-mails não são iguais.");
      return;
    }

    setCarregando(true);

    const corpo = {
      nome: dados.nome,
      data_nascimento: dados.nascimento,
      cpf: dados.cpf,
      email: dados.email,
      id_cargo: Number(dados.id_cargo),
      id_setor: Number(dados.id_setor),
      id_status_funcionario: Number(dados.id_status_funcionario),
      // foto: não dá para mandar um File dentro de JSON.
      // Quando você definir como a API recebe a foto, a gente ajusta.
    };

    try {
      const res = await fetch("/api/funcionario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });

      const retorno = await res.json().catch(() => ({}));

      if (res.ok) {
        setSucesso("Funcionário registrado com sucesso!");
      } else {
        setErro(retorno.message || "Erro ao registrar o funcionário.");
      }
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  // ---------- CARGOS ----------

  async function adicionarCargo(evento) {
    evento.preventDefault();

    const nome = novoCargo.trim();
    if (!nome) return;

    const jaExiste = cargos.some(
      (c) => c.cargo.toLowerCase() === nome.toLowerCase()
    );
    if (jaExiste) {
      setErro("Esse cargo já existe.");
      return;
    }

    try {
      const res = await fetch("/api/funcionario/cargos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cargo: nome }),
      });

      const retorno = await res.json().catch(() => ({}));

      if (res.ok) {
        const novo = retorno.response;
        setCargos([...cargos, { id: novo.id, cargo: novo.cargo }]);
        setNovoCargo("");
      } else {
        setErro(retorno.message || "Erro ao registrar o cargo.");
      }
    } catch {
      setErro("Erro de conexão com o servidor.");
    }
  }

  async function salvarEdicaoCargo(id) {
    const nome = nomeCargoEditado.trim();
    if (!nome) return;

    try {
      // Confirme se sua API usa PUT nessa rota e o campo "cargo"
      const res = await fetch(`/api/funcionario/cargos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cargo: nome }),
      });

      if (res.ok) {
        setCargos(cargos.map((c) => (c.id === id ? { ...c, cargo: nome } : c)));
        setCargoEditandoId(null);
        setNomeCargoEditado("");
      } else {
        const retorno = await res.json().catch(() => ({}));
        setErro(retorno.message || "Erro ao atualizar o cargo.");
      }
    } catch {
      setErro("Erro de conexão com o servidor.");
    }
  }

  async function excluirCargo(id) {
    try {
      const res = await fetch(`/api/funcionario/cargos/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCargos(cargos.filter((c) => c.id !== id));
      } else {
        const retorno = await res.json().catch(() => ({}));
        setErro(retorno.message || "Erro ao excluir o cargo.");
      }
    } catch {
      setErro("Erro de conexão com o servidor.");
    }
  }

  return (
    <Shell voltar={false}>
      <main className={styles.container}>
        <section className={styles.cadastroBox}>
          <div className={styles.titulo}>
            <div>
              <h1>Cadastro do Funcionário</h1>
              <p>Preencha os dados para cadastrar um novo funcionário no sistema.</p>
            </div>

            <button
              type="button"
              className={styles.sair}
              onClick={() => router.push("/funcionarios")}
            >
              SAIR
            </button>
          </div>

          <form onSubmit={cadastrar}>
            <div className={styles.formulario}>
              <div className={styles.fotoColuna}>
                <label className={styles.fotoArea}>
                  {preview ? (
                    <img
                      src={preview}
                      alt="Foto do funcionário"
                      className={styles.previewImagem}
                    />
                  ) : (
                    <div className={styles.fotoTexto}>
                      <strong>Adicionar foto</strong>
                      <p>Clique para selecionar uma imagem</p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => setFoto(e.target.files?.[0] || null)}
                  />
                </label>

                {foto && (
                  <button
                    type="button"
                    className={styles.removerFoto}
                    onClick={() => setFoto(null)}
                  >
                    Remover foto
                  </button>
                )}
              </div>

              <div className={styles.campos}>
                <div className={styles.campo}>
                  <label htmlFor="nome">Nome completo <span>*</span></label>
                  <input
                    id="nome"
                    name="nome"
                    value={dados.nome}
                    onChange={atualizar}
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="email">E-mail <span>*</span></label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={dados.email}
                    onChange={atualizar}
                    placeholder="exemplo@dominio.com"
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="cpf">CPF <span>*</span></label>
                  <input
                    id="cpf"
                    name="cpf"
                    value={dados.cpf}
                    onChange={atualizar}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="confirmarEmail">Confirmar e-mail <span>*</span></label>
                  <input
                    id="confirmarEmail"
                    name="confirmarEmail"
                    type="email"
                    value={dados.confirmarEmail}
                    onChange={atualizar}
                    placeholder="Digite o e-mail novamente"
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="nascimento">Data de nascimento <span>*</span></label>
                  <input
                    id="nascimento"
                    name="nascimento"
                    type="date"
                    value={dados.nascimento}
                    onChange={atualizar}
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="id_cargo">Cargo <span>*</span></label>
                  <select
                    id="id_cargo"
                    name="id_cargo"
                    value={dados.id_cargo}
                    onChange={atualizar}
                    required
                  >
                    <option value="">Selecione o cargo</option>
                    {cargos.map((c) => (
                      <option key={c.id} value={c.id}>{c.cargo}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.campo}>
                  <label htmlFor="id_setor">Setor <span>*</span></label>
                  <select
                    id="id_setor"
                    name="id_setor"
                    value={dados.id_setor}
                    onChange={atualizar}
                    required
                  >
                    <option value="">Selecione o setor</option>
                    {setores.map((s) => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.campo}>
                  <label htmlFor="id_status_funcionario">Status <span>*</span></label>
                  <select
                    id="id_status_funcionario"
                    name="id_status_funcionario"
                    value={dados.id_status_funcionario}
                    onChange={atualizar}
                    required
                  >
                    <option value="">Selecione o status</option>
                    {status.map((st) => (
                      <option key={st.id} value={st.id}>{st.status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.botoes}>
              <button
                type="button"
                className={styles.cancelar}
                onClick={() => router.push("/funcionarios")}
              >
                CANCELAR
              </button>

              <button
                type="button"
                className={styles.cadastrarCargo}
                onClick={() => setModalCargoAberto(true)}
              >
                + CADASTRAR NOVO CARGO
              </button>

              <button
                type="submit"
                className={styles.cadastrar}
                disabled={carregando}
              >
                {carregando ? "CADASTRANDO..." : "CADASTRAR FUNCIONÁRIO"}
              </button>
            </div>
          </form>
        </section>
      </main>

      {/* MODAL DE CARGOS */}
      {modalCargoAberto && (
        <div className={modalStyles.modalOverlay}>
          <div className={modalStyles.modalContainer}>
            <div className={modalStyles.modalCabecalho}>
              <h3>Gerenciar Cargos</h3>
              <button
                type="button"
                className={modalStyles.modalFechar}
                onClick={() => setModalCargoAberto(false)}
              >
                ✕
              </button>
            </div>

            <div className={modalStyles.modalFormulario}>
              <input
                type="text"
                placeholder="Novo cargo..."
                value={novoCargo}
                onChange={(e) => setNovoCargo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") adicionarCargo(e);
                }}
                className={modalStyles.modalInput}
              />
              <button
                type="button"
                onClick={adicionarCargo}
                className={modalStyles.modalBotaoAdicionar}
              >
                Adicionar
              </button>
            </div>

            <div className={modalStyles.modalLista}>
              {cargos.map((item) => (
                <div key={item.id} className={modalStyles.modalItem}>
                  {cargoEditandoId === item.id ? (
                    <input
                      type="text"
                      value={nomeCargoEditado}
                      onChange={(e) => setNomeCargoEditado(e.target.value)}
                      className={modalStyles.modalInputEdicao}
                    />
                  ) : (
                    <span className={modalStyles.modalItemTexto}>● {item.cargo}</span>
                  )}

                  <div className={modalStyles.modalAcoesItem}>
                    {cargoEditandoId === item.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => salvarEdicaoCargo(item.id)}
                          className={modalStyles.modalBotaoSalvar}
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setCargoEditandoId(null)}
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
                            setCargoEditandoId(item.id);
                            setNomeCargoEditado(item.cargo);
                          }}
                          className={modalStyles.modalBotaoEditar}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => excluirCargo(item.id)}
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
                onClick={() => setModalCargoAberto(false)}
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
        titulo="Funcionário Cadastrado!"
        textoBotao="Ir para Início"
        aoFechar={() => router.push("/funcionarios")}
      />
    </Shell>
  );
}