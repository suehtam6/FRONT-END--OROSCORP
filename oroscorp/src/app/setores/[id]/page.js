"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "../../components/Shell.js";
import s from "../../style/novas.module.css";


const IconUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const IconCamera = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"></polygon>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  </svg>
);

const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);


const getIniciais = (nome) => {
  if (!nome) return "??";
  const partes = nome.trim().split(" ").filter(Boolean);
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

function AvatarFuncionario({ foto, nome }) {
  const [erroImg, setErroImg] = useState(false);

  const srcValido =
    foto && !erroImg
      ? foto.startsWith("http") || foto.startsWith("/") || foto.startsWith("data:")
        ? foto
        : `/${foto}`
      : null;

  if (srcValido) {
    return (
      <img
        src={srcValido}
        alt={nome}
        className={s.avatar}
        onError={() => setErroImg(true)}
        style={{ objectFit: "cover" }}
      />
    );
  }

  return <div className={s.avatar}>{getIniciais(nome)}</div>;
}

const StatusBadge = ({ status }) => {
  const st = String(status || "").toUpperCase();
  let classeCor = s.badgeCinza;

  if (st === "ATIVO" || st === "ONLINE" || st === "ABERTA") classeCor = s.badgeVerde;
  if (st === "INATIVO" || st === "OFFLINE" || st === "FECHADA" || st === "CANCELADA" || st === "AFASTADO") {
    classeCor = s.badgeVermelho;
  }

  return (
    <div className={`${s.badgeContainer} ${classeCor}`}>
      <div className={s.dot}></div>
      {st}
    </div>
  );
};

function extrairLista(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.response?.dados)) return json.response.dados;
  if (Array.isArray(json.dados)) return json.dados;
  return [];
}

