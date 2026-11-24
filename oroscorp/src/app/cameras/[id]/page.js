"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "../../components/Shell";
import PlayerCamera from "../../components/PlayerCamera";
import Popup from "../../components/Popup";
import s from "../../style/detalhesCamera.module.css";

export default function DetalhesCamera() {
  const params = useParams();
  const id = params?.id || Object.values(params || {})[0];
  const router = useRouter();
  const containerPlayerRef = useRef(null);

  const [camera, setCamera] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [streamFalhou, setStreamFalhou] = useState(false);

  // para deletar camera
  const [deletando, setDeletando] = useState(false);
  const [sucessoExcluir, setSucessoExcluir] = useState("");
  const [erroExcluir, setErroExcluir] = useState("");

  const carregarCamera = useCallback(async () => {
    if (!id) return;
    setCarregando(true);
    setErro("");

    try {
      const res = await fetch(`/api/camera/${id}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || "Erro ao carregar dados da câmera.");
      }

      const dados =
        json?.response?.camera ||
        json?.response?.dados?.[0] ||
        json?.response?.dados ||
        json?.dados?.[0] ||
        json?.dados ||
        json;

      setCamera(Array.isArray(dados) ? dados[0] : dados);
    } catch (err) {
      setErro(err.message || "Câmera não encontrada.");
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    carregarCamera();
  }, [carregarCamera]);

  const ativarTelaCheia = () => {
    if (containerPlayerRef.current?.requestFullscreen) {
      containerPlayerRef.current.requestFullscreen();
    }
  };

  const deletarCamera = async () => {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a câmera "${camera?.nome}"?`
    );
    if (!confirmar) return;

    
    setDeletando(true);

    try {
      const res = await fetch(`/api/camera/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.message || "Erro ao excluir a câmera.");
      }

      setSucessoExcluir("Câmera excluída com sucesso!");
    } catch (err) {
      setErroExcluir("esta câmera não pode ser excluida, a câmera já esta vinculada a outas informações");
    } finally {
      setDeletando(false);
    }
  };

  if (carregando) {
    return (
      <Shell>
        <div className={s.conteudo}>
          <div className={s.estadoWrapper}>
            Conectando à transmissão da câmera...
          </div>
        </div>
      </Shell>
    );
  }

  if (erro || !camera) {
    return (
      <Shell>
        <div className={s.conteudo}>
          <div className={s.estadoWrapper}>
            <p className={s.mensagemErro}>{erro || "Câmera não encontrada."}</p>
            <button
              type="button"
              className={s.botaoPrimario}
              onClick={() => router.push("/cameras")}
            >
              ← Voltar para câmeras
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const statusStr = Array.isArray(camera.status_camera)
    ? camera.status_camera[0]?.status
    : camera.status_camera || (camera.online ? "ONLINE" : "OFFLINE");

  const isOnline =
    String(statusStr || "").toUpperCase() === "ONLINE" ||
    camera.online === true ||
    Number(camera.id_status_camera) === 1;

  const urlStream =
    camera.endereco_stream || camera.stream || camera.url_video || camera.foto;

  const nomeSetor = Array.isArray(camera.setor)
    ? camera.setor[0]?.nome
    : camera.setor?.nome || camera.setor || "Setor não vinculado";

  const modeloCamera = camera.modelo || camera.fabricante || "Hikvision IP";

  return (
    <Shell>
      <section className={s.conteudo}>
        {/* TOPO */}
        <div className={s.topo}>
          <div>
            <div className={s.linhaTitulo}>
              <h1 className={s.titulo}>{camera.nome}</h1>
              <span
                className={`${s.badgeStatus} ${
                  isOnline ? s.statusOnline : s.statusOffline
                }`}
              >
                <span className={s.pontoStatus} />
                {isOnline ? "ONLINE" : "OFFLINE"}
              </span>
            </div>

            <p className={s.subtitulo}>
              <span> {nomeSetor}</span>
              <span>·</span>
              <code className={s.codigoStream}>
                {urlStream || "Stream não configurado"}
              </code>
            </p>
          </div>

          <div className={s.acoesTopo}>
            {isOnline && urlStream && !streamFalhou && (
              <button
                type="button"
                className={s.botaoPrimario}
                onClick={ativarTelaCheia}
              >
                ⛶ Tela cheia
              </button>
            )}

            <button
              type="button"
              className={s.deletar}
              onClick={deletarCamera}
              disabled={deletando}
            >
              {deletando ? "Excluindo..." : "Excluir câmera"}
            </button>

            <button
              type="button"
              className={s.botaoVoltar}
              onClick={() => router.push("/cameras")}
            >
              ← Voltar
            </button>
          </div>
        </div>

        {/* PLAYER GRANDE AO VIVO */}
        <div ref={containerPlayerRef} className={s.playerContainer}>
          {isOnline && urlStream && !streamFalhou ? (
            <>
              <div className={s.badgeAoVivo}>
                <span className={s.pontoAoVivo} />
                TRANSMISSÃO AO VIVO — {camera.nome}
              </div>

              <PlayerCamera
                url={urlStream}
                online={isOnline}
                titulo={camera.nome}
                controles={true}
                onErro={() => setStreamFalhou(true)}
                className={s.videoGrande}
              />
            </>
          ) : (
            <div className={s.semSinalBox}>
              <svg
                className={s.iconeSemSinal}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1" />
                <path d="M23 7l-7 5 7 5V7z" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>

              <p className={s.tituloSemSinal}>
                {isOnline
                  ? "Não foi possível carregar o fluxo de vídeo"
                  : "Câmera desconectada (Offline)"}
              </p>

              <p className={s.descricaoSemSinal}>
                Verifique se o endereço de stream cadastrado (
                {urlStream || "vazio"}) está acessível na rede local ou se o
                MediaMTX está em execução.
              </p>
            </div>
          )}
        </div>

        {/* INFORMAÇÕES TÉCNICAS DA CÂMERA */}
        <div className={s.painelDetalhes}>
          <div className={s.itemInfo}>
            <span>Identificação</span>
            <strong>#{camera.id} — {camera.nome}</strong>
          </div>

          <div className={s.itemInfo}>
            <span>Setor Monitorado</span>
            <strong>{nomeSetor}</strong>
          </div>

          <div className={s.itemInfo}>
            <span>Equipamento</span>
            <strong>{modeloCamera}</strong>
          </div>

          <div className={s.itemInfo}>
            <span>Endereço IP / URL</span>
            <strong>{camera.ip || urlStream || "Não informado"}</strong>
          </div>
        </div>

        {/* POPUPS DE EXCLUIR CÂMERA */}
        <Popup
          mensagem={erroExcluir}
          tipo="erro"
          aoFechar={() => setErroExcluir("")}
        />

        <Popup
          mensagem={sucessoExcluir}
          tipo="sucesso"
          titulo="Câmera excluída!"
          textoBotao="Ir para câmeras"
          aoFechar={() => router.push("/cameras")}
        />
      </section>
    </Shell>
  );
}