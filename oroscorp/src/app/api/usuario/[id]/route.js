import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1/oroscorp";

async function obterTokenHeaders(request) {
  let authHeader = request.headers.get("authorization");

  if (!authHeader || authHeader === "Bearer null" || authHeader === "Bearer undefined") {
    const cookieStore = await cookies();
    const tokenCookie =
      cookieStore.get("token")?.value ||
      cookieStore.get("oroscorp_token")?.value ||
      cookieStore.get("auth_token")?.value ||
      cookieStore.get("access_token")?.value ||
      cookieStore.get("jwt")?.value;

    if (tokenCookie) {
      authHeader = tokenCookie.startsWith("Bearer ")
        ? tokenCookie
        : `Bearer ${tokenCookie}`;
    }
  }

  return {
    "Content-Type": "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
  };
}

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    const headers = await obterTokenHeaders(request);

    const res = await fetch(`${BASE_URL}/usuario/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { status: false, message: "Erro ao conectar com o servidor de usuário." },
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
        { status: false, message: "ID do usuário não informado." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const headers = await obterTokenHeaders(request);

    const res = await fetch(`${BASE_URL}/usuario/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { status: false, message: "Erro ao atualizar dados do usuário." },
      { status: 500 }
    );
  }
}