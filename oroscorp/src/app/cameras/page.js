"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "../components/Shell";
import style from "../style/novas.module.css";

export default function Cameras() {
    const router = useRouter();
    const [busca, setBusca] = useState("");
    const [setor, setSetor] = useState("");

    const cameras = [];

    const lista = cameras.filter((c) => {
        const combinaNome = c.nome.toLowerCase().includes(busca.toLowerCase());
        const combinaSetor = !setor || c.setor === setor;
        return combinaNome && combinaSetor;
    });

    const totalOnline = lista.filter((c) => c.online).length;

    return (
        <Shell>
            <h1 className={style.titulo}>Câmeras</h1>
            <p className={style.sub}>Monitoramento em tempo real dos setores.</p>

            <div className={style.painel}>
                <div className={style.linha}>
                    <input
                        className={style.busca}
                        style={{ flex: 2 }}
                        placeholder="⌕ Buscar câmera"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />

                    <select
                        className={style.busca}
                        style={{ flex: 1 }}
                        value={setor}
                        onChange={(e) => setSetor(e.target.value)}
                    >
                        <option value="">Todos os setores</option>
                    </select>

                    <button
                        className={style.botao}
                        onClick={() => router.push("/cadastrarCameras")}
                    >
                        Cadastrar câmera
                    </button>
                </div>
            </div>

            <p className={style.sub}>
                {totalOnline} de {lista.length} câmeras online
            </p>

            <div className={style.cameraGrade}>
                {lista.length ? (
                    lista.map((c) => (
                        <article
                            className={style.cameraCard}
                            key={c.id}
                            onClick={() => router.push(`/cameras/${c.id}`)}
                        >
                            <div className={style.video}>Sem transmissão</div>
                            <h3>{c.nome}</h3>
                            <p>
                                {c.setor} · {c.online ? "ONLINE" : "OFFLINE"}
                            </p>
                        </article>
                    ))
                ) : (
                    <div className={style.painel}>
                        As câmeras da API aparecerão aqui.
                    </div>
                )}
            </div>
        </Shell>
    );
}