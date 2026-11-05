"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import styles from "../style/cadastrarFuncionario.module.css";
import post from "../api/funcionario/route.js";
import Popup from "../components/Popup";
import style from "../style/modalGerenciador.module.css"

export default function CadastrarFuncionario() {

const [idSetor, setIdSetor] = useState("");
const [setores, setSetores] = useState([]);
const [idCargo ,setIdCargo] = useState("");
const [cargos, setCargos] = useState([]);

const[status, setStatus] = useState([]);
const[idstatus, setIdStatus] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState("");

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

  useEffect(() => {
    async function carregarDependencias() {
      try {
        const [resCrg, resSetor, resStat] = await Promise.all([
          fetch("/api/funcionario/cargos"),
          fetch("/api/setor"),
          fetch("/api/funcionario/status_funcionario")
        ]);

        if (resCrg.ok) setCargos(extrairLista(await resCrg.json()));
        if (resSetor.ok) setSetores(extrairLista(await resSetor.json()));
       
        if (resStat.ok) {
          const listaStat = extrairLista(await resStat.json());
          setStatus(listaStat);
          if (listaStat.length > 0) setIdStatus(listaStat[0].id || 1);
        }
      } catch (erro) {
        console.error("Erro ao carregar dependências da ocorrência:", erro);
      }
    }
    carregarDependencias();
  }, []);

function atualizar(evento) {
    const { name, value } = evento.target;
    let novoValor = value;

    if (name === "cpf") {
      novoValor = mascaraCPF(value);
    } 

    setDados({
      ...dados,
      [name]: novoValor
    });
    setErro("");
  }



  const router = useRouter();

  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [popupCargo, setPopupCargo] = useState(false);
  const [novoCargo, setNovoCargo] = useState("");

  const [dados, setDados] = useState({
    nome: "",
    email: "",
    confirmarEmail: "",
    cpf: "",
    nascimento: "",
    id_cargo: "",
    id_setor: "",
    id_status_funcionario: ""
  });

  useEffect(() => {
    if (!foto) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(foto);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [foto]);



  function adicionarCargo(evento) {
    evento.preventDefault();

    const nome = novoCargo.trim();
    if (!nome) return;

    const jaExiste = cargos.some(
      (c) => c.nome.toLowerCase() === nome.toLowerCase()
    );
    if (jaExiste) return;

    const id = cargos.length ? Math.max(...cargos.map((c) => c.id)) + 1 : 1;

    setCargos([...cargos, { id, nome }]);
    setNovoCargo("");
  }

  function excluirCargo(id) {
    setCargos(cargos.filter((c) => c.id !== id));

    // se o cargo apagado estava escolhido no select, limpa a escolha
    if (Number(dados.id_cargo) === id) {
      setDados({ ...dados, id_cargo: "" });
    }
  }

  async function cadastrar(evento) {
    evento.preventDefault();

    if (dados.email !== dados.confirmarEmail) {
      setMensagem("Os e-mails não são iguais.");
      return;
    }

    // para verificar se o corpo está igual ao que a API aceita
    const corpo = {
      nome: dados.nome,
      data_nascimento: dados.nascimento,
      cpf: dados.cpf,
      email: dados.email,
      foto: "URL da foto do funcionario", 
      id_cargo: Number(dados.id_cargo),
      id_setor: Number(dados.id_setor),
      id_status_funcionario: Number(dados.id_status_funcionario),
    };
      
    try {
      const res = await fetch("/api/funcionario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo)
      });

      const retorno = await res.json().catch(() => ({}));
      console.log(res)
      if (res.ok) {
        setSucesso("Funcionario registrado com sucesso!");
      } else {
        setErro(retorno.message || "Erro ao registrar um funcionario.");
      }
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
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

            {mensagem && (
              <p className={styles.mensagem} role="status">{mensagem}</p>
            )}

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
                onClick={() => setPopupCargo(true)}
              >
                + CADASTRAR NOVO CARGO
              </button>

              <button type="submit" className={styles.cadastrar}>
                CADASTRAR FUNCIONÁRIO
              </button>
            </div>
          </form>
        </section>
      </main>

      {popupCargo && (
        <div className={styles.popupFundo} onClick={() => setPopupCargo(false)}>
          <div className={styles.popupCaixa} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popupTopo}>
              <h2>Cargos</h2>
              <button
                type="button"
                className={styles.popupFechar}
                onClick={() => setPopupCargo(false)}
              >
                ✕
              </button>
            </div>

            <form className={styles.popupForm} onSubmit={adicionarCargo}>
              <input
                value={novoCargo}
                onChange={(e) => setNovoCargo(e.target.value)}
                placeholder="Nome do novo cargo"
              />
              <button type="submit">CADASTRAR</button>
            </form>

            {cargos.length ? (
              <ul className={styles.listaCargos}>
                {cargos.map((c) => (
                  <li key={c.id}>
                    <span>{c.nome}</span>
                    <button
                      type="button"
                      className={styles.excluirCargo}
                      onClick={() => excluirCargo(c.id)}
                    >
                      Excluir
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.vazioCargos}>Nenhum cargo cadastrado.</p>
            )}
          </div>
        </div>
      )}

              {/* POPUPS DE NOTIFICAÇÃO */}
              <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
              <Popup
                mensagem={sucesso}
                tipo="sucesso"
                titulo="Funcionario Cadastrado!"
                textoBotao="Ir para Inicio"
                aoFechar={() => router.push("/funcionarios")}
              />


    </Shell>
  );
}