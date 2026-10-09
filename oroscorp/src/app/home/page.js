
"use client";

/*
Data: 9 de Outubro de 2026
Objetivo: Página Home
Autor: João Pedro e Kaique Carvalho
*/

import { useState } from "react";
import styles from "../style/home.module.css";

export default function Home() {
  const [menuAberto, setMenuAberto] = useState(false);

  // Dados que serão recebidos pela API.
  const indicadores = [
    { titulo: "Ocorrências hoje", valor: "—", icone: "⚠" },
    { titulo: "Aguardando identificação", valor: "—", icone: "◉" },
    { titulo: "Câmeras online", valor: "—/—", icone: "▣" },
    { titulo: "Índice de segurança geral", valor: "—%", icone: "♙" },
  ];

  const alertas = [];
  const ocorrencias = [];

  return (
    <main className={styles.pagina}>
      <header className={styles.topo}>
        <button
          className={styles.menu}
          aria-label="Abrir ou fechar menu"
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto(!menuAberto)}
        >
          ☰
        </button>

        <div className={styles.logo}>
          <span />
          OROSCORP
        </div>
      </header>

      {/* Menu lateral: aparece somente quando o hambúrguer é clicado */}
      <aside
        className={`${styles.sidebar} ${
          menuAberto ? styles.sidebarAberta : ""
        }`}
      >
        <h3>🟠 CENTRAL</h3>

        <nav>
          <a href="/home" onClick={() => setMenuAberto(false)}>
            ▦　DASHBOARD
          </a>

          <a href="/setores" onClick={() => setMenuAberto(false)}>
            ▦　SETORES
          </a>

          <a href="/cameras" onClick={() => setMenuAberto(false)}>
            ▱　CÂMERAS
          </a>

          <a href="/ocorrencias" onClick={() => setMenuAberto(false)}>
            △　OCORRÊNCIAS
          </a>

          <a href="/funcionarios" onClick={() => setMenuAberto(false)}>
            ♙　FUNCIONÁRIOS
          </a>

          <p>CADASTROS</p>

          <a href="/epi" onClick={() => setMenuAberto(false)}>
            ♟　EPI
          </a>

          <a href="/gestor" onClick={() => setMenuAberto(false)}>
            ♙　GESTOR
          </a>

          <a href="/funcionarios" onClick={() => setMenuAberto(false)}>
            ♟　FUNCIONÁRIOS
          </a>
        </nav>

        <div className={styles.usuario}>
          <strong>Administrador</strong>
          <small>Conta administrativa</small>
        </div>
      </aside>

      {/* Fundo escuro ao abrir o menu */}
      {menuAberto && (
        <div
          className={styles.fundoMenu}
          onClick={() => setMenuAberto(false)}
        />
      )}

      {/* Dashboard permanece visível */}
      <section className={styles.conteudo}>
        <h1>Dashboard</h1>

        <p className={styles.subtitulo}>
          Visão geral do monitoramento de segurança e
          conformidade com EPIs em tempo real.
        </p>

        <section className={styles.indicadores}>
          {indicadores.map((item) => (
            <article className={styles.card} key={item.titulo}>
              <span className={styles.icone}>{item.icone}</span>
              <h2>{item.valor}</h2>
              <p>{item.titulo}</p>
            </article>
          ))}
        </section>

        <section className={styles.grade}>
          <div className={styles.coluna}>
            <article className={styles.painel}>
              <div className={styles.tituloPainel}>
                <div>
                  <h2>Ocorrências ao longo do tempo</h2>
                  <p>Detecções de IA e registros manuais</p>
                </div>

                <select aria-label="Período">
                  <option>Semana</option>
                  <option>Hoje</option>
                  <option>Mês</option>
                </select>
              </div>

              <div className={styles.grafico}>
                <div className={styles.linhas}>
                  <span>20</span>
                  <span>15</span>
                  <span>10</span>
                  <span>5</span>
                  <span>0</span>
                </div>

                <svg
                  viewBox="0 0 600 180"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Gráfico de ocorrências"
                >
                  <path
                    d="M0 120 C70 95 100 65 160 65 S240 145 300 155 S370 95 420 90 S520 65 600 30"
                    fill="none"
                    stroke="#ffad78"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>

                <div className={styles.dias}>
                  <span>Qui</span>
                  <span>Sex</span>
                  <span>Sáb</span>
                  <span>Dom</span>
                  <span>Seg</span>
                  <span>Ter</span>
                  <span>Qua</span>
                </div>
              </div>
            </article>

            <article className={styles.painel}>
              <div className={styles.tituloPainel}>
                <div>
                  <h2>Ocorrências recentes</h2>
                  <p>Últimos registros de IA e manuais</p>
                </div>

                <a href="/ocorrencias">Ver todas →</a>
              </div>

              <div className={styles.tabelaRolagem}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Funcionário</th>
                      <th>Tipo</th>
                      <th>Setor</th>
                      <th>Origem</th>
                      <th>Prioridade</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ocorrencias.length > 0 ? (
                      ocorrencias.map((item, i) => (
                        <tr key={item.id || i}>
                          <td>{item.id}</td>
                          <td>{item.funcionario}</td>
                          <td>{item.tipo}</td>
                          <td>{item.setor}</td>
                          <td>{item.origem}</td>
                          <td>{item.prioridade}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className={styles.vazio}>
                          Os dados das ocorrências aparecerão aqui.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </div>

          <article
            className={`${styles.painel} ${styles.painelAlertas}`}
          >
            <h2>Alertas recentes</h2>
            <p>Eventos das últimas horas</p>

            {alertas.length > 0 ? (
              alertas.map((alerta, i) => (
                <div className={styles.alerta} key={alerta.id || i}>
                  <span>⚠</span>

                  <div>
                    <strong>{alerta.titulo}</strong>
                    <small>{alerta.detalhe}</small>
                  </div>

                  <label>{alerta.prioridade}</label>
                </div>
              ))
            ) : (
              <p className={styles.vazio}>
                Os alertas da API aparecerão aqui.
              </p>
            )}
          </article>
        </section>
      </section>
    </main>
  );
}