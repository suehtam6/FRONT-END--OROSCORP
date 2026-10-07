"use client";

/*
Data : 7 de Outubro de 2026
Objetivo : Página de verificação de código
Autor : João Pedro e Kaique Carvalho
*/

import { useRouter } from "next/navigation";
import styles from "@/app/style/codigo.module.css";

export default function Codigo() {
  const router = useRouter();

  const voltar = () => {
    router.back();
  };

  const verificarCodigo = (e) => {
    e.preventDefault();
    router.push("./redefinir_senha");
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

          <h1 className={styles.title}>Trocar Senha</h1>

          <p className={styles.subtitle}>
            Digite o código de 6 dígitos que enviamos para o seu e-mail
          </p>

          <form onSubmit={verificarCodigo} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="CÓDIGO"
                maxLength={6}
                className={styles.input}
                required
              />
            </div>

            <button 
            type="submit"
            className={styles.submitButton}
            onClick={verificarCodigo} >
              CONTINUE
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}