"use client";

/*
Data : 6 de Outubro de 2026
Objetivo : Tela Inicial / Login
Autor : João Pedro e Kaique Carvalho
*/

import { useRouter } from "next/navigation";
import styles from "@/app/style/redefinirsenha.module.css";

export default function Home() {
  const router = useRouter();

  const trocarSenha = (e) => {
    e.preventDefault();
    router.push("/trocar_senha");
  };

  const voltar = () => {
    router.back();
  };

  const redefinir = (e) => {
    e.preventDefault();
    router.push("./");
  };

  const entrar = (e) => {
    e.preventDefault();
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
        
          <h1 className={styles.title}>ENTRE NA SUA CONTA</h1>
          <p className={styles.subtitle}>
            Digite o código de 6 dígitos que enviamos para o seu e-mail</p> 

          <form onSubmit={entrar} className={styles.form}>
            <div className={styles.inputGroup}>
             
              <input
                type="email"
                placeholder="Digite sua senha"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <input
                type="password"
                placeholder="Digite sua senha novamente"
                className={styles.input}
                required
              />
            </div>

            

            <button type="submit" className={styles.submitButton} onClick={redefinir}>
              Redefinir
            </button>

            
          </form>
        </div>
      </section>
    </main>
  );
}