import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL;
const ROTA_EPI = '/v1/oroscorp/epi';

export async function POST(request) {
  try {
    // Captura o corpo enviado pelo frontend
    const body = await request.json();

    // Monta o payload exatamente no formato esperado pelo Spring Boot
    const payload = {
      nome: body.nome,
      descricao: body.descricao,
      foto: body.foto,
      cor: body.cor,
      id_categoria: Number(body.id_categoria)
    };

    // Faz a requisição para o backend externo
    const resposta = await fetch(`${API_URL}${ROTA_EPI}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const text = await resposta.text();
    const dados = text ? JSON.parse(text) : {};

    if (!resposta.ok) {
      const mensagemErro = dados.message || dados.response?.message || 'Erro ao cadastrar o EPI no servidor.';
      return NextResponse.json(
        { message: mensagemErro }, 
        { status: resposta.status }
      );
    }

    return NextResponse.json(dados, { status: 201 });
  } catch (error) {
    console.error('Erro na rota API /api/epi:', error);
    return NextResponse.json(
      { message: 'Erro interno no servidor Next.js ao processar a requisição.' }, 
      { status: 500 }
    );
  }
}