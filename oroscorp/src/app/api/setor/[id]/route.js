import { NextResponse } from "next/server";

const BASE_URL = "http://localhost:8080/v1/oroscorp";

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const res = await fetch(`${BASE_URL}/setor/dados/${id}`, {
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
  const { id } = await params;
  const body = await request.json();

  try {
    const res = await fetch(`${BASE_URL}/setor/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { erro: "Erro ao atualizar o setor" },
      { status: 500 }
    );
  }
}