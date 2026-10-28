"use client";

/*
Data : 6 de Outubro de 2026
Objetivo : Tela Inicial / Login
Autor : João Pedro e Kaique Carvalho
*/

import { useRouter } from "next/navigation";
import styles from "@/app/style/page.module.css";

export default function Home() {
  const router = useRouter();

  const trocarSenha = (e) => {
    e.preventDefault();
    router.push("/trocar_senha");
  };

  const cadastrar = (e) => {
    e.preventDefault();
    router.push("/cadastrarAdm");
  };

  const entrar = (e) => {
    e.preventDefault();
    router.push("/home");
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

          <form onSubmit={entrar} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                placeholder="E-MAIL"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <input
                type="password"
                placeholder="SENHA"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.forgotWrapper}>
              <a onClick={trocarSenha} className={styles.forgot}>
                Esqueceu sua senha?
              </a>
            </div>

            <button onClick={entrar} type="submit" className={styles.submitButton}>
              ENTRAR
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