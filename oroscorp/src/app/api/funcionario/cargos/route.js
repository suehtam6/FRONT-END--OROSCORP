import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
// puxa o .env
const API_URL = process.env.API_URL;
const ROTA_CARGO = '/v1/oroscorp/cargo';

export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value;
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            headers['token'] = token;
        }
        
        const resposta = await fetch(`${API_URL}${ROTA_CARGO}`, {
            method: 'GET',
            headers,
            cache: 'no-store'
        });
                
        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            return NextResponse.json({ message: 'Erro ao buscar os funcionários do backend.' }, { status: resposta.status });
        }

        return NextResponse.json(dados, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { message: 'Não foi possível conectar ao servidor para buscar os funcionários.' },
            { status: 502 }
        );
    }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const body = await request.json();

    const payload = {
        cargo: body.cargo
    };

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['token'] = token;
    }

    const resposta = await fetch(`${API_URL}${ROTA_CARGO}`, {
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