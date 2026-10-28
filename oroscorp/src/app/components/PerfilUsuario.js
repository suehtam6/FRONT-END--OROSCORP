"use client";

/*
Objetivo : Bloco de perfil no rodapé do menu lateral.
Mostra a foto, o nome e o tipo de conta de quem fez login.
Pode ser reaproveitado em qualquer página que tenha o mesmo menu.
*/

import { useEffect, useState } from "react";
import styles from "@/app/style/home.module.css";

const DESCRICAO_NIVEL = {
  ADM: "Conta administrativa",
};


const ROTA_PERFIL = "/api/perfilToken";

export default function PerfilUsuario() {

  const [perfil, setPerfil] = useState(undefined);
  const [fotoFalhou, setFotoFalhou] = useState(false);

  useEffect(() => {
    let ativo = true;

    fetch(ROTA_PERFIL, { cache: "no-store" })
      .then((resposta) => (resposta.ok ? resposta.json() : null))
      .then((dados) => {
        if (ativo) setPerfil(dados?.usuario ?? null);
      })
      .catch(() => {
        if (ativo) setPerfil(null);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const carregando = perfil === undefined;

  // Se o perfil não carregar, vou fazer mostrar que ele é adm
  const nome = perfil?.nome || "Administrador";
  const nivel = String(perfil?.nivel_acesso || "ADM").toUpperCase();
  const descricao = DESCRICAO_NIVEL[nivel] || nivel;
  const inicial = carregando ? "" : nome.trim().charAt(0).toUpperCase();

  // A foto é o endereço completo do Cloudinary. Qualquer outro valor (como
  // "sem-foto.png" ou nomes de arquivo antigos) cai no círculo com a inicial.
  const fotoUrl = perfil?.foto?.startsWith("https://") ? perfil.foto : null;

  return (
    <div className={styles.usuario}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {fotoUrl && !fotoFalhou ? (
          <img
            src={fotoUrl}
            alt=""
            width={36}
            height={36}
            style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            onError={() => setFotoFalhou(true)}
          />
        ) : (
          
            //Aqui eu vou colocar a Inicial do nome caso nn tenha foto
          <span
            aria-hidden="true"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: carregando ? "#333" : "#ff7a1a",
              color: "#111",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {inicial}
          </span>
        )}

        <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
          <strong>{carregando ? "Carregando..." : nome}</strong>
          <small>{carregando ? "\u00A0" : descricao}</small>
        </div>
      </div>
    </div>
  );
}