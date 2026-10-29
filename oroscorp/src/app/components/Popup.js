"use client";

/*
Objetivo    : Popup (janela de aviso) reutilizável para mensagens de erro e de sucesso.
Autor       : Matheus Lucas
Data        : 29 de Outubro de 2026

Uso:
  <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />

  <Popup
    mensagem={sucesso}
    tipo="sucesso"
    titulo="Senha alterada!"
    textoBotao="Ir para o login"
    aoFechar={() => router.push("/")}
  />

O popup aparece quando "mensagem" tem texto e some quando ela fica vazia.
Fecha com o botão, com a tecla Esc ou clicando fora da caixa.
*/

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "@/app/style/popup.module.css";

const PADRAO = {
  erro: { titulo: "Algo deu errado", icone: "!", botao: "Entendi" },
  sucesso: { titulo: "Tudo certo!", icone: "✓", botao: "OK" },
};

export default function Popup({ mensagem, tipo = "erro", titulo, textoBotao, aoFechar }) {
  const botaoRef = useRef(null);
  const fecharRef = useRef(aoFechar);

  const aberto = Boolean(mensagem);
  const config = PADRAO[tipo] || PADRAO.erro;


  useEffect(() => {
    fecharRef.current = aoFechar;
  });

  useEffect(() => {
    if (!aberto) return;


    const anterior = document.activeElement;
    botaoRef.current?.focus();

    const aoApertarTecla = (e) => {
      if (e.key === "Escape") {
        fecharRef.current?.();
      }

      if (e.key === "Tab") {
        e.preventDefault();
        botaoRef.current?.focus();
      }
    };

    document.addEventListener("keydown", aoApertarTecla);

    return () => {
      document.removeEventListener("keydown", aoApertarTecla);
      anterior?.focus?.();
    };
  }, [aberto]);

  if (!aberto || typeof document === "undefined") return null;

  const fechar = () => fecharRef.current?.();


  return createPortal(
    <div className={styles.fundo} onClick={fechar}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="popup-titulo"
        aria-describedby="popup-mensagem"
        className={`${styles.caixa} ${tipo === "sucesso" ? styles.sucesso : styles.erro}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.icone} aria-hidden="true">
          {config.icone}
        </div>

        <h2 id="popup-titulo" className={styles.titulo}>
          {titulo || config.titulo}
        </h2>

        <p id="popup-mensagem" className={styles.mensagem}>
          {mensagem}
        </p>

        <button
          ref={botaoRef}
          type="button"
          className={styles.botao}
          onClick={fechar}
        >
          {textoBotao || config.botao}
        </button>
      </div>
    </div>,
    document.body
  );
}