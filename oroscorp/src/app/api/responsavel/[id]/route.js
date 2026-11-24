import { NextResponse } from "next/server";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1/oroscorp";

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    const authHeader = request.headers.get("authorization");
    const headers = {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    };

    const res = await fetch(`${BASE_URL}/responsavel/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Erro ao buscar responsável:", error);
    return NextResponse.json(
      { status: false, message: "Erro ao buscar responsável." },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(
        { status: false, message: "ID do responsável não informado." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const authHeader = request.headers.get("authorization");
    const headers = {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    };

    const res = await fetch(`${BASE_URL}/responsavel/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Erro ao atualizar responsável:", error);
    return NextResponse.json(
      { status: false, message: "Erro ao atualizar dados do responsável." },
      { status: 500 }
    );
  }
}