export default function SetorDetalhe() {
  const { id } = useParams();
  const router = useRouter();

  const [setor, setSetor] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDetalhes() {
      try {
        const [resSetor, resFuncs] = await Promise.all([
          fetch(`/api/setor/dados/${id}`),
          fetch("/api/funcionario").catch(() => null),
        ]);


        const listaTodosFuncs = resFuncs?.ok ? extrairLista(await resFuncs.json()) : [];
        const mapaFuncPorId = new Map();
        const mapaFuncPorNome = new Map();

        listaTodosFuncs.forEach((f) => {
          const fId = f.id ?? f.ID_funcionario ?? f.id_funcionario;
          const fNome = String(f.nome || f.Nome_funcionario || "").trim().toLowerCase();
          const fFoto = f.foto || f.Foto_funcionario || null;
          if (fId) mapaFuncPorId.set(Number(fId), { id: fId, foto: fFoto });
          if (fNome) mapaFuncPorNome.set(fNome, { id: fId, foto: fFoto });
        });

        if (resSetor.ok) {
          const json = await resSetor.json();
          const dadosCompletos = json.response?.ocorrencia;

          if (dadosCompletos) {
            setSetor({
              nome: dadosCompletos.nome,
              descricao: dadosCompletos.descricao,
              totalFuncionarios: dadosCompletos.Total_funcionarios || 0,
              totalCameras: dadosCompletos.Total_cameras || 0,
              totalAbertas: dadosCompletos.Total_ocorrencias_abertas || 0,
            });

            const funcsEnriquecidos = (dadosCompletos.funcionarios || []).map((func) => {
              const idEncontrado =
                func.id ??
                func.ID_funcionario ??
                func.id_funcionario ??
                mapaFuncPorNome.get(String(func.nome || "").trim().toLowerCase())?.id ??
                null;

              const infoExtra =
                (idEncontrado && mapaFuncPorId.get(Number(idEncontrado))) ||
                mapaFuncPorNome.get(String(func.nome || "").trim().toLowerCase());

              return {
                ...func,
                id: idEncontrado,
                foto: func.foto || func.Foto_funcionario || infoExtra?.foto || null,
              };
            });

            setFuncionarios(funcsEnriquecidos);
            setCameras(dadosCompletos.cameras || []);
            setOcorrencias(dadosCompletos.ocorrencias || []);
          }
        }
      } catch (error) {
        console.error("Erro ao procurar detalhes do setor:", error);
      } finally {
        setCarregando(false);
      }
    }

    if (id) {
      carregarDetalhes();
    }
  }, [id]);

  const abrirPerfilFuncionario = (func) => {
    const fId = func.id ?? func.ID_funcionario ?? func.id_funcionario;
    if (fId) {
      router.push(`/funcionarios/${fId}`);
    }
  };

  const abrirDetalhesOcorrencia = (oco) => {
    const oId = oco.id ?? oco.ID_ocorrencia ?? oco.id_ocorrencia;
    if (oId) {
      router.push(`/ocorrencias/${oId}`);
    }
  };

  return (
    <Shell>
      {carregando ? (
        <div style={{ color: "#fff", padding: "2rem", textAlign: "center" }}>
          A carregar informações do setor...
        </div>
      ) : (
        <>

          <section className={`${s.painel} ${s.painelTopo}`}>
            <h1 className={s.titulo}>{setor?.nome || `Setor ${id}`}</h1>
            <p className={s.sub}>
              {setor?.descricao || "Nenhuma descrição disponível."}
            </p>

            <div className={s.cards}>
              <div className={s.card}>
                <div className={s.cardCabecalho}>
                  <IconUsers /> Funcionários
                </div>
                <h2>{setor?.totalFuncionarios || 0}</h2>
              </div>
              <div className={s.card}>
                <div className={s.cardCabecalho}>
                  <IconCamera /> Câmeras
                </div>
                <h2>{setor?.totalCameras || 0}</h2>
              </div>
              <div className={s.card}>
                <div className={s.cardCabecalho}>
                  <IconAlert /> Ocorrências abertas
                </div>
                <h2 className={s.laranja}>{setor?.totalAbertas || 0}</h2>
              </div>
            </div>
          </section>

          <div className={s.grade}>
            <section className={s.painel}>
              <h3 className={s.secao}>FUNCIONÁRIOS DO SETOR</h3>
              <div className={s.rolagem}>
                <table className={s.tabela}>
                  <thead>
                    <tr>
                      <th>NOME</th>
                      <th>CARGO</th>
                      <th>STATUS</th>
                      <th>OCORRÊNCIAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funcionarios.length > 0 ? (
                      funcionarios.map((func, i) => (
                        <tr
                          key={func.id || i}
                          onClick={() => abrirPerfilFuncionario(func)}
                          style={{ cursor: func.id ? "pointer" : "default" }}
                          title={func.id ? `Ver perfil de ${func.nome}` : undefined}
                        >
                          <td>
                            <div className={s.perfilRow}>
                              <AvatarFuncionario foto={func.foto} nome={func.nome} />
                              <span>{func.nome}</span>
                            </div>
                          </td>
                          <td>{func.cargo}</td>
                          <td>
                            <StatusBadge status={func.status} />
                          </td>
                          <td>
                            <span className={s.badgePequeno}>{func.ocorrencias}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className={s.vazio} colSpan="4">
                          Nenhum funcionário encontrado neste setor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={s.painel}>
              <h3 className={s.secao}>CÂMERAS DO SETOR</h3>
              {cameras.length > 0 ? (
                <ul className={s.listaCameras}>
                  {cameras.map((cam, i) => (
                    <li className={s.itemCamera} key={cam.id || i}>
                      <div className={s.cameraNome}>
                        <IconCamera /> {cam.nome}
                      </div>
                      <StatusBadge status={cam.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={s.sub}>Nenhuma câmara vinculada.</p>
              )}
            </section>
          </div>

          <section className={s.painel}>
            <h3 className={s.secao}>OCORRÊNCIAS RECENTES</h3>
            {ocorrencias.length > 0 ? (
              <div className={s.gradeOcorrencias}>
                {ocorrencias.map((oco, i) => {
                  const ocoId = oco.id ?? oco.ID_ocorrencia ?? oco.id_ocorrencia;
                  return (
                    <div
                      className={s.cardOcorrencia}
                      key={ocoId || i}
                      onClick={() => abrirDetalhesOcorrencia(oco)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          abrirDetalhesOcorrencia(oco);
                        }
                      }}
                      style={{ cursor: ocoId ? "pointer" : "default" }}
                      title={ocoId ? `Ver detalhes da ocorrência #${ocoId}` : undefined}
                    >
                      <div className={s.ocoCabecalho}>
                        <span>#{String(ocoId || i + 1).padStart(4, "0")}</span>
                        <span className={`${s.badgeContainer} ${s.badgeCinza}`}>
                          {oco.origem || "SISTEMA"}
                        </span>
                      </div>

                      <h4 className={s.ocoTitulo}>{oco.descricao}</h4>

                      <div className={s.ocoRodape}>
                        <span>
                          {oco.autor || "Sistema"} ·{" "}
                          {oco.data_hora
                            ? new Date(oco.data_hora).toLocaleDateString("pt-BR")
                            : ""}
                        </span>

                        <div className={s.ocoBadgeSeta}>
                          <StatusBadge status={oco.status} />
                          <IconChevron />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={s.sub}>Nenhuma ocorrência registada.</p>
            )}
          </section>
        </>
      )}
    </Shell>
  );
}