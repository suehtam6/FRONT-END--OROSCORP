
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import styles from "../style/cadastrarGestor.module.css";

export default function CadastrarGestor() {
  const router = useRouter();

  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const [dados, setDados] = useState({
    nome: "",
    email: "",
    confirmarEmail: "",
    cnpj: "",
    nascimento: "",
    senha: "",
    confirmarSenha: ""
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

  function atualizar(evento) {
    setDados({
      ...dados,
      [evento.target.name]: evento.target.value
    });
    setMensagem("");
  }

  function cadastrar(evento) {
    evento.preventDefault();

    if (dados.email !== dados.confirmarEmail) {
      setMensagem("Os e-mails não são iguais.");
      return;
    }

    if (dados.senha !== dados.confirmarSenha) {
      setMensagem("As senhas não são iguais.");
      return;
    }

    // O envio para a API será implementado aqui.
    setMensagem("Dados validados. Cadastro aguardando integração com a API.");
  }

  return (
    <Shell voltar={false}>
      <main className={styles.container}>
        <section className={styles.cadastroBox}>
          <div className={styles.titulo}>
            <div>
              <h1>Cadastro do Gestor</h1>
              <p>Preencha os dados para cadastrar um novo gestor no sistema.</p>
            </div>

            <button
              type="button"
              className={styles.sair}
              onClick={() => router.push("/home")}
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
                      alt="Foto do gestor"
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
                    onChange={(e) =>
                      setFoto(e.target.files?.[0] || null)
                    }
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
                  <label htmlFor="cnpj">CNPJ <span>*</span></label>
                  <input
                    id="cnpj"
                    name="cnpj"
                    value={dados.cnpj}
                    onChange={atualizar}
                    placeholder="00.000.000/0000-00"
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
                  <label htmlFor="senha">Senha <span>*</span></label>
                  <input
                    id="senha"
                    name="senha"
                    type={mostrarSenha ? "text" : "password"}
                    value={dados.senha}
                    onChange={atualizar}
                    placeholder="Digite a senha"
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="confirmarSenha">Confirmar senha <span>*</span></label>
                  <input
                    id="confirmarSenha"
                    name="confirmarSenha"
                    type={mostrarSenha ? "text" : "password"}
                    value={dados.confirmarSenha}
                    onChange={atualizar}
                    placeholder="Digite a senha novamente"
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label className={styles.mostrarSenha}>
                    <input
                      type="checkbox"
                      checked={mostrarSenha}
                      onChange={(e) => setMostrarSenha(e.target.checked)}
                    />
                    Mostrar senhas
                  </label>
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
                onClick={() => router.push("/home")}
              >
                CANCELAR
              </button>

              <button type="submit" className={styles.cadastrar}>
                CADASTRAR GESTOR
              </button>
            </div>
          </form>
        </section>
      </main>
    </Shell>
  );
}
