"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import Popup from "../components/Popup";
import styles from "../style/perfilADM.module.css";

function iniciais(nome = "") {
  const partes = nome.trim().split(" ").filter(Boolean);
  if (!partes.length) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

function formatarCnpj(valor) {
  if (!valor) return "Não informado";
  const digitos = String(valor).replace(/\D/g, "");
  if (digitos.length === 14) {
    return digitos.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5"
    );
  }
  return valor;
}

function formatarDataNascimento(dataStr) {
  if (!dataStr) return "Não informada";
  const data = new Date(dataStr);
  if (isNaN(data.getTime())) return dataStr;

  const dia = String(data.getUTCDate()).padStart(2, "0");
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const ano = data.getUTCFullYear();
  return `${dia}/${mes}/${ano}`;
}

export default function Perfil() {
  const router = useRouter();

  const [dadosAdm, setDadosAdm] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [excluindo, setExcluindo] = useState(false);
  const [fotoFalhou, setFotoFalhou] = useState(false);
  const [excluir, setExcluir] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarPerfilAdm() {
      setCarregando(true);
      try {
        const [resToken, resAdm] = await Promise.all([
          fetch("/api/perfilToken", { cache: "no-store" }),
          fetch("/api/adm", { cache: "no-store" }),
        ]);

        const jsonToken = resToken.ok ? await resToken.json() : null;
        const jsonAdm = resAdm.ok ? await resAdm.json() : null;

        const usuarioToken = jsonToken?.usuario || null;
        const listaAdms = jsonAdm?.response?.dados || jsonAdm?.dados || [];

        let admEncontrado = null;
        if (Array.isArray(listaAdms) && listaAdms.length > 0) {
          if (usuarioToken?.id) {
            admEncontrado =
              listaAdms.find((item) => {
                const u = Array.isArray(item.usuario)
                  ? item.usuario[0]
                  : item.usuario;
                return (
                  Number(u?.id || item.id_usuario) === Number(usuarioToken.id)
                );
              }) || listaAdms[0];
          } else {
            admEncontrado = listaAdms[0];
          }
        }

        const usuarioAninhado = Array.isArray(admEncontrado?.usuario)
          ? admEncontrado.usuario[0]
          : admEncontrado?.usuario;

        const usuarioFinal = usuarioAninhado || usuarioToken || {};

        const nivelObj = Array.isArray(usuarioFinal.nivel_acesso)
          ? usuarioFinal.nivel_acesso[0]
          : usuarioFinal.nivel_acesso;

        const statusObj = Array.isArray(usuarioFinal.status_conta)
          ? usuarioFinal.status_conta[0]
          : usuarioFinal.status_conta;

        setDadosAdm({
          idAdm: admEncontrado?.id ?? null,
          idUsuario: usuarioFinal?.id ?? usuarioToken?.id ?? null,
          cnpj: admEncontrado?.cnpj || "",
          razaoSocial: admEncontrado?.razao_social || "",
          nome: usuarioFinal?.nome || "Administrador",
          foto: usuarioFinal?.foto || null,
          email: usuarioFinal?.email || "Não informado",
          dataNascimento: usuarioFinal?.data_nascimento || null,
          nivelAcesso:
            nivelObj?.nome ||
            (typeof usuarioFinal?.nivel_acesso === "string"
              ? usuarioFinal.nivel_acesso
              : "ADM"),
          statusConta: statusObj?.status || "Ativo",
        });
      } catch (err) {
        console.error("Erro ao carregar perfil do administrador:", err);
      } finally {
        setCarregando(false);
      }
    }

    carregarPerfilAdm();
  }, []);

  async function confirmarExclusaoConta() {
    if (!dadosAdm?.idAdm) {
      setErro("Não foi possível identificar o administrador para exclusão.");
      setExcluir(false);
      return;
    }

    setExcluindo(true);
    try {
      const res = await fetch(`/api/adm/${dadosAdm.idAdm}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: dadosAdm.idUsuario }),
      });

      if (res.ok) {
        router.push("/");
      } else {
        const json = await res.json().catch(() => ({}));
        setErro(json?.message || "Erro ao excluir a conta.");
        setExcluir(false);
      }
    } catch {
      setErro("Erro de conexão ao tentar excluir a conta.");
      setExcluir(false);
    } finally {
      setExcluindo(false);
    }
  }

  const nome = dadosAdm?.nome || "Administrador";
  const fotoUrl =
    dadosAdm?.foto &&
    !dadosAdm.foto.endsWith("sem-foto.png") &&
    (dadosAdm.foto.startsWith("http") ||
      dadosAdm.foto.startsWith("/") ||
      dadosAdm.foto.startsWith("data:"))
      ? dadosAdm.foto
      : null;

  const codigo = dadosAdm?.idUsuario
    ? `#${String(dadosAdm.idUsuario).padStart(5, "0")}`
    : "#—";

  const isAtivo =
    String(dadosAdm?.statusConta || "Ativo").toLowerCase() === "ativo";

  return (
    <Shell>
      <main className={styles.conteudo}>
        {/* TOPO DA PÁGINA */}
        <div className={styles.cabecalhoPagina}>
          <div>
            <h1 className={styles.tituloPagina}>Perfil da Conta</h1>
            <p className={styles.subtituloPagina}>
              Gerencie os dados cadastrais da empresa, credenciais e configurações da conta administrativa.
            </p>
          </div>

          <button
            type="button"
            className={styles.botaoEditar}
            onClick={() => router.push("/atualizarPerfil")}
          >
            ✎ Editar conta
          </button>
        </div>

        {/* CARTÃO PRINCIPAL DO ADMINISTRADOR */}
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

          <div className={styles.identidade}>
            <div className={styles.badgesTopo}>
              <span className={styles.codigoBadge}>{codigo}</span>
              <span className={styles.tagNivel}>
                {dadosAdm?.nivelAcesso || "ADM"}
              </span>
              <span className={styles.badgeAtivo}>
                <span className={styles.pontoAtivo} />
                {isAtivo ? "Conta Ativa" : dadosAdm?.statusConta}
              </span>
            </div>

            <h2 className={styles.nome}>
              {carregando ? "Carregando..." : nome}
            </h2>
            <p className={styles.descricao}>
              {dadosAdm?.razaoSocial
                ? `Empresa vinculada: ${dadosAdm.razaoSocial}`
                : "Responsável pela gestão de setores, colaboradores, câmeras e conformidade de EPIs."}
            </p>
          </div>
        </section>

        {/* INFORMAÇÕES CADASTRAIS */}
        <section className={styles.painel}>
          <div className={styles.cabecalhoSecao}>
            <h3 className={styles.secao}>INFORMAÇÕES DA CONTA</h3>
            <span className={styles.hintSecao}>
              Dados da tabela administrador e usuário
            </span>
          </div>

          <div className={styles.gradeInfo}>
            <div className={styles.campoInfo}>
              <span className={styles.rotulo}>Nome do responsável</span>
              <strong className={styles.valor}>
                {carregando ? "—" : nome}
              </strong>
            </div>

            <div className={styles.campoInfo}>
              <span className={styles.rotulo}>Razão Social</span>
              <strong className={styles.valor}>
                {carregando ? "—" : dadosAdm?.razaoSocial || "Não informada"}
              </strong>
            </div>

            <div className={styles.campoInfo}>
              <span className={styles.rotulo}>CNPJ</span>
              <strong className={`${styles.valor} ${styles.mono}`}>
                {carregando ? "—" : formatarCnpj(dadosAdm?.cnpj)}
              </strong>
            </div>

            <div className={styles.campoInfo}>
              <span className={styles.rotulo}>E-mail de acesso</span>
              <strong className={styles.valor}>
                {carregando ? "—" : dadosAdm?.email || "Não informado"}
              </strong>
            </div>

            <div className={styles.campoInfo}>
              <span className={styles.rotulo}>Data de nascimento</span>
              <strong className={styles.valor}>
                {carregando
                  ? "—"
                  : formatarDataNascimento(dadosAdm?.dataNascimento)}
              </strong>
            </div>

            <div className={styles.campoInfo}>
              <span className={styles.rotulo}>Nível de permissão</span>
              <strong className={styles.valor}>
                {carregando ? "—" : dadosAdm?.nivelAcesso || "ADM"}
              </strong>
            </div>
          </div>
        </section>

        {/* ZONA DE GERENCIAMENTO / EXCLUSÃO */}
        <section className={`${styles.painel} ${styles.painelPerigo}`}>
          <div className={styles.zonaPerigoConteudo}>
            <div>
              <h3 className={styles.tituloPerigo}>Encerramento da conta</h3>
              <p className={styles.textoPerigo}>
                Ao excluir esta conta administrativa, o acesso ao painel de monitoramento será revogado permanentemente.
              </p>
            </div>

            <button
              type="button"
              className={styles.deletar}
              onClick={() => setExcluir(true)}
            >
              Deletar conta
            </button>
          </div>
        </section>

        {/* MODAL DE CONFIRMAÇÃO */}
        {excluir && (
          <div className={styles.modalFundo} onClick={() => setExcluir(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalIcone}>!</div>
              <h4>Confirmar exclusão de conta</h4>
              <p>
                Tem certeza que deseja deletar permanentemente a conta{" "}
                <strong>{nome}</strong>? Esta ação não pode ser desfeita.
              </p>

              <div className={styles.modalBotoes}>
                <button
                  type="button"
                  className={styles.negar}
                  disabled={excluindo}
                  onClick={() => setExcluir(false)}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className={styles.confirmarExcluir}
                  disabled={excluindo}
                  onClick={confirmarExclusaoConta}
                >
                  {excluindo ? "Excluindo..." : "Sim, deletar conta"}
                </button>
              </div>
            </div>
          </div>
        )}

        <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
      </main>
    </Shell>
  );
}