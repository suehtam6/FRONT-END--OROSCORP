import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL;
const ROTA_CAMERA = '/v1/oroscorp/camera';


export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Requisição inválida.' }, { status: 400 });
  }


  const texto = (campo) => String(body?.[campo] ?? '');
  const numero = (campo) => Number(body?.[campo] ?? 0);


  try {
    const resposta = await fetch(`${API_URL}${ROTA_CAMERA}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: texto('nome'),
        endereco_stream: texto('ip'),
        id_setor: numero('id_setor'),
        descricao: texto('descricao'),
        id_status_camera: numero('id_status_camera')
      }),
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));

    if (resposta.ok && dados.status === true) {
      return NextResponse.json({ ok: true, dados }, { status: 201 });
    }

    const mensagemErro = dados.message || dados.response?.message || 'Não foi possível cadastrar a câmera.';
    
    return NextResponse.json(
      { message: mensagemErro },
      { status: resposta.ok ? 400 : resposta.status }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor.' },
      { status: 502 }
    );
  }
}


export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const resposta = await fetch(`${API_URL}${ROTA_CAMERA}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ([]));

    if (!resposta.ok) {
      return NextResponse.json(
        { message: 'Erro ao buscar as câmeras.' },
        { status: resposta.status }
      );
    }

    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor.' },
      { status: 502 }
    );
  }
}