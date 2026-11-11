import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL || 'http://localhost:8080';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resposta = await fetch(`${API_URL}/v1/oroscorp/setor/todos-setores`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ([]));

    if (!resposta.ok) {
      return NextResponse.json(
        { message: 'Erro ao buscar dados gerais dos setores.' },
        { status: resposta.status }
      );
    }

    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Erro ao conectar ao servidor para buscar os setores.' },
      { status: 502 }
    );
  }
}