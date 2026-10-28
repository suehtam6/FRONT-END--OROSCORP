"use client"
import Shell from "../components/Shell";

/*
Data: 9 de Outubro de 2026
Objetivo: Página de setores
Autor: João Pedro e Kaique Carvalho
*/

import { useRouter } from "next/navigation"; 
import styles from "../style/setores.module.css";

const setores = [
  {
    id: 1,
    nome: "Almoxarifado",
    descricao:
      "Armazenamento e controle de insumos, ferramentas e EPIs.",
    funcionarios: 12,
    cameras: 2,
    abertas: 1,
  },
  {
    id: 2,
    nome: "Soldagem",
    descricao:
      "Área de solda e corte de metais com alto risco térmico.",
    funcionarios: 9,
    cameras: 1,
    abertas: 4,
  },
  {
    id: 3,
    nome: "Maquinário",
    descricao:
      "Operação de máquinas pesadas, CNC e linha de produção.",
    funcionarios: 15,
    cameras: 3,
    abertas: 2,
  },
  {
    id: 4,
    nome: "Manutenção",
    descricao:
      "Reparos elétricos e mecânicos em toda a planta industrial.",
    funcionarios: 7,
    cameras: 2,
    abertas: 0,
  },
  {
    id: 5,
    nome: "Expedição",
    descricao:
      "Carga, descarga e movimentação de mercadorias.",
    funcionarios: 10,
    cameras: 2,
    abertas: 1,
  },
  {
    id: 6,
    nome: "Químicos",
    descricao:
      "Armazenamento e manuseio de produtos químicos industriais.",
    funcionarios: 6,
    cameras: 2,
    abertas: 3,
  },
];

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
  
    const registrar = (e) => {
      e.preventDefault();
      router.push("/cadastrarSetor");
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

        <div className={styles.grade}>
          {setores.map((setor) => (
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

              <button className={styles.botaoVer}>
                Ver setor <span>›</span>
              </button>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}