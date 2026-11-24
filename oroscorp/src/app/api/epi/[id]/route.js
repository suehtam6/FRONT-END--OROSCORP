import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1/oroscorp";

async function obterTokenHeaders(request) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("token")?.value;

  let authHeader = request.headers.get("authorization");
  if (
    (!authHeader ||
      authHeader === "Bearer null" ||
      authHeader === "Bearer undefined") &&
    tokenCookie
  ) {
    authHeader = tokenCookie.startsWith("Bearer ")
      ? tokenCookie
      : `Bearer ${tokenCookie}`;
  }

  const tokenLimpo = authHeader ? authHeader.replace(/^Bearer\s+/i, "") : "";

  return {
    "Content-Type": "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(tokenLimpo ? { "x-access-token": tokenLimpo, token: tokenLimpo } : {}),
  };
}

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(
        { status: false, message: "ID do EPI não informado." },
        { status: 400 }
      );
    }

    const headers = await obterTokenHeaders(request);

    const res = await fetch(`${BASE_URL}/epi/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Erro ao buscar detalhes do EPI:", error);
    return NextResponse.json(
      { status: false, message: "Erro ao conectar com o servidor de EPIs." },
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
        { status: false, message: "ID do EPI não informado." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const headers = await obterTokenHeaders(request);

    const res = await fetch(`${BASE_URL}/epi/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Erro ao atualizar EPI:", error);
    return NextResponse.json(
      { status: false, message: "Erro ao atualizar dados do EPI." },
      { status: 500 }
    );
  }
}