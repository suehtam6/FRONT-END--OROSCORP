"use client";

/*
Autor: Matheus Lucas
Data: 01 de novembro de 2026
Objetivo: Menu lateral compartilhado por todas as páginas internas.
O cabeçalho (com o botão hambúrguer) continua em cada página. A página controla
se o menu está aberto e passa isso para cá:
*/

import Link from "next/link";
import styles from "@/app/style/menu.module.css";
import PerfilUsuario from "@/app/components/PerfilUsuario";
import { usePathname, useRouter } from "next/navigation";

const ICONES = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  setores: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M17 18h1" />
      <path d="M12 18h1" />
      <path d="M7 18h1" />
    </svg>
  ),
  cameras: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  ),
  ocorrencias: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
  funcionarios: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  epi: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" />
      <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
      <path d="M4 15v-3a6 6 0 0 1 6-6h0" />
      <path d="M14 6h0a6 6 0 0 1 6 6v3" />
    </svg>
  ),
  gestor: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M8.5 16c.8-1.5 2-2.2 3.5-2.2s2.7.7 3.5 2.2" />
    </svg>
  ),
  addFuncionario: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  addOcorrencia: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  ),
  addSetor: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  addCamera: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  sair: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const PRINCIPAL = [
  { href: "/home", icone: ICONES.dashboard, texto: "DASHBOARD" },
  { href: "/setores", icone: ICONES.setores, texto: "SETORES" },
  { href: "/cameras", icone: ICONES.cameras, texto: "CÂMERAS" },
  { href: "/ocorrencias", icone: ICONES.ocorrencias, texto: "OCORRÊNCIAS" },
  { href: "/funcionarios", icone: ICONES.funcionarios, texto: "FUNCIONÁRIOS" },
];

const CADASTROS = [
  { href: "/cadastroEPI", icone: ICONES.epi, texto: "EPI" },
  { href: "/cadastrarGestor", icone: ICONES.gestor, texto: "GESTOR" },
  { href: "/cadastrarFuncionario", icone: ICONES.addFuncionario, texto: "FUNCIONÁRIO" },
  { href: "/cadastrarOcorrencia", icone: ICONES.addOcorrencia, texto: "OCORRÊNCIA" },
  { href: "/cadastrarSetor", icone: ICONES.addSetor, texto: "SETOR" },
  { href: "/cadastrarCameras", icone: ICONES.addCamera, texto: "CÂMERA" },
];

export default function Menu({ aberto = false, aoFechar }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleVoltar = (e) => {
    e.preventDefault();
    router.push("/");
  };

  const fechar = () => aoFechar?.();

  const renderLink = ({ href, icone, texto }) => (
    <Link
      key={href}
      href={href}
      onClick={fechar}
      aria-current={pathname === href ? "page" : undefined}
    >
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        {icone}
      </span>
      <span>{texto}</span>
    </Link>
  );

  return (
    <>
      <aside
        className={`${styles.sidebar} ${aberto ? styles.sidebarAberta : ""}`}
      >
        <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#ff7900",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          CENTRAL
        </h3>

        <nav>
          {PRINCIPAL.map(renderLink)}

          <p>CADASTROS</p>

          {CADASTROS.map(renderLink)}
        </nav>

        <PerfilUsuario />

        <button
          className={styles.btnSair}
          onClick={handleVoltar}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          {ICONES.sair}
          <span>Sair da conta</span>
        </button>
      </aside>

      {aberto && <div className={styles.fundoMenu} onClick={fechar} />}
    </>
  );
}