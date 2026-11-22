import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL || 'http://localhost:8080';
const ROTA_USUARIO = '/v1/oroscorp/usuario';

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

export async function GET(request) {
  try {
    const token = obterToken(request);
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['token'] = token;
    }

    const resposta = await fetch(`${API_URL}${ROTA_USUARIO}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => []);

    if (!resposta.ok) {
      return NextResponse.json(
        { message: 'Erro ao buscar usuários.' },
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