/*
  Autor: Matheus Lucas
  Objetivo: Tela de detalhes da ocorrência, com dados e perfil do funcionário vindos da API
  Data: 10/11/2026
*/

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "../../components/Shell";
import Popup from "../../components/Popup";
import styles from "../../style/detalhesOcorrencia.module.css";

function formatarData(dataStr) {
  if (!dataStr) return { data: "--/--/----", hora: "--:--:--" };
  const d = new Date(dataStr);
  if (isNaN(d.getTime())) return { data: dataStr, hora: "--:--:--" };
  const p = (n) => String(n).padStart(2, "0");
  return {
    data: `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`,
    hora: `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`,
  };
}

function iniciais(nome) {
  if (!nome) return "?";
  const partes = nome.trim().split(" ").filter(Boolean);
  const primeira = partes[0]?.[0] || "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

function classeStatus(status = "") {
  const s = status.toLowerCase();
  if (s.includes("fech")) return styles.statusFechada;
  if (s.includes("andamento") || s.includes("anális")) return styles.statusAnalise;
  return styles.statusAberta;
}

function classePrioridade(prioridade = "") {
  const p = prioridade.toUpperCase();
  if (p === "ALTA") return styles.prioAlta;
  if (p === "BAIXA") return styles.prioBaixa;
  return styles.prioMedia;
}

function formatarPrioridade(prioridade = "") {
  const p = prioridade.toLowerCase();
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function extrairOcorrencia(json) {
  const r = json?.response;
  if (!r) return null;
  if (Array.isArray(r.ocorrencia)) return r.ocorrencia[0] || null;
  if (Array.isArray(r.dados)) return r.dados[0] || null;
  if (r.ocorrencia && typeof r.ocorrencia === "object") return r.ocorrencia;
  return null;
}

export default function DetalhesOcorrencia() {
  const { id } = useParams();
  const router = useRouter();

  const [ocorrencia, setOcorrencia] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!id) return;

    async function carregar() {
      setCarregando(true);
      setErro("");
      try {
        const res = await fetch(`/api/ocorrencia/${id}`);
        console.log(res)
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setErro(json.message || "Erro ao carregar a ocorrência.");
          return;
        }

        const item = extrairOcorrencia(json);
        if (!item) {
          setErro("Ocorrência não encontrada.");
          return;
        }
        setOcorrencia(item);
      } catch {
        setErro("Erro de conexão ao carregar a ocorrência.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [id]);

  if (carregando) {
    return (
      <Shell>
        <section className={styles.conteudo}>
          <p className={styles.carregando}>Carregando ocorrência...</p>
        </section>
      </Shell>
    );
  }

  if (!ocorrencia) {
    return (
      <Shell>
        <section className={styles.conteudo}>
          <button className={styles.botaoVoltar} onClick={() => router.push("/ocorrencias")}>
            ← Voltar para ocorrências
          </button>
          <p className={styles.carregando}>Ocorrência não encontrada.</p>
          <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
        </section>
      </Shell>
    );
  }

  const o = ocorrencia;
  const { data, hora } = formatarData(o.data_hora || o.Data_ocorrencia);
  const temFuncionario = Boolean(o.ID_funcionario);
  const fechada = (o.Status_ocorrencia || "").toLowerCase().includes("fech");
  const idFormatado = String(o.ID_ocorrencia).padStart(5, "0");

  const infos = [
    { rotulo: "Tipo", valor: o.Motivo_ocorrencia },
    { rotulo: "EPI", valor: o.Nome_EPI },
    { rotulo: "Categoria do EPI", valor: o.Categoria_EPI },
    { rotulo: "Cor do EPI", valor: o.Cor_EPI },
    { rotulo: "Setor", valor: o.Nome_setor },
    { rotulo: "Local do setor", valor: o.Local_setor },
    { rotulo: "Câmera", valor: o.Nome_camera },
    { rotulo: "Data", valor: data },
    { rotulo: "Horário", valor: hora },
  ].filter((i) => i.valor);

  return (
    <Shell>
      <section className={styles.conteudo}>
        <button className={styles.botaoVoltar} onClick={() => router.push("/ocorrencias")}>
          ← Voltar para ocorrências
        </button>

        <div className={styles.tituloPagina}>
          <h1>Detalhes da ocorrência</h1>
          <span className={styles.idOcorrencia}>#{idFormatado}</span>
        </div>

        <div className={styles.barraTags}>
          <span className={`${styles.tag} ${classeStatus(o.Status_ocorrencia)}`}>
            <i className={styles.ponto} /> {(o.Status_ocorrencia || "").toUpperCase()}
          </span>
          <span className={styles.tag}>{o.origem_ocorrencia}</span>
          <span className={`${styles.tagPrioridade} ${classePrioridade(o.prioridade_ocorrencia)}`}>
            <i className={styles.ponto} /> {formatarPrioridade(o.prioridade_ocorrencia)}
          </span>
        </div>

        <div className={styles.grade}>
          <div className={styles.colunaEsquerda}>
            <div className={styles.card}>
              <h4 className={styles.cardTitulo}>
                {temFuncionario ? "FUNCIONÁRIO" : "FUNCIONÁRIO NÃO IDENTIFICADO"}
              </h4>

              <div className={styles.perfil}>
                <div className={styles.avatar}>
                  {temFuncionario ? iniciais(o.Nome_funcionario) : "?"}
                </div>
                <div>
                  <strong>{temFuncionario ? o.Nome_funcionario : "Não identificado"}</strong>
                  <span>
                    {temFuncionario
                      ? [o.Cargo_funcionario, o.ID_funcionario && `Mat. ${String(o.ID_funcionario).padStart(5, "0")}`]
                          .filter(Boolean)
                          .join(" · ")
                      : "Aguardando identificação"}
                  </span>
                </div>
              </div>

              {temFuncionario ? (
                <ul className={styles.listaPerfil}>
                  {o.Email_funcionario && (
                    <li><span>E-mail</span>{o.Email_funcionario}</li>
                  )}
                  {o.CPF_funcionario && (
                    <li><span>CPF</span>{o.CPF_funcionario}</li>
                  )}
                  {o.Data_nascimento_funcionario && (
                    <li>
                      <span>Nascimento</span>
                      {formatarData(o.Data_nascimento_funcionario).data}
                    </li>
                  )}
                  {o.Status_funcionario && (
                    <li><span>Status</span>{o.Status_funcionario}</li>
                  )}
                </ul>
              ) : (
                <>
                  <p className={styles.textoApoio}>
                    Não foi possível identificar automaticamente o funcionário desta ocorrência.
                  </p>
                  <button className={styles.botaoPrimario}>+ Adicionar funcionário</button>
                </>
              )}
            </div>

            <div className={styles.card}>
              <h4 className={styles.cardTituloCinza}>INFORMAÇÕES</h4>
              <div className={styles.gradeInfo}>
                {infos.map((i) => (
                  <div key={i.rotulo} className={styles.infoItem}>
                    <span>{i.rotulo}</span>
                    <strong>{i.valor}</strong>
                  </div>
                ))}
              </div>
            </div>

            {o.Nome_responsavel && (
              <div className={styles.card}>
                <h4 className={styles.cardTituloCinza}>RESPONSÁVEL</h4>
                <div className={styles.perfil}>
                  <div className={styles.avatar}>{iniciais(o.Nome_responsavel)}</div>
                  <div>
                    <strong>{o.Nome_responsavel}</strong>
                    <span>{o.Email_responsavel}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.colunaDireita}>
            <div className={styles.card}>
              <h4 className={styles.cardTitulo}>DESCRIÇÃO</h4>
              <p className={styles.descricao}>
                {o.Descricao_Ocorrencia || "Sem descrição."}
              </p>
            </div>

            {o.Foto_ocorrencia && (
              <div className={styles.card}>
                <h4 className={styles.cardTitulo}>EVIDÊNCIA</h4>
                <div className={styles.moldura}>
                  <img src={o.Foto_ocorrencia} alt="Evidência da ocorrência" />
                </div>
              </div>
            )}

            {o.Descricao_setor && (
              <div className={styles.card}>
                <h4 className={styles.cardTitulo}>SETOR</h4>
                <p className={styles.descricao}>
                  <strong>{o.Nome_setor}</strong> — {o.Descricao_setor}
                </p>
              </div>
            )}

            <div className={styles.acoes}>
              <button className={fechada ? styles.botaoReabrir : styles.botaoFechar}>
                {fechada ? "Reabrir ocorrência" : "Fechar ocorrência"}
              </button>
              <button className={styles.botaoSecundario} onClick={() => window.print()}>
                Exportar PDF
              </button>
            </div>
          </div>
        </div>

        <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
      </section>
    </Shell>
  );
}