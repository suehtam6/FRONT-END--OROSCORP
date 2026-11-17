"use client";

import { useEffect, useRef, useState } from "react";

export default function PlayerCamera({
  url,
  online = true,
  titulo = "Câmera",
  className = "",
  controles = false,
  onErro,
}) {
  const videoRef = useRef(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    setFalhou(false);
  }, [url]);

  const urlLimpa = String(url || "").trim();

  // Detecta se é arquivo de vídeo (.mp4, .webm, .ogg) ou stream HLS (.m3u8)
  const ehVideoDireto = /\.(mp4|webm|ogg)(\?.*)?$/i.test(urlLimpa);
  const ehHls = /\.m3u8(\?.*)?$/i.test(urlLimpa);

  useEffect(() => {
    if (!ehHls || !urlLimpa || !online || !videoRef.current) return;

    let hlsInstance = null;
    const video = videoRef.current;

    // Safari / iOS suportam HLS nativamente
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = urlLimpa;
      video.play().catch(() => {});
      return;
    }

    // Chrome / Edge / Firefox usam hls.js
    import("hls.js")
      .then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          hlsInstance = new Hls({ lowLatencyMode: true });
          hlsInstance.loadSource(urlLimpa);
          hlsInstance.attachMedia(video);
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });
          hlsInstance.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              setFalhou(true);
              onErro?.();
            }
          });
        }
      })
      .catch(() => {
        setFalhou(true);
        onErro?.();
      });

    return () => {
      if (hlsInstance) hlsInstance.destroy();
    };
  }, [ehHls, urlLimpa, online, onErro]);

  if (!online || !urlLimpa || falhou) {
    return null;
  }

  if (ehVideoDireto || ehHls) {
    return (
      <video
        ref={videoRef}
        src={ehVideoDireto ? urlLimpa : undefined}
        className={className}
        autoPlay
        muted
        loop
        playsInline
        controls={controles}
        onError={() => {
          setFalhou(true);
          onErro?.();
        }}
      />
    );
  }

  // Padrão para streams MJPEG (OpenCV/Flask, ESP32-CAM, Câmeras IP HTTP) ou imagem ao vivo
  return (
    <img
      src={urlLimpa}
      alt={titulo}
      className={className}
      onError={() => {
        setFalhou(true);
        onErro?.();
      }}
    />
  );
}