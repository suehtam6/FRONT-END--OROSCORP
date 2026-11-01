"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import styles from "../style/cadastrarGestor.module.css";

// Função para aplicar a máscara do CPF (111.111.111-11)
function mascaraCPF(valor) {
  let v = valor.replace(/\D/g, ""); // Remove tudo o que não é dígito
  if (v.length > 11) v = v.substring(0, 11); // Limita a 11 dígitos
  
  if (v.length > 9) {
    v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  } else if (v.length > 6) {
    v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
  } else if (v.length > 3) {
    v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
  }
  return v;
}


function mascaraData(valor) {
  let v = valor.replace(/\D/g, ""); 
  if (v.length === 0) return "";

 
  let dia = v.substring(0, 2);
  let mes = v.substring(2, 4);
  let ano = v.substring(4, 8);

  
  if (dia.length === 2 && parseInt(dia, 10) > 31) {
    dia = "31";
  }


  if (mes.length === 2 && parseInt(mes, 10) > 12) {
    mes = "12";
  }

 
  const anoAtual = new Date().getFullYear();
  if (ano.length === 4 && parseInt(ano, 10) > anoAtual) {
    ano = anoAtual.toString();
  }


  let resultado = dia;
  if (v.length >= 3) {
    resultado += "/" + mes;
  }
  if (v.length >= 5) {
    resultado += "/" + ano;
  }

  return resultado;
}


