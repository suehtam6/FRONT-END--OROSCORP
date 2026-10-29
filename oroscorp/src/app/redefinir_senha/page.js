"use client";

/*
Data : 7 de Outubro de 2026
Objetivo : Página de redefinir a senha (depois de confirmar o código)
Autor : João Pedro e Kaique Carvalho

Autor do JS       : Matheus Lucas
Data              : 29 de Outubro de 2026s
*/

import { useState } from "react";
import { useRouter } from "next/navigation";
import Popup from "@/app/components/Popup";
import styles from "@/app/style/redefinirsenha.module.css";

export default function RedefinirSenha() {
  const router = useRouter();

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  const voltar = () => {
    router.push("/trocar_senha");
  };

  const redefinir = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch("/api/recuperar/redefinir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        setErro(dados.message || "Não foi possível alterar a senha.");
        return;
      }

      setSucesso("Agora é só entrar com a nova senha.");
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

          <h1 className={styles.title}>REDEFINIR SENHA</h1>
          <p className={styles.subtitle}>
            Coloque uma senha nova aqui
          </p>

          {/* Só o onSubmit chama o redefinir. O onClick no botão fazia a função rodar duas vezes. */}
          <form onSubmit={redefinir} className={styles.form}>
            <div className={styles.inputGroup}>
              {/* Era type="email": a senha aparecia na tela. Agora é password. */}
              <input
                type="password"
                name="senha"
                autoComplete="new-password"
                maxLength={72}
                placeholder="Digite sua senha"
                className={styles.input}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <input
                type="password"
                name="confirmarSenha"
                autoComplete="new-password"
                maxLength={72}
                placeholder="Digite sua senha novamente"
                className={styles.input}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={carregando || Boolean(sucesso)}
            >
              {carregando ? "SALVANDO..." : "Redefinir"}
            </button>
          </form>
        </div>
      </section>

      <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
      <Popup
        mensagem={sucesso}
        tipo="sucesso"
        titulo="Senha alterada!"
        textoBotao="Ir para o login"
        aoFechar={() => router.push("/")}
      />
    </main>
  );
}