import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL;
const ROTA_OCORRENCIA = '/v1/oroscorp/ocorrencia';

function obterToken(request) {
  const headerAuth = request.headers.get('authorization') || request.headers.get('token');
  if (headerAuth) {
    return headerAuth.replace(/^Bearer\s+/i, '').trim();
  }

  const nomesComuns = ['token', 'auth_token', 'jwt', 'access_token', 'oroscorp_token'];
  for (const nome of nomesComuns) {
    const val = request.cookies.get(nome)?.value;
    if (val) return val;
  }

  for (const c of request.cookies.getAll()) {
    if (c.value && c.value.split('.').length === 3) {
      return c.value;
    }
  }

  return '';
}

function extrairDadosDoToken(token) {
  if (!token) return null;
  try {
    const partes = token.split('.');
    if (partes.length < 2) return null;

    const payloadBase64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Requisição inválida.' }, { status: 400 });
  }

  const token = obterToken(request);
  const dadosToken = extrairDadosDoToken(token);

  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['token'] = token;
  }

  // Pega diretamente o ID do usuário autenticado no token (ADM ou Responsável)
  const idUsuarioToken = Number(
    dadosToken?.id ||
      dadosToken?.id_usuario ||
      dadosToken?.idUsuario ||
      dadosToken?.userId ||
      dadosToken?.sub ||
      0
  );

  const payloadFinal = {
    ...body,
    id_usuario_registro: idUsuarioToken || Number(body.id_usuario_registro) || null,
  };

  try {
    const resposta = await fetch(`${API_URL}${ROTA_OCORRENCIA}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payloadFinal),
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return NextResponse.json(
        { message: dados?.message || dados?.response?.message || 'Erro ao registrar ocorrência.' },
        { status: resposta.status }
      );
    }

    return NextResponse.json(dados, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor.' },
      { status: 502 }
    );
  }
}

export async function GET(request) {
  try {
    const token = obterToken(request);
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['token'] = token;
    }

    const resposta = await fetch(`${API_URL}${ROTA_OCORRENCIA}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => []);

    if (!resposta.ok) {
      return NextResponse.json(
        { message: 'Erro ao buscar ocorrências.' },
        { status: resposta.status }
      );
    }

    return NextResponse.json(dados, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor.' },
      { status: 502 }
    );
  }
}