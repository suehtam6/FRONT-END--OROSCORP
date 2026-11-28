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

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const resposta = await fetch(`${API_URL}${ROTA_STATUS_CAMERA}/${id}`, {
      method: 'PUT',
      headers: obterHeadersAuth(request),
      body: JSON.stringify({ status: body.status }),
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return NextResponse.json({ message: dados.message || 'Erro ao atualizar status.' }, { status: resposta.status });
    }

    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro de conexão com o servidor.' }, { status: 502 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const resposta = await fetch(`${API_URL}${ROTA_STATUS_CAMERA}/${id}`, {
      method: 'DELETE',
      headers: obterHeadersAuth(request),
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return NextResponse.json({ message: dados.message || 'Erro ao deletar status.' }, { status: resposta.status });
    }

    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro de conexão com o servidor.' }, { status: 502 });
  }
}