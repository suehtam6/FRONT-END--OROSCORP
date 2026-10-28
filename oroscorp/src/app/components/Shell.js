"use client";
import {useState} from "react";
import {usePathname,useRouter} from "next/navigation";
import styles from "../style/shell.module.css";
const links=[["▦","DASHBOARD","/home"],["▤","SETORES","/setores"],["▣","CÂMERAS","/cameras"],["△","OCORRÊNCIAS","/ocorrencias"],["♙","FUNCIONÁRIOS","/funcionarios"]];
const cadastros=[["♧","EPI","/cadastroEPI"],["♙","GESTOR","/cadastrarGestor"],["♟","FUNCIONÁRIOS","/cadastrarFuncionario"],["▤","SETOR","/cadastrarSetor"]];
export default function Shell({children,voltar=true}){
 const [aberto,setAberto]=useState(false),router=useRouter(),path=usePathname();
 return <div className={styles.pagina}>
 <header className={styles.topo}><button className={styles.menu} onClick={()=>setAberto(!aberto)} aria-label="Abrir menu">☰</button><img src="/logo-oroscorp.png" alt="OROSCORP" className={styles.logo}/>{voltar?<button className={styles.voltar} onClick={()=>router.back()}>⬅</button>:<span/>}</header>
 {aberto&&<div className={styles.fundo} onClick={()=>setAberto(false)}/>}
 <aside className={`${styles.sidebar} ${aberto?styles.aberta:""}`}><h3>🟠 CENTRAL</h3><nav>{links.map(([i,n,r])=><a key={r} className={path===r?styles.ativo:""} href={r}>{i}　{n}</a>)}<p>CADASTROS</p>{cadastros.map(([i,n,r])=><a key={r} href={r}>{i}　{n}</a>)}</nav><div className={styles.usuario}><strong>Administrador</strong><small>Conta administrativa</small><button onClick={()=>router.push("/")}>Sair da conta</button></div></aside>
 <main className={styles.conteudo}>{children}</main></div>;
}
