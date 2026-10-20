
"use client";

/*
Data: 20 de Outubro de 2026
Objetivo: Página de cadastro de câmeras
Autor: João Pedro e Kaique Carvalho
*/

import { useState } from "react";
import styles from "../style/cadastrarCamera.module.css";

function Icone({ tipo }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
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
          <path
            d="M10 5 3 12l7 7v-4h11V9H10V5Z"
            fill="currentColor"
          />
        </svg>
      );

    case "camera":
      return (
        <svg {...props}>
          <rect x="3" y="6" width="13" height="12" rx="2" />
          <path d="m16 10 5-3v10l-5-3" />
        </svg>
      );

    case "descricao":
      return (
        <svg {...props}>
          <path d="M6 3h9l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M14 3v6h6M8 13h7M8 17h5" />
        </svg>
      );

    case "ip":
      return (
        <svg {...props}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.7 10.5 6.6-4M8.7 13.5l6.6 4" />
        </svg>
      );

    case "setor":
      return (
        <svg {...props}>
          <rect x="5" y="3" width="14" height="18" rx="1" />
          <path d="M9 7h2m2 0h2M9 11h2m2 0h2M9 15h2m2 0h2M10 21v-3h4v3" />
        </svg>
      );

    case "video":
      return (
        <svg {...props}>
          <rect
            x="3"
            y="6"
            width="13"
            height="12"
            rx="2"
            fill="currentColor"
          />
          <path
            d="m16 10 5-3v10l-5-3Z"
            fill="currentColor"
          />
        </svg>
      );

    default:
      return null;
  }
}

function Campo({ tipo, titulo, children, obrigatorio = false }) {
  return (
    <div className={styles.campo}>
      <span className={styles.iconeCampo}>
        <Icone tipo={tipo} />
      </span>

      <div className={styles.conteudoCampo}>
        <label>
          {titulo}
          {obrigatorio && (
            <span className={styles.obrigatorio}> *</span>
          )}
        </label>

        {children}
      </div>
    </div>
  );
}

export default function CadastroCamera() {
  const [nome, setNome] = useState("Câmera 01");
  const [descricao, setDescricao] = useState(
    "Entrada do almoxarifado"
  );
  const [endereco, setEndereco] = useState(
    "rtsp://192.168.1.101/stream"
  );
  const [setor, setSetor] = useState("Almoxarifado");
  const [status, setStatus] = useState("ativa");
  const [mensagem, setMensagem] = useState("");

  function cancelar() {
    setNome("");
    setDescricao("");
    setEndereco("");
    setSetor("");
    setStatus("ativa");
    setMensagem("");
  }

  function cadastrar(event) {
    event.preventDefault();

    setMensagem(
      `Câmera "${nome}" preenchida com sucesso! A integração com a API ainda não foi implementada.`
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
          <h1>Cadastro de Câmeras</h1>
          <p>
            Cadastre e configure as câmeras de monitoramento da empresa.
          </p>
        </div>

        <form className={styles.formulario} onSubmit={cadastrar}>
          <div className={styles.colunaCampos}>
            <Campo
              tipo="camera"
              titulo="Nome da câmera"
              obrigatorio
            >
              <input
                type="text"
                placeholder="Digite o nome da câmera"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </Campo>

            <Campo tipo="descricao" titulo="Descrição">
              <input
                type="text"
                placeholder="Descreva a localização da câmera"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </Campo>

            <Campo tipo="ip" titulo="Endereço / IP" obrigatorio>
              <input
                type="text"
                placeholder="rtsp://192.168.1.101/stream"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                required
              />
            </Campo>

            <Campo tipo="setor" titulo="Setor" obrigatorio>
              <div className={styles.seletor}>
                <select
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  required
                >
                  <option value="">Selecione um setor</option>
                  <option value="Almoxarifado">Almoxarifado</option>
                  <option value="Soldagem">Soldagem</option>
                  <option value="Maquinário">Maquinário</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Expedição">Expedição</option>
                  <option value="Químicos">Químicos</option>
                </select>
              </div>
            </Campo>

            <fieldset className={styles.caixaStatus}>
              <legend>
                <Icone tipo="video" />
                <span>Status</span>
              </legend>

              <label className={styles.opcaoStatus}>
                <input
                  type="radio"
                  name="status"
                  value="ativa"
                  checked={status === "ativa"}
                  onChange={(e) => setStatus(e.target.value)}
                />
                <span className={styles.radioVisual} />
                Ativa
              </label>

              <label className={styles.opcaoStatus}>
                <input
                  type="radio"
                  name="status"
                  value="inativa"
                  checked={status === "inativa"}
                  onChange={(e) => setStatus(e.target.value)}
                />
                <span className={styles.radioVisual} />
                Inativa
              </label>
            </fieldset>
          </div>

          <div className={styles.colunaPreview}>
            <div className={styles.previewCamera}>
              <div className={styles.iconeVideo}>
                <Icone tipo="video" />
              </div>

              <div className={styles.cenario}>
                <div className={styles.teto} />

                <div
                  className={`${styles.prateleira} ${styles.prateleiraUm}`}
                />

                <div
                  className={`${styles.prateleira} ${styles.prateleiraDois}`}
                />

                <div
                  className={`${styles.coluna} ${styles.colunaUm}`}
                />

                <div
                  className={`${styles.coluna} ${styles.colunaDois}`}
                />

                <div
                  className={`${styles.coluna} ${styles.colunaTres}`}
                />

                <div className={styles.chao} />

                <div className={styles.empilhadeira}>
                  <span />
                </div>
              </div>
            </div>

            <p className={styles.legendaPreview}>
              Pré-visualização da câmera
            </p>
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

            <button
              type="submit"
              className={styles.botaoCadastrar}
            >
              Cadastrar
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
