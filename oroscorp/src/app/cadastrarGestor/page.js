"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import Popup from "../components/Popup";
import { uploadParaCloudinary } from "@/API/cloudinary";
import styles from "../style/cadastrarGestor.module.css";
import modalStyles from "../style/modalGerenciador.module.css";

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

function mascaraData(valor) {
  let v = valor.replace(/\D/g, "");
  if (v.length === 0) return "";

  let dia = v.substring(0, 2);
  let mes = v.substring(2, 4);
  let ano = v.substring(4, 8);

  if (dia.length === 2 && parseInt(dia, 10) > 31) dia = "31";
  if (mes.length === 2 && parseInt(mes, 10) > 12) mes = "12";

  const anoAtual = new Date().getFullYear();
  if (ano.length === 4 && parseInt(ano, 10) > anoAtual) ano = anoAtual.toString();

  let resultado = dia;
  if (v.length >= 3) resultado += "/" + mes;
  if (v.length >= 5) resultado += "/" + ano;

  return resultado;
}

function validarSenha(form) {
  if (form.senha.length < 8 || form.senha.length > 72) {
    return "A senha deve ter entre 8 e 72 caracteres.";
  }
  if (!/[A-Z]/.test(form.senha)) {
    return "A senha deve conter pelo menos uma letra maiúscula.";
  }
  if (!/\d/.test(form.senha)) {
    return "A senha deve conter pelo menos um número.";
  }
  if (form.senha !== form.confirmarSenha) {
    return "As senhas não conferem.";
  }
  return "";
}

