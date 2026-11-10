/*
  Autor: Matheus Lucas
  Objetivo: Rota que busca uma ocorrência específica pelo ID na API
  Data: 10/11/2026
*/

import { NextResponse } from "next/server";

const API_BASE = "http://localhost:8080/v1/oroscorp";

export async function GET(request, { params }) {
  const { id } = await params;
  const url = `${API_BASE}/ocorrencia/dados/${id}`;

  console.log("Chamando API:", url);

  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Erro ao conectar com a API." },
      { status: 500 }
    );
  }
}