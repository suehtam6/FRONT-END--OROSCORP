"use client";
import {useState} from "react";
import {useRouter,useParams} from "next/navigation";
import Shell from "../../components/Shell";
import s from "../../style/novas.module.css";
export default function CameraDetalhe(){const router=useRouter(),{id}=useParams();return <Shell><div className={s.linha}><h2>CAM-{id}</h2><button className={s.botao} onClick={()=>router.push("/cadastrarOcorrencia")}>+ Registrar ocorrência</button></div><div className={s.video}>A transmissão desta câmera será carregada pela API.</div><div className={s.linha}><button className={`${s.botao} ${s.secundario}`} onClick={()=>router.push("/cameras")}>← Todas as câmeras</button></div></Shell>}
