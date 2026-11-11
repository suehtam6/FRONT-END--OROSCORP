import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL || 'http://localhost:8080';
const ROTA_MOTIVO = '/v1/oroscorp/motivo_ocorrencia/';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resposta = await fetch(`${API_URL}${ROTA_MOTIVO}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ([]));

    if (!resposta.ok) {
      return NextResponse.json(
        { message: 'Erro ao buscar um motivo da ocorrência no servidor.' },
        { status: resposta.status }
      );
    }

    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Erro ao conectar ao servidor para buscar um motivo da ocorrência.' },
      { status: 502 }
    );
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const body = await request.json();

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resposta = await fetch(`${API_URL}${ROTA_MOTIVO}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      const msg = dados.message || 'Erro ao registrar um motivo da ocorrência no backend.';
      return NextResponse.json({ message: msg }, { status: resposta.status });
    }

    return NextResponse.json(dados, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor para registrar um motivo da ocorrência.' },
      { status: 502 }
    );
  }
}