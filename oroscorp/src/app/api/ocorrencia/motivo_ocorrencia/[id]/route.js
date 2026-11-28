import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL;
const ROTA_MOTIVO = '/v1/oroscorp/motivo_ocorrencia';

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
    const valorNome = body.nome;

    const payload = {
      id: Number(id),
      nome: valorNome
    };

    const resposta = await fetch(`${API_URL}${ROTA_MOTIVO}/${id}`, {
      method: 'PUT',
      headers: obterHeadersAuth(request),
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const text = await resposta.text();
    const dados = text ? JSON.parse(text) : {};

    if (!resposta.ok) {
      return NextResponse.json(
        { message: dados.message || 'Erro ao atualizar um motivo da ocorrência.' }, 
        { status: resposta.status }
      );
    }

    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno no servidor Next.js.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const resposta = await fetch(`${API_URL}${ROTA_MOTIVO}/${id}`, {
      method: 'DELETE',
      headers: obterHeadersAuth(request),
      cache: 'no-store',
    });

    const text = await resposta.text();
    const dados = text ? JSON.parse(text) : {};

    if (!resposta.ok) {
      return NextResponse.json(
        { message: dados.message || 'Erro ao deletar um motivo da ocorrência.' }, 
        { status: resposta.status }
      );
    }

    return NextResponse.json({ sucesso: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno no servidor Next.js.' }, { status: 500 });
  }
}