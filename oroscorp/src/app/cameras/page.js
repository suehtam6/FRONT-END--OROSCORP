"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import PlayerCamera from "../components/PlayerCamera";
import s from "../style/cameras.module.css";

const CAMERAS_POR_PAGINA = 9;

function verificarOnline(camera) {
  const statusStr = Array.isArray(camera.status_camera)
    ? camera.status_camera[0]?.status
    : camera.status_camera || (camera.online ? "ONLINE" : "OFFLINE");

  const idStatus = Array.isArray(camera.status_camera)
    ? Number(camera.status_camera[0]?.id)
    : Number(camera.id_status_camera);

  return (
    String(statusStr || "").toUpperCase() === "ONLINE" ||
    camera.online === true ||
    idStatus === 1
  );
}

function filtrarCameras(cameras, busca, setor, filtroStatus) {
  const termo = busca.trim().toLowerCase();

  return cameras.filter((c) => {
    const ipOuStream = String(c.ip || c.endereco_stream || "").toLowerCase();
    const nomeValido =
      !termo ||
      c.nome?.toLowerCase().includes(termo) ||
      ipOuStream.includes(termo);

    const idSetorCamera =
      c.id_setor || (Array.isArray(c.setor) ? c.setor[0]?.id : c.setor?.id);
    const setorValido = !setor || String(idSetorCamera) === String(setor);

    const online = verificarOnline(c);
    const statusValido =
      filtroStatus === "todas" ||
      (filtroStatus === "online" && online) ||
      (filtroStatus === "offline" && !online);

    return nomeValido && setorValido && statusValido;
  });
}

function CameraCard({ camera, onClick }) {
  const [streamFalhou, setStreamFalhou] = useState(false);

  const isOnline = verificarOnline(camera);
  const urlStream =
    camera.endereco_stream || camera.stream || camera.url_video || camera.foto;
  const temVideo = isOnline && Boolean(urlStream) && !streamFalhou;

  const nomeSetor = Array.isArray(camera.setor)
    ? camera.setor[0]?.nome
    : camera.setor?.nome || camera.setor || "Sem setor";

  const endereco = camera.ip || camera.endereco_stream || "IP não configurado";

  return (
    <article
      className={`${s.cameraCard} ${!isOnline ? s.cameraCardOffline : ""}`}
      onClick={onClick}
    >
      <div className={s.midiaContainer}>
        <div
          className={`${s.badgeStatus} ${
            isOnline ? s.statusOnline : s.statusOffline
          }`}
        >
          <span className={isOnline ? s.pontoOnline : s.pontoOffline} />
          {isOnline ? "ONLINE" : "OFFLINE"}
        </div>

        {temVideo && (
          <div className={s.badgeAoVivo}>
            <span className={s.pontoAoVivo} />
            AO VIVO
          </div>
        )}

        {temVideo ? (
          <PlayerCamera
            url={urlStream}
            online={isOnline}
            titulo={camera.nome}
            className={s.imagemPreview}
            onErro={() => setStreamFalhou(true)}
          />
        ) : (
          <div className={s.semSinal}>
            <svg
              className={s.iconeSemSinal}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isOnline ? (
                <>
                  <rect x="2" y="6" width="14" height="12" rx="2" />
                  <path d="m16 10 6-3v10l-6-3" />
                </>
              ) : (
                <>
                  <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1" />
                  <path d="M23 7l-7 5 7 5V7z" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              )}
            </svg>
            <span>
              {isOnline ? "AGUARDANDO SINAL DE VÍDEO" : "TRANSMISSÃO AUSENTE"}
            </span>
          </div>
        )}

        <div className={s.gradienteMidia} />
      </div>

      <div className={s.cardCorpo}>
        <div className={s.cardTopo}>
          <div className={s.infoPrincipal}>
            <h3 className={s.cameraNome}>{camera.nome}</h3>
            <span className={s.setorTag}>📍 {nomeSetor}</span>
          </div>
        </div>

        <div className={s.cardRodape}>
          <span className={s.ipEndereco} title={endereco}>
            {endereco}
          </span>

          <span className={s.linkDetalhes}>
            {isOnline ? "Abrir tela cheia" : "Diagnosticar"} →
          </span>
        </div>
      </div>
    </article>
  );
}

