"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../style/cadastrarOcorrencia.module.css";

export default function CadastrarOcorrencia() {
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);
  const [imagem, setImagem] = useState(null);
  const [prioridade, setPrioridade] = useState("Média");
  const [enviando, setEnviando] = useState(false);

  const [dados, setDados] = useState({
    funcionario: "",
    setor: "",
    camera: "",
    tipo: "",
    data: "",
    hora: "",
    status: "Aberta",
    descricao: "",
  });

  function atualizar(e) {
    setDados({ ...dados, [e.target.name]: e.target.value });
  }

  async function registrar(e) {
    e.preventDefault();
    setEnviando(true);

    try {
      const formulario = new FormData();
      Object.entries({ ...dados, prioridade }).forEach(([chave, valor]) =>
        formulario.append(chave, valor)
      );

      if (imagem) formulario.append("imagem", imagem);

      console.log("Dados para a API:", Object.fromEntries(formulario));
      alert("Formulário preenchido! Conecte a API para salvar a ocorrência.");
    } catch (erro) {
      console.error("Erro ao registrar:", erro);
      alert("Não foi possível registrar a ocorrência.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className={styles.pagina}>
      <header className={styles.header}>
        <button className={styles.botaoMenu} onClick={() => setMenuAberto(!menuAberto)}>
          {menuAberto ? "✕" : "☰"}
        </button>
        <div className={styles.logo}>
          <span className={styles.logoIcone} /> OROSCORP
        </div>
        <button className={styles.botaoVoltar} onClick={() => router.back()}>←</button>
      </header>

      {menuAberto && (
        <>
          <button className={styles.fundoMenu} onClick={() => setMenuAberto(false)} />
          <aside className={`${styles.sidebar} ${styles.sidebarAberta}`}>
            <h3>🟠 CENTRAL</h3>
            <nav>
              <a href="/home">▦ DASHBOARD</a>
              <a href="/setores">▦ SETORES</a>
              <a href="/cameras">▱ CÂMERAS</a>
              <a href="/ocorrencias" className={styles.linkSelecionado}>△ OCORRÊNCIAS</a>
              <a href="/funcionarios">♙ FUNCIONÁRIOS</a>
              <p>CADASTROS</p>
              <a href="/cadastrarSetor">♟ SETOR</a>
              <a href="/cadastrarGestor">♙ GESTOR</a>
              <a href="/cadastrarFuncionario">♟ FUNCIONÁRIOS</a>
            </nav>
            <div className={styles.usuario}>
              <strong>Administrador</strong>
              <small>Conta administrativa</small>
            </div>
          </aside>
        </>
      )}

      <section className={form.conteudo}>
        <div className={form.cabecalhoPagina}>
          <h1>Registrar ocorrência</h1>
          <p>Registre uma não conformidade com EPIs.</p>
        </div>

        <form className={form.painel} onSubmit={registrar}>
          <div className={form.campos}>
            {[
              ["funcionario", "Funcionário", "text"],
              ["setor", "Setor", "text"],
              ["camera", "Câmera", "text"],
              ["tipo", "Tipo de ocorrência", "text"],
              ["data", "Data", "date"],
              ["hora", "Hora", "time"],
            ].map(([nome, rotulo, tipo]) => (
              <div className={form.campo} key={nome}>
                <label htmlFor={nome}>{rotulo}{nome !== "camera" && " *"}</label>
                <input
                  id={nome}
                  name={nome}
                  type={tipo}
                  value={dados[nome]}
                  onChange={atualizar}
                  required={nome !== "camera"}
                />
              </div>
            ))}

            <div className={form.campo}>
              <label>Prioridade</label>
              <div className={form.prioridades}>
                {["Baixa", "Média", "Alta", "Crítica"].map((p) => (
                  <button
                    type="button"
                    key={p}
                    className={`${form.botaoPrioridade} ${prioridade === p ? form.prioridadeAtiva : ""}`}
                    onClick={() => setPrioridade(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className={form.campo}>
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={dados.status} onChange={atualizar}>
                <option value="Aberta">Aberta</option>
                <option value="Em análise">Em análise</option>
                <option value="Resolvida">Resolvida</option>
                <option value="Aguardando identificação">Aguardando identificação</option>
              </select>
            </div>

            <div className={`${form.campo} ${form.larguraTotal}`}>
              <label htmlFor="descricao">Descrição</label>
              <textarea
                id="descricao"
                name="descricao"
                rows={4}
                placeholder="Descreva o que aconteceu..."
                value={dados.descricao}
                onChange={atualizar}
              />
            </div>

            <div className={`${form.campo} ${form.larguraTotal}`}>
              <label htmlFor="imagem">Imagem da ocorrência</label>
              <input
                id="imagem"
                type="file"
                accept="image/*"
                onChange={(e) => setImagem(e.target.files[0])}
              />
            </div>
          </div>

          <div className={form.acoes}>
            <button type="button" className={form.botaoCancelar} onClick={() => router.push("/ocorrencias")}>
              Cancelar
            </button>
            <button type="submit" className={form.botaoRegistrar} disabled={enviando}>
              {enviando ? "Enviando..." : "Registrar ocorrência"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}