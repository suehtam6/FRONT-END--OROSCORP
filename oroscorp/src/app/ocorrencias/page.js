
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import styles from "../style/ocorrencias.module.css";

export default function Ocorrencias() {
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState({
    status: "", origem: "", setor: "", prioridade: "", tipo: ""
  });

  function alterarFiltro(e) {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  }

  const listaFiltrada = ocorrencias.filter((item) => {
    const texto = `${item.id} ${item.funcionario} ${item.tipo}`.toLowerCase();
    const correspondeBusca = texto.includes(busca.toLowerCase());
    const correspondeFiltros = Object.entries(filtros).every(
      ([campo, valor]) => !valor || item[campo] === valor
    );
    return correspondeBusca && correspondeFiltros;
  });

  return (
    <Shell><section className={styles.conteudo}>
        <div className={styles.tituloPagina}>
          <div>
            <h1>Ocorrências</h1>
            <p>Todas as detecções de EPI e registros manuais de não conformidade com EPIs.</p>
          </div>
          <button
            className={styles.registrar}
            onClick={() => router.push("/cadastrarOcorrencia")}
          >
            + Registrar ocorrência
          </button>
        </div>

        <div className={styles.painelFiltros}>
          <h3>⚑ Filtros</h3>

          <div className={styles.filtros}>
            <input
              type="search"
              placeholder="⌕ Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            {[
              ["status", "Todos os status", ["Aberta", "Em análise", "Resolvida", "Aguardando identificação"]],
              ["origem", "Todas as origens", ["IA", "Manual"]],
              ["setor", "Todos os setores", ["Produção", "Montagem", "Manutenção", "Soldagem"]],
              ["prioridade", "Todas as prioridades", ["Baixa", "Média", "Alta", "Crítica"]],
              ["tipo", "Todos os tipos", ["Ausência de capacete", "Ausência de luvas", "Ausência de colete"]]
            ].map(([nome, titulo, opcoes]) => (
              <select
                key={nome}
                name={nome}
                value={filtros[nome]}
                onChange={alterarFiltro}
              >
                <option value="">{titulo}</option>
                {opcoes.map((opcao) => (
                  <option key={opcao} value={opcao}>{opcao}</option>
                ))}
              </select>
            ))}
          </div>
        </div>

        <div className={styles.painelTabela}>
          <p className={styles.quantidade}>
            {listaFiltrada.length} ocorrências
          </p>

          <div className={styles.tabelaScroll}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>FUNCIONÁRIO</th>
                  <th>TIPO</th>
                  <th>SETOR</th>
                  <th>ORIGEM</th>
                  <th>PRIORIDADE</th>
                  <th>STATUS</th>
                  <th>DATA / HORA</th>
                </tr>
              </thead>

              <tbody>
                {listaFiltrada.length > 0 ? (
                  listaFiltrada.map((item) => (
                    <tr key={item.id}>
                      <td className={styles.id}>#{item.id}</td>
                      <td>{item.funcionario}</td>
                      <td>{item.tipo}</td>
                      <td>{item.setor}</td>
                      <td><span className={styles.etiqueta}>{item.origem}</span></td>
                      <td><span className={styles.etiqueta}>{item.prioridade}</span></td>
                      <td><span className={styles.etiqueta}>{item.status}</span></td>
                      <td>{item.data} {item.hora}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className={styles.vazio}>
                      Nenhuma ocorrência encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Shell>
  );
}
