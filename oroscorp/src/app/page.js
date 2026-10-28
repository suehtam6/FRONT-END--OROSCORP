"use client";

/*
Data : 6 de Outubro de 2026
Objetivo : Tela Inicial / Login
Autor : João Pedro e Kaique Carvalho
*/

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/style/page.module.css";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const trocarSenha = (e) => {
    e.preventDefault();
    router.push("/trocar_senha");
  };

  const cadastrar = (e) => {
    e.preventDefault();
    router.push("/cadastrarAdm");
  };

  const entrar = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        setErro(dados.message || "Não foi possível entrar.");
        return;
      }

      // Dados não sensíveis para exibir na interface (nome, foto...).
      // O token fica no cookie httpOnly, fora do alcance do JavaScript.
      sessionStorage.setItem("usuario", JSON.stringify(dados.usuario));

      router.push("/home");
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <img
          src="/logo-oroscorp.png"
          alt="Oroscorp"
          className={styles.logo}
        />
      </header>

      <section className={styles.mainContent}>
        <div className={styles.loginBox}>
          <h1 className={styles.title}>ENTRE NA SUA CONTA</h1>

          {/* Só o onSubmit chama o entrar. O onClick no botão fazia a função rodar duas vezes. */}
          <form onSubmit={entrar} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="E-MAIL"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <input
                type="password"
                name="senha"
                autoComplete="current-password"
                placeholder="SENHA"
                className={styles.input}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            {erro && (
              <p role="alert" className={styles.erro}>
                {erro}
              </p>
            )}

            <div className={styles.forgotWrapper}>
              <a onClick={trocarSenha} className={styles.forgot}>
                Esqueceu sua senha?
              </a>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={carregando}
            >
              {carregando ? "ENTRANDO..." : "ENTRAR"}
            </button>

            <p className={styles.signupText}>
              Não tem conta?{" "}
              <a onClick={cadastrar} className={styles.signupLink}>
                Cadastre-se
              </a>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}