"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import Popup from "../components/Popup";
import styles from "../style/funcionario.module.css";

function extrairLista(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.response?.dados)) return json.response.dados;
  if (Array.isArray(json?.response)) return json.response;
  if (Array.isArray(json?.dados)) return json.dados;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

export default function FuncionariosPage() {
  const router = useRouter();

  const [funcionarios, setFuncionarios] = useState([]);
  const [setores, setSetores] = useState([]);
  const [statusFuncionarioLista, setStatusFuncionarioLista] = useState([]);
  const [busca, setBusca] = useState("");
  const [setorFiltro, setSetorFiltro] = useState("");
  const [situacaoFiltro, setSituacaoFiltro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [resFunc, resSetor, resStat] = await Promise.all([
          fetch("/api/funcionario/dados", { headers }),
          fetch("/api/setor", { headers }),
          fetch("/api/funcionario/status_funcionario", { headers }),
        ]);

        if (resFunc.ok) {
          setFuncionarios(extrairLista(await resFunc.json()));
        } else {
          const r = await resFunc.json().catch(() => ({}));
          setErro(r.message || `Erro ${resFunc.status} ao buscar funcionários.`);
        }

        if (resSetor.ok) setSetores(extrairLista(await resSetor.json()));
        if (resStat.ok) setStatusFuncionarioLista(extrairLista(await resStat.json()));
      } catch (e) {
        console.error("Erro ao carregar funcionários:", e);
        setErro("Não foi possível conectar ao servidor.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const obterIniciais = (nome) => {
    if (!nome) return "?";
    const partes = nome.trim().split(" ");
    if (partes.length === 1) return partes[0][0].toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  const obterNomeCargo = (func) => {
    if (Array.isArray(func.cargo) && func.cargo.length > 0) {
      return func.cargo[0].cargo || func.cargo[0].nome || "Não informado";
    }
    if (typeof func.cargo === "string" && func.cargo.trim() !== "") return func.cargo;
    return func.funcao || "Não informado";
  };

  const obterNomeSetor = (func) => {
    if (Array.isArray(func.setor) && func.setor.length > 0) {
      return func.setor[0].nome || "Sem setor";
    }
    if (func.setor?.nome) return func.setor.nome;
    if (typeof func.setor === "string" && func.setor.trim() !== "") return func.setor;

    const setorEncontrado = setores.find(
      (s) => Number(s.id || s.id_setor) === Number(func.id_setor)
    );
    return setorEncontrado?.nome || setorEncontrado?.descricao || "Sem setor";
  };

  const obterStatusFuncionario = (func) => {
    let texto = "";
    let statusId = func.id_status_funcionario ?? null;

    if (Array.isArray(func.status_funcionario) && func.status_funcionario.length > 0) {
      const st = func.status_funcionario[0];
      texto = st.status || st.nome || "";
      statusId = st.id ?? statusId;
    } else if (func.status_funcionario && typeof func.status_funcionario === "object") {
      texto = func.status_funcionario.status || func.status_funcionario.nome || "";
      statusId = func.status_funcionario.id ?? statusId;
    } else if (typeof func.status_funcionario === "string") {
      texto = func.status_funcionario;
    }

    if (!texto && statusId !== null) {
      const encontrado = statusFuncionarioLista.find(
        (s) => Number(s.id || s.id_status_funcionario) === Number(statusId)
      );
      texto = encontrado?.status || encontrado?.nome || "";
    }

    const textoFinal = String(texto || "Inativo").trim();
    const ativo =
      textoFinal.toLowerCase() === "ativo" || Number(statusId) === 1;

    return {
      texto: textoFinal,
      ativo,
    };
  };

  const opcoesSetores =
    setores.length > 0
      ? setores.map((s) => s.nome || s.descricao).filter(Boolean)
      : [...new Set(funcionarios.map((f) => obterNomeSetor(f)).filter((n) => n !== "Sem setor"))];

  const opcoesSituacoes =
    statusFuncionarioLista.length > 0
      ? statusFuncionarioLista.map((st) => st.status || st.nome).filter(Boolean)
      : ["Ativo", "Inativo"];

  const funcionariosFiltrados = funcionarios.filter((func) => {
    const termo = busca.trim().toLowerCase();
    const nome = (func.nome || "").toLowerCase();
    const matricula = String(func.matricula || func.id || func.id_funcionario || "").toLowerCase();
    const cargo = obterNomeCargo(func).toLowerCase();

    const bateBusca =
      !termo ||
      nome.includes(termo) ||
      matricula.includes(termo) ||
      cargo.includes(termo);

    const nomeSetor = obterNomeSetor(func);
    const bateSetor =
      !setorFiltro ||
      nomeSetor.trim().toLowerCase() === setorFiltro.trim().toLowerCase();

    const statusFunc = obterStatusFuncionario(func);
    const bateSituacao =
      !situacaoFiltro ||
      statusFunc.texto.trim().toLowerCase() === situacaoFiltro.trim().toLowerCase();

    return bateBusca && bateSetor && bateSituacao;
  });

  return (
    <Shell>
      <main className={styles.conteudo}>
        <h1 className={styles.titulo}>| FUNCIONÁRIOS</h1>
        <p className={styles.sub}>
          Cadastro de colaboradores, conformidade de EPIs e histórico de ocorrências.
        </p>

        <div className={`${styles.painel} ${styles.painelTopo}`}>
          <div className={styles.barraFiltros}>
            <input
              type="text"
              className={styles.busca}
              placeholder="Buscar por nome, matrícula ou cargo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            <select
              className={styles.filtroSelect}
              value={setorFiltro}
              onChange={(e) => setSetorFiltro(e.target.value)}
            >
              <option value="">Todos os setores</option>
              {opcoesSetores.map((nomeSetor, idx) => (
                <option key={idx} value={nomeSetor}>
                  {nomeSetor}
                </option>
              ))}
            </select>

            <select
              className={styles.filtroSelect}
              value={situacaoFiltro}
              onChange={(e) => setSituacaoFiltro(e.target.value)}
            >
              <option value="">Todas as situações</option>
              {opcoesSituacoes.map((nomeSituacao, idx) => (
                <option key={idx} value={nomeSituacao}>
                  {nomeSituacao}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.painel}>
          <div className={styles.cabecalhoTabela}>
            <span className={styles.contadorResultados}>
              {funcionariosFiltrados.length}{" "}
              {funcionariosFiltrados.length === 1
                ? "FUNCIONÁRIO ENCONTRADO"
                : "FUNCIONÁRIOS ENCONTRADOS"}
            </span>

            <button
              type="button"
              className={styles.botao}
              onClick={() => router.push("/cadastrarFuncionario")}
            >
              + Cadastrar funcionário
            </button>
          </div>

          <div className={styles.rolagem}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Matrícula</th>
                  <th>Cargo</th>
                  <th>Setor</th>
                  <th>Situação</th>
                  <th>Ocorr. Abertas</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={6} className={styles.vazio}>
                      Carregando funcionários...
                    </td>
                  </tr>
                ) : funcionariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.vazio}>
                      Nenhum funcionário encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  funcionariosFiltrados.map((func) => {
                    const id = func.id || func.id_funcionario;
                    const cargoNome = obterNomeCargo(func);
                    const setorNome = obterNomeSetor(func);
                    const statusFunc = obterStatusFuncionario(func);
                    const ocorrenciasAbertas =
                      func.ocorrencias_abertas ?? func.total_ocorrencias ?? func.ocorrencias ?? 0;

                    return (
                      <tr
                        key={id}
                        onClick={() => router.push(`/funcionarios/${id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <div className={styles.perfilRow}>
                            {func.foto ? (
                              <img
                                src={func.foto}
                                alt={func.nome}
                                className={styles.avatar}
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <span className={styles.avatar}>
                                {obterIniciais(func.nome)}
                              </span>
                            )}
                            <span>{func.nome}</span>
                          </div>
                        </td>
                        <td>{func.matricula || id}</td>
                        <td>{cargoNome}</td>
                        <td>
                          <span className={styles.badgePequeno}>{setorNome}</span>
                        </td>
                        <td>
                          <span
                            className={`${styles.badgeContainer} ${
                              statusFunc.ativo ? styles.badgeVerde : styles.badgeVermelho
                            }`}
                          >
                            <span className={styles.dot} />
                            {statusFunc.texto}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              Number(ocorrenciasAbertas) > 0
                                ? styles.laranja
                                : undefined
                            }
                            style={{ fontWeight: "bold" }}
                          >
                            {ocorrenciasAbertas}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
      </main>
    </Shell>
  );
}