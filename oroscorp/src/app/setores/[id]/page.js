"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "../../components/Shell.js";
import styles from "../../style/detalheSetor.module.css";

export default function DetalhesSetor() {
  const params = useParams();
  const id = params?.id || Object.values(params || {})[0];
  const router = useRouter();

  const [setor, setSetor] = useState(null);
  const [catalogoEpis, setCatalogoEpis] = useState([]);
  const [epiSelecionado, setEpiSelecionado] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvandoEpi, setSalvandoEpi] = useState(false);
  const [erro, setErro] = useState("");

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

      setSetor({
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
        epis: Array.isArray(dadosSetor.epi) ? dadosSetor.epi : [],
        responsaveis: Array.isArray(dadosSetor.responsavel)
          ? dadosSetor.responsavel
          : [],
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

  // Função auxiliar que monta o payload completo exigido pelo PUT /api/setor/[id]
  const atualizarSetorComEpis = async (novaListaIdsEpi) => {
    setSalvandoEpi(true);
    try {
      const payload = {
        nome: setor.nome,
        foto: setor.foto,
        descricao: setor.descricao,
        local: setor.local,
        id_status_setor: Number(setor.id_status_setor) || 1,
        id_epi: novaListaIdsEpi.map((epiId) => ({ id: Number(epiId) })),
        id_responsavel: setor.responsaveis.map((resp) => ({
          id: Number(resp.ID_RESPONSAVEL ?? resp.id),
        })),
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
          data?.message ||
            data?.erro ||
            "Não foi possível atualizar os EPIs do setor."
        );
      }

      setEpiSelecionado("");
      await carregarSetor();
    } catch (err) {
      alert(err.message || "Erro ao salvar alterações no setor.");
    } finally {
      setSalvandoEpi(false);
    }
  };

  // Adiciona um novo EPI mantendo todos os dados atuais do setor
  const handleAdicionarEpi = async (e) => {
    e.preventDefault();
    if (!epiSelecionado || !setor) return;

    const idNovoEpi = Number(epiSelecionado);
    const jaVinculado = setor.epis.some((item) => Number(item.id) === idNovoEpi);

    if (jaVinculado) {
      alert("Este EPI já está cadastrado neste setor.");
      return;
    }

    const idsAtualizados = [
      ...setor.epis.map((item) => Number(item.id)),
      idNovoEpi,
    ];

    await atualizarSetorComEpis(idsAtualizados);
  };

  // Remove um EPI específico reenviando todos os demais dados do setor
  const handleRemoverEpi = async (idEpiRemover) => {
    if (!setor || salvandoEpi) return;

    const idsAtualizados = setor.epis
      .filter((item) => Number(item.id) !== Number(idEpiRemover))
      .map((item) => Number(item.id));

    await atualizarSetorComEpis(idsAtualizados);
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

  // Filtra o catálogo para exibir no dropdown apenas EPIs que ainda não estão no setor
  const episDisponiveis = catalogoEpis.filter((item) => {
    const itemId = Number(item.id ?? item.ID_epi);
    return !setor.epis.some((vinculado) => Number(vinculado.id) === itemId);
  });

  return (
    <Shell>
      <section className={styles.conteudo}>
        {/* Cabeçalho e Indicadores do Setor */}
        <div className={styles.cardPrincipal}>
          <div className={styles.topoCardPrincipal}>
            <div>
              <h1>{setor.nome}</h1>
              <p className={styles.descricaoSetor}>{setor.descricao}</p>
              {setor.local && (
                <span className={styles.localBadge}>{setor.local}</span>
              )}
            </div>

            <button
              type="button"
              className={styles.botaoVoltar}
              onClick={() => router.push("/setores")}
            >
              ← Voltar
            </button>
          </div>

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
                  {setor.responsaveis.map((resp) => {
                    const respId = resp.ID_RESPONSAVEL ?? resp.id;
                    const respNome = resp.Nome_responsavel ?? resp.nome;
                    const respFoto = resp.Foto_responsavel ?? resp.foto;
                    const respEmail = resp.Email_responsavel ?? resp.email;
                    const respCpf = resp.CPF_RESPONSAVEL ?? resp.cpf;

                    return (
                      <tr key={respId}>
                        <td>
                          <div className={styles.infoFuncionario}>
                            {respFoto && (
                              <img
                                src={respFoto}
                                alt={respNome}
                                className={styles.avatarFuncionario}
                              />
                            )}
                            <span>{respNome}</span>
                          </div>
                        </td>
                        <td>{respEmail || "-"}</td>
                        <td>{respCpf || "-"}</td>
                      </tr>
                    );
                  })}
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
                    {setor.funcionarios.map((func) => (
                      <tr key={func.id}>
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
                    ))}
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
                {setor.cameras.map((cam) => (
                  <div key={cam.id} className={styles.itemCamera}>
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
                disabled={salvandoEpi}
              >
                <option value="">
                  {episDisponiveis.length > 0
                    ? "Selecione um EPI para adicionar..."
                    : "Todos os EPIs já foram adicionados"}
                </option>
                {episDisponiveis.map((item) => {
                  const epiId = item.id ?? item.ID_epi;
                  const epiNome = item.nome ?? item.Nome_epi;
                  return (
                    <option key={epiId} value={epiId}>
                      {epiNome}
                    </option>
                  );
                })}
              </select>

              <button
                type="submit"
                className={styles.botaoAdicionarEpi}
                disabled={salvandoEpi || !epiSelecionado}
              >
                {salvandoEpi ? "Salvando..." : "+ Adicionar EPI"}
              </button>
            </form>
          </div>

          {setor.epis.length > 0 ? (
            <div className={styles.gradeEpis}>
              {setor.epis.map((epi) => (
                <div key={epi.id} className={styles.cardEpi}>
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
                    disabled={salvandoEpi}
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
              {setor.ocorrencias.map((oc) => (
                <div key={oc.id} className={styles.itemOcorrencia}>
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
              ))}
            </div>
          ) : (
            <p className={styles.vazio}>Nenhuma ocorrência registrada.</p>
          )}
        </div>
      </section>
    </Shell>
  );
}