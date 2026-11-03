import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL;
const ROTA_FUNCIONARIO = '/v1/oroscorp/funcionario';

export async function GET() {
  try {
    const resposta = await fetch(`${API_URL}${ROTA_FUNCIONARIO}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
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

    //variavel reponsavel por validar o token de usuario (ela vai lá e pega do cookies)
    const token = request.cookies.get('token')?.value;
    
    //trasforma os dados em JSON
    const body = await request.json();

    //pega os dados que o usuario escreve e trasforma em JSON
    const payload = {
      nome: body.nome,
      data_nascimento: body.data_nascimento,
      cpf: body.cpf,
      email: body.email,
      foto: body.foto, 
      id_cargo: Number(body.id_cargo),
      id_setor: Number(body.id_setor),
      id_status_funcionario: Number(body.id_status_funcionario),
    };

    //trasforma Content-Type do headers em JSON
    const headers = { 'Content-Type': 'application/json' };
    // verifica se o token é true 
    if (token) {
      //e autoriza a transão de dados para api atraves do token 
      headers['Authorization'] = `Bearer ${token}`;
    }

    //agora chama a API pra fazer funcionar tudo 
    const resposta = await fetch(`${API_URL}${ROTA_FUNCIONARIO}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    //cria uma resposta da api do tipo text
    const text = await resposta.text();
    //e trasforma em JSON
    const dados = text ? JSON.parse(text) : {};

    //se a resposta for diferente de true 
    if (!resposta.ok) {
      //cria tipo uma config mesage 
      const msg = dados.message || dados.response?.message || 'Erro ao cadastrar EPI.';
      return NextResponse.json({ message: msg }, { status: resposta.status });
    }

    return NextResponse.json(dados, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno no servidor Next.js.' }, { status: 500 });
  }
}