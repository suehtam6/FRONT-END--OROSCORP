"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadParaCloudinary } from "@/API/cloudinary";
import Shell from "../components/Shell";
import Popup from "../components/Popup";
import s from "../style/atualizar_perfil.module.css";

function formatarCnpjInput(valor) {
  const digitos = String(valor || "").replace(/\D/g, "").slice(0, 14);
  return digitos
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatarDataInput(dataStr) {
  if (!dataStr) return "";
  const data = new Date(dataStr);
  if (isNaN(data.getTime())) return "";
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export default function AtualizarPerfil() {
  const router = useRouter();

  const [foto, setFoto] = useState(null);
  const [fotoAtualUrl, setFotoAtualUrl] = useState("");
  const [idsConta, setIdsConta] = useState({
    id_usuario: null,
    id_adm: null,
    id_nivel_acesso: 1,
    id_status_conta: 1,
  });

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState({ mensagem: "", tipo: "erro" });

  const [dados, setDados] = useState({
    nome: "",
    razao_social: "",
    cnpj: "",
    data_nascimento: "",
    email: "",
    confirmarEmail: "",
    senha: "",
    confirmarSenha: "",
  });

  useEffect(() => {
    async function carregarDadosAtuais() {
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

        const u = usuarioAninhado || usuarioToken || {};

        const nivelObj = Array.isArray(u.nivel_acesso)
          ? u.nivel_acesso[0]
          : u.nivel_acesso;
        const statusObj = Array.isArray(u.status_conta)
          ? u.status_conta[0]
          : u.status_conta;

        setIdsConta({
          id_usuario: u.id || usuarioToken?.id || null,
          id_adm: admEncontrado?.id || null,
          id_nivel_acesso: Number(nivelObj?.id || u.id_nivel_acesso || 1),
          id_status_conta: Number(statusObj?.id || u.id_status_conta || 1),
        });

        if (u.foto && !u.foto.endsWith("sem-foto.png")) {
          setFotoAtualUrl(u.foto);
        }

        setDados((prev) => ({
          ...prev,
          nome: u.nome || "",
          razao_social: admEncontrado?.razao_social || "",
          cnpj: formatarCnpjInput(admEncontrado?.cnpj || ""),
          data_nascimento: formatarDataInput(u.data_nascimento),
          email: u.email || "",
          confirmarEmail: u.email || "",
        }));
      } catch (err) {
        console.error("Erro ao carregar dados do perfil:", err);
        setAviso({
          mensagem: "Erro ao carregar os dados atuais do perfil.",
          tipo: "erro",
        });
      } finally {
        setCarregando(false);
      }
    }

    carregarDadosAtuais();
  }, []);

  const previewNovaFoto = useMemo(
    () => (foto ? URL.createObjectURL(foto) : null),
    [foto]
  );

  useEffect(() => {
    return () => {
      if (previewNovaFoto) URL.revokeObjectURL(previewNovaFoto);
    };
  }, [previewNovaFoto]);

  const imagemExibida = previewNovaFoto || fotoAtualUrl;

  function atualizarCampo(e) {
    const { name, value } = e.target;
    const valorTratado = name === "cnpj" ? formatarCnpjInput(value) : value;
    setDados((anterior) => ({ ...anterior, [name]: valorTratado }));
  }

  function selecionarFoto(e) {
    setFoto(e.target.files?.[0] ?? null);
  }

  function validar() {
    if (!dados.nome.trim()) return "Informe o nome do responsável.";
    if (!dados.razao_social.trim()) return "Informe a razão social.";
    if (!dados.cnpj.trim()) return "Informe o CNPJ.";
    if (!dados.data_nascimento) return "Informe a data de nascimento.";
    if (!dados.email.trim()) return "Informe o e-mail de acesso.";
    if (dados.email.trim() !== dados.confirmarEmail.trim()) {
      return "Os e-mails não coincidem.";
    }
    if (!dados.senha) {
      return "Informe sua senha (ou uma nova senha) para confirmar a atualização.";
    }
    if (dados.senha !== dados.confirmarSenha) {
      return "As senhas não coincidem.";
    }
    return null;
  }

  async function salvar(e) {
    e.preventDefault();

    const erroValidacao = validar();
    if (erroValidacao) {
      setAviso({ mensagem: erroValidacao, tipo: "erro" });
      return;
    }

    if (!idsConta.id_usuario || !idsConta.id_adm) {
      setAviso({
        mensagem:
          "Não foi possível identificar o ID da conta. Recarregue a página.",
        tipo: "erro",
      });
      return;
    }

    setSalvando(true);
    setAviso({ mensagem: "", tipo: "erro" });

    try {
      let urlFotoFinal = fotoAtualUrl || "sem-foto.png";

      if (foto) {
        try {
          urlFotoFinal = await uploadParaCloudinary(foto);
        } catch (uploadErr) {
          console.error("Erro no upload Cloudinary:", uploadErr);
          throw new Error("Não foi possível enviar a nova foto para o Cloudinary.");
        }
      }

      const res = await fetch(`/api/adm/${idsConta.id_adm}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: idsConta.id_usuario,
          id_nivel_acesso: idsConta.id_nivel_acesso,
          id_status_conta: idsConta.id_status_conta,
          nome: dados.nome.trim(),
          foto: urlFotoFinal,
          email: dados.email.trim(),
          senha: dados.senha,
          data_nascimento: dados.data_nascimento,
          cnpj: dados.cnpj.trim(),
          razao_social: dados.razao_social.trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.message || "Não foi possível atualizar o perfil.");
      }

      setAviso({
        mensagem: "Perfil atualizado com sucesso!",
        tipo: "sucesso",
      });

      setTimeout(() => {
        router.push("/perfil");
        router.refresh();
      }, 1200);
    } catch (err) {
      setAviso({
        mensagem: err.message || "Erro ao salvar alterações.",
        tipo: "erro",
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Shell>
      <main className={s.conteudo}>
        {/* TOPO DA PÁGINA */}
        <div className={s.cabecalhoPagina}>
          <div>
            <h1 className={s.titulo}>Atualizar perfil</h1>
            <p className={s.sub}>
              Edite os dados do responsável, informações da empresa (CNPJ) e credenciais de acesso.
            </p>
          </div>

          <button
            type="button"
            className={s.botaoVoltarTopo}
            onClick={() => router.back()}
          >
            ← Voltar ao perfil
          </button>
        </div>

        {/* PAINEL DO FORMULÁRIO */}
        <section className={s.painel}>
          <form onSubmit={salvar} className={s.grade}>
            {/* COLUNA ESQUERDA: FOTO */}
            <aside className={s.colunaFoto}>
              <label
                className={`${s.upload} ${
                  imagemExibida ? s.uploadComImagem : ""
                }`}
              >
                {imagemExibida ? (
                  <>
                    <img
                      src={imagemExibida}
                      alt="Foto de perfil"
                      className={s.previewImagem}
                    />
                    <div className={s.overlayFoto}>
                      <span>Alterar foto</span>
                    </div>
                  </>
                ) : (
                  <div className={s.placeholderFoto}>
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span>Adicionar foto</span>
                  </div>
                )}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={selecionarFoto}
                />
              </label>

              <p className={s.dicaFoto}>
                Clique no círculo acima para escolher uma imagem JPG ou PNG para o perfil administrativo.
              </p>

              {foto && (
                <button
                  type="button"
                  className={s.botaoRemoverFoto}
                  onClick={() => setFoto(null)}
                >
                  Descartar nova foto
                </button>
              )}
            </aside>

            <div className={s.colunaFormulario}>
              <div className={s.blocoSecao}>
                <h2 className={s.tituloSecao}>Dados do Administrador e Empresa</h2>

                <div className={s.formGrade}>
                  <div className={s.campo}>
                    <label htmlFor="nome">Nome completo do responsável</label>
                    <input
                      id="nome"
                      name="nome"
                      type="text"
                      placeholder={carregando ? "Carregando..." : "Ex: Matheus Lucas"}
                      value={dados.nome}
                      onChange={atualizarCampo}
                    />
                  </div>

                  <div className={s.campo}>
                    <label htmlFor="data_nascimento">Data de nascimento</label>
                    <input
                      id="data_nascimento"
                      name="data_nascimento"
                      type="date"
                      value={dados.data_nascimento}
                      onChange={atualizarCampo}
                    />
                  </div>

                  <div className={s.campo}>
                    <label htmlFor="razao_social">Razão Social</label>
                    <input
                      id="razao_social"
                      name="razao_social"
                      type="text"
                      placeholder={carregando ? "Carregando..." : "Ex: Oroscorp LTDA"}
                      value={dados.razao_social}
                      onChange={atualizarCampo}
                    />
                  </div>

                  <div className={s.campo}>
                    <label htmlFor="cnpj">CNPJ</label>
                    <input
                      id="cnpj"
                      name="cnpj"
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={dados.cnpj}
                      onChange={atualizarCampo}
                    />
                  </div>
                </div>
              </div>

              <div className={s.blocoSecao}>
                <h2 className={s.tituloSecao}>Credenciais e Segurança</h2>

                <div className={s.formGrade}>
                  <div className={s.campo}>
                    <label htmlFor="email">E-mail de acesso</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@empresa.com.br"
                      value={dados.email}
                      onChange={atualizarCampo}
                    />
                  </div>

                  <div className={s.campo}>
                    <label htmlFor="confirmarEmail">Confirmar e-mail</label>
                    <input
                      id="confirmarEmail"
                      name="confirmarEmail"
                      type="email"
                      placeholder="Repita o e-mail"
                      value={dados.confirmarEmail}
                      onChange={atualizarCampo}
                    />
                  </div>

                  <div className={s.campo}>
                    <label htmlFor="senha">Senha</label>
                    <input
                      id="senha"
                      name="senha"
                      type="password"
                      placeholder="••••••••"
                      value={dados.senha}
                      onChange={atualizarCampo}
                    />
                  </div>

                  <div className={s.campo}>
                    <label htmlFor="confirmarSenha">Confirmar senha</label>
                    <input
                      id="confirmarSenha"
                      name="confirmarSenha"
                      type="password"
                      placeholder="••••••••"
                      value={dados.confirmarSenha}
                      onChange={atualizarCampo}
                    />
                  </div>
                </div>

                <p className={s.dicaSenha}>
                  Informe sua senha atual (ou uma nova senha) para confirmar a atualização dos dados no servidor.
                </p>
              </div>

              <div className={s.linhaAcoes}>
                <button
                  type="button"
                  className={`${s.botao} ${s.secundario}`}
                  onClick={() => router.back()}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={s.botao}
                  disabled={salvando || carregando}
                >
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <Popup
          mensagem={aviso.mensagem}
          tipo={aviso.tipo}
          aoFechar={() => setAviso({ mensagem: "", tipo: "erro" })}
        />
      </main>
    </Shell>
  );
}