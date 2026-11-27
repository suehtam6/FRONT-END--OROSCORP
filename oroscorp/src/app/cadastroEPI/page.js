"use client";

/*
Autor JS: Matheus Lucas
Data: 02 de novembro de 2026
Objetivo: Transformar a tela em dinamica e integrar upload com Cloudinary
*/

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadParaCloudinary } from "../../API/cloudinary.js";
import Shell from "../components/Shell";
import styles from "../style/cadastrarEpi.module.css";
import Popup from "../components/Popup";

export default function CadastroEPI() {
  const router = useRouter();
  const uploadRef = useRef({ arquivo: null, url: "" });

  const [imagem, setImagem] = useState(null);
  const [preview, setPreview] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Popups de Notificação
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Modal Gerenciador de Categorias
  const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");
  const [categoriaEditandoId, setCategoriaEditandoId] = useState(null);
  const [nomeCategoriaEditado, setNomeCategoriaEditado] = useState("");

  const [categorias, setCategorias] = useState([]);
  const [dados, setDados] = useState({
    nome: "",
    id_categoria_epi: "",
    cor: "",
    descricao: "",
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

  // Carregar categorias do backend
  async function carregarCategorias() {
    try {
      const res = await fetch("/api/categoria-epi");
      if (res.ok) {
        const json = await res.json();

        let lista = [];
        if (Array.isArray(json)) lista = json;
        else if (Array.isArray(json.dados)) lista = json.dados;
        else if (Array.isArray(json.response)) lista = json.response;
        else if (json.response && Array.isArray(json.response.dados))
          lista = json.response.dados;
        else if (json.content && Array.isArray(json.content))
          lista = json.content;

        setCategorias(lista);
      }
    } catch (error) {
      console.error("Erro ao buscar categorias de EPI:", error);
    }
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  function atualizar(e) {
    setDados({ ...dados, [e.target.name]: e.target.value });
  }

  // --- AÇÕES DO MODAL DE CATEGORIA ---
  async function criarCategoria(e) {
    e.preventDefault();
    if (!novaCategoriaNome.trim()) return;

    try {
      const res = await fetch("/api/categoria-epi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria: novaCategoriaNome.trim() }),
      });

      if (res.ok) {
        setNovaCategoriaNome("");
        await carregarCategorias();
      } else {
        const err = await res.json();
        setErro(err.message || "Erro ao criar categoria.");
      }
    } catch {
      setErro("Erro de conexão ao criar categoria.");
    }
  }

  async function salvarEdicaoCategoria(id) {
    if (!nomeCategoriaEditado.trim()) return;

    try {
      const res = await fetch(`/api/categoria-epi/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria: nomeCategoriaEditado.trim() }),
      });

      if (res.ok) {
        setCategoriaEditandoId(null);
        setNomeCategoriaEditado("");
        await carregarCategorias();
      } else {
        const err = await res.json();
        setErro(err.message || "Erro ao atualizar categoria.");
      }
    } catch {
      setErro("Erro de conexão ao atualizar categoria.");
    }
  }

  async function deletarCategoria(id) {
    if (!confirm("Deseja realmente excluir esta categoria?")) return;

    try {
      const res = await fetch(`/api/categoria-epi/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (Number(dados.id_categoria_epi) === id) {
          setDados((prev) => ({ ...prev, id_categoria_epi: "" }));
        }
        await carregarCategorias();
      } else {
        const err = await res.json();
        setErro(err.message || "Erro ao deletar categoria.");
      }
    } catch {
      setErro("Erro de conexão ao deletar categoria.");
    }
  }

  async function cadastrar(e) {
    e.preventDefault();
    if (carregando) return;

    setCarregando(true);
    setErro("");
    setSucesso("");

    try {
      let fotoUrl = "";
      if (imagem) {
        if (uploadRef.current.arquivo !== imagem) {
          try {
            const url = await uploadParaCloudinary(imagem);
            uploadRef.current = { arquivo: imagem, url };
          } catch {
            setErro(
              "Não foi possível enviar a foto para o Cloudinary. Tente novamente."
            );
            return;
          }
        }
        fotoUrl = uploadRef.current.url;
      }

      const payload = {
        nome: dados.nome,
        descricao: dados.descricao,
        foto: fotoUrl || "sem-foto.png",
        cor: dados.cor,
        id_categoria: Number(dados.id_categoria_epi),
      };

      const resposta = await fetch("/api/epi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const retorno = await resposta.json().catch(() => ({}));

      if (resposta.ok) {
        setSucesso("EPI cadastrado com sucesso!");
        setDados({ nome: "", id_categoria_epi: "", cor: "", descricao: "" });
        setImagem(null);
        uploadRef.current = { arquivo: null, url: "" };
      } else {
        setErro(retorno.message || retorno.response?.message || "Erro ao cadastrar o EPI.");
      }
    } catch {
      setErro("Erro de conexão ao salvar o EPI.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Shell>
      <main className={styles.pagina}>
        <div className={styles.titulo}>
          <h1>Cadastro de EPI</h1>
          <p>
            Preencha as informações para cadastrar um equipamento de proteção individual.
          </p>
        </div>

        <form className={styles.painel} onSubmit={cadastrar}>
          <div className={styles.layout}>
            <div className={styles.campos}>
              <h2>Informações do EPI</h2>

              <div className={styles.campo}>
                <label htmlFor="nome">
                  Nome do EPI <span>*</span>
                </label>
                <input
                  id="nome"
                  name="nome"
                  value={dados.nome || ""}
                  onChange={atualizar}
                  placeholder="Digite o nome do EPI"
                  required
                />
              </div>

              <div className={styles.campo}>
                <div className={styles.cabecalhoCampo}>
                  <label htmlFor="id_categoria_epi">
                    Categoria <span>*</span>
                  </label>
                  <button
                    type="button"
                    className={styles.botaoGerenciar}
                    onClick={() => setModalCategoriaAberto(true)}
                  >
                    + Gerenciar Categorias
                  </button>
                </div>
                <select
                  id="id_categoria_epi"
                  name="id_categoria_epi"
                  value={dados.id_categoria_epi || ""}
                  onChange={atualizar}
                  required
                >
                  <option value="">Selecione a categoria</option>
                  {categorias.map((cat, index) => {
                    const catId =
                      cat.id || cat.id_categoria_epi || cat.id_categoria || index;
                    const catNome =
                      cat.categoria || cat.nome_categoria || cat.nome || "Sem Nome";

                    return (
                      <option key={catId} value={catId}>
                        {catNome}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className={styles.linha}>
                <div className={styles.campo}>
                  <label htmlFor="cor">Cor</label>
                  <input
                    id="cor"
                    name="cor"
                    value={dados.cor || ""}
                    onChange={atualizar}
                    placeholder="Nome da Cor"
                  />
                </div>
              </div>

              <div className={styles.campo}>
                <label htmlFor="descricao">Descrição</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  rows={4}
                  placeholder="Descreva as características e a utilização do EPI..."
                  value={dados.descricao || ""}
                  onChange={atualizar}
                />
              </div>
            </div>

            <div className={styles.areaImagem}>
              <h2>Imagem do EPI</h2>
              <label className={styles.uploadImagem}>
                {preview ? (
                  <img
                    src={preview}
                    alt="Imagem do EPI"
                    className={styles.previewImagem}
                  />
                ) : (
                  <div className={styles.espacoImagem}>
                    <p>Clique para anexar uma imagem</p>
                    <small>PNG, JPG ou JPEG</small>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  hidden
                  onChange={(e) => setImagem(e.target.files?.[0] || null)}
                />
              </label>
              <p className={styles.legenda}>
                Imagem do equipamento de proteção individual.
              </p>
              {imagem && (
                <button
                  type="button"
                  className={styles.removerImagem}
                  onClick={() => {
                    setImagem(null);
                    uploadRef.current = { arquivo: null, url: "" };
                  }}
                >
                  Remover imagem
                </button>
              )}
            </div>
          </div>

          <div className={styles.acoes}>
            <button
              type="button"
              className={styles.cancelar}
              onClick={() => router.back()}
              disabled={carregando}
            >
              CANCELAR
            </button>
            <button type="submit" className={styles.salvar} disabled={carregando}>
              {carregando ? "CADASTRANDO..." : "CADASTRAR EPI"}
            </button>
          </div>
        </form>

        {/* MODAL DE GERENCIAMENTO DE CATEGORIAS */}
        {modalCategoriaAberto && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
              <div className={styles.modalCabecalho}>
                <h3>Gerenciar Categorias de EPI</h3>
                <button
                  type="button"
                  className={styles.modalFechar}
                  onClick={() => setModalCategoriaAberto(false)}
                >
                  ✕
                </button>
              </div>

              <div className={styles.modalFormulario}>
                <input
                  type="text"
                  placeholder="Nova Categoria..."
                  value={novaCategoriaNome || ""}
                  onChange={(e) => setNovaCategoriaNome(e.target.value)}
                  className={styles.modalInput}
                />
                <button
                  type="button"
                  onClick={criarCategoria}
                  className={styles.modalBotaoAdicionar}
                >
                  Adicionar
                </button>
              </div>

              <div className={styles.modalLista}>
                {categorias.map((item, index) => {
                  const itemId =
                    item.id || item.id_categoria_epi || item.id_categoria || index;
                  const itemNome =
                    item.categoria || item.nome_categoria || item.nome || "Sem Nome";

                  return (
                    <div key={itemId} className={styles.modalItem}>
                      {categoriaEditandoId === itemId ? (
                        <input
                          type="text"
                          value={nomeCategoriaEditado || ""}
                          onChange={(e) => setNomeCategoriaEditado(e.target.value)}
                          className={styles.modalInputEdicao}
                        />
                      ) : (
                        <span>● {itemNome}</span>
                      )}

                      <div className={styles.modalAcoesItem}>
                        {categoriaEditandoId === itemId ? (
                          <>
                            <button
                              type="button"
                              onClick={() => salvarEdicaoCategoria(itemId)}
                              className={styles.modalBotaoSalvar}
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => setCategoriaEditandoId(null)}
                              className={styles.modalBotaoCancelarItem}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setCategoriaEditandoId(itemId);
                                setNomeCategoriaEditado(itemNome);
                              }}
                              className={styles.modalBotaoEditar}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => deletarCategoria(itemId)}
                              className={styles.modalBotaoExcluir}
                            >
                              Excluir
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.modalRodape}>
                <button
                  type="button"
                  onClick={() => setModalCategoriaAberto(false)}
                  className={styles.modalBotaoConcluido}
                >
                  Concluído
                </button>
              </div>
            </div>
          </div>
        )}

        <Popup mensagem={erro} tipo="erro" aoFechar={() => setErro("")} />
        <Popup
          mensagem={sucesso}
          tipo="sucesso"
          titulo="EPI Cadastrado!"
          textoBotao="Ir para EPIs"
          aoFechar={() => router.push("/epis")}
        />
      </main>
    </Shell>
  );
}