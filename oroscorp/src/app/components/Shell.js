"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "../style/shell.module.css";
import Menu from "./menu";

export default function Shell({ children, voltar = true }) {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();
    


  const path = usePathname();
  

  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className={styles.pagina}>
      <header className={styles.topo}>
        <button 
          className={styles.menu} 
          onClick={() => setMenuAberto(!menuAberto)} // Correção aqui!
          aria-label="Abrir menu"
        >
          ☰
        </button>
        
        <img 
          src="/logo-oroscorp.png" 
          alt="OROSCORP" 
          className={styles.logo}
        />
        
        {voltar ? (
          <button 
            className={styles.voltar} 
            onClick={() => router.back()}
          >
            ⬅
          </button>
        ) : (
          <span />
        )}
      </header>

      {/* Agora o Menu recebe o estado correto */}
      <Menu aberto={menuAberto} aoFechar={() => setMenuAberto(false)} />

      <main className={styles.conteudo}>
        {children}
      </main>
    </div>
  );
}