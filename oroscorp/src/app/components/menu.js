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

const PRINCIPAL = [
  { href: "/home", icone: "▦", texto: "DASHBOARD" },
  { href: "/setores", icone: "▦", texto: "SETORES" },
  { href: "/cameras", icone: "▱", texto: "CÂMERAS" },
  { href: "/ocorrencias", icone: "△", texto: "OCORRÊNCIAS" },
  { href: "/funcionarios", icone: "♙", texto: "FUNCIONÁRIOS" },
];

const CADASTROS = [
  { href: "/cadastroEPI", icone: "♟", texto: "EPI" },
  { href: "/cadastrarGestor", icone: "♙", texto: "GESTOR" },
  { href: "/cadastrarFuncionario", icone: "♟", texto: "FUNCIONÁRIOS" },
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
      <span style={{ fontSize: "14px" }}>{icone}</span>
      <span>{texto}</span>
    </Link>
  );

  return (
    <>
      <aside
        className={`${styles.sidebar} ${aberto ? styles.sidebarAberta : ""}`}
      >
        <h3>🟠 CENTRAL</h3>

        <nav>
          {PRINCIPAL.map(renderLink)}

          <p>CADASTROS</p>

          {CADASTROS.map(renderLink)}
        </nav>

        <PerfilUsuario />

        <button className={styles.btnSair} onClick={handleVoltar}>
          Sair da conta
        </button>
      </aside>

      {aberto && <div className={styles.fundoMenu} onClick={fechar} />}
    </>
  );
}