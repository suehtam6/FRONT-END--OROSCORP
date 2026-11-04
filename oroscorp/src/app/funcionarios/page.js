"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Shell from "../components/Shell";
import s from "../style/novas.module.css";


export default function Funcionarios() {
  const router = useRouter();
  
  const [busca, setBusca] = useState("");
  const [setor, setSetor] = useState("");
  const [situacao, setSituacao] = useState("");
 
  

  
  const funcionarios = [];
  
  const lista = funcionarios.filter((f) => 
    (f.nome || "").toLowerCase().includes(busca.toLowerCase()) &&
    (!setor || f.setor === setor) &&
    (!situacao || f.situacao === situacao)
  );

  return (
    <Shell>


      <h1 className={s.titulo}>▏FUNCIONÁRIOS</h1>
      <p className={s.sub}>
        Cadastro de colaboradores, conformidade de EPIs e histórico de ocorrências.
      </p>

      <div className={s.painel}>
        <div className={s.linha}>
          <input
            className={s.busca}
            style={{ flex: 2 }}
            placeholder="⌕ Buscar por nome, matrícula ou cargo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select
            className={s.busca}
            style={{ flex: 1 }}
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
          >
            <option value="">Todos os setores</option>
          </select>
          <select
            className={s.busca}
            style={{ flex: 1 }}
            value={situacao}
            onChange={(e) => setSituacao(e.target.value)}
          >
            <option value="">Todas as situações</option>
            <option>Ativo</option>
            <option>Afastado</option>
          </select>
        </div>
      </div>

      <div className={s.painel}>
        <div className={s.linha}>
          <small>{lista.length} FUNCIONÁRIOS ENCONTRADOS</small>
          <button
            className={s.botao}
            onClick={() => router.push("/cadastrarFuncionario")}
          >
            cadastrar funcionario
          </button>
        </div>
        
        <div className={s.rolagem}>
          <table className={s.tabela}>
            <thead>
              <tr>
                {[
                  "Funcionário",
                  "Matrícula",
                  "Cargo",
                  "Setor",
                  "Conformidade EPI",
                  "Situação",
                  "Ocorr. abertas",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.length ? (
                lista.map((f) => (
                  <tr
                    key={f.id}
                    onClick={() => router.push(`/funcionarios/${f.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{f.nome}</td>
                    <td>{f.matricula}</td>
                    <td>{f.cargo}</td>
                    <td>{f.setor}</td>
                    <td>{f.conformidade}</td>
                    <td>{f.situacao}</td>
                    <td>{f.ocorrencias}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={s.vazio}>
                    Os funcionários aparecerão aqui.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}