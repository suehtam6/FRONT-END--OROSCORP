
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import styles from "../style/cadastrarCamera.module.css";

export default function CadastrarCamera() {
  const router = useRouter();

  const [imagem, setImagem] = useState(null);
  const [dados, setDados] = useState({
    nome: "",
    endereco: "",
    setor: "",
    localizacao: "",
    descricao: "",
    status: "Online"
  });

  // Os setores serão carregados pela API
  const setores = [];

  function atualizar(e) {
    setDados({
      ...dados,
      [e.target.name]: e.target.value
    });
  }

  function registrar(e) {
    e.preventDefault();

    const formulario = new FormData();

    Object.entries(dados).forEach(([chave, valor]) => {
      formulario.append(chave, valor);
    });

    if (imagem) {
      formulario.append("imagem", imagem);
    }

    console.log("Dados da câmera:", Object.fromEntries(formulario));
    alert("Formulário pronto! Conecte a API para salvar a câmera.");
  }

  return (
    <Shell>
      <main className={styles.pagina}>
        <div className={styles.titulo}>
          <h1>Cadastrar Câmera</h1>
          <p>
            Preencha as informações para cadastrar
            uma nova câmera de monitoramento.
          </p>
        </div>

        <form className={styles.painel} onSubmit={registrar}>
          <div className={styles.layout}>

            {/* CAMPOS DO FORMULÁRIO */}
            <div className={styles.campos}>
              <h2>Informações da câmera</h2>

              <div className={styles.campo}>
                <label>Nome da câmera <span>*</span></label>
                <input
                  type="text"
                  name="nome"
                  placeholder="Ex: Câmera 01"
                  value={dados.nome}
                  onChange={atualizar}
                  required
                />
              </div>

              <div className={styles.campo}>
                <label>Endereço IP <span>*</span></label>
                <input
                  type="text"
                  name="endereco"
                  placeholder="Ex: 192.168.0.10"
                  value={dados.endereco}
                  onChange={atualizar}
                  required
                />
              </div>

              <div className={styles.campo}>
                <label>Setor <span>*</span></label>
                <select
                  name="setor"
                  value={dados.setor}
                  onChange={atualizar}
                  required
                >
                  <option value="">Selecione o setor</option>
                  {setores.map((setor) => (
                    <option key={setor.id} value={setor.id}>
                      {setor.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.campo}>
                <label>Localização</label>
                <input
                  type="text"
                  name="localizacao"
                  placeholder="Ex: Entrada principal, Galpão A"
                  value={dados.localizacao}
                  onChange={atualizar}
                />
              </div>

              <div className={styles.campo}>
                <label>Descrição</label>
                <textarea
                  name="descricao"
                  placeholder="Descreva a localização e a finalidade da câmera..."
                  value={dados.descricao}
                  onChange={atualizar}
                  rows={4}
                />
              </div>

              <div className={styles.campo}>
                <label>Status inicial</label>
                <div className={styles.status}>
                  {["Online", "Offline"].map((opcao) => (
                    <button
                      type="button"
                      key={opcao}
                      className={
                        dados.status === opcao
                          ? styles.statusAtivo
                          : ""
                      }
                      onClick={() =>
                        setDados({ ...dados, status: opcao })
                      }
                    >
                      ● {opcao}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* FOTO DO EQUIPAMENTO */}
            <div className={styles.imagemArea}>
              <h2>Imagem da câmera</h2>

              <label className={styles.uploadImagem}>
                {imagem ? (
                  <img
                    src={URL.createObjectURL(imagem)}
                    alt="Foto do equipamento"
                    className={styles.fotoCamera}
                  />
                ) : (
                  <div className={styles.conteudoUpload}>
                    <span className={styles.iconeUpload}>📷</span>
                    <strong>Adicionar imagem da câmera</strong>
                    <p>
                      Clique para selecionar uma foto
                      <br />
                      do equipamento utilizado.
                    </p>
                    <small>PNG, JPG ou JPEG</small>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  hidden
                  onChange={(e) =>
                    setImagem(e.target.files?.[0] || null)
                  }
                />
              </label>

              <p className={styles.legenda}>
                Fotografia da câmera instalada no setor.
              </p>

              {imagem && (
                <button
                  type="button"
                  className={styles.removerImagem}
                  onClick={() => setImagem(null)}
                >
                  Remover imagem
                </button>
              )}

              <div className={styles.informacoes}>
                <h3>Informações</h3>
                <p>
                  A imagem será utilizada para identificar
                  o equipamento cadastrado.
                </p>
                <p>
                  O monitoramento em tempo real será
                  configurado separadamente.
                </p>
              </div>
            </div>
          </div>

          {/* BOTÕES */}
          <div className={styles.acoes}>
            <button
              type="button"
              className={styles.cancelar}
              onClick={() => router.push("/cameras")}
            >
              CANCELAR
            </button>

            <button
              type="submit"
              className={styles.cadastrar}
            >
              CADASTRAR CÂMERA
            </button>
          </div>
        </form>
      </main>
    </Shell>
  );
}
