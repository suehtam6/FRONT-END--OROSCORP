
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../style/ocorrencias.module.css";

export default function Ocorrencias() {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState({
    status: "", origem: "", setor: "", prioridade: "", tipo: "",
  });

  // Substitua pelo retorno da API futuramente
  const ocorrencias = [];

  const atualizar = (campo, valor) =>
    setFiltros({ ...filtros, [campo]: valor });

  const dados = ocorrencias.filter((o) =>
    [o.id, o.funcionario, o.tipo].some((v) =>
      String(v ?? "").toLowerCase().includes(busca.toLowerCase())
    ) && Object.entries(filtros).every(([chave, valor]) =>
      !valor || o[chave] === valor
    )
  );

  const opcoes = {
    status: ["Aberta", "Em análise", "Resolvida", "Aguardando identificação"],
    origem: ["IA", "Manual"],
    setor: ["Soldagem", "Manutenção", "Maquinário", "Almoxarifado"],
    prioridade: ["Crítica", "Alta", "Média", "Baixa"],
    tipo: [...new Set(ocorrencias.map((o) => o.tipo).filter(Boolean))],
  };

  const classe = (valor) =>
    styles[valor?.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "").toLowerCase()] || "";

  return (
    <main className={styles.pagina}>
      <header className={styles.header}>
        <button onClick={() => setMenu(!menu)}>{menu ? "✕" : "☰"}</button>
        <strong><span>●</span> OROSCORP</strong>
        <button onClick={() => router.back()}>←</button>
      </header>

      {menu && <button className={styles.fundo} onClick={() => setMenu(false)} />}

      <aside className={`${styles.menu} ${menu ? styles.aberto : ""}`}>
        <h3>● CENTRAL</h3>
        {[
          ["DASHBOARD", "/home"],
          ["SETORES", "/setores"],
          ["CÂMERAS", "/cameras"],
          ["OCORRÊNCIAS", "/ocorrencias"],
          ["FUNCIONÁRIOS", "/funcionarios"],
          ["CADASTRAR SETOR", "/cadastrarSetor"],
          ["CADASTRAR GESTOR", "/cadastrarGestor"],
          ["CADASTRAR FUNCIONÁRIO", "/cadastrarFuncionario"],
        ].map(([nome, link]) => (
          <a key={link} href={link}
            className={nome === "OCORRÊNCIAS" ? styles.selecionado : ""}>
            {nome}
          </a>
        ))}
        <div className={styles.usuario}>
          <strong>Administrador</strong>
          <small>Conta administrativa</small>
        </div>
      </aside>

      <section className={styles.conteudo}>
        <div className={styles.titulo}>
          <div>
            <h1>Ocorrências</h1>
            <p>Todas as detecções de IA e registros manuais de não conformidade com EPIs.</p>
          </div>
          <button className={styles.registrar}
            onClick={() => router.push("/cadastrarOcorrencia")}>
            + Registrar ocorrência
          </button>
        </div>

        <section className={styles.painel}>
          <h2>☰ Filtros</h2>
          <div className={styles.filtros}>
            <input placeholder="⌕ Buscar..." value={busca}
              onChange={(e) => setBusca(e.target.value)} />

            {Object.entries(opcoes).map(([campo, valores]) => (
              <select key={campo} value={filtros[campo]}
                onChange={(e) => atualizar(campo, e.target.value)}>
                <option value="">{{
                  status: "Todos os status",
                  origem: "Todas as origens",
                  setor: "Todos os setores",
                  prioridade: "Todas as prioridades",
                  tipo: "Todos os tipos",
                }[campo]}</option>
                {valores.map((v) => <option key={v}>{v}</option>)}
              </select>
            ))}
          </div>
        </section>

        <section className={styles.painel}>
          <p className={styles.contagem}>{dados.length} ocorrências</p>
          <div className={styles.tabela}>
            <table>
              <thead>
                <tr>
                  {["ID", "FUNCIONÁRIO", "TIPO", "SETOR", "ORIGEM",
                    "PRIORIDADE", "STATUS", "DATA / HORA"].map((t) =>
                    <th key={t}>{t}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {dados.length ? dados.map((o, i) => (
                  <tr key={o.id ?? i}>
                    <td>#{o.id}</td>
                    <td>{o.funcionario || "Não identificado"}</td>
                    <td>{o.tipo || "—"}</td>
                    <td>{o.setor || "—"}</td>
                    <td><span className={`${styles.etiqueta} ${classe(o.origem)}`}>{o.origem || "—"}</span></td>
                    <td><span className={`${styles.etiqueta} ${classe(o.prioridade)}`}>{o.prioridade || "—"}</span></td>
                    <td><span className={`${styles.etiqueta} ${classe(o.status)}`}>{o.status || "—"}</span></td>
                    <td>{o.data || "—"}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className={styles.vazio}>
                    Nenhuma ocorrência encontrada.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
