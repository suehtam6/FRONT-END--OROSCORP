"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "../style/shell.module.css";
import Menu from "./menu";
import { useTema } from "../hooks/useTema";

export default function Shell({ children, voltar = true }) {
  const router = useRouter();
  const { tema, alternarTema } = useTema();
  const path = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className={styles.pagina}>
<header
  className={styles.topo}
  style={{
    backgroundColor: "#050505",
    borderBottom: "1px solid #1f2225",
  }}
>
  <button
    className={styles.menu}
    onClick={() => setMenuAberto(!menuAberto)}
    aria-label="Abrir menu"
    style={{
      backgroundColor: "transparent",
      borderColor: "#ff9800",
      color: "#ff9800",
    }}
  >
    ☰
  </button>

  <img
    src="/logo-oroscorp.png"
    alt="OROSCORP"
    className={styles.logo}
    style={{
      backgroundColor: "transparent",
      filter: "none",
    }}
  />

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      backgroundColor: "transparent",
    }}
  >
    <button
      type="button"
      onClick={alternarTema}
      title={tema === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      style={{
        backgroundColor: "#14171a",
        color: "#ffffff",
        border: "1px solid #22262b",
        borderRadius: "8px",
        padding: "6px 10px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 600,
      }}
    >
      {tema === "dark" ? "☀️" : "🌙"}
    </button>

    {voltar ? (
      <button
        className={styles.voltar}
        onClick={() => router.back()}
        style={{
          backgroundColor: "transparent",
          borderColor: "#ff9800",
          color: "#ff9800",
        }}
      >
        ⬅
      </button>
    ) : (
      <span />
    )}
  </div>
</header>
      <Menu aberto={menuAberto} aoFechar={() => setMenuAberto(false)} />

      <main className={styles.conteudo}>
        {children}
      </main>
    </div>
  );
}