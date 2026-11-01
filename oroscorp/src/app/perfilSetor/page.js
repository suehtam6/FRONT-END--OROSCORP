"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import styles from "../style/perfilSetor.module.css";

export default function perfilSetor(){
    const router = useRouter();

      const [perfil, setPerfil] = useState(null);
  const [fotoFalhou, setFotoFalhou] = useState(false);
  const [excluir, setExcluir] = useState(false);

  // Lista de funcionários do setor. Vai vir da API.
  // Cada item deve ter: id, nome, cargo, status, ocorrencias
  const funcionarios = [];

  // Busca os dados de quem está logado
  useEffect(() => {
    fetch("/api/perfilToken", { cache: "no-store" })
      .then((resposta) => (resposta.ok ? resposta.json() : null))
      .then((dados) => setPerfil(dados?.usuario ?? null))
      .catch(() => setPerfil(null));
  }, []);

    return(
        <Shell>
            {/* ===== CARTÃO DO TOPO ===== */}
            <section>
                <h1>almoxerifado</h1>
                <p>Armazenamento e controle de insumos, ferramentas e EPIs.</p>
            </section>
        </Shell>
    )
}