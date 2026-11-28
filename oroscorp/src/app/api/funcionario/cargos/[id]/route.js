import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL;
const ROTA_CARGO = '/v1/oroscorp/cargo';

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

    if (!id) {
      return NextResponse.json(
        { message: 'ID do cargo não informado.' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const payload = {
      id: Number(id),
      cargo: body.cargo,
    };

    const resposta = await fetch(`${API_URL}${ROTA_CARGO}/${id}`, {
      method: 'PUT',
      headers: obterHeadersAuth(request),
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const text = await resposta.text();
    const dados = text ? JSON.parse(text) : {};

    if (!resposta.ok) {
      const msg = dados.message || dados.response?.message || 'Erro ao atualizar cargo.';
      return NextResponse.json({ message: msg }, { status: resposta.status });
    }

    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Erro interno no servidor Next.js.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: 'ID do cargo não informado.' },
        { status: 400 }
      );
    }

    const resposta = await fetch(`${API_URL}${ROTA_CARGO}/${id}`, {
      method: 'DELETE',
      headers: obterHeadersAuth(request),
      cache: 'no-store',
    });

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      return NextResponse.json(
        { message: dados.message || 'Erro ao deletar o cargo.' },
        { status: resposta.status }
      );
    }

    return NextResponse.json({ sucesso: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Erro interno no servidor ao deletar cargo.' },
      { status: 500 }
    );
  }
}