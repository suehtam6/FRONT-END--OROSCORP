"use client";

/*
Objetivo: Menu lateral compartilhado por todas as páginas internas.
O cabeçalho (com o botão hambúrguer) continua em cada página. A página controla
se o menu está aberto e passa isso para cá:
*/

import Link from "next/link";
import styles from "@/app/style/home.module.css";
import PerfilUsuario from "@/app/components/PerfilUsuario";
import { usePathname, useRouter } from "next/navigation";

// Para criar, tirar ou mudar um item do menu, mexa só nestas listas.
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

  // Marca com aria-current a página em que a pessoa está (dá para estilizar no CSS).
  const renderLink = ({ href, icone, texto }) => (
    <Link
      key={href}
      href={href}
      onClick={fechar}
      aria-current={pathname === href ? "page" : undefined}
    >
      {icone}
      {"\u3000"}
      {texto}
    </Link>
  );

  return (
    <>
      {/* Menu lateral: aparece somente quando "aberto" é verdadeiro */}
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

      {/* Fundo escuro ao abrir o menu (clicar nele fecha o menu) */}
      {aberto && <div className={styles.fundoMenu} onClick={fechar} />}
    </>
  );
}