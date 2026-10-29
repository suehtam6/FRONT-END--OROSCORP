"use client";

/*
Data : 7 de Outubro de 2026
Objetivo : Página de verificação de código
Autor : João Pedro e Kaique Carvalho

Autor do JS       : Matheus Lucas
Data              : 29 de Outubro de 2026
*/

import { useState } from "react";
import { useRouter } from "next/navigation";
import Popup from "@/app/components/Popup";
import styles from "@/app/style/codigo.module.css";

export default function Codigo() {
  const router = useRouter();

  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const voltar = () => {
    router.back();
  };


  const aoDigitar = (e) => {
    setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6));
  };

  const verificarCodigo = async (e) => {
    e.preventDefault();
    setErro("");

    if (codigo.length !== 6) {
      setErro("Digite os 6 dígitos do código.");
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch("/api/recuperar/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        setErro(dados.message || "Código inválido ou expirado.");
        return;
      }

      router.push("./redefinir_senha");
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

          <h1 className={styles.title}>Trocar Senha</h1>

          <p className={styles.subtitle}>
            Digite o código de 6 dígitos que enviamos para o seu e-mail
          </p>

          <form onSubmit={verificarCodigo} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="text"
                name="codigo"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="CÓDIGO"
                maxLength={6}
                className={styles.input}
                value={codigo}
                onChange={aoDigitar}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={carregando}
            >
              {carregando ? "CONFERINDO..." : "CONTINUE"}
            </button>
          </form>
        </div>
      </section>

      <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
    </main>
  );
}