import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL;
const ROTA_CATEGORIA_EPI = '/v1/oroscorp/categoria-epi';

function obterHeadersAuth(request) {
  const headers = { 'Content-Type': 'application/json' };
  const headerAuth = request.headers.get('authorization');
  const tokenCookie =
    request.cookies.get('token')?.value ||
    request.cookies.get('auth_token')?.value ||
    request.cookies.get('jwt')?.value ||
    request.cookies.get('access_token')?.value ||
    request.cookies.get('oroscorp_token')?.value;

  const bruto = headerAuth || tokenCookie;
  if (bruto) {
    const tokenLimpo = bruto.replace(/^Bearer\s+/i, '').trim();
    headers['Authorization'] = `Bearer ${tokenLimpo}`;
    headers['token'] = tokenLimpo;
  }

  return headers;
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const valorNome = body.categoria || body.nome_categoria || body.nome;

    const payload = {
      id: Number(id),
      categoria: valorNome,
      nome_categoria: valorNome
    };

    const resposta = await fetch(`${API_URL}${ROTA_CATEGORIA_EPI}/${id}`, {
      method: 'PUT',
      headers: obterHeadersAuth(request),
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const text = await resposta.text();
    const dados = text ? JSON.parse(text) : {};

    if (!resposta.ok) {
      return NextResponse.json(
        { message: dados.message || 'Erro ao atualizar categoria.' },
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

    const resposta = await fetch(`${API_URL}${ROTA_CATEGORIA_EPI}/${id}`, {
      method: 'DELETE',
      headers: obterHeadersAuth(request),
      cache: 'no-store',
    });

    const text = await resposta.text();
    const dados = text ? JSON.parse(text) : {};

    if (!resposta.ok) {
      return NextResponse.json(
        { message: dados.message || 'Erro ao deletar categoria.' },
        { status: resposta.status }
      );
    }

    return NextResponse.json({ sucesso: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno no servidor Next.js.' }, { status: 500 });
  }
}