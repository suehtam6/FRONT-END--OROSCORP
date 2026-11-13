/*
  Autor: Matheus Lucas
  Objetivo: Rota que busca uma ocorrência específica pelo ID na API
  Data: 10/11/2026
*/

import { NextResponse } from "next/server";

const API_BASE = "http://localhost:8080/v1/oroscorp";
const API_OCORRENCIA = "/ocorrencia"

export async function GET(request, { params }) {
  const { id } = await params;
  const url = `${API_BASE}${API_OCORRENCIA}/dados/${id}`;

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

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log("PAYLOAD ENVIADO PARA O BACKEND:", JSON.stringify(body, null, 2));

    const resposta = await fetch(`${API_BASE}${API_OCORRENCIA}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await resposta.text();
    console.log("RESPOSTA DO BACKEND:", resposta.status, text);

    let dados = {};
    try {
      dados = text ? JSON.parse(text) : {};
    } catch {
      dados = { message: text };
    }

    if (!resposta.ok) {
      return NextResponse.json(
        { message: dados.message || dados.erro || "Erro ao atualizar ocorrência." },
        { status: resposta.status }
      );
    }

    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    console.error("ERRO NO NEXT.JS PUT /api/ocorrencia/[id]:", error);
    return NextResponse.json(
      { message: error.message || "Erro interno no servidor Next.js." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const resposta = await fetch(`${API_URL}${API_OCORRENCIA}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const text = await resposta.text();
    const dados = text ? JSON.parse(text) : {};

    if (!resposta.ok) {
      return NextResponse.json(
        { message: dados.message || 'Erro ao deletar um motivo da ocorrência.' }, 
        { status: resposta.status }
      );
    }

    return NextResponse.json({ sucesso: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno no servidor Next.js.' }, { status: 500 });
  }
}