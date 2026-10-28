"use client";
import {useState} from "react";
import {useRouter,useParams} from "next/navigation";
import Shell from "../components/Shell";
import s from "../style/novas.module.css";
export default function Perfil(){const router=useRouter();return <Shell><section className={s.painel}><h1 className={s.titulo}>Meu perfil</h1><p className={s.sub}>Os dados do administrador serão carregados pela API.</p><button className={s.botao} onClick={()=>router.push("/atualizarPerfil")}>Atualizar perfil</button></section></Shell>}
