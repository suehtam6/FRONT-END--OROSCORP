"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import s from "../style/cameras.module.css";

function filtrarCameras(cameras, busca, setor) {
  const termo = busca.trim().toLowerCase();

  return cameras.filter((c) => {
    const nomeValido = c.nome?.toLowerCase().includes(termo);
    const idSetorCamera = c.id_setor || (Array.isArray(c.setor) ? c.setor[0]?.id : c.setor?.id);
    const setorValido = !setor || String(idSetorCamera) === String(setor);

    return nomeValido && setorValido;
  });
}

function CameraCard({ camera, onClick }) {
  const statusStr = Array.isArray(camera.status_camera)
    ? camera.status_camera[0]?.status
    : camera.status_camera || (camera.online ? "ONLINE" : "OFFLINE");

  const isOnline = statusStr?.toUpperCase() === "ONLINE";

  const temVideo = isOnline && (camera.stream || camera.endereco_stream || camera.url_video);

  const nomeSetor = Array.isArray(camera.setor)
    ? camera.setor[0]?.nome
    : camera.setor?.nome || camera.setor || "Sem setor";

  return (
    <article className={s.cameraCard} onClick={onClick}>
      <div className={s.midiaContainer}>
        <div className={`${s.badgeStatus} ${isOnline ? s.statusOnline : s.statusOffline}`}>
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
          <img
            src={camera.thumb || camera.foto || "/placeholder-camera.jpg"}
            alt={camera.nome}
            className={s.imagemPreview}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className={s.semSinal}>
            <svg
              className={s.iconeSemSinal}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1" />
              <path d="M23 7l-7 5 7 5V7z" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <span>TRANSMISSÃO AUSENTE</span>
          </div>
        )}
      </div>

      <div className={s.cardCorpo}>
        <div className={s.cardTopo}>
          <div>
            <h3 className={s.cameraNome}>{camera.nome}</h3>
            <p className={s.setorNome}>{nomeSetor}</p>
          </div>

          <span className={s.ipEndereco}>
            {camera.ip || camera.endereco_stream}
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
  const [setores, setSetores] = useState([]);
  const [cameras, setCameras] = useState([]);

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
      try {
        const [resSetor, resCam] = await Promise.all([
          fetch("/api/setor"),
          fetch("/api/camera")
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
      }
    }
    carregarDependencias();
  }, []);

  const camerasFiltradas = useMemo(() => {
    return filtrarCameras(cameras, busca, idSetor);
  }, [cameras, busca, idSetor]);

  const qtdOnline = useMemo(() => {
    return cameras.filter((c) => {
      const st = Array.isArray(c.status_camera) ? c.status_camera[0]?.status : c.status_camera;
      return st?.toUpperCase() === "ONLINE" || c.online;
    }).length;
  }, [cameras]);

  return (
    <Shell>
      <div className={s.pagina}>
      <h1 className={s.titulo}>Câmeras</h1>
      <p className={s.sub}>Monitoramento em tempo real dos setores.</p>

      <div className={s.painel}>
        <div className={s.linha}>
          <input
            className={s.busca}
            style={{ flex: 2 }}
            placeholder="⌕ Buscar câmera"
            aria-label="Buscar câmera"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className={s.selectSetor}
            style={{ flex: 1 }}
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

          <button
            type="button"
            className={s.botao}
            onClick={() => router.push("/cadastrarCameras")}
          >
            cadastrar camera
          </button>
        </div>
      </div>

      <div className={s.contadorOnline}>
        {qtdOnline} de {cameras.length} câmeras online
      </div>

      <div className={s.cameraGrade}>
        {camerasFiltradas.length > 0 ? (
          camerasFiltradas.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              onClick={() => router.push(`/cameras/${camera.id}`)}
            />
          ))
        ) : (
          <div className={s.painel}>Nenhuma câmera encontrada.</div>
        )}
      </div>
      </div>
    </Shell>
  );
}