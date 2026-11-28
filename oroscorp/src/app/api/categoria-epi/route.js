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

export async function GET(request) {
  try {
    const resposta = await fetch(`${API_URL}${ROTA_CATEGORIA_EPI}`, {
      method: 'GET',
      headers: obterHeadersAuth(request),
      cache: 'no-store',
    });

    const text = await resposta.text();
    const dados = text ? JSON.parse(text) : [];
    
    return NextResponse.json(dados, { status: resposta.ok ? 200 : resposta.status });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao conectar ao servidor de categorias.' }, { status: 502 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const valorNome = body.categoria || body.nome_categoria || body.nome;

    if (!valorNome) {
      return NextResponse.json({ message: 'O nome da categoria é obrigatório.' }, { status: 400 });
    }

    const payload = {
      categoria: valorNome,
      nome_categoria: valorNome
    };

    const resposta = await fetch(`${API_URL}${ROTA_CATEGORIA_EPI}`, {
      method: 'POST',
      headers: obterHeadersAuth(request),
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const text = await resposta.text();
    const dados = text ? JSON.parse(text) : {};

    if (!resposta.ok) {
      return NextResponse.json(
        { message: dados.message || 'Erro ao criar categoria no backend.' }, 
        { status: resposta.status }
      );
    }

    return NextResponse.json(dados, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno no servidor Next.js.' }, { status: 500 });
  }
}