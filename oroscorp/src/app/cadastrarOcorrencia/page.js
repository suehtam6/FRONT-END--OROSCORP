
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import styles from "../style/cadastrarOcorrencia.module.css";

export default function CadastrarOcorrencia() {
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);
  const [prioridade, setPrioridade] = useState("Média");
  const [imagem, setImagem] = useState(null);
  const [dados, setDados] = useState({
    funcionario: "", setor: "", camera: "", tipo: "",
    data: "", hora: "", status: "Aberta", descricao: ""
  });

  function atualizar(e) {
    setDados({ ...dados, [e.target.name]: e.target.value });
  }

  function registrar(e) {
    e.preventDefault();
    const formulario = new FormData();
    Object.entries({ ...dados, prioridade }).forEach(([k, v]) => formulario.append(k, v));
    if (imagem) formulario.append("imagem", imagem);
    console.log(Object.fromEntries(formulario));
    alert("Conecte a API para salvar a ocorrência.");
  }

  return (
    <Shell><section className={styles.conteudo}>
        <h1>Registrar ocorrência</h1>
        <p>Registre manualmente uma não conformidade com EPIs identificada no chão de fábrica.</p>

        <form className={styles.painel} onSubmit={registrar}>
          <div className={styles.layout}>
            <div className={styles.campos}>
              <div className={styles.campo}>
                <label>Funcionário <span>*</span></label>
                <select name="funcionario" value={dados.funcionario} onChange={atualizar} required>
                  <option value="">Selecione o funcionário</option>
                  <option value="1">Funcionário 1</option>
                  <option value="2">Funcionário 2</option>
                </select>
              </div>

              <div className={styles.linha}>
                <div className={styles.campo}>
                  <label>Setor <span>*</span></label>
                  <select name="setor" value={dados.setor} onChange={atualizar} required>
                    <option value="">Selecione o setor</option>
                    <option>Produção</option>
                    <option>Montagem</option>
                    <option>Manutenção</option>
                  </select>
                </div>
                <div className={styles.campo}>
                  <label>Câmera</label>
                  <select name="camera" value={dados.camera} onChange={atualizar}>
                    <option value="">Sem câmera associada</option>
                    <option>Câmera 01</option>
                    <option>Câmera 02</option>
                  </select>
                </div>
              </div>

              <div className={styles.campo}>
                <label>Tipo de ocorrência <span>*</span></label>
                <select name="tipo" value={dados.tipo} onChange={atualizar} required>
                  <option value="">Selecione o tipo</option>
                  <option>Sem capacete</option>
                  <option>Sem luvas</option>
                  <option>Sem óculos</option>
                  <option>Outros</option>
                </select>
              </div>

              <div className={styles.linha}>
                {["data", "hora"].map((nome) => (
                  <div className={styles.campo} key={nome}>
                    <label>{nome === "data" ? "Data" : "Hora"} <span>*</span></label>
                    <input type={nome === "data" ? "date" : "time"} name={nome}
                      value={dados[nome]} onChange={atualizar} required />
                  </div>
                ))}
              </div>

              <div className={styles.linha}>
                <div className={styles.campo}>
                  <label>Prioridade</label>
                  <div className={styles.prioridades}>
                    {["Baixa", "Média", "Alta", "Crítica"].map((p) => (
                      <button type="button" key={p}
                        className={prioridade === p ? styles.ativo : ""}
                        onClick={() => setPrioridade(p)}>{p}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.campo}>
                  <label>Status inicial</label>
                  <select name="status" value={dados.status} onChange={atualizar}>
                    <option>Aberta</option>
                    <option>Em análise</option>
                    <option>Resolvida</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.imagemArea}>
              <label className={styles.upload}>
                {imagem ? (
                  <img src={URL.createObjectURL(imagem)} alt="Ocorrência" />
                ) : (
                  <div>
                    <div className={styles.iconeUpload}>♧</div>
                    <strong>Adicionar print</strong>
                    <p>Clique para enviar uma imagem<br />ou arraste o arquivo aqui.</p>
                  </div>
                )}
                <input type="file" accept="image/*"
                  onChange={(e) => setImagem(e.target.files[0] || null)} hidden />
              </label>
              <label className={styles.alterar} htmlFor="arquivoExtra">
                ↥ Alterar imagem
              </label>
              <input id="arquivoExtra" type="file" accept="image/*" hidden
                onChange={(e) => setImagem(e.target.files[0] || null)} />
            </div>
          </div>

          <div className={styles.descricao}>
            <label>Descrição</label>
            <textarea name="descricao" value={dados.descricao} onChange={atualizar}
              placeholder="Descreva o que foi observado, as circunstâncias e as ações tomadas..." />
          </div>

          <div className={styles.acoes}>
            <button type="button" onClick={() => router.push("/ocorrencias")}>Cancelar</button>
            <button type="submit">♧ Registrar ocorrência</button>
          </div>
        </form>
      </section>
    </Shell>
  );
}
