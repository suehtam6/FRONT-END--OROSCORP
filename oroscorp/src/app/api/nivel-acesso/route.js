import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:8080';
const ROTA_NIVEL = '/v1/oroscorp/nivel-acesso';

export async function GET(request) {
  const token = request.cookies.get('token')?.value;

  if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

  try {
    const resposta = await fetch(`${API_URL}${ROTA_NIVEL}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });
    const dados = await resposta.json();
    return NextResponse.json(dados);
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar níveis de acesso.' }, { status: 502 });
  }
}

export async function POST(request) {
  const token = request.cookies.get('token')?.value;

  if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Requisição inválida.' }, { status: 400 });
  }

  try {
    const resposta = await fetch(`${API_URL}${ROTA_NIVEL}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nome: body.nome }),
      cache: 'no-store',
    });
    
    const dados = await resposta.json();
    return NextResponse.json(dados, { status: resposta.status });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao criar nível de acesso.' }, { status: 502 });
  }
}