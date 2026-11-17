import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL;
const ROTA_CAMERA = "/v1/oroscorp/camera";

function obterAuthorization(request) {
  const headerAuth = request.headers.get("authorization");
  if (headerAuth) return headerAuth;

  const tokenCookie =
    request.cookies.get("token")?.value ||
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("jwt")?.value ||
    request.cookies.get("access_token")?.value ||
    request.cookies.get("oroscorp_token")?.value;

  if (tokenCookie) {
    return tokenCookie.startsWith("Bearer ")
      ? tokenCookie
      : `Bearer ${tokenCookie}`;
  }

  return "";
}

export async function GET(request, context) {
  const params = await context.params;
  const id = Number(params?.id);

  if (!id) {
    return NextResponse.json(
      { message: "ID da câmera inválido na URL." },
      { status: 400 }
    );
  }

  const authHeader = obterAuthorization(request);
  const headers = { "Content-Type": "application/json" };

  if (authHeader) {
    headers["Authorization"] = authHeader;
    headers["token"] = authHeader.replace(/^Bearer\s+/i, "");
  }

  try {
    const resposta = await fetch(`${API_URL}${ROTA_CAMERA}/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return NextResponse.json(
        {
          message:
            dados?.message ||
            dados?.response?.message ||
            `Erro ${resposta.status} ao carregar dados da câmera.`,
        },
        { status: resposta.status }
      );
    }

    return NextResponse.json(dados, { status: 200 });
  } catch (err) {
    console.error("Erro no GET /api/camera/[id]:", err);
    return NextResponse.json(
      { message: "Não foi possível conectar ao servidor da API." },
      { status: 502 }
    );
  }
}