"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Shell from "../components/Shell";
import s from "../style/novas.module.css";

export default function Funcionarios() {
  const router = useRouter();

  const [busca, setBusca] = useState("");
  const [setor, setSetor] = useState("");
  const [situacao, setSituacao] = useState("");

  const [setores, setSetores] = useState([]);
  const [status, setStatus] = useState([]);
  const [funcionario, setFuncionario] = useState([]);

  const [filtros, setFiltros] = useState({
    status: "",
    setor: ""
  });

  const extrairLista = (resJson) => {
    if (!resJson) return [];
    return (
      resJson.response?.dados ||
      resJson.dados ||
      resJson.response ||
      resJson.content ||
      (Array.isArray(resJson) ? resJson : [])
    );
  };

  // Filtro completo na tabela
  const listaFiltrada = funcionario.filter((item) => {
    const texto = `${item.id} ${item.nome} ${item.status} ${item.setor}`.toLowerCase();
    const correspondeBusca = texto.includes(busca.toLowerCase());
    const correspondeStatus = !filtros.status || item.status_funcionario === filtros.status;
    const correspondeSetor = !filtros.setor || item.setor === filtros.status;
  

    return (
      correspondeBusca &&
      correspondeStatus &&
      correspondeSetor

    );
  });

  useEffect(() => {
    async function carregarDependencias() {
      try {
        const [resFuncionario, resSetor, resStat] = await Promise.all([
          fetch("/api/funcionario/dados"),
          fetch("/api/setor"),
          fetch("/api/funcionario/status_funcionario")
        ]);

        if (resFuncionario.ok) setFuncionario(extrairLista(await resFuncionario.json()));
        if (resSetor.ok) setSetores(extrairLista(await resSetor.json()));
        if (resStat.ok) setStatus(extrairLista(await resStat.json()));


      } catch (erro) {
        console.error("Erro ao carregar dependências da ocorrência:", erro);
      }
    }
    carregarDependencias();
  }, []);




  const lista = funcionario.filter((f) =>
    (f.nome || "").toLowerCase().includes(busca.toLowerCase()) &&
    (!setor || f.setor === setor) &&
    (!situacao || f.situacao === situacao)
  );

  return (
    <Shell>


      <h1 className={s.titulo}>▏FUNCIONÁRIOS</h1>
      <p className={s.sub}>
        Cadastro de colaboradores, conformidade de EPIs e histórico de ocorrências.
      </p>

      <div className={s.painel}>
        <div className={s.linha}>
          <input
            className={s.busca}
            style={{ flex: 2 }}
            placeholder="⌕ Buscar por nome, matrícula ou cargo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select
            className={s.busca}
            style={{ flex: 1 }}
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
          >

            <option value="">Todos os setores</option>
            {setores.map((setor) => (
              <option key={setor.id} value={setor.id}>{setor.nome}</option>
            ))}
          </select>
          <select
            className={s.busca}
            style={{ flex: 1 }}
            value={situacao}
            onChange={(e) => setSituacao(e.target.value)}
          >
            <option value="">Todas as situações</option>
            {status.map((status) => (
              <option key={status.id} value={status.id}>{status.status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={s.painel}>
        <div className={s.linha}>
          <small>{lista.length} FUNCIONÁRIOS ENCONTRADOS</small>
          <button
            className={s.botao}
            onClick={() => router.push("/cadastrarFuncionario")}
          >
            + CADASTRAR FUNCIONÁRIO
          </button>
        </div>

        <div className={s.rolagem}>
          <table className={s.tabela}>
            <thead>
              <tr>
                {[
                  "Funcionário",
                  "Matrícula",
                  "Cargo",
                  "Setor",
                  "Situação",
                  "Ocorr. abertas",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.length ? (
                listaFiltrada.map((f) => (
                  <tr
                    key={f.id}
                    onClick={() => router.push(`/funcionarios/${f.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{f.nome}</td>
                    <td>{f.id}</td>
                    <td>{f.cargo}</td>
                    <td>{f.setor}</td>
                    <td>{f.status_funcionario}</td>
                    <td>{f.total_ocorrencia_aberta}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={s.vazio}>
                    Os funcionários da API aparecerão aqui.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}