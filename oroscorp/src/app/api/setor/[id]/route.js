import { NextResponse } from "next/server";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1/oroscorp";

function obterHeadersAuth(request) {
  const headers = { "Content-Type": "application/json" };
  const token = request.cookies.get("token")?.value;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["token"] = token;
  }
  return headers;
}

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const res = await fetch(`${BASE_URL}/setor/dados/${id}`, {
      headers: obterHeadersAuth(request),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { erro: "Erro ao buscar dados do setor" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const res = await fetch(`${BASE_URL}/setor/${id}`, {
      method: "PUT",
      headers: obterHeadersAuth(request),
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);
    return NextResponse.json(data || { message: "Erro ao atualizar" }, {
      status: res.status,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Erro interno na rota PUT do setor." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const resposta = await fetch(`${BASE_URL}/setor/${id}`, {
      method: "DELETE",
      headers: obterHeadersAuth(request),
      cache: "no-store",
    });

    const text = await resposta.text();
    const dados = text ? JSON.parse(text) : {};

    if (!resposta.ok) {
      return NextResponse.json(
        { message: dados.message || "Erro ao deletar o setor." },
        { status: resposta.status }
      );
    }

    return NextResponse.json({ sucesso: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Erro interno no servidor Next.js." },
      { status: 500 }
    );
  }
}