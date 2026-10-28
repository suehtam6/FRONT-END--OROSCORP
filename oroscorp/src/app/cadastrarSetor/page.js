"use client"
import Shell from "../components/Shell";

/*
Data: 9 de Outubro de 2026
Objetivo: Cadastro de Setor
Autor: João Pedro e Kaique Carvalho
*/

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import styles from "../style/cadastrarsetor.module.css";

function Icone({ tipo, className = "" }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    className,
  };

  switch (tipo) {
    case "menu":
      return (
        <svg {...props}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );

    case "voltar":
      return (
        <svg {...props}>
          <path d="M10 5 3 12l7 7v-4h11V9H10V5Z" fill="currentColor" />
        </svg>
      );

    case "imagem":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      );

    case "escudo":
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case "funcionarios":
      return (
        <svg {...props}>
          <circle cx="9" cy="7" r="3" />
          <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
          <path d="M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5" />
        </svg>
      );

    case "camera":
      return (
        <svg {...props}>
          <rect x="3" y="6" width="13" height="12" rx="2" />
          <path d="m16 10 5-3v10l-5-3" />
        </svg>
      );

    case "alerta":
      return (
        <svg {...props}>
          <path d="M12 3 22 20H2L12 3Z" />
          <path d="M12 9v5m0 3v.1" />
        </svg>
      );

    case "capacete":
      return (
        <svg {...props}>
          <path d="M3 14a9 9 0 0 1 18 0v2H3v-2Z" fill="currentColor" />
          <path d="M12 5v9M2 18h20M5 16v2m14-2v2" />
        </svg>
      );

    case "seta":
      return (
        <svg {...props}>
          <path d="m7 10 5 5 5-5" />
        </svg>
      );

    case "upload":
      return (
        <svg {...props}>
          <path d="M12 16V4m-5 5 5-5 5 5" />
          <path d="M5 15v5h14v-5" />
        </svg>
      );

    default:
      return null;
  }
}

function CampoSelect({
  label,
  valor,
  onChange,
  opcoes,
  placeholder,
  icone,
  multiplo = false,
}) {
  return (
    <div className={styles.campo}>
      <label>{label}</label>

      <div className={styles.selectWrapper}>
        {icone && (
          <Icone tipo={icone} className={styles.iconeCampo} />
        )}

        <select
          value={valor}
          onChange={onChange}
          multiple={multiplo}
          className={icone ? styles.selectComIcone : ""}
        >
          {!multiplo && <option value="">{placeholder}</option>}

          {opcoes.map((opcao) => (
            <option key={opcao.value} value={opcao.value}>
              {opcao.label}
            </option>
          ))}
        </select>

        {!multiplo && (
          <Icone tipo="seta" className={styles.setaSelect} />
        )}
      </div>
    </div>
  );
}

