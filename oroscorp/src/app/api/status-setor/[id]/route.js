import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL || 'http://localhost:8080';
const ROTA_STATUS_SETOR = '/v1/oroscorp/status-setor';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;
    const body = await request.json();

    const nomeStatus = body.status || body.nome;

    const payload = {
      id: Number(id),
      status: nomeStatus,
      nome: nomeStatus
    };

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resposta = await fetch(`${API_URL}${ROTA_STATUS_SETOR}/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return NextResponse.json({ message: dados.message || 'Erro ao atualizar status.' }, { status: resposta.status });
    }

    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno no servidor.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resposta = await fetch(`${API_URL}${ROTA_STATUS_SETOR}/${id}`, {
      method: 'DELETE',
      headers,
      cache: 'no-store',
    });

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      return NextResponse.json({ message: dados.message || 'Erro ao deletar status.' }, { status: resposta.status });
    }

    return NextResponse.json({ sucesso: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno no servidor.' }, { status: 500 });
  }
}