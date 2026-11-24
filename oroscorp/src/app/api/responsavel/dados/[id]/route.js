import { NextResponse } from "next/server";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1/oroscorp";

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(
        { status: false, message: "ID do responsável não informado." },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const headers = {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    };

    const res = await fetch(`${BASE_URL}/responsavel/dados/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Erro ao buscar detalhes do responsável:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Erro ao conectar com o servidor de detalhes do responsável.",
      },
      { status: 500 }
    );
  }
}