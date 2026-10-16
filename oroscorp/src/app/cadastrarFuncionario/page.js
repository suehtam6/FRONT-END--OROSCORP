"use client";

/*
Data : 16 de Outubro de 2026
Objetivo : Tela de cadastro
Autor : João Pedro e Kaique Carvalho
*/

import { useRouter } from "next/navigation";
import styles from "../style/cadastrarFuncionario.module.css";

export default function Home() {

  const router = useRouter();

  const cancelarCadastro = (e) => {
    e.preventDefault();
    router.back();
  };

  const finalizarCadastro = (e) => {
    e.preventDefault();
    router.back();
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
          <h1>Cadastro do Funcionário</h1>
          <p>Preencha os dados para cadastrar um novo funcionario no sistema.</p>
        </div>

        <div className={styles.formulario}>

          <div className={styles.fotoArea}>
            <div className={styles.fotoIcone}>
              <span>👤</span>
            </div>

            <strong>Adicionar foto</strong>

            <p>
              Clique para enviar uma imagem
              <br />
              ou arraste o arquivo aqui.
            </p>
          </div>

          <div className={styles.campos}>

            <div className={styles.campo}>
              <label>
                Nome completo <span>*</span>
              </label>

              <input
                type="text"
                placeholder="Digite o nome completo"
              />
            </div>

            <div className={styles.campo}>
              <label>
                E-mail <span>*</span>
              </label>

              <input
                type="email"
                placeholder="exemplo@dominio.com"
              />
            </div>

            <div className={styles.campo}>
              <label>
                CPF <span>*</span>
              </label>

              <input
                type="text"
                placeholder="00.000.000/000-00"
              />
            </div>

            <div className={styles.campo}>
              <label>
                Confirmar e-mail <span>*</span>
              </label>

              <input
                type="email"
                placeholder="Digite o e-mail novamente"
              />
            </div>

            <div className={styles.campo}>
              <label>
                Data de nascimento <span>*</span>
              </label>

              <input
                type="text"
                placeholder="Ex: 16/05/2005"
              />
            </div>

          </div>

        </div>

        <div className={styles.botoes}>

          <button
            type="button"
            className={styles.cancelar}
            onClick={cancelarCadastro}
          >
            CANCELAR
          </button>

          <button
            type="button"
            className={styles.cadastrar}
            onClick={finalizarCadastro}
          >
            CADASTRAR
          </button>

        </div>

      </section>

    </main>
  );
}