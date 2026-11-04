"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import Popup from "../components/Popup";
import styles from "../style/ocorrencias.module.css";

export default function Ocorrencias() {
  const router = useRouter();

  const [ocorrencias, setOcorrencias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  const [filtros, setFiltros] = useState({
    status: "",
    origem: "",
    setor: "",
    prioridade: "",
    tipo: ""
  });


  const formatarData = (dataStr) => {
    if (!dataStr) return "--/--/---- --:--:--";

    const data = new Date(dataStr);
    if (isNaN(data.getTime())) return dataStr;

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    const segundos = String(data.getSeconds()).padStart(2, '0');

    return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
  };


  const MapearProcedure = (item) => {
    return {
      id: item.ID_ocorrencia || item.id,
      funcionario: item.Nome_funcionario || "N/A",
      tipo: item.Motivo_ocorrencia || "Não especificado",
      setor: item.Nome_setor || "N/A",
      origem: item.origem_ocorrencia || "MANUAL",
      prioridade: item.prioridade_ocorrencia || "MÉDIA",
      status: item.Status_ocorrencia || "Aberta",
      descricao: item.Descricao_Ocorrencia || "",
      dataHora: formatarData(item.Data_ocorrencia || item.data_hora),
      raw: item
    };
  };

  useEffect(() => {
    async function carregarOcorrencias() {
      setCarregando(true);
      setErro("");
      try {
        const res = await fetch("/api/ocorrencia/dados");
        if (res.ok) {
          const json = await res.json();
          const listaBruta = json.response?.dados || json.dados || [];
          const listaFormatada = listaBruta.map(MapearProcedure);
          setOcorrencias(listaFormatada);
        } else {
          const err = await res.json().catch(() => ({}));
          setErro(err.message || "Erro ao carregar dados das ocorrências.");
        }
      } catch {
        setErro("Erro de conexão ao carregar ocorrências.");
      } finally {
        setCarregando(false);
      }
    }
    carregarOcorrencias();
  }, []);

  function alterarFiltro(e) {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  }


  const opcoesStatus = [...new Set(ocorrencias.map((o) => o.status))].filter(Boolean);
  const opcoesOrigem = [...new Set(ocorrencias.map((o) => o.origem))].filter(Boolean);
  const opcoesSetor = [...new Set(ocorrencias.map((o) => o.setor))].filter(Boolean);
  const opcoesPrioridade = [...new Set(ocorrencias.map((o) => o.prioridade))].filter(Boolean);
  const opcoesTipo = [...new Set(ocorrencias.map((o) => o.tipo))].filter(Boolean);


  const listaFiltrada = ocorrencias.filter((item) => {
    const texto = `${item.id} ${item.funcionario} ${item.tipo} ${item.setor} ${item.descricao}`.toLowerCase();
    const correspondeBusca = texto.includes(busca.toLowerCase());

    const correspondeStatus       = !filtros.status || item.status === filtros.status;
    const correspondeOrigem       = !filtros.origem || item.origem === filtros.origem;
    const correspondeSetor        = !filtros.setor || item.setor === filtros.setor;
    const correspondePrioridade   = !filtros.prioridade || item.prioridade === filtros.prioridade;
    const correspondeTipo         = !filtros.tipo || item.tipo === filtros.tipo;

    return (
      correspondeBusca &&
      correspondeStatus &&
      correspondeOrigem &&
      correspondeSetor &&
      correspondePrioridade &&
      correspondeTipo
    );
  });

  return (
    <Shell>
      <section className={styles.conteudo}>
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

            <select name="status" value={filtros.status} onChange={alterarFiltro}>
              <option value="">Todos os status</option>
              {opcoesStatus.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>

            <select name="origem" value={filtros.origem} onChange={alterarFiltro}>
              <option value="">Todas as origens</option>
              {opcoesOrigem.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>

            <select name="setor" value={filtros.setor} onChange={alterarFiltro}>
              <option value="">Todos os setores</option>
              {opcoesSetor.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>

            <select name="prioridade" value={filtros.prioridade} onChange={alterarFiltro}>
              <option value="">Todas as prioridades</option>
              {opcoesPrioridade.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>

            <select name="tipo" value={filtros.tipo} onChange={alterarFiltro}>
              <option value="">Todos os tipos</option>
              {opcoesTipo.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
        </div>


        <div className={styles.painelTabela}>
          <p className={styles.quantidade}>
            {carregando ? "Carregando..." : `${listaFiltrada.length} ocorrências`}
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
                {carregando ? (
                  <tr>
                    <td colSpan="8" className={styles.vazio}>
                      Carregando ocorrências...
                    </td>
                  </tr>
                ) : listaFiltrada.length > 0 ? (
                  listaFiltrada.map((item) => (
                    <tr key={item.id}>
                      <td className={styles.id}>#{item.id}</td>
                      <td>{item.funcionario}</td>
                      <td>{item.tipo}</td>
                      <td>{item.setor}</td>
                      <td><span className={styles.etiqueta}>{item.origem}</span></td>
                      <td><span className={styles.etiqueta}>{item.prioridade}</span></td>
                      <td><span className={styles.etiqueta}>{item.status}</span></td>
                      <td>{item.dataHora}</td>
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

        <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
      </section>
    </Shell>
  );
}