"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import s from "../style/novas.module.css";

const CAMPOS = [
  { name: "nome", label: "Nome completo", type: "text" },
  { name: "idade", label: "Idade", type: "number" },
  { name: "cpf", label: "CPF", type: "text" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "confirmarEmail", label: "Confirmar e-mail", type: "email" },
  { name: "senha", label: "Senha", type: "password" },
  { name: "confirmarSenha", label: "Confirmar senha", type: "password" },
];

const ESTADO_INICIAL = Object.fromEntries(CAMPOS.map(({ name }) => [name, ""]));

function validar({ email, confirmarEmail, senha, confirmarSenha }) {
  if (email !== confirmarEmail) return "Os e-mails não coincidem.";
  if (senha !== confirmarSenha) return "As senhas não coincidem.";
  return null;
}

function Campo({ name, label, type, value, onChange }) {
  return (
    <div className={s.campo}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export default function AtualizarPerfil() {
  const router = useRouter();
  const [foto, setFoto] = useState(null);
  const [dados, setDados] = useState(ESTADO_INICIAL);

  // Cria a URL de preview uma única vez por arquivo e libera a memória depois
  const previewFoto = useMemo(
    () => (foto ? URL.createObjectURL(foto) : null),
    [foto]
  );

  useEffect(() => {
    return () => {
      if (previewFoto) URL.revokeObjectURL(previewFoto);
    };
  }, [previewFoto]);

  function atualizarCampo({ target: { name, value } }) {
    setDados((anterior) => ({ ...anterior, [name]: value }));
  }

  function selecionarFoto(e) {
    setFoto(e.target.files?.[0] ?? null);
  }

  function salvar(e) {
    e.preventDefault();

    const erro = validar(dados);
    if (erro) return alert(erro);

    alert("Conecte a API para atualizar o perfil.");
  }

  return (
    <Shell>
      <section className={s.painel}>
        <h1 className={s.titulo}>Atualizar perfil</h1>
        <p className={s.sub}>
          Preencha os dados para atualizar seu perfil no sistema.
        </p>

        <form onSubmit={salvar} className={s.grade}>
          <label className={s.upload}>
            {previewFoto ? <img src={previewFoto} alt="Foto de perfil" /> : "Adicionar foto"}
            <input hidden type="file" accept="image/*" onChange={selecionarFoto} />
          </label>

          <div className={s.formGrade}>
            {CAMPOS.map((campo) => (
              <Campo
                key={campo.name}
                {...campo}
                value={dados[campo.name]}
                onChange={atualizarCampo}
              />
            ))}

            <div className={`${s.linha} ${s.largura}`}>
              <button
                type="button"
                className={`${s.botao} ${s.secundario}`}
                onClick={() => router.back()}
              >
                Cancelar
              </button>
              <button type="submit" className={s.botao}>
                Atualizar
              </button>
            </div>
          </div>
        </form>
      </section>
    </Shell>
  );
}