export default function CadastrarGestor() {
  const router = useRouter();

  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  
  // Estados para os Níveis de Acesso
  const [niveisAcesso, setNiveisAcesso] = useState([]);
  const [mostrarInputNivel, setMostrarInputNivel] = useState(false);
  const [novoNivel, setNovoNivel] = useState("");

  const [dados, setDados] = useState({
    nome: "",
    email: "",
    confirmarEmail: "",
    cpf: "",
    nascimento: "",
    senha: "",
    confirmarSenha: "",
    id_nivel_acesso: ""
  });

  // Busca os níveis de acesso ao carregar a página
  useEffect(() => {
    async function carregarNiveis() {
      try {
        const res = await fetch("/api/nivel-acesso");
        const dadosAPI = await res.json();
        
        if (res.ok) {
          const listaNiveis = dadosAPI.response?.dados || dadosAPI.response || dadosAPI.dados || dadosAPI;
          if (Array.isArray(listaNiveis)) {
            setNiveisAcesso(listaNiveis);
          } else {
            setNiveisAcesso([]);
          }
        }
      } catch (error) {
        console.error("Falha de ligação ao buscar níveis:", error);
      }
    }
    carregarNiveis();
  }, []);

  useEffect(() => {
    if (!foto) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(foto);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  // Função atualizar que aplica as máscaras
  function atualizar(evento) {
    const { name, value } = evento.target;
    let novoValor = value;

    if (name === "cpf") {
      novoValor = mascaraCPF(value);
    } else if (name === "nascimento") {
      novoValor = mascaraData(value);
    }

    setDados({
      ...dados,
      [name]: novoValor
    });
    setMensagem("");
  }

  // Função para criar o novo nível internamente
  async function salvarNovoNivel() {
    if (!novoNivel || novoNivel.trim() === "") {
      setMostrarInputNivel(false);
      return;
    }

    try {
      const res = await fetch("/api/nivel-acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNivel })
      });

      if (res.ok) {
        setMensagem(`Nível "${novoNivel}" criado com sucesso!`);
        setNovoNivel(""); 
        setMostrarInputNivel(false); 
        

        const resAtualizada = await fetch("/api/nivel-acesso");
        const dadosAPI = await resAtualizada.json();
        const listaNiveis = dadosAPI.response?.dados || dadosAPI.response || dadosAPI.dados || dadosAPI;
        setNiveisAcesso(Array.isArray(listaNiveis) ? listaNiveis : []);
      } else {
        const erro = await res.json();
        setMensagem(erro.message || "Erro ao criar o nível.");
      }
    } catch (error) {
      setMensagem("Erro de ligação ao criar nível.");
    }
  }


  async function cadastrar(evento) {
    evento.preventDefault();

    if (dados.email !== dados.confirmarEmail) {
      setMensagem("Os e-mails não coincidem.");
      return;
    }
    if (dados.senha !== dados.confirmarSenha) {
      setMensagem("As senhas não coincidem.");
      return;
    }
    if (!dados.id_nivel_acesso) {
      setMensagem("Selecione um nível de acesso.");
      return;
    }

    // Converte a data de DD/MM/AAAA para AAAA-MM-DD para a API
    let dataFormatada = dados.nascimento;
    const partesData = dados.nascimento.split('/');
    if (partesData.length === 3) {
      dataFormatada = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;
    }


    setCarregando(true);
    setMensagem("");

    try {
      const resposta = await fetch("/api/responsavel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: dados.nome,
          email: dados.email,
          cpf: dados.cpf, 
          data_nascimento: dataFormatada, 
          senha: dados.senha,
          id_nivel_acesso: Number(dados.id_nivel_acesso),
          foto: "" 
        }),
      });

      const retorno = await resposta.json();

      if (resposta.ok) {
        setMensagem("Gestor cadastrado com sucesso!");

        setTimeout(() => router.push("/home"), 1500);
      } else {
        setMensagem(retorno.message || "Erro ao cadastrar gestor.");
      }
    } catch (erro) {
      setMensagem("Erro de ligação com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Shell voltar={false}>
      <main className={styles.container}>
        <section className={styles.cadastroBox}>
          <div className={styles.titulo}>
            <div>
              <h1>Cadastro do Gestor</h1>
              <p>Preencha os dados para cadastrar um novo gestor no sistema.</p>
            </div>
            <button
              type="button"
              className={styles.sair}
              onClick={() => router.push("/home")}
            >
              SAIR
            </button>
          </div>

          <form onSubmit={cadastrar}>
            <div className={styles.formulario}>
              <div className={styles.fotoColuna}>
                <label className={styles.fotoArea}>
                  {preview ? (
                    <img src={preview} alt="Foto" className={styles.previewImagem} />
                  ) : (
                    <div className={styles.fotoTexto}>
                      <strong>Adicionar foto</strong>
                      <p>Clique para selecionar uma imagem</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" hidden onChange={(e) => setFoto(e.target.files?.[0] || null)} />
                </label>
                {foto && (
                  <button type="button" className={styles.removerFoto} onClick={() => setFoto(null)}>
                    Remover foto
                  </button>
                )}
              </div>

              <div className={styles.campos}>
                <div className={styles.campo}>
                  <label htmlFor="nome">Nome completo <span>*</span></label>
                  <input id="nome" name="nome" value={dados.nome} onChange={atualizar} placeholder="Digite o nome completo" required />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="email">E-mail <span>*</span></label>
                  <input id="email" name="email" type="email" value={dados.email} onChange={atualizar} placeholder="exemplo@dominio.com" required />
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
                    maxLength="14" 
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="confirmarEmail">Confirmar e-mail <span>*</span></label>
                  <input id="confirmarEmail" name="confirmarEmail" type="email" value={dados.confirmarEmail} onChange={atualizar} placeholder="Digite o e-mail novamente" required />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="nascimento">Data de nascimento <span>*</span></label>
                  <input 
                    id="nascimento" 
                    name="nascimento" 
                    type="text" 
                    value={dados.nascimento} 
                    onChange={atualizar} 
                    placeholder="DD/MM/AAAA" 
                    required 
                    maxLength="10" 
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="senha">Senha <span>*</span></label>
                  <input id="senha" name="senha" type="password" value={dados.senha} onChange={atualizar} placeholder="Digite a senha" required />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="confirmarSenha">Confirmar senha <span>*</span></label>
                  <input id="confirmarSenha" name="confirmarSenha" type="password" value={dados.confirmarSenha} onChange={atualizar} placeholder="Digite a senha novamente" required />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="id_nivel_acesso">Nível de Acesso <span>*</span></label>
                  <select 
                    id="id_nivel_acesso" 
                    name="id_nivel_acesso" 
                    value={dados.id_nivel_acesso} 
                    onChange={atualizar} 
                    required
                  >
                    <option value="" disabled>Selecione um nível</option>
                    {/* Filtra para não mostrar o "ADM" */}
                    {niveisAcesso
                      .filter((nivel) => nivel.nome.toUpperCase() !== "ADM")
                      .map((nivel) => (
                        <option key={nivel.id} value={nivel.id}>
                          {nivel.nome}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

          
            {mensagem && (
              <div className={styles.popupOverlay}>
                <div className={styles.popupBox}>
                  <p>{mensagem}</p>
                  <button type="button" onClick={() => setMensagem("")}>
                    OK
                  </button>
                </div>
              </div>
            )}

            <div className={styles.botoes}>
              {!mostrarInputNivel ? (
                <button 
                  type="button" 
                  className={styles.btnNovoNivel} 
                  onClick={() => setMostrarInputNivel(true)}
                >
                  + NOVO NÍVEL DE ACESSO
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px', marginRight: 'auto', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Nome do nível..."
                    value={novoNivel}
                    onChange={(e) => setNovoNivel(e.target.value)}
                    style={{
                      height: '35px', 
                      padding: '0 10px', 
                      background: '#151a1f',
                      border: '1px solid #303842', 
                      borderRadius: '7px', 
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                  <button type="button" onClick={salvarNovoNivel} className={styles.cadastrar} style={{ padding: '9px 12px' }}>
                    SALVAR
                  </button>
                  <button type="button" onClick={() => { setMostrarInputNivel(false); setNovoNivel(""); }} className={styles.cancelar} style={{ padding: '9px 12px' }}>
                    X
                  </button>
                </div>
              )}

              <button type="button" className={styles.cancelar} onClick={() => router.push("/home")} disabled={carregando}>
                CANCELAR
              </button>
              <button type="submit" className={styles.cadastrar} disabled={carregando}>
                {carregando ? "CADASTRANDO..." : "CADASTRAR GESTOR"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </Shell>
  );
}