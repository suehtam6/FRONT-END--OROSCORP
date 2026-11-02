import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL || 'http://localhost:8080';
// Nota a barra "/" no final para bater com o mapeamento exato da tua controller Java
const ROTA_EPI = '/v1/oroscorp/epi/';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const resposta = await fetch(`${API_URL}${ROTA_EPI}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const text = await resposta.text();
    const dados = text ? JSON.parse(text) : [];

    if (!resposta.ok) {
      return NextResponse.json(
        { message: 'Erro ao buscar os EPIs no backend.' }, 
        { status: resposta.status }
      );
    }

    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor para buscar os EPIs.' }, 
      { status: 502 }
    );
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const body = await request.json();

    const payload = {
      nome: body.nome,
      descricao: body.descricao,
      foto: body.foto,
      cor: body.cor,
      id_categoria: Number(body.id_categoria)
    };

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const resposta = await fetch(`${API_URL}${ROTA_EPI}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const text = await resposta.text();
    const dados = text ? JSON.parse(text) : {};

    if (!resposta.ok) {
      const msg = dados.message || dados.response?.message || 'Erro ao cadastrar EPI.';
      return NextResponse.json({ message: msg }, { status: resposta.status });
    }

    return NextResponse.json(dados, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno no servidor Next.js.' }, { status: 500 });
  }
}