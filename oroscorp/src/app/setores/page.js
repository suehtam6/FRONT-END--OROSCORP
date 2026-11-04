"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import Shell from "../components/Shell.js";
import styles from "../style/setores.module.css";

function Icone({ tipo }) {
  if (tipo === "funcionarios") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="7" r="3" />
        <path d="M3 19v-2a6 6 0 0 1 12 0v2H3Z" />
        <path d="M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5h-3" />
      </svg>
    );
  }

  if (tipo === "cameras") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="6" width="13" height="12" rx="2" />
        <path d="m16 10 5-3v10l-5-3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 22 20H2L12 3Z" />
      <path d="M12 9v5m0 3v.1" />
    </svg>
  );
}

function Indicador({ tipo, valor, legenda }) {
  return (
    <div className={styles.indicador}>
      <span
        className={`${styles.icone} ${
          tipo === "alertas" ? styles.iconeAlerta : ""
        }`}
      >
        <Icone tipo={tipo} />
      </span>

      <strong
        className={tipo === "alertas" ? styles.valorAlerta : ""}
      >
        {valor}
      </strong>

      <span className={styles.legenda}>{legenda}</span>
    </div>
  );
}

export default function Setores() {
  const router = useRouter();

  const [listaSetores, setListaSetores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const mapearSetorBD = (item) => ({
    id: item.ID_setor || item.id,
    nome: item.Nome_setor || "Sem nome",
    descricao: item.Descricao_setor || "Sem descrição disponível.",
    funcionarios: item.Total_funcionarios ?? 0,
    cameras: item.Total_cameras ?? 0,
    abertas: item.Total_ocorrencias_abertas ?? 0,
  });

  useEffect(() => {
    async function carregarSetores() {
      setCarregando(true);
      setErro("");
      try {
        const res = await fetch("/api/setor/dados");
        if (res.ok) {
          const json = await res.json();
          
          let dadosBrutos = [];
          if (Array.isArray(json)) {
            dadosBrutos = json;
          } else if (json.response?.ocorrencia) {
            dadosBrutos = json.response.ocorrencia;
          } else if (json.response?.dados) {
            dadosBrutos = json.response.dados;
          } else if (json.dados) {
            dadosBrutos = json.dados;
          }

          const dadosFormatados = dadosBrutos.map(mapearSetorBD);
          
          // Remove duplicados caso a API traga o mesmo setor repetido
          const setoresUnicos = Array.from(new Map(dadosFormatados.map(item => [item.id, item])).values());
          
          setListaSetores(setoresUnicos);
        } else {
          setErro("Erro ao carregar setores.");
        }
      } catch (err) {
        setErro("Erro na comunicação com a API de setores.");
      } finally {
        setCarregando(false);
      }
    }

    carregarSetores();
  }, []);

  const registrar = (e) => {
    e.preventDefault();
    router.push("/cadastrarSetor");
  };

  const verDetalhesSetor = (id) => {
    router.push(`/setores/${id}`);
  };

  return (
    <Shell>
      <section className={styles.conteudo}>
        <div className={styles.topoConteudo}>
          <div>
            <h1>Setores</h1>
            <p>
              Áreas monitoradas da planta industrial e seus
              indicadores de segurança.
            </p>
          </div>

          <button onClick={registrar} className={styles.botaoCadastrar}>
            <span>+</span> Registrar novo setor
          </button>
        </div>

        {carregando ? (
          <div style={{ color: "#fff", padding: "2rem", textAlign: "center" }}>
            A carregar setores...
          </div>
        ) : erro ? (
          <div style={{ color: "#ff4d4d", padding: "2rem", textAlign: "center" }}>
            {erro}
          </div>
        ) : (
          <div className={styles.grade}>
            {listaSetores.length > 0 ? (
              listaSetores.map((setor, index) => (
                /* A chave agora usa o index para evitar o erro do Next.js */
                <article className={styles.card} key={setor.id}>
                  <h2>{setor.nome}</h2>

                  <p className={styles.descricao}>
                    {setor.descricao}
                  </p>

                  <div className={styles.indicadores}>
                    <Indicador
                      tipo="funcionarios"
                      valor={setor.funcionarios}
                      legenda="Funcionários"
                    />

                    <Indicador
                      tipo="cameras"
                      valor={setor.cameras}
                      legenda="Câmeras"
                    />

                    <Indicador
                      tipo="alertas"
                      valor={setor.abertas}
                      legenda="Abertas"
                    />
                  </div>

                  <button 
                    className={styles.botaoVer}
                    onClick={() => verDetalhesSetor(setor.id)}
                  >
                    Ver setor <span>›</span>
                  </button>
                </article>
              ))
            ) : (
              <div style={{ color: "#aaa", padding: "2rem", gridColumn: "1 / -1", textAlign: "center" }}>
                Nenhum setor cadastrado.
              </div>
            )}
          </div>
        )}
      </section>
    </Shell>
  );
}