export default function CadastroSetor() {
    const router = useRouter();
  
    const cadastrar = (e) => {
      e.preventDefault();
      router.push("/setores");
    };
  
    const cancelar = (e) => {
      e.preventDefault();
      router.push("/setores");
    };

  const inputImagem = useRef(null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [funcionarios, setFuncionarios] = useState([]);
  const [epis, setEpis] = useState([]);
  const [imagem, setImagem] = useState(null);
  const [status, setStatus] = useState("ativo");
  const [mensagem, setMensagem] = useState("");

  const funcionariosDisponiveis = [
    { value: "1", label: "João Pedro" },
    { value: "2", label: "Kaique Carvalho" },
    { value: "3", label: "Maria Oliveira" },
    { value: "4", label: "Lucas Santos" },
  ];

  const episDisponiveis = [
    { value: "capacete", label: "Capacete de segurança" },
    { value: "oculos", label: "Óculos de proteção" },
    { value: "luvas", label: "Luvas de proteção" },
    { value: "protetor", label: "Protetor auricular" },
    { value: "botas", label: "Botas de segurança" },
  ];

  function alternarSelecao(valor, lista, atualizar) {
    atualizar(
      lista.includes(valor)
        ? lista.filter((item) => item !== valor)
        : [...lista, valor]
    );
  }

  function limparFormulario() {
    setNome("");
    setDescricao("");
    setResponsavel("");
    setLocalizacao("");
    setFuncionarios([]);
    setEpis([]);
    setImagem(null);
    setStatus("ativo");
    setMensagem("");

    if (inputImagem.current) {
      inputImagem.current.value = "";
    }
  }

  function cadastrarSetor(event) {
    event.preventDefault();

    setMensagem(
      `Formulário preenchido! O cadastro de "${nome}" ainda não está conectado ao backend.`
    );
  }

  return (
    <Shell>
      

      <section className={styles.conteudo}>
        <div className={styles.tituloPagina}>
          <h1>Cadastro de Setor</h1>
          <p>Preencha as informações do novo setor da empresa.</p>
        </div>

        <form onSubmit={cadastrarSetor}>
          <div className={styles.painel}>
            <div className={styles.areaSuperior}>
              <button
                type="button"
                className={styles.uploadImagem}
                onClick={() => inputImagem.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const arquivo = event.dataTransfer.files?.[0];
                  if (arquivo?.type.startsWith("image/")) {
                    setImagem(arquivo);
                  }
                }}
              >
                {imagem ? (
                  <img
                    className={styles.previewImagem}
                    src={URL.createObjectURL(imagem)}
                    alt="Pré-visualização do setor"
                  />
                ) : (
                  <>
                    <span className={styles.caixaImagem}>
                      <Icone tipo="imagem" />
                      <span className={styles.seloUpload}>
                        <Icone tipo="upload" />
                      </span>
                    </span>

                    <span className={styles.textoUpload}>
                      Clique para enviar uma imagem ou
                      <br />
                      arraste o arquivo aqui.
                    </span>
                  </>
                )}
              </button>

              <input
                ref={inputImagem}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const arquivo = event.target.files?.[0];
                  if (arquivo) setImagem(arquivo);
                }}
              />

              <div className={styles.resumo}>
                <div className={styles.resumoCabecalho}>
                  <span className={styles.iconeEscudo}>
                    <Icone tipo="escudo" />
                  </span>

                  <div>
                    <h2>Informações do setor</h2>
                    <p>
                      Cadastre um novo setor para
                      <br />
                      organizar os funcionários,
                      <br />
                      câmeras e ocorrências.
                    </p>
                  </div>
                </div>

                <div className={styles.resumoLinha}>
                  <span>
                    <Icone tipo="funcionarios" />
                    Funcionários
                  </span>
                  <strong>{funcionarios.length}</strong>
                </div>

                <div className={styles.resumoLinha}>
                  <span>
                    <Icone tipo="camera" />
                    Câmeras
                  </span>
                  <strong>0</strong>
                </div>

                <div className={styles.resumoLinha}>
                  <span>
                    <Icone tipo="alerta" />
                    Ocorrências abertas
                  </span>
                  <strong>0</strong>
                </div>
              </div>
            </div>

            <div className={styles.formulario}>
              <div className={styles.coluna}>
                <div className={styles.campo}>
                  <label htmlFor="nome">
                    NOME DO SETOR <span className={styles.obrigatorio}>*</span>
                  </label>

                  <input
                    id="nome"
                    type="text"
                    placeholder="Digite o nome do setor"
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    maxLength={100}
                    required
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="descricao">DESCRIÇÃO</label>

                  <div className={styles.textareaWrapper}>
                    <textarea
                      id="descricao"
                      placeholder="Descreva o setor, suas atividades e observações..."
                      value={descricao}
                      onChange={(event) =>
                        setDescricao(event.target.value)
                      }
                      maxLength={500}
                    />

                    <span className={styles.contador}>
                      {descricao.length}/500
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.coluna}>
                <CampoSelect
                  label="RESPONSÁVEL"
                  valor={responsavel}
                  onChange={(event) => setResponsavel(event.target.value)}
                  placeholder="Selecione o responsável"
                  opcoes={funcionariosDisponiveis}
                />

                <div className={styles.campo}>
                  <label htmlFor="localizacao">LOCALIZAÇÃO</label>

                  <input
                    id="localizacao"
                    type="text"
                    placeholder="Ex: Galpão A, Piso 1"
                    value={localizacao}
                    onChange={(event) =>
                      setLocalizacao(event.target.value)
                    }
                  />
                </div>

                <div className={styles.campo}>
                  <label>FUNCIONÁRIOS DO SETOR</label>

                  <div className={styles.selectWrapper}>
                    <Icone tipo="camera" className={styles.iconeCampo} />

                    <select
                      value=""
                      className={styles.selectComIcone}
                      onChange={(event) => {
                        if (event.target.value) {
                          alternarSelecao(
                            event.target.value,
                            funcionarios,
                            setFuncionarios
                          );
                        }
                      }}
                    >
                      <option value="">
                        {funcionarios.length
                          ? `${funcionarios.length} funcionário(s) selecionado(s)`
                          : "Selecione os funcionários"}
                      </option>

                      {funcionariosDisponiveis.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>

                    <Icone tipo="seta" className={styles.setaSelect} />
                  </div>

                  {funcionarios.length > 0 && (
                    <div className={styles.selecionados}>
                      {funcionarios.map((id) => {
                        const item = funcionariosDisponiveis.find(
                          (funcionario) => funcionario.value === id
                        );

                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() =>
                              alternarSelecao(id, funcionarios, setFuncionarios)
                            }
                            className={styles.tag}
                          >
                            {item?.label} ×
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={styles.campo}>
                  <label>EPI DO SETOR</label>

                  <div className={styles.selectWrapper}>
                    <Icone tipo="capacete" className={styles.iconeCapacete} />

                    <select
                      value=""
                      className={styles.selectComIcone}
                      onChange={(event) => {
                        if (event.target.value) {
                          alternarSelecao(
                            event.target.value,
                            epis,
                            setEpis
                          );
                        }
                      }}
                    >
                      <option value="">
                        {epis.length
                          ? `${epis.length} EPI(s) selecionado(s)`
                          : "Selecione os EPIs"}
                      </option>

                      {episDisponiveis.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>

                    <Icone tipo="seta" className={styles.setaSelect} />
                  </div>

                  {epis.length > 0 && (
                    <div className={styles.selecionados}>
                      {epis.map((id) => {
                        const item = episDisponiveis.find(
                          (epi) => epi.value === id
                        );

                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => alternarSelecao(id, epis, setEpis)}
                            className={styles.tag}
                          >
                            {item?.label} ×
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.seguranca}>
              <div className={styles.tituloSeguranca}>
                <Icone tipo="escudo" />
                <h2>Configurações de segurança</h2>
              </div>

              <p>Status do setor</p>

              <div className={styles.opcoesStatus}>
                <button
                  type="button"
                  className={`${styles.statusBotao} ${
                    status === "ativo" ? styles.statusAtivo : ""
                  }`}
                  onClick={() => setStatus("ativo")}
                  aria-pressed={status === "ativo"}
                >
                  <span />
                  Ativo
                </button>

                <button
                  type="button"
                  className={`${styles.statusBotao} ${
                    status === "inativo" ? styles.statusInativo : ""
                  }`}
                  onClick={() => setStatus("inativo")}
                  aria-pressed={status === "inativo"}
                >
                  <span />
                  Inativo
                </button>
              </div>
            </div>
          </div>

          {mensagem && (
            <p className={styles.mensagem} role="status">
              {mensagem}
            </p>
          )}

          <div className={styles.acoes}>
            <button
              type="button"
              className={styles.botaoCancelar}
              onClick={limparFormulario & cancelar}
            >
              CANCELAR
            </button>

            <button 
              onClick={cadastrar}
              type="submit"
              className={styles.botaoCadastrar}
             >
              CADASTRAR SETOR
            </button>
          </div>
        </form>
      </section>
    </Shell>
  );
}
