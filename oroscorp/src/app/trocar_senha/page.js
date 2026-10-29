"use client";

/*
Data : 7 de Outubro de 2026
Objetivo : Página de solicitar código de troca de senha
Autor : João Pedro e Kaique Carvalho

Autor do JS       : Matheus Lucas
Data              : 29 de Outubro de 2026
*/

import { useState } from "react";
import { useRouter } from "next/navigation";
import Popup from "@/app/components/Popup";
import styles from "@/app/style/recuperarsenha.module.css";

export default function TrocarSenha() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const voltar = () => {
    router.back();
  };

  const enviarCodigo = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/recuperar/solicitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        setErro(dados.message || "Não foi possível enviar o código.");
        return;
      }

      router.push("./codigo");
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
                name="email"
                autoComplete="email"
                placeholder="E-MAIL"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={carregando}
            >
              {carregando ? "ENVIANDO..." : "ENVIAR CÓDIGO"}
            </button>
          </form>
        </div>
      </section>

      <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
    </main>
  );
}