export default function CadastrarGestor() {
  const router = useRouter();

  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [niveisAcesso, setNiveisAcesso] = useState([]);
  const [modalNivelAberto, setModalNivelAberto] = useState(false);
  const [novoNivelNome, setNovoNivelNome] = useState("");
  const [nivelEditandoId, setNivelEditandoId] = useState(null);
  const [nomeNivelEditado, setNomeNivelEditado] = useState("");

  const [dados, setDados] = useState({
    nome: "",
    email: "",
    confirmarEmail: "",
    cpf: "",
    nascimento: "",
    senha: "",
    confirmarSenha: "",
    id_nivel_acesso: "",
  });

  async function carregarNiveis() {
    try {
      const res = await fetch("/api/nivel-acesso");
      const dadosAPI = await res.json().catch(() => []);

      if (res.ok) {
        const listaNiveis =
          dadosAPI.response?.dados || dadosAPI.response || dadosAPI.dados || dadosAPI;
        if (Array.isArray(listaNiveis)) {
          setNiveisAcesso(listaNiveis);
        } else {
          setNiveisAcesso([]);
        }
      }
    } catch (error) {
      console.error("Falha de conexão ao buscar níveis de acesso:", error);
    }
  }

  useEffect(() => {
    carregarNiveis();
  }, []);

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
    let novoValor = value;

    if (name === "cpf") {
      novoValor = mascaraCPF(value);
    } else if (name === "nascimento") {
      novoValor = mascaraData(value);
    }

    setDados({
      ...dados,
      [name]: novoValor,
    });
    setErro("");
  }

  async function criarNivelAcesso(e) {
    e.preventDefault();
    const nomeLimpo = novoNivelNome.trim();
    if (!nomeLimpo) return;

    if (nomeLimpo.toUpperCase() === "ADM") {
      setErro("O nível de acesso ADM é reservado pelo sistema.");
      return;
    }

    try {
      const res = await fetch("/api/nivel-acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nomeLimpo }),
      });

      if (res.ok) {
        const criado = await res.json().catch(() => ({}));
        setNovoNivelNome("");
        await carregarNiveis();

        const idNovo = criado.id || criado.response?.id;
        if (idNovo) {
          setDados((prev) => ({ ...prev, id_nivel_acesso: String(idNovo) }));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setErro(err.message || "Erro ao criar nível de acesso.");
      }
    } catch {
      setErro("Erro de conexão ao criar nível de acesso.");
    }
  }

  async function salvarEdicaoNivel(id) {
    const nomeLimpo = nomeNivelEditado.trim();
    if (!nomeLimpo) return;

    if (nomeLimpo.toUpperCase() === "ADM") {
      setErro("O nível de acesso ADM é reservado pelo sistema.");
      return;
    }

    try {
      const res = await fetch(`/api/nivel-acesso/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nomeLimpo }),
      });

      if (res.ok) {
        setNivelEditandoId(null);
        setNomeNivelEditado("");
        await carregarNiveis();
      } else {
        const err = await res.json().catch(() => ({}));
        setErro(err.message || "Erro ao atualizar nível de acesso.");
      }
    } catch {
      setErro("Erro de conexão ao atualizar nível de acesso.");
    }
  }

  async function deletarNivel(id) {
    if (!confirm("Deseja realmente excluir este nível de acesso?")) return;

    try {
      const res = await fetch(`/api/nivel-acesso/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (Number(dados.id_nivel_acesso) === Number(id)) {
          setDados((prev) => ({ ...prev, id_nivel_acesso: "" }));
        }
        await carregarNiveis();
      } else {
        const err = await res.json().catch(() => ({}));
        setErro(err.message || "Erro ao deletar nível de acesso.");
      }
    } catch {
      setErro("Erro de conexão ao deletar nível de acesso.");
    }
  }

  async function cadastrar(evento) {
    evento.preventDefault();

    if (dados.email !== dados.confirmarEmail) {
      setErro("Os e-mails não coincidem.");
      return;
    }

    const erroSenha = validarSenha(dados);
    if (erroSenha) {
      setErro(erroSenha);
      return;
    }

    if (!dados.id_nivel_acesso) {
      setErro("Selecione um nível de acesso.");
      return;
    }

    let dataFormatada = dados.nascimento;
    const partesData = dados.nascimento.split("/");
    if (partesData.length === 3) {
      dataFormatada = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;
    }

    setCarregando(true);
    setErro("");
    setSucesso("");

    let fotoParaEnvio = "";
    if (foto && foto instanceof File) {
      try {
        fotoParaEnvio = await uploadParaCloudinary(foto);
      } catch {
        setErro("Não foi possível enviar a foto. Tente novamente.");
        setCarregando(false);
        return;
      }
    }

    try {
      const resposta = await fetch("/api/responsavel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: dados.nome,
          email: dados.email,
          cpf: dados.cpf,
          data_nascimento: dataFormatada,
          senha: dados.senha,
          id_nivel_acesso: Number(dados.id_nivel_acesso),
          foto: fotoParaEnvio,
        }),
      });

      const retorno = await resposta.json().catch(() => ({}));

      if (resposta.ok) {
        setSucesso("Gestor cadastrado com sucesso!");
      } else {
        setErro(retorno.message || retorno.response?.message || "Erro ao cadastrar gestor.");
      }
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  const niveisSemAdm = niveisAcesso.filter(
    (nivel) => (nivel.nome || "").trim().toUpperCase() !== "ADM"
  );

  return (
    <Shell voltar={false}>
      <main className={styles.container}>
        {/* TÍTULO NO TOPO DA PÁGINA */}
        <div className={styles.tituloPagina}>
          <h1>Cadastro do Responsável</h1>
          <p>Preencha os dados para cadastrar um novo gestor no sistema.</p>
        </div>

        {/* PAINEL PRINCIPAL */}
        <section className={styles.cadastroBox}>
          <form onSubmit={cadastrar}>
            <div className={styles.formulario}>
              <div className={styles.fotoColuna}>
                <label className={styles.fotoArea}>
                  {preview ? (
                    <img src={preview} alt="Foto" className={styles.previewImagem} />
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
                  <label htmlFor="nome">
                    Nome completo <span>*</span>
                  </label>
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
                  <label htmlFor="email">
                    E-mail <span>*</span>
                  </label>
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
                  <label htmlFor="cpf">
                    CPF <span>*</span>
                  </label>
                  <input
                    id="cpf"
                    name="cpf"
                    value={dados.cpf}
                    onChange={atualizar}
                    placeholder="000.000.000-00"
                    required
                    maxLength={14}
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="confirmarEmail">
                    Confirmar e-mail <span>*</span>
                  </label>
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
                  <label htmlFor="nascimento">
                    Data de nascimento <span>*</span>
                  </label>
                  <input
                    id="nascimento"
                    name="nascimento"
                    type="text"
                    value={dados.nascimento}
                    onChange={atualizar}
                    placeholder="DD/MM/AAAA"
                    required
                    maxLength={10}
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="senha">
                    Senha <span>*</span>
                  </label>
                  <input
                    id="senha"
                    name="senha"
                    type="password"
                    value={dados.senha}
                    onChange={atualizar}
                    placeholder="Mín. 8 caracteres, 1 maiúscula e 1 número"
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="confirmarSenha">
                    Confirmar senha <span>*</span>
                  </label>
                  <input
                    id="confirmarSenha"
                    name="confirmarSenha"
                    type="password"
                    value={dados.confirmarSenha}
                    onChange={atualizar}
                    placeholder="Digite a senha novamente"
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="id_nivel_acesso">
                    Nível de Acesso <span>*</span>
                  </label>
                  <select
                    id="id_nivel_acesso"
                    name="id_nivel_acesso"
                    value={dados.id_nivel_acesso}
                    onChange={atualizar}
                    required
                  >
                    <option value="" disabled>
                      Selecione um nível
                    </option>
                    {niveisSemAdm.map((nivel) => {
                      const nId = nivel.id || nivel.id_nivel_acesso;
                      return (
                        <option key={nId} value={nId}>
                          {nivel.nome}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.botoes}>
              <button
                type="button"
                className={styles.btnNovoNivel}
                onClick={() => setModalNivelAberto(true)}
              >
                + GERENCIAR NÍVEIS DE ACESSO
              </button>

              <button
                type="button"
                className={styles.cancelar}
                onClick={() => router.push("/home")}
                disabled={carregando}
              >
                CANCELAR
              </button>
              <button type="submit" className={styles.cadastrar} disabled={carregando}>
                {carregando ? "CADASTRANDO..." : "CADASTRAR GESTOR"}
              </button>
            </div>
          </form>
        </section>

        {modalNivelAberto && (
          <div className={modalStyles.modalOverlay}>
            <div className={modalStyles.modalContainer}>
              <div className={modalStyles.modalCabecalho}>
                <h3>Gerenciar Níveis de Acesso</h3>
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
                  placeholder="Novo Nível de Acesso..."
                  value={novoNivelNome}
                  onChange={(e) => setNovoNivelNome(e.target.value)}
                  className={modalStyles.modalInput}
                />
                <button
                  type="button"
                  onClick={criarNivelAcesso}
                  className={modalStyles.modalBotaoAdicionar}
                >
                  Adicionar
                </button>
              </div>

              <div className={modalStyles.modalLista}>
                {niveisSemAdm.map((item, index) => {
                  const itemId = item.id || item.id_nivel_acesso || index;
                  const itemNome = item.nome || "Sem Nome";

                  return (
                    <div key={itemId} className={modalStyles.modalItem}>
                      {nivelEditandoId === itemId ? (
                        <input
                          type="text"
                          value={nomeNivelEditado}
                          onChange={(e) => setNomeNivelEditado(e.target.value)}
                          className={modalStyles.modalInputEdicao}
                        />
                      ) : (
                        <span className={modalStyles.modalItemTexto}>● {itemNome}</span>
                      )}

                      <div className={modalStyles.modalAcoesItem}>
                        {nivelEditandoId === itemId ? (
                          <>
                            <button
                              type="button"
                              onClick={() => salvarEdicaoNivel(itemId)}
                              className={modalStyles.modalBotaoSalvar}
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => setNivelEditandoId(null)}
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
                                setNivelEditandoId(itemId);
                                setNomeNivelEditado(itemNome);
                              }}
                              className={modalStyles.modalBotaoEditar}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => deletarNivel(itemId)}
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
          titulo="Gestor Cadastrado!"
          aoFechar={() => {
            setSucesso("");
            router.push("/home");
          }}
        />
      </main>
    </Shell>
  );
}