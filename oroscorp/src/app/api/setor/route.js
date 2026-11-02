import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL;
const ROTA_SETOR = '/v1/oroscorp/setor';

export async function GET() {
  try {
    const resposta = await fetch(`${API_URL}${ROTA_SETOR}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return NextResponse.json({ message: 'Erro ao buscar os setores do backend.' }, { status: resposta.status });
    }

    // Retorna a estrutura limpa diretamente ou a resposta bruta do backend
    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor para buscar os setores.' },
      { status: 502 }
    );
  }
}