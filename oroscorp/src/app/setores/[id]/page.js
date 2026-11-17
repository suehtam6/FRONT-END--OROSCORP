"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { uploadParaCloudinary } from "@/API/cloudinary";
import Shell from "../../components/Shell.js";
import styles from "../../style/detalheSetor.module.css";

const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO_MB = 2;

export default function DetalhesSetor() {
  const params = useParams();
  const id = params?.id || Object.values(params || {})[0];
  const router = useRouter();

  const inputFotoRef = useRef(null);
  const uploadRef = useRef({ arquivo: null, url: "" });

  const [setor, setSetor] = useState(null);
  const [catalogoEpis, setCatalogoEpis] = useState([]);
  const [epiSelecionado, setEpiSelecionado] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // Estados para edição dos dados gerais e foto do setor
  const [editandoSetor, setEditandoSetor] = useState(false);
  const [fotoArquivo, setFotoArquivo] = useState(null);
  const [previewFoto, setPreviewFoto] = useState("");
  const [arrastandoFoto, setArrastandoFoto] = useState(false);
  const [erroFoto, setErroFoto] = useState("");
  const [formSetor, setFormSetor] = useState({
    nome: "",
    descricao: "",
    local: "",
    foto: "",
    id_status_setor: 1,
  });

  // Gera preview local da nova imagem escolhida e limpa a memória depois
  useEffect(() => {
    if (!fotoArquivo) {
      setPreviewFoto("");
      return;
    }
    const url = URL.createObjectURL(fotoArquivo);
    setPreviewFoto(url);
    return () => URL.revokeObjectURL(url);
  }, [fotoArquivo]);

  const carregarSetor = useCallback(async () => {
    if (!id) {
      setErro("ID do setor não encontrado na URL.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const res = await fetch(`/api/setor/dados/${id}`, {
        cache: "no-store",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          json?.message ||
            json?.erro ||
            `Erro ${res.status} na rota /api/setor/dados/${id}`
        );
      }

      const dadosSetor =
        json?.response?.setor ||
        json?.setor ||
        json?.response?.dados ||
        json?.dados ||
        (json?.id ? json : null);

      if (!dadosSetor || typeof dadosSetor !== "object") {
        throw new Error("A API respondeu, mas não retornou o objeto 'setor'.");
      }

      const episUnicos = Array.isArray(dadosSetor.epi)
        ? Array.from(
            new Map(
              dadosSetor.epi
                .filter((item) => item && (item.id || item.ID_epi))
                .map((item) => [Number(item.id ?? item.ID_epi), item])
            ).values()
          )
        : [];

      const responsaveisUnicos = Array.isArray(dadosSetor.responsavel)
        ? Array.from(
            new Map(
              dadosSetor.responsavel
                .filter((resp) => {
                  const rId =
                    resp?.ID_RESPONSAVEL ?? resp?.id_responsavel ?? resp?.id;
                  return (
                    rId !== undefined &&
                    rId !== null &&
                    !Number.isNaN(Number(rId))
                  );
                })
                .map((resp) => {
                  const rId = Number(
                    resp.ID_RESPONSAVEL ?? resp.id_responsavel ?? resp.id
                  );
                  return [
                    rId,
                    {
                      id: rId,
                      nome:
                        resp.Nome_responsavel ??
                        resp.nome_responsavel ??
                        resp.nome ??
                        "Sem nome",
                      email:
                        resp.Email_responsavel ??
                        resp.email_responsavel ??
                        resp.email ??
                        "-",
                      cpf:
                        resp.CPF_RESPONSAVEL ??
                        resp.cpf_responsavel ??
                        resp.cpf ??
                        "-",
                      foto:
                        resp.Foto_responsavel ??
                        resp.foto_responsavel ??
                        resp.foto ??
                        "",
                    },
                  ];
                })
            ).values()
          )
        : [];

      const setorNormalizado = {
        id: dadosSetor.id ?? id,
        nome: dadosSetor.nome || `Setor ${id}`,
        descricao: dadosSetor.descricao || "Nenhuma descrição disponível.",
        foto: dadosSetor.foto || "",
        local: dadosSetor.local || "",
        id_status_setor: dadosSetor.id_status_setor ?? 1,
        totalFuncionarios:
          dadosSetor.Total_funcionarios ??
          (Array.isArray(dadosSetor.funcionarios)
            ? dadosSetor.funcionarios.length
            : 0),
        totalCameras:
          dadosSetor.Total_cameras ??
          (Array.isArray(dadosSetor.cameras) ? dadosSetor.cameras.length : 0),
        totalOcorrenciasAbertas:
          dadosSetor.Total_ocorrencias_abertas ??
          (Array.isArray(dadosSetor.ocorrencias)
            ? dadosSetor.ocorrencias.filter(
                (o) => o.status?.toLowerCase() === "aberta"
              ).length
            : 0),
        funcionarios: Array.isArray(dadosSetor.funcionarios)
          ? dadosSetor.funcionarios
          : [],
        cameras: Array.isArray(dadosSetor.cameras) ? dadosSetor.cameras : [],
        ocorrencias: Array.isArray(dadosSetor.ocorrencias)
          ? dadosSetor.ocorrencias
          : [],
        epis: episUnicos,
        responsaveis: responsaveisUnicos,
      };

      setSetor(setorNormalizado);
      setFormSetor({
        nome: setorNormalizado.nome,
        descricao: setorNormalizado.descricao,
        local: setorNormalizado.local,
        foto: setorNormalizado.foto,
        id_status_setor: setorNormalizado.id_status_setor,
      });
    } catch (err) {
      setErro(err.message || "Falha ao carregar informações do setor.");
    } finally {
      setCarregando(false);
    }
  }, [id]);

  const carregarCatalogoEpis = useCallback(async () => {
    try {
      const res = await fetch("/api/epi", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const lista = Array.isArray(json)
          ? json
          : json?.response?.epi ||
            json?.response?.dados ||
            json?.dados ||
            json?.epi ||
            [];
        setCatalogoEpis(lista);
      }
    } catch {
      // Silencia falha secundária no catálogo
    }
  }, []);

  useEffect(() => {
    carregarSetor();
    carregarCatalogoEpis();
  }, [carregarSetor, carregarCatalogoEpis]);

  // Handlers de seleção de foto (clique ou drag & drop)
  const selecionarFoto = (arquivo) => {
    if (!arquivo) return;

    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      setErroFoto("A foto deve ser JPG, PNG ou WebP.");
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
      setErroFoto(`A foto deve ter no máximo ${TAMANHO_MAXIMO_MB} MB.`);
      return;
    }

    setErroFoto("");
    setFotoArquivo(arquivo);
  };

  const abrirSeletorFoto = () => inputFotoRef.current?.click();

  const aoEscolherArquivo = (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    selecionarFoto(arquivo);
  };

  const soltarFoto = (e) => {
    e.preventDefault();
    setArrastandoFoto(false);
    selecionarFoto(e.dataTransfer.files?.[0]);
  };

  // Envia o PUT completo do setor para /api/setor/[id]
  const enviarPutSetor = async ({
    dadosGerais = setor,
    listaIdsEpi = setor.epis.map((item) => Number(item.id)),
  }) => {
    setSalvando(true);
    try {
      const payload = {
        nome: dadosGerais.nome,
        foto: dadosGerais.foto,
        descricao: dadosGerais.descricao,
        local: dadosGerais.local,
        id_status_setor: Number(dadosGerais.id_status_setor) || 1,
        id_epi: listaIdsEpi
          .map((epiId) => Number(epiId))
          .filter((n) => !Number.isNaN(n))
          .map((n) => ({ id: n })),
        id_responsavel: setor.responsaveis
          .map((resp) => Number(resp.id))
          .filter((n) => !Number.isNaN(n))
          .map((n) => ({ id: n })),
      };

      const res = await fetch(`/api/setor/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || data?.erro || "Não foi possível atualizar o setor."
        );
      }

      setEpiSelecionado("");
      setEditandoSetor(false);
      setFotoArquivo(null);
      setErroFoto("");
      await carregarSetor();
    } catch (err) {
      alert(err.message || "Erro ao salvar alterações no setor.");
    } finally {
      setSalvando(false);
    }
  };

  // Faz upload para o Cloudinary se uma nova foto foi escolhida e salva o setor
  const handleSalvarDadosSetor = async (e) => {
    e.preventDefault();
    if (!formSetor.nome.trim()) {
      alert("O nome do setor não pode ficar vazio.");
      return;
    }

    setSalvando(true);
    try {
      let fotoUrlFinal = formSetor.foto;

      if (fotoArquivo) {
        if (uploadRef.current.arquivo !== fotoArquivo) {
          let urlRetornada;
          try {
            urlRetornada = await uploadParaCloudinary(fotoArquivo);
          } catch {
            setErroFoto("Não foi possível enviar a foto para o Cloudinary.");
            setSalvando(false);
            return;
          }
          uploadRef.current = { arquivo: fotoArquivo, url: urlRetornada };
        }
        fotoUrlFinal = uploadRef.current.url;
      }

      await enviarPutSetor({
        dadosGerais: {
          ...formSetor,
          foto: fotoUrlFinal,
        },
      });
    } catch {
      setSalvando(false);
    }
  };

  const handleCancelarEdicao = () => {
    setFormSetor({
      nome: setor.nome,
      descricao: setor.descricao,
      local: setor.local,
      foto: setor.foto,
      id_status_setor: setor.id_status_setor,
    });
    setFotoArquivo(null);
    setErroFoto("");
    setEditandoSetor(false);
  };

  const handleAdicionarEpi = async (e) => {
    e.preventDefault();
    if (!epiSelecionado || !setor) return;

    const idNovoEpi = Number(epiSelecionado);
    const jaVinculado = setor.epis.some((item) => Number(item.id) === idNovoEpi);

    if (jaVinculado) {
      alert("Este EPI já está cadastrado neste setor.");
      return;
    }

    await enviarPutSetor({
      listaIdsEpi: [
        ...setor.epis.map((item) => Number(item.id)),
        idNovoEpi,
      ],
    });
  };

  const handleRemoverEpi = async (idEpiRemover) => {
    if (!setor || salvando) return;

    const idsAtualizados = setor.epis
      .filter((item) => Number(item.id) !== Number(idEpiRemover))
      .map((item) => Number(item.id));

    await enviarPutSetor({
      listaIdsEpi: idsAtualizados,
    });
  };

  if (carregando) {
    return (
      <Shell>
        <div className={styles.conteudo}>
          <div className={styles.estado}>Carregando dados do setor...</div>
        </div>
      </Shell>
    );
  }

  if (erro || !setor) {
    return (
      <Shell>
        <div className={styles.conteudo}>
          <div className={`${styles.estado} ${styles.estadoErro}`}>
            {erro || "Setor não encontrado."}
          </div>
          <button
            className={styles.botaoVoltar}
            onClick={() => router.push("/setores")}
          >
            ← Voltar para setores
          </button>
        </div>
      </Shell>
    );
  }

  const episDisponiveis = catalogoEpis.filter((item) => {
    const itemId = Number(item.id ?? item.ID_epi);
    return !setor.epis.some((vinculado) => Number(vinculado.id) === itemId);
  });

  const imagemExibidaNaEdicao = previewFoto || formSetor.foto;

  return (
    <Shell>
      <section className={styles.conteudo}>
        {/* Cabeçalho e Indicadores do Setor */}
        <div className={styles.cardPrincipal}>
          {!editandoSetor ? (
            <div className={styles.topoCardPrincipal}>
              <div>
                <h1>{setor.nome}</h1>
                <p className={styles.descricaoSetor}>{setor.descricao}</p>
                {setor.local && (
                  <span className={styles.localBadge}>{setor.local}</span>
                )}
              </div>

              <div className={styles.acoesTopo}>
                <button
                  type="button"
                  className={styles.botaoEditar}
                  onClick={() => setEditandoSetor(true)}
                >
                  Editar Setor
                </button>
                <button
                  type="button"
                  className={styles.botaoVoltar}
                  onClick={() => router.push("/setores")}
                >
                  ← Voltar
                </button>
              </div>
            </div>
          ) : (
            <form
              className={styles.formEditarSetor}
              onSubmit={handleSalvarDadosSetor}
            >
              <div className={styles.topoFormEdicao}>
                <h2 className={styles.tituloSecao}>Editar Dados do Setor</h2>
                <div className={styles.acoesTopo}>
                  <button
                    type="button"
                    className={styles.botaoVoltar}
                    onClick={handleCancelarEdicao}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.botaoAdicionarEpi}
                    disabled={salvando}
                  >
                    {salvando ? "Enviando e salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </div>

              <div className={styles.gradeFormEdicao}>
                {/* Área de Upload de Foto para Cloudinary */}
                <div className={`${styles.campoGrupo} ${styles.campoLargo}`}>
                  <label className={styles.labelCampo}>Foto do Setor</label>

                  <div
                    className={`${styles.areaUploadFoto} ${
                      arrastandoFoto ? styles.areaUploadArrastando : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={abrirSeletorFoto}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        abrirSeletorFoto();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setArrastandoFoto(true);
                    }}
                    onDragLeave={() => setArrastandoFoto(false)}
                    onDrop={soltarFoto}
                  >
                    <input
                      ref={inputFotoRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={aoEscolherArquivo}
                      onClick={(e) => e.stopPropagation()}
                      hidden
                    />

                    {imagemExibidaNaEdicao ? (
                      <img
                        src={imagemExibidaNaEdicao}
                        alt="Prévia do setor"
                        className={styles.previewImagemSetor}
                      />
                    ) : (
                      <div className={styles.placeholderUpload}>📷</div>
                    )}

                    <div className={styles.textoUpload}>
                      <strong>
                        {fotoArquivo
                          ? `Novo arquivo: ${fotoArquivo.name}`
                          : "Clique para selecionar ou arraste uma nova foto"}
                      </strong>
                      <span>JPG, PNG ou WebP (máx. {TAMANHO_MAXIMO_MB} MB)</span>
                    </div>
                  </div>

                  {erroFoto && (
                    <span className={styles.erroUpload}>{erroFoto}</span>
                  )}
                </div>

                <div className={styles.campoGrupo}>
                  <label className={styles.labelCampo}>Nome do Setor</label>
                  <input
                    type="text"
                    className={styles.inputCampo}
                    value={formSetor.nome}
                    onChange={(e) =>
                      setFormSetor({ ...formSetor, nome: e.target.value })
                    }
                    placeholder="Ex: Soldagem Estrutural"
                    required
                  />
                </div>

                <div className={styles.campoGrupo}>
                  <label className={styles.labelCampo}>Localização</label>
                  <input
                    type="text"
                    className={styles.inputCampo}
                    value={formSetor.local}
                    onChange={(e) =>
                      setFormSetor({ ...formSetor, local: e.target.value })
                    }
                    placeholder="Ex: Galpão A, piso 1"
                  />
                </div>

                <div className={styles.campoGrupo}>
                  <label className={styles.labelCampo}>Status do Setor</label>
                  <select
                    className={styles.inputCampo}
                    value={formSetor.id_status_setor}
                    onChange={(e) =>
                      setFormSetor({
                        ...formSetor,
                        id_status_setor: Number(e.target.value),
                      })
                    }
                  >
                    <option value={1}>Ativo</option>
                    <option value={2}>Inativo</option>
                  </select>
                </div>

                <div className={`${styles.campoGrupo} ${styles.campoLargo}`}>
                  <label className={styles.labelCampo}>Descrição</label>
                  <textarea
                    rows={3}
                    className={styles.textareaCampo}
                    value={formSetor.descricao}
                    onChange={(e) =>
                      setFormSetor({ ...formSetor, descricao: e.target.value })
                    }
                    placeholder="Descreva as atividades e riscos deste setor..."
                  />
                </div>
              </div>
            </form>
          )}

          <div className={styles.gradeIndicadores}>
            <div className={styles.boxIndicador}>
              <div className={styles.cabecalhoIndicador}>
                <svg viewBox="0 0 24 24">
                  <circle cx="9" cy="7" r="3" />
                  <path d="M3 19v-2a6 6 0 0 1 12 0v2H3Z" />
                </svg>
                <span>Funcionários</span>
              </div>
              <strong className={styles.valorIndicador}>
                {setor.totalFuncionarios}
              </strong>
            </div>

            <div className={styles.boxIndicador}>
              <div className={styles.cabecalhoIndicador}>
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="6" width="13" height="12" rx="2" />
                  <path d="m16 10 5-3v10l-5-3" />
                </svg>
                <span>Câmeras</span>
              </div>
              <strong className={styles.valorIndicador}>
                {setor.totalCameras}
              </strong>
            </div>

            <div className={styles.boxIndicador}>
              <div className={styles.cabecalhoIndicador}>
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4m0 4h.01" />
                </svg>
                <span>Ocorrências abertas</span>
              </div>
              <strong
                className={`${styles.valorIndicador} ${styles.valorAlerta}`}
              >
                {setor.totalOcorrenciasAbertas}
              </strong>
            </div>
          </div>
        </div>

        {/* Responsáveis pelo Setor */}
        <div className={styles.cardSecao}>
          <h2 className={styles.tituloSecao}>
            Responsáveis pelo Setor ({setor.responsaveis.length})
          </h2>

          {setor.responsaveis.length > 0 ? (
            <div className={styles.tabelaWrapper}>
              <table className={styles.tabela}>
                <thead>
                  <tr>
                    <th>Responsável</th>
                    <th>E-mail</th>
                    <th>CPF</th>
                  </tr>
                </thead>
                <tbody>
                  {setor.responsaveis.map((resp, idx) => (
                    <tr key={`resp-${resp.id}-${idx}`}>
                      <td>
                        <div className={styles.infoFuncionario}>
                          {resp.foto && (
                            <img
                              src={resp.foto}
                              alt={resp.nome}
                              className={styles.avatarFuncionario}
                            />
                          )}
                          <span>{resp.nome}</span>
                        </div>
                      </td>
                      <td>{resp.email}</td>
                      <td>{resp.cpf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.vazio}>
              Nenhum responsável vinculado a este setor.
            </p>
          )}
        </div>

        {/* Funcionários e Câmeras */}
        <div className={styles.gradeDupla}>
          <div className={styles.cardSecao}>
            <h2 className={styles.tituloSecao}>Funcionários do Setor</h2>

            {setor.funcionarios.length > 0 ? (
              <div className={styles.tabelaWrapper}>
                <table className={styles.tabela}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Cargo</th>
                      <th>Status</th>
                      <th>Ocorrências</th>
                    </tr>
                  </thead>
                  <tbody>
                    {setor.funcionarios.map((func, idx) => {
                      const funcId =
                        func.id ?? func.ID_funcionario ?? func.id_funcionario;
                      return (
                        <tr
                          key={`func-${funcId ?? idx}-${idx}`}
                          className={funcId ? styles.linhaClicavel : undefined}
                          onClick={() => {
                            if (funcId) router.push(`/funcionarios/${funcId}`);
                          }}
                          title={
                            funcId ? `Ver detalhes de ${func.nome}` : undefined
                          }
                        >
                          <td>
                            <div className={styles.infoFuncionario}>
                              {func.foto && (
                                <img
                                  src={func.foto}
                                  alt={func.nome}
                                  className={styles.avatarFuncionario}
                                />
                              )}
                              <span>{func.nome}</span>
                            </div>
                          </td>
                          <td>{func.cargo}</td>
                          <td>
                            <span
                              className={`${styles.badgeStatus} ${
                                func.status?.toLowerCase() === "ativo"
                                  ? styles.statusAtivo
                                  : styles.statusInativo
                              }`}
                            >
                              {func.status}
                            </span>
                          </td>
                          <td>{func.ocorrencias ?? 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.vazio}>
                Nenhum funcionário encontrado neste setor.
              </p>
            )}
          </div>

          <div className={styles.cardSecao}>
            <h2 className={styles.tituloSecao}>Câmeras do Setor</h2>

            {setor.cameras.length > 0 ? (
              <div className={styles.listaCameras}>
                {setor.cameras.map((cam, idx) => (
                  <div
                    key={`cam-${cam.id ?? idx}-${idx}`}
                    className={styles.itemCamera}
                  >
                    <span>{cam.nome}</span>
                    <span
                      className={
                        cam.status?.toUpperCase() === "ONLINE"
                          ? styles.statusOnline
                          : styles.statusOffline
                      }
                    >
                      {cam.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.vazio}>Nenhuma câmera vinculada.</p>
            )}
          </div>
        </div>

        {/* EPIs do Setor e Cadastro de Novos EPIs */}
        <div className={styles.cardSecao}>
          <div className={styles.topoSecaoEpi}>
            <div>
              <h2 className={styles.tituloSecao}>
                EPIs do Setor ({setor.epis.length})
              </h2>
              <p className={styles.subtituloSecao}>
                Equipamentos de proteção individual obrigatórios nesta área.
              </p>
            </div>

            <form
              className={styles.formAdicionarEpi}
              onSubmit={handleAdicionarEpi}
            >
              <select
                className={styles.selectEpi}
                value={epiSelecionado}
                onChange={(e) => setEpiSelecionado(e.target.value)}
                disabled={salvando}
              >
                <option value="">
                  {episDisponiveis.length > 0
                    ? "Selecione um EPI para adicionar..."
                    : "Todos os EPIs já foram adicionados"}
                </option>
                {episDisponiveis.map((item, idx) => {
                  const epiId = item.id ?? item.ID_epi;
                  const epiNome = item.nome ?? item.Nome_epi;
                  return (
                    <option key={`cat-${epiId}-${idx}`} value={epiId}>
                      {epiNome}
                    </option>
                  );
                })}
              </select>

              <button
                type="submit"
                className={styles.botaoAdicionarEpi}
                disabled={salvando || !epiSelecionado}
              >
                {salvando ? "Salvando..." : "+ Adicionar EPI"}
              </button>
            </form>
          </div>

          {setor.epis.length > 0 ? (
            <div className={styles.gradeEpis}>
              {setor.epis.map((epi, idx) => (
                <div key={`epi-${epi.id}-${idx}`} className={styles.cardEpi}>
                  {epi.foto ? (
                    <img
                      src={epi.foto}
                      alt={epi.nome}
                      className={styles.fotoEpi}
                    />
                  ) : (
                    <div className={styles.placeholderEpi}>EPI</div>
                  )}

                  <div className={styles.infoEpi}>
                    <strong>{epi.nome}</strong>
                    {epi.cor && (
                      <span className={styles.corEpi}>Cor: {epi.cor}</span>
                    )}
                    <p className={styles.descEpi}>{epi.descricao}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoverEpi(epi.id)}
                    disabled={salvando}
                    title="Remover EPI do setor"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      marginLeft: "auto",
                      alignSelf: "flex-start",
                    }}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.vazio}>Nenhum EPI vinculado a este setor.</p>
          )}
        </div>

        {/* Ocorrências Recentes */}
        <div className={styles.cardSecao}>
          <h2 className={styles.tituloSecao}>Ocorrências Recentes</h2>

          {setor.ocorrencias.length > 0 ? (
            <div className={styles.listaOcorrencias}>
              {setor.ocorrencias.map((oc, idx) => {
                const ocId = oc.id ?? oc.ID_ocorrencia ?? oc.id_ocorrencia;
                return (
                  <div
                    key={`oc-${ocId ?? idx}-${idx}`}
                    className={`${styles.itemOcorrencia} ${
                      ocId ? styles.itemClicavel : ""
                    }`}
                    onClick={() => {
                      if (ocId) router.push(`/ocorrencias/${ocId}`);
                    }}
                    title={
                      ocId ? `Ver detalhes da ocorrência #${ocId}` : undefined
                    }
                  >
                    <div>
                      <p className={styles.textoOcorrencia}>{oc.descricao}</p>
                      {oc.data_hora && (
                        <span className={styles.dataOcorrencia}>
                          {new Date(oc.data_hora).toLocaleString("pt-BR")}
                        </span>
                      )}
                    </div>
                    <span className={styles.badgeOcorrencia}>{oc.status}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.vazio}>Nenhuma ocorrência registrada.</p>
          )}
        </div>
      </section>
    </Shell>
  );
}