export default function Cameras() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [idSetor, setIdSetor] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [setores, setSetores] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const extrairLista = (resJson) => {
    if (!resJson) return [];
    if (resJson.response && Array.isArray(resJson.response.dados)) {
      return resJson.response.dados;
    }
    if (resJson.dados && Array.isArray(resJson.dados)) return resJson.dados;
    if (Array.isArray(resJson.response)) return resJson.response;
    if (Array.isArray(resJson)) return resJson;
    return [];
  };

  useEffect(() => {
    async function carregarDependencias() {
      setCarregando(true);
      try {
        const [resSetor, resCam] = await Promise.all([
          fetch("/api/setor"),
          fetch("/api/camera"),
        ]);

        if (resSetor.ok) {
          const jsonSetor = await resSetor.json();
          setSetores(extrairLista(jsonSetor));
        }

        if (resCam.ok) {
          const jsonCam = await resCam.json();
          setCameras(extrairLista(jsonCam));
        }
      } catch (err) {
        console.error("Erro ao carregar dependências da câmera:", err);
      } finally {
        setCarregando(false);
      }
    }
    carregarDependencias();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, idSetor, filtroStatus]);

  const camerasFiltradas = useMemo(() => {
    return filtrarCameras(cameras, busca, idSetor, filtroStatus);
  }, [cameras, busca, idSetor, filtroStatus]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(camerasFiltradas.length / CAMERAS_POR_PAGINA)
  );
  const indiceInicio = (paginaAtual - 1) * CAMERAS_POR_PAGINA;
  const indiceFim = indiceInicio + CAMERAS_POR_PAGINA;
  const camerasPaginadas = camerasFiltradas.slice(indiceInicio, indiceFim);

  const qtdOnline = useMemo(() => {
    return cameras.filter((c) => verificarOnline(c)).length;
  }, [cameras]);

  const qtdOffline = cameras.length - qtdOnline;

  return (
    <Shell>
      <div className={s.pagina}>
        {/* TOPO DA PÁGINA */}
        <div className={s.topoPagina}>
          <div>
            <h1 className={s.titulo}>Câmeras</h1>
            <p className={s.sub}>
              Monitoramento em tempo real e status de conectividade dos setores.
            </p>
          </div>

          <button
            type="button"
            className={s.botao}
            onClick={() => router.push("/cadastrarCameras")}
          >
            <span>+</span> Cadastrar câmera
          </button>
        </div>

        {/* CARDS DE RESUMO */}
        <div className={s.barraResumo}>
          <div className={s.cardResumo}>
            <span>Total de câmeras</span>
            <strong>{carregando ? "—" : cameras.length}</strong>
          </div>

          <div className={`${s.cardResumo} ${s.resumoOnline}`}>
            <span>Câmeras online</span>
            <strong>{carregando ? "—" : qtdOnline}</strong>
          </div>

          <div
            className={`${s.cardResumo} ${
              qtdOffline > 0 ? s.resumoOffline : ""
            }`}
          >
            <span>Câmeras offline</span>
            <strong>{carregando ? "—" : qtdOffline}</strong>
          </div>
        </div>

        {/* PAINEL DE BUSCA E FILTROS */}
        <div className={s.painel}>
          <div className={s.linha}>
            <div className={s.campoBuscaWrapper}>
              <svg
                className={s.iconeBusca}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                className={s.busca}
                placeholder="Buscar por nome da câmera ou endereço IP..."
                aria-label="Buscar câmera"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              {busca && (
                <button
                  type="button"
                  className={s.limparBusca}
                  onClick={() => setBusca("")}
                  title="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              className={s.selectSetor}
              aria-label="Filtrar por setor"
              value={idSetor}
              onChange={(e) => setIdSetor(e.target.value)}
            >
              <option value="">Todos os setores</option>
              {setores.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>

            <div className={s.grupoFiltrosStatus}>
              {[
                { id: "todas", label: "Todas" },
                { id: "online", label: "Online" },
                { id: "offline", label: "Offline" },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  className={`${s.botaoFiltroStatus} ${
                    filtroStatus === st.id ? s.botaoFiltroStatusAtivo : ""
                  }`}
                  onClick={() => setFiltroStatus(st.id)}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BARRA DE PAGINAÇÃO SUPERIOR */}
        <div className={s.barraPaginacao}>
          <div className={s.contadorOnline}>
            {camerasFiltradas.length === 0 ? (
              "0 câmeras encontradas"
            ) : (
              <>
                Mostrando{" "}
                <strong>
                  {indiceInicio + 1}–{Math.min(indiceFim, camerasFiltradas.length)}
                </strong>{" "}
                de <strong>{camerasFiltradas.length}</strong> câmeras (
                {qtdOnline} online no total)
              </>
            )}
          </div>

          {camerasFiltradas.length > CAMERAS_POR_PAGINA && (
            <div className={s.controlesPaginacao}>
              <button
                type="button"
                className={s.botaoPagina}
                disabled={paginaAtual === 1}
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                aria-label="Página anterior"
              >
                ←
              </button>
              <span className={s.textoPaginacao}>
                Página <strong>{paginaAtual}</strong> de{" "}
                <strong>{totalPaginas}</strong>
              </span>
              <button
                type="button"
                className={s.botaoPagina}
                disabled={paginaAtual === totalPaginas}
                onClick={() =>
                  setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                }
                aria-label="Próxima página"
              >
                →
              </button>
            </div>
          )}
        </div>

        {/* GRADE DE CÂMERAS */}
        {carregando ? (
          <div className={s.estadoVazio}>Carregando câmeras...</div>
        ) : camerasPaginadas.length > 0 ? (
          <>
            <div className={s.cameraGrade}>
              {camerasPaginadas.map((camera) => (
                <CameraCard
                  key={camera.id}
                  camera={camera}
                  onClick={() => router.push(`/cameras/${camera.id}`)}
                />
              ))}
            </div>

            {camerasFiltradas.length > CAMERAS_POR_PAGINA && (
              <div className={`${s.barraPaginacao} ${s.rodapePaginacao}`}>
                <span className={s.textoPaginacao}>
                  Exibindo até {CAMERAS_POR_PAGINA} câmeras simultâneas por página
                </span>

                <div className={s.controlesPaginacao}>
                  <button
                    type="button"
                    className={s.botaoPagina}
                    disabled={paginaAtual === 1}
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  >
                    ← Anterior
                  </button>
                  <span className={s.textoPaginacao}>
                    Página <strong>{paginaAtual}</strong> de{" "}
                    <strong>{totalPaginas}</strong>
                  </span>
                  <button
                    type="button"
                    className={s.botaoPagina}
                    disabled={paginaAtual === totalPaginas}
                    onClick={() =>
                      setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                    }
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={s.estadoVazio}>
            Nenhuma câmera encontrada para os filtros selecionados.
          </div>
        )}
      </div>
    </Shell>
  );
}