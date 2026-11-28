import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL;
const ROTA_STATUS_CAMERA = '/v1/oroscorp/status-camera';

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
    const resposta = await fetch(`${API_URL}${ROTA_STATUS_CAMERA}`, {
      method: 'GET',
      headers: obterHeadersAuth(request),
      cache: 'no-store',
    });
    const dados = await resposta.json().catch(() => ({}));
    return NextResponse.json(dados, { status: resposta.ok ? 200 : resposta.status });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar status.' }, { status: 502 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const resposta = await fetch(`${API_URL}${ROTA_STATUS_CAMERA}`, {
      method: 'POST',
      headers: obterHeadersAuth(request),
      body: JSON.stringify({ status: body.status }),
      cache: 'no-store',
    });
    const dados = await resposta.json().catch(() => ({}));
    return NextResponse.json(dados, { status: resposta.ok ? 201 : resposta.status });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao criar novo status.' }, { status: 502 });
  }
}