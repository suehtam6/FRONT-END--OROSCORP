"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "../style/shell.module.css";
import Menu from "./menu";

// Você pode apagar as constantes 'links' e 'cadastros' deste arquivo 
// se elas já estiverem sendo renderizadas por dentro do componente "./menu"

export default function Shell({ children, voltar = true }) {
  const router = useRouter();
  const path = usePathname();
  
  // Usaremos apenas este estado para controlar o Menu
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