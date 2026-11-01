
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import styles from "../style/cadastrarFuncionario.module.css";

    const CARGOS = [
  { id: 1, nome: "Operador" },
  { id: 2, nome: "Supervisor" },
];

const SETORES = [
  { id: 1, nome: "Produção" },
  { id: 2, nome: "Almoxarifado" },
];

const STATUS = [
  { id: 1, nome: "Ativo" },
  { id: 2, nome: "Afastado" },
];


export default function CadastrarFuncionario() {
  const router = useRouter();

  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [dados, setDados] = useState({
    nome: "",
    email: "",
    confirmarEmail: "",
    cpf: "",
    nascimento: "",
    id_cargo: "",
    id_setor: "",
    id_status_funcionario: ""
  });

  useEffect(() => {
    if (!foto) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(foto);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [foto]);

  function atualizar(evento) {
    setDados({
      ...dados,
      [evento.target.name]: evento.target.value
    });
    setMensagem("");
  }

  function cadastrar(evento) {
    evento.preventDefault();

    if (dados.email !== dados.confirmarEmail) {
      setMensagem("Os e-mails não são iguais.");
      return;
    }


const corpo = {
  nome: dados.nome,
  data_nascimento: dados.nascimento,
  cpf: dados.cpf,
  email: dados.email,
  foto: "URL da foto do funcionario", // depois ligamos ao upload
  id_cargo: Number(dados.id_cargo),
  id_setor: Number(dados.id_setor),
  id_status_funcionario: Number(dados.id_status_funcionario),
};

console.log(corpo); // confira no F12 se está igual ao formato da API

    // O envio para a API será implementado aqui.
    setMensagem("Dados validados. Cadastro aguardando integração com a API.");
  }

  return (
    <Shell voltar={false}>
      <main className={styles.container}>
        <section className={styles.cadastroBox}>
          <div className={styles.titulo}>
            <div>
              <h1>Cadastro do Funcionário</h1>
              <p>Preencha os dados para cadastrar um novo funcionário no sistema.</p>
            </div>

            <button
              type="button"
              className={styles.sair}
              onClick={() => router.push("/funcionarios")}
            >
              SAIR
            </button>
          </div>

          <form onSubmit={cadastrar}>
            <div className={styles.formulario}>
              <div className={styles.fotoColuna}>
                <label className={styles.fotoArea}>
                  {preview ? (
                    <img
                      src={preview}
                      alt="Foto do funcionário"
                      className={styles.previewImagem}
                    />
                  ) : (
                    <div className={styles.fotoTexto}>
                      <strong>Adicionar foto</strong>
                      <p>Clique para selecionar uma imagem</p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) =>
                      setFoto(e.target.files?.[0] || null)
                    }
                  />
                </label>

                {foto && (
                  <button
                    type="button"
                    className={styles.removerFoto}
                    onClick={() => setFoto(null)}
                  >
                    Remover foto
                  </button>
                )}
              </div>

              <div className={styles.campos}>
                <div className={styles.campo}>
                  <label htmlFor="nome">Nome completo <span>*</span></label>
                  <input
                    id="nome"
                    name="nome"
                    value={dados.nome}
                    onChange={atualizar}
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="email">E-mail <span>*</span></label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={dados.email}
                    onChange={atualizar}
                    placeholder="exemplo@dominio.com"
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="cpf">CPF <span>*</span></label>
                  <input
                    id="cpf"
                    name="cpf"
                    value={dados.cpf}
                    onChange={atualizar}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="confirmarEmail">Confirmar e-mail <span>*</span></label>
                  <input
                    id="confirmarEmail"
                    name="confirmarEmail"
                    type="email"
                    value={dados.confirmarEmail}
                    onChange={atualizar}
                    placeholder="Digite o e-mail novamente"
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="nascimento">Data de nascimento <span>*</span></label>
                  <input
                    id="nascimento"
                    name="nascimento"
                    type="date"
                    value={dados.nascimento}
                    onChange={atualizar}
                    required
                  />
                </div>

                <div className={styles.campo}>
                <label htmlFor="id_cargo">Cargo <span>*</span></label>
                <select
                  id="id_cargo"
                  name="id_cargo"
                  value={dados.id_cargo}
                  onChange={atualizar}
                  required
                >
                  <option value="">Selecione o cargo</option>
                  {CARGOS.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div className={styles.campo}>
                <label htmlFor="id_setor">Setor <span>*</span></label>
                <select
                  id="id_setor"
                  name="id_setor"
                  value={dados.id_setor}
                  onChange={atualizar}
                  required
                >
                  <option value="">Selecione o setor</option>
                  {SETORES.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>

              <div className={styles.campo}>
                <label htmlFor="id_status_funcionario">Status <span>*</span></label>
                <select
                  id="id_status_funcionario"
                  name="id_status_funcionario"
                  value={dados.id_status_funcionario}
                  onChange={atualizar}
                  required
                >
                  <option value="">Selecione o status</option>
                  {STATUS.map((st) => (
                    <option key={st.id} value={st.id}>{st.nome}</option>
                  ))}
                </select>
              </div>

              </div>
            </div>

            {mensagem && (
              <p className={styles.mensagem} role="status">{mensagem}</p>
            )}

            <div className={styles.botoes}>
              <button
                type="button"
                className={styles.cancelar}
                onClick={() => router.push("/funcionarios")}
              >
                CANCELAR
              </button>

              <button type="submit" className={styles.cadastrar}>
                CADASTRAR FUNCIONÁRIO
              </button>
            </div>
          </form>
        </section>
      </main>
    </Shell>
  );
}
