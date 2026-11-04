"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import styles from "../style/perfilADM.module.css";
  
// Pega as letras iniciais do nome: "Matheus Lucas" -> "ML"
function iniciais(nome = "") {
  const partes = nome.trim().split(" ").filter(Boolean);
  if (!partes.length) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

// Calcula a idade a partir da data de nascimento
function calcularIdade(data) {
  if (!data) return "—";
  const nascimento = new Date(data);
  if (isNaN(nascimento)) return "—";

  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const jaFezAniversario =
    hoje.getMonth() > nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() &&
      hoje.getDate() >= nascimento.getDate());

  if (!jaFezAniversario) idade--;
  return idade;
}

export default function Perfil() {
  const router = useRouter();

  const [perfil, setPerfil] = useState(null);
  const [fotoFalhou, setFotoFalhou] = useState(false);
  const [excluir, setExcluir] = useState(false);

  // Lista de funcionários do setor. Vai vir da API.
  // Cada item deve ter: id, nome, cargo, status, ocorrencias
  const funcionarios = [];

  // Busca os dados de quem está logado
  useEffect(() => {
    fetch("/api/perfilToken", { cache: "no-store" })
      .then((resposta) => (resposta.ok ? resposta.json() : null))
      .then((dados) => setPerfil(dados?.usuario ?? null))
      .catch(() => setPerfil(null));
  }, []);

  const nome = perfil?.nome || "Administrador";
  const fotoUrl = perfil?.foto?.startsWith("https://") ? perfil.foto : null;
  const codigo = perfil?.id ? `#${String(perfil.id).padStart(5, "0")}` : "#—";

  return (
    <Shell>
      {/* ===== CARTÃO DO TOPO ===== */}
      <section className={`${styles.painel} ${styles.topo}`}>
        {fotoUrl && !fotoFalhou ? (
          <img
            src={fotoUrl}
            alt={`Foto de ${nome}`}
            className={styles.foto}
            onError={() => setFotoFalhou(true)}
          />
        ) : (
          <div className={`${styles.foto} ${styles.fotoVazia}`}>
            {iniciais(nome)}
          </div>
        )}

        <div>
          <h1 className={styles.nome}>{nome}</h1>
          <p className={styles.descricao}>
            {perfil?.descricao || "Conta administrativa"}
          </p>
        </div>
      </section>

      {/* ===== FUNCIONÁRIOS DO SETOR ===== */}
      <section className={styles.painel}>
        <h3 className={styles.secao}>FUNCIONÁRIOS DO SETOR</h3>

        <div className={styles.rolagem}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Status</th>
                <th>Ocorrências</th>
              </tr>
            </thead>

            <tbody>
              {funcionarios.length ? (
                funcionarios.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <div className={styles.pessoa}>
                        <span className={styles.avatar}>{iniciais(f.nome)}</span>
                        <span>{f.nome}</span>
                      </div>
                    </td>
                    <td>{f.cargo}</td>
                    <td>
                      <span className={styles.badge}>● {f.status}</span>
                    </td>
                    <td>
                      <span className={styles.contador}>{f.ocorrencias}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className={styles.vazio}>
                    Os funcionários do setor aparecerão aqui.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== INFORMAÇÕES ===== */}
      <section className={styles.painel}>
        <h3 className={styles.secao}>INFORMAÇÕES</h3>

        <div className={styles.infoCard}>
          <div>
            <div className={styles.infoTopo}>
              <span className={styles.codigo}>{codigo}</span>
              <span className={styles.tag}>{perfil?.nivel_acesso || "ADM"}</span>
            </div>

            <p className={styles.infoTexto}>
              <strong>Nome:</strong> {nome}
              <br />
              <strong>Idade:</strong> {calcularIdade(perfil?.data_nascimento)}
              <br />
              <strong>CPF:</strong> {perfil?.cpf || "—"}
              <br />
              <strong>E-mail:</strong> {perfil?.email || "—"}
            </p>
          </div>

          <span className={styles.badge}>● ATIVO</span>
        </div>
      </section>

      {/* ===== BOTÕES ===== */}
      <div className={styles.acoes}>
        <button
          type="button"
          className={styles.editar}
          onClick={() => router.push("/atualizarPerfil")}
        >
          Editar conta
        </button>

        <button
          type="button"
          className={styles.deletar}
          onClick={() => setExcluir(true)}
        >
          Deletar conta
        </button>
      </div>

      {/* ===== CONFIRMAR EXCLUSÃO ===== */}
      {excluir && (
        <div className={styles.modalFundo} onClick={() => setExcluir(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p>TEM CERTEZA QUE DESEJA DELETAR SUA CONTA?</p>

            <div className={styles.modalBotoes}>
              <button
                type="button"
                className={styles.deletar}
                onClick={() => alert("A exclusão precisa ser conectada à API.")}
              >
                CONFIRMAR
              </button>

              <button
                type="button"
                className={styles.negar}
                onClick={() => setExcluir(false)}
              >
                NEGAR
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}