import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL || 'http://localhost:8080';
const ROTA = '/v1/oroscorp/status-ocorrencia/';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${ROTA}`, { method: 'GET', headers, cache: 'no-store' });
    const dados = await res.json().catch(() => ([]));
    return NextResponse.json(dados, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Erro de conexão.' }, { status: 502 });
  }
}