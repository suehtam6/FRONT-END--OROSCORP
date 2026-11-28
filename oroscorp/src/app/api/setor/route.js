import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL;
const ROTA_SETOR = '/v1/oroscorp/setor';

function obterHeadersAuth(request) {
  const headers = { 'Content-Type': 'application/json' };
  const token = request.cookies.get('token')?.value;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['token'] = token;
  }
  return headers;
}

export async function GET(request) {
  try {
    const resposta = await fetch(`${API_URL}${ROTA_SETOR}`, {
      method: 'GET',
      headers: obterHeadersAuth(request),
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return NextResponse.json({ message: 'Erro ao buscar os setores do backend.' }, { status: resposta.status });
    }

    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor para buscar os setores.' },
      { status: 502 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const resposta = await fetch(`${API_URL}${ROTA_SETOR}`, {
      method: 'POST',
      headers: obterHeadersAuth(request),
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      const msg = dados.message || dados.response?.message || 'Erro ao cadastrar o setor no backend.';
      return NextResponse.json({ message: msg }, { status: resposta.status });
    }

    return NextResponse.json(dados, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor para cadastrar o setor.' },
      { status: 502 }
    );
  }
}