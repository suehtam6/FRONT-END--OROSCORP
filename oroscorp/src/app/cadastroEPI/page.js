
"use client";

/*
Data: 20 de Outubro de 2026
Objetivo: Página de cadastro de EPIs
Autor: João Pedro e Kaique Carvalho
*/

import { useRef, useState } from "react";
import styles from "../style/cadastrarEpi.module.css";

function Icone({ tipo, className = "" }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  switch (tipo) {
    case "menu":
      return (
        <svg {...props}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );

    case "voltar":
      return (
        <svg {...props}>
          <path d="M10 5 3 12l7 7v-4h11V9H10V5Z" fill="currentColor" />
        </svg>
      );

    case "capacete":
      return (
        <svg {...props}>
          <path d="M3 15a9 9 0 0 1 18 0v2H3v-2Z" />
          <path d="M12 6v9M5 12h14M2 19h20" />
        </svg>
      );

    case "descricao":
      return (
        <svg {...props}>
          <path d="M6 3h9l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M14 3v6h6M8 13h7M8 17h5" />
        </svg>
      );

    case "cor":
      return (
        <svg {...props}>
          <path d="M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4h-1a1.5 1.5 0 0 1 0-3h2a5 5 0 0 0 5-5c0-3.3-3.6-6-8-6Z" />
          <circle cx="7.5" cy="10" r="1" fill="currentColor" />
          <circle cx="11" cy="6.5" r="1" fill="currentColor" />
          <circle cx="16" cy="8" r="1" fill="currentColor" />
        </svg>
      );

    case "upload":
      return (
        <svg {...props}>
          <path d="M12 16V4m-5 5 5-5 5 5" />
          <path d="M5 14v5h14v-5" />
        </svg>
      );

    case "fechar":
      return (
        <svg {...props}>
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      );

    default:
      return null;
  }
}

export default function CadastroEPI() {
  const inputImagem = useRef(null);

  const [nome, setNome] = useState("Capacete");
  const [descricao, setDescricao] = useState(
    "Capacete de segurança industrial"
  );
  const [cor, setCor] = useState("Amarelo");
  const [imagem, setImagem] = useState(null);
  const [mensagem, setMensagem] = useState("");

  function selecionarImagem(event) {
    const arquivo = event.target.files?.[0];

    if (arquivo && arquivo.type.startsWith("image/")) {
      setImagem(arquivo);
      setMensagem("");
    }

    event.target.value = "";
  }

  function removerImagem() {
    setImagem(null);

    if (inputImagem.current) {
      inputImagem.current.value = "";
    }
  }

  function cancelar() {
    setNome("");
    setDescricao("");
    setCor("Amarelo");
    setImagem(null);
    setMensagem("");
  }

  function cadastrar(event) {
    event.preventDefault();

    setMensagem(
      `Dados do EPI "${nome}" preenchidos! A conexão com a API ainda não foi implementada.`
    );
  }

  return (
    <main className={styles.pagina}>
      <header className={styles.cabecalho}>
        <button
          type="button"
          className={`${styles.botaoCircular} ${styles.botaoMenu}`}
          aria-label="Abrir menu"
        >
          <Icone tipo="menu" />
        </button>

        <a href="/" className={styles.logo} aria-label="OrosCorp">
          <span className={styles.logoSimbolo} />
          <span className={styles.logoTexto}>OROSCORP</span>
        </a>

        <button
          type="button"
          className={styles.botaoCircular}
          aria-label="Voltar"
          onClick={() => window.history.back()}
        >
          <Icone tipo="voltar" />
        </button>
      </header>

      <section className={styles.conteudo}>
        <div className={styles.tituloPagina}>
          <h1>Cadastro de EPIs</h1>
          <p>
            Cadastre e gerencie os Equipamentos de Proteção Individual
            utilizados na empresa.
          </p>
        </div>

        <form className={styles.formularioPrincipal} onSubmit={cadastrar}>
          <div className={styles.colunaCampos}>
            <div className={styles.campo}>
              <label htmlFor="nomeEpi">
                Nome do EPI <span className={styles.obrigatorio}>*</span>
              </label>

              <div className={styles.campoComIcone}>
                <span className={styles.iconeRedondo}>
                  <Icone tipo="capacete" />
                </span>

                <input
                  id="nomeEpi"
                  type="text"
                  placeholder="Digite o nome do EPI"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.campo}>
              <label htmlFor="descricaoEpi">Descrição</label>

              <div className={styles.campoComIcone}>
                <span className={styles.iconeRedondo}>
                  <Icone tipo="descricao" />
                </span>

                <input
                  id="descricaoEpi"
                  type="text"
                  placeholder="Descreva o equipamento"
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                />
              </div>
            </div>

            <div className={styles.campo}>
              <label htmlFor="corEpi">Cor</label>

              <div className={styles.campoComIcone}>
                <span className={styles.iconeRedondo}>
                  <Icone tipo="cor" />
                </span>

                <div className={styles.seletorCor}>
                  <select
                    id="corEpi"
                    value={cor}
                    onChange={(event) => setCor(event.target.value)}
                  >
                    <option value="Amarelo">Amarelo</option>
                    <option value="Branco">Branco</option>
                    <option value="Laranja">Laranja</option>
                    <option value="Vermelho">Vermelho</option>
                  </select>

                  <span className={styles.amostraCor}>
                    <span
                      className={`${styles.bolinhaCor} ${
                        styles[`cor${cor}`]
                      }`}
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.colunaImagem}>
            <label className={styles.rotuloImagem}>Foto do EPI</label>

            <div className={styles.caixaImagem}>
              <div className={styles.preview}>
                {imagem ? (
                  <>
                    <img
                      src={URL.createObjectURL(imagem)}
                      alt={`Imagem do EPI ${nome || "cadastrado"}`}
                    />

                    <button
                      type="button"
                      className={styles.removerImagem}
                      onClick={removerImagem}
                      aria-label="Remover imagem"
                    >
                      <Icone tipo="fechar" />
                    </button>
                  </>
                ) : (
                  <div className={styles.ilustracaoCapacete}>
                    <span role="img" aria-label="Capacete de segurança">
                      ⛑️
                    </span>
                  </div>
                )}
              </div>

              <input
                ref={inputImagem}
                type="file"
                accept="image/*"
                hidden
                onChange={selecionarImagem}
              />

              <button
                type="button"
                className={styles.botaoImagem}
                onClick={() => inputImagem.current?.click()}
              >
                <Icone tipo="upload" />
                Alterar imagem
              </button>
            </div>
          </div>

          {mensagem && (
            <p className={styles.mensagem} role="status">
              {mensagem}
            </p>
          )}

          <div className={styles.acoes}>
            <button
              type="button"
              className={styles.botaoCancelar}
              onClick={cancelar}
            >
              Cancelar
            </button>

            <button type="submit" className={styles.botaoCadastrar}>
              Cadastrar
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
