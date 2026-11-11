"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import s from "../style/novas.module.css";

// Aceita vários formatos de resposta da API e sempre devolve um array
const extrairLista = (resJson) => {
  if (!resJson) return [];
  const lista =
    resJson.response?.dados ||
    resJson.dados ||
    resJson.response ||
    resJson.content ||
    resJson;
  return Array.isArray(lista) ? lista : [];
};

const normalizar = (v) => String(v ?? "").toLowerCase();

export default function Funcionarios() {
  const router = useRouter();

  const [busca, setBusca] = useState("");
  const [setor, setSetor] = useState(""); // nome do setor selecionado
  const [situacao, setSituacao] = useState(""); // nome do status selecionado

  const [setores, setSetores] = useState([]);
  const [status, setStatus] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const [resFunc, resSetor, resStat] = await Promise.all([
          fetch("/api/funcionario/dados"),
          fetch("/api/setor"),
          fetch("/api/funcionario/status_funcionario"),
        ]);

        if (resFunc.ok) {
          setFuncionarios(extrairLista(await resFunc.json()));
        } else {
          const r = await resFunc.json().catch(() => ({}));
          setErro(r.message || `Erro ${resFunc.status} ao buscar funcionários.`);
        }
        if (resSetor.ok) setSetores(extrairLista(await resSetor.json()));
        if (resStat.ok) setStatus(extrairLista(await resStat.json()));
      } catch (e) {
        console.error("Erro ao carregar funcionários:", e);
        setErro("Não foi possível conectar ao servidor.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  // Um único filtro (antes existiam dois, e o da tabela comparava o campo errado)
  const lista = funcionarios.filter((f) => {
    const texto = `${f.id} ${f.nome} ${f.cargo} ${f.setor} ${f.status_funcionario}`;
    return (
      normalizar(texto).includes(normalizar(busca)) &&
      (!setor || f.setor === setor) &&
      (!situacao || f.status_funcionario === situacao)
    );
  });

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
            {setores.map((st) => (
              <option key={st.id} value={st.nome}>{st.nome}</option>
            ))}
          </select>
          <select
            className={s.busca}
            style={{ flex: 1 }}
            value={situacao}
            onChange={(e) => setSituacao(e.target.value)}
          >
            <option value="">Todas as situações</option>
            {status.map((stt) => (
              <option key={stt.id} value={stt.status}>{stt.status}</option>
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
            cadastrar funcionario
          </button>
        </div>

        <div className={s.rolagem}>
          <table className={s.tabela}>
            <thead>
              <tr>
                {["Funcionário", "Matrícula", "Cargo", "Setor", "Situação", "Ocorr. abertas"].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.length ? (
                lista.map((f) => (
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
                  <td colSpan="6" className={s.vazio}>
                    {carregando
                      ? "Carregando funcionários..."
                      : erro || "Nenhum funcionário encontrado."}
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