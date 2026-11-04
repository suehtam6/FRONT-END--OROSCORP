"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import s from "../style/novas.module.css";

// Quando a API estiver conectada, substitua por dados reais (fetch, SWR, etc.)
const CAMERAS_MOCK = [];

function filtrarCameras(cameras, busca, setor) {
  const termo = busca.trim().toLowerCase();

  return cameras.filter(
    (c) =>
      c.nome.toLowerCase().includes(termo) && (!setor || c.setor === setor)
  );
}

function CameraCard({ camera, onClick }) {
  const status = camera.online ? "ONLINE" : "OFFLINE";

  return (
    <article className={s.cameraCard} onClick={onClick}>
      <div className={s.video}>Sem transmissão</div>
      <h3>{camera.nome}</h3>
      <p>
        {camera.setor} · {status}
      </p>
    </article>
  );
}

export default function Cameras() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [setor, setSetor] = useState("");
  const [cameras] = useState(CAMERAS_MOCK);

  // Setores derivados dos dados, para popular o select automaticamente
  const setores = useMemo(
    () => [...new Set(cameras.map((c) => c.setor))].sort(),
    [cameras]
  );

  const lista = useMemo(
    () => filtrarCameras(cameras, busca, setor),
    [cameras, busca, setor]
  );

  const totalOnline = useMemo(
    () => lista.filter((c) => c.online).length,
    [lista]
  );

  return (
    <Shell>
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
            className={s.busca}
            style={{ flex: 1 }}
            aria-label="Filtrar por setor"
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
          >
            <option value="">Todos os setores</option>
            {setores.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={s.botao}
            onClick={() => router.push("/cadastrarCameras")}
          >
            Cadastrar câmera
          </button>
        </div>
      </div>

      <p className={s.sub}>
        {totalOnline} de {lista.length} câmeras online
      </p>

      <div className={s.cameraGrade}>
        {lista.length > 0 ? (
          lista.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              onClick={() => router.push(`/cameras/${camera.id}`)}
            />
          ))
        ) : (
          <div className={s.painel}>As câmeras da API aparecerão aqui.</div>
        )}
      </div>
    </Shell>
  );
}