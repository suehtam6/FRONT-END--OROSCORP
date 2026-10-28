
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import styles from "../style/cadastrarEpi.module.css";

export default function CadastroEPI() {
  const router = useRouter();
  const [imagem, setImagem] = useState(null);
  const [preview, setPreview] = useState("");
  const [dados, setDados] = useState({
    nome: "",
    categoria: "",
    ca: "",
    fabricante: "",
    descricao: "",
    validade: "",
    status: "Ativo"
  });

  useEffect(() => {
    if (!imagem) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(imagem);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imagem]);

  function atualizar(e) {
    setDados({ ...dados, [e.target.name]: e.target.value });
  }

  function cadastrar(e) {
    e.preventDefault();

    const formulario = new FormData();

    Object.entries(dados).forEach(([chave, valor]) => {
      formulario.append(chave, valor);
    });

    if (imagem) formulario.append("imagem", imagem);

    console.log("Dados do EPI:", Object.fromEntries(formulario));
    alert("Formulário pronto! Conecte a API para cadastrar o EPI.");
  }

  return (
    <Shell>
      <main className={styles.pagina}>
        <div className={styles.titulo}>
          <h1>Cadastro de EPI</h1>
          <p>Preencha as informações para cadastrar um equipamento de proteção individual.</p>
        </div>

        <form className={styles.painel} onSubmit={cadastrar}>
          <div className={styles.layout}>
            <div className={styles.campos}>
              <h2>Informações do EPI</h2>

              <div className={styles.campo}>
                <label htmlFor="nome">Nome do EPI <span>*</span></label>
                <input id="nome" name="nome" value={dados.nome}
                  onChange={atualizar} placeholder="Digite o nome do EPI" required />
              </div>

              <div className={styles.campo}>
                <label htmlFor="categoria">Categoria <span>*</span></label>
                <select id="categoria" name="categoria" value={dados.categoria}
                  onChange={atualizar} required>
                  <option value="">Selecione a categoria</option>
                  <option>Proteção da cabeça</option>
                  <option>Proteção dos olhos</option>
                  <option>Proteção das mãos</option>
                  <option>Proteção dos pés</option>
                  <option>Proteção auditiva</option>
                  <option>Proteção respiratória</option>
                  <option>Outros</option>
                </select>
              </div>

              <div className={styles.linha}>
                <div className={styles.campo}>
                  <label htmlFor="ca">Certificado de Aprovação (CA)</label>
                  <input id="ca" name="ca" value={dados.ca}
                    onChange={atualizar} placeholder="Número do CA" />
                </div>
                <div className={styles.campo}>
                  <label htmlFor="fabricante">Fabricante</label>
                  <input id="fabricante" name="fabricante" value={dados.fabricante}
                    onChange={atualizar} placeholder="Nome do fabricante" />
                </div>
              </div>

              <div className={styles.campo}>
                <label htmlFor="validade">Validade</label>
                <input id="validade" type="date" name="validade"
                  value={dados.validade} onChange={atualizar} />
              </div>

              <div className={styles.campo}>
                <label htmlFor="descricao">Descrição</label>
                <textarea id="descricao" name="descricao" rows={4}
                  placeholder="Descreva as características e a utilização do EPI..."
                  value={dados.descricao} onChange={atualizar} />
              </div>

              <div className={styles.campo}>
                <label>Status</label>
                <div className={styles.status}>
                  {["Ativo", "Inativo"].map((opcao) => (
                    <button type="button" key={opcao}
                      className={dados.status === opcao ? styles.statusAtivo : ""}
                      onClick={() => setDados({ ...dados, status: opcao })}>
                      {opcao}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.areaImagem}>
              <h2>Imagem do EPI</h2>

              <label className={styles.uploadImagem}>
                {preview ? (
                  <img src={preview} alt="Imagem do EPI"
                    className={styles.previewImagem} />
                ) : (
                  <div className={styles.espacoImagem}>
                    <p>Clique para anexar uma imagem</p>
                    <small>PNG, JPG ou JPEG</small>
                  </div>
                )}

                <input type="file" accept="image/png,image/jpeg" hidden
                  onChange={(e) => setImagem(e.target.files?.[0] || null)} />
              </label>

              <p className={styles.legenda}>
                Imagem do equipamento de proteção individual.
              </p>

              {imagem && (
                <button type="button" className={styles.removerImagem}
                  onClick={() => setImagem(null)}>
                  Remover imagem
                </button>
              )}
            </div>
          </div>

          <div className={styles.acoes}>
            <button type="button" className={styles.cancelar}
              onClick={() => router.back()}>
              CANCELAR
            </button>
            <button type="submit" className={styles.salvar}>
              CADASTRAR EPI
            </button>
          </div>
        </form>
      </main>
    </Shell>
  );
}
