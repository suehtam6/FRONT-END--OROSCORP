/*
Data : 6 de Outubro de 2026
Objetivo : Página de Login
Autor : João Pedro e Kaique Carvalho

*/

import styles from "./page.module.css"

export default function Home() {
  return (
    <main className={styles.container}>

      <header className={styles.header}>
        <img
        src="/logo-oroscorp.png"
        alt="Oroscorp"
        className={styles.logo}
        
        />

      </header>

    <section className={styles.loginBox}>

      <h1>ENTRE NA SUA CONTA</h1>

      <input
      type="email"
      placeholder="E-mail"
      />

      <input 
      type="password"
      placeholder="SENHA"
      />
      
      <a href="#" classname={styles.forgot}>
        Esqueceu sua senha ?
      </a>

      <button>
        ENTRAR
      </button>

      <p>
        Não tem conta?{""}
        <a href="#"> Cadastre-se</a>
      </p>

    </section>

    </main>
  );
}