"use client";

/*
Data : 7 de Outubro de 2026
Objetivo : Tela de cadastro
Autor : João Pedro e Kaique Carvalho
*/

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadParaCloudinary } from "@/API/cloudinary";
import styles from "../style/cadastrarAdm.module.css";

const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO_MB = 2;

const soDigitos = (valor) => valor.replace(/\D/g, "");

// Formata enquanto digita: 00.000.000/0000-00
const mascararCnpj = (valor) =>
  soDigitos(valor)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");

const FORM_INICIAL = {
  nome: "",
  email: "",
  confirmarEmail: "",
  cnpj: "",
  razaoSocial: "",
  dataNascimento: "",
  senha: "",
  confirmarSenha: "",
};

export default function Home() {
  const router = useRouter();
  const inputFotoRef = useRef(null);
  // Última foto já enviada ao Cloudinary: evita enviar de novo se o cadastro
  // falhar e a pessoa tentar outra vez com a mesma foto.
  const uploadRef = useRef({ arquivo: null, url: "" });

  const [form, setForm] = useState(FORM_INICIAL);
  const [foto, setFoto] = useState(null); // arquivo escolhido (File) ou null
  const [previewUrl, setPreviewUrl] = useState(""); // endereço temporário só para mostrar a prévia
  const [arrastando, setArrastando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Libera a memória da prévia quando ela troca ou quando a tela fecha.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Um único handler para todos os campos de texto: atualizar("nome"), atualizar("cnpj")...
  const atualizar = (campo) => (e) => {
    const valor = campo === "cnpj" ? mascararCnpj(e.target.value) : e.target.value;
    setForm((atual) => ({ ...atual, [campo]: valor }));
  };

  // ---------- Foto ----------
  const selecionarFoto = (arquivo) => {
    if (!arquivo) return;

    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      setErro("A foto deve ser JPG, PNG ou WebP.");
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
      setErro(`A foto deve ter no máximo ${TAMANHO_MAXIMO_MB} MB.`);
      return;
    }

    setErro("");
    setFoto(arquivo);
    setPreviewUrl(URL.createObjectURL(arquivo));
  };

  const abrirSeletor = () => inputFotoRef.current?.click();

  const aoEscolherArquivo = (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo depois
    selecionarFoto(arquivo);
  };

  const soltarFoto = (e) => {
    e.preventDefault();
    setArrastando(false);
    selecionarFoto(e.dataTransfer.files?.[0]);
  };

  // ---------- Cadastro ----------
  const cancelarCadastro = (e) => {
    e.preventDefault();
    router.back();
  };

  // Retorna a mensagem do primeiro problema encontrado, ou "" se estiver tudo certo.
  const validar = () => {
    if (!form.nome.trim()) return "Informe o nome completo.";
    if (!form.email.trim()) return "Informe o e-mail.";
    if (form.email.trim().toLowerCase() !== form.confirmarEmail.trim().toLowerCase()) {
      return "Os e-mails não conferem.";
    }
    if (soDigitos(form.cnpj).length !== 14) return "O CNPJ deve ter 14 dígitos.";
    if (!form.razaoSocial.trim()) return "Informe a razão social.";
    if (!form.dataNascimento) return "Informe a data de nascimento.";
    if (form.senha.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    if (form.senha !== form.confirmarSenha) return "As senhas não conferem.";
    return "";
  };

  const finalizarCadastro = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const mensagemErro = validar();
    if (mensagemErro) {
      setErro(mensagemErro);
      return;
    }

    setCarregando(true);

    try {
      // 1) Se escolheu foto, envia para o Cloudinary e recebe o endereço (URL) dela.
      let fotoUrl = "";
      if (foto) {
        if (uploadRef.current.arquivo !== foto) {
          let url;
          try {
            url = await uploadParaCloudinary(foto);
          } catch {
            setErro("Não foi possível enviar a foto. Tente novamente.");
            return;
          }
          uploadRef.current = { arquivo: foto, url };
        }
        fotoUrl = uploadRef.current.url;
      }

      // 2) Envia os dados para o Next, que cadastra o usuário e o administrador no back.
      const resposta = await fetch("/api/adm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          email: form.email.trim(),
          senha: form.senha,
          data_nascimento: form.dataNascimento, // o input type="date" já entrega AAAA-MM-DD
          cnpj: form.cnpj, // com máscara, igual ao seu exemplo do Postman
          razao_social: form.razaoSocial.trim(),
          foto: fotoUrl, // vazio = sem foto
        }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        setErro(dados.message || "Não foi possível cadastrar.");
        return;
      }

      setSucesso("Administrador cadastrado! Redirecionando para o login...");
      setTimeout(() => router.push("/"), 1500);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className={styles.container}>

      <header className={styles.header}>
        <img
          src="/logo-oroscorp.png"
          alt="Oroscorp"
          className={styles.logo}
        />
      </header>

      <section className={styles.cadastroBox}>

        <div className={styles.titulo}>
          <h1>Cadastro do Adiministrador</h1>
          <p>Preencha os dados para cadastrar um novo adm no sistema.</p>
        </div>

        <div className={styles.formulario}>

          <div
            className={styles.fotoArea}
            role="button"
            tabIndex={0}
            aria-label="Adicionar foto"
            onClick={abrirSeletor}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                abrirSeletor();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={soltarFoto}
            style={{
              cursor: "pointer",
              outline: arrastando ? "2px dashed currentColor" : undefined,
            }}
          >
            
            <input
              ref={inputFotoRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={aoEscolherArquivo}
              onClick={(e) => e.stopPropagation()}
              hidden
            />

            <div className={styles.fotoIcone}>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Prévia da foto escolhida"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "inherit",
                  }}
                />
              ) : (
                <span>👤</span>
              )}
            </div>

            <strong>{foto ? "Trocar foto" : "Adicionar foto"}</strong>

            <p>
              {foto ? (
                foto.name
              ) : (
                <>
                  Clique para enviar uma imagem
                  <br />
                  ou arraste o arquivo aqui.
                </>
              )}
            </p>
          </div>

          <div className={styles.campos}>

            <div className={styles.campo}>
              <label htmlFor="nome">
                Nome completo <span>*</span>
              </label>

              <input
                id="nome"
                type="text"
                maxLength={100}
                placeholder="Digite o nome completo"
                value={form.nome}
                onChange={atualizar("nome")}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="email">
                E-mail <span>*</span>
              </label>

              <input
                id="email"
                type="email"
                maxLength={256}
                placeholder="exemplo@dominio.com"
                value={form.email}
                onChange={atualizar("email")}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="cnpj">
                CNPJ <span>*</span>
              </label>

              <input
                id="cnpj"
                type="text"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                value={form.cnpj}
                onChange={atualizar("cnpj")}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="confirmarEmail">
                Confirmar e-mail <span>*</span>
              </label>

              <input
                id="confirmarEmail"
                type="email"
                maxLength={256}
                placeholder="Digite o e-mail novamente"
                value={form.confirmarEmail}
                onChange={atualizar("confirmarEmail")}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="razaoSocial">
                Razão social <span>*</span>
              </label>

              <input
                id="razaoSocial"
                type="text"
                maxLength={80}
                placeholder="Nome da empresa"
                value={form.razaoSocial}
                onChange={atualizar("razaoSocial")}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="dataNascimento">
                Data de nascimento <span>*</span>
              </label>

              <input
                id="dataNascimento"
                type="date"
                value={form.dataNascimento}
                onChange={atualizar("dataNascimento")}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="senha">
                Senha <span>*</span>
              </label>

              <input
                id="senha"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                value={form.senha}
                onChange={atualizar("senha")}
              />
            </div>

            <div className={styles.campo}>
              <label htmlFor="confirmarSenha">
                Confirmar senha <span>*</span>
              </label>

              <input
                id="confirmarSenha"
                type="password"
                autoComplete="new-password"
                placeholder="Digite a senha novamente"
                value={form.confirmarSenha}
                onChange={atualizar("confirmarSenha")}
              />
            </div>

          </div>

        </div>

        {erro && (
          <p role="alert" className={styles.erro}>
            {erro}
          </p>
        )}

        {sucesso && (
          <p role="status" className={styles.sucesso}>
            {sucesso}
          </p>
        )}

        <div className={styles.botoes}>

          <button
            type="button"
            className={styles.cancelar}
            onClick={cancelarCadastro}
            disabled={carregando}
          >
            CANCELAR
          </button>

          <button
            type="button"
            className={styles.cadastrar}
            onClick={finalizarCadastro}
            disabled={carregando || Boolean(sucesso)}
          >
            {carregando ? "CADASTRANDO..." : "CADASTRAR"}
          </button>

        </div>

      </section>

    </main>
  );
}