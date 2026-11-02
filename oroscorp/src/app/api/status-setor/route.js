import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL || 'http://localhost:8080';
const ROTA_STATUS_SETOR = '/v1/oroscorp/status-setor/';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resposta = await fetch(`${API_URL}${ROTA_STATUS_SETOR}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ([]));

    if (!resposta.ok) {
      return NextResponse.json({ message: 'Erro ao buscar os status de setor.' }, { status: resposta.status });
    }

    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Não foi possível conectar ao servidor.' }, { status: 502 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const body = await request.json();

    const nomeStatus = body.status || body.nome;

    const payload = {
      status: nomeStatus,
      nome: nomeStatus
    };

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resposta = await fetch(`${API_URL}${ROTA_STATUS_SETOR}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return NextResponse.json({ message: dados.message || 'Erro ao criar status.' }, { status: resposta.status });
    }

    return NextResponse.json(dados, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno no servidor.' }, { status: 500 });
  }
}