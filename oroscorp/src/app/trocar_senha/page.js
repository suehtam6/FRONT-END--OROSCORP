"use client";

/*
Data : 7 de Outubro de 2026
Objetivo : Página de solicitar código de troca de senha
Autor : João Pedro e Kaique Carvalho
*/

import { useRouter } from "next/navigation";
import styles from "@/app/style/recuperarsenha.module.css";

export default function TrocarSenha() {
  const router = useRouter();

  const voltar = () => {
    router.back();
  };

  const enviarCodigo = (e) => {
    e.preventDefault();
    router.push("./codigo");
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
        <div className={styles.card}>
          <a onClick={voltar} className={styles.backButton}>
            &larr; voltar
          </a>

          <h1 className={styles.title}>TROCAR SENHA</h1>

          <p className={styles.subtitle}>
            Digite o e-mail para redefinir sua senha
          </p>

          <form onSubmit={enviarCodigo} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                placeholder="E-MAIL"
                className={styles.input}
                required
              />
            </div>

            <button 
              type="submit" 
              onClick={enviarCodigo} 
              className={styles.submitButton}
            >
              ENVIAR CÓDIGO
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}