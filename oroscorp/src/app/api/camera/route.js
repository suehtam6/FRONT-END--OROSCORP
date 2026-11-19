import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const IA_URL = process.env.IA_URL || 'http://localhost:5000';
const API_URL = process.env.API_URL;
const ROTA_CAMERA = '/v1/oroscorp/camera';

function obterAuthorization(request) {
  const headerAuth = request.headers.get('authorization');
  if (headerAuth) return headerAuth;

  const tokenCookie =
    request.cookies.get('token')?.value ||
    request.cookies.get('auth_token')?.value ||
    request.cookies.get('jwt')?.value ||
    request.cookies.get('access_token')?.value ||
    request.cookies.get('oroscorp_token')?.value;

  if (tokenCookie) {
    return tokenCookie.startsWith('Bearer ')
      ? tokenCookie
      : `Bearer ${tokenCookie}`;
  }

  return '';
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Requisição inválida.' }, { status: 400 });
  }

  const texto = (campo) => String(body?.[campo] ?? '').trim();
  const numero = (campo) => Number(body?.[campo] ?? 0);

  // Normaliza o JSON exatamente como o Back-end Node e a IA esperam
  const payload = {
    nome: texto('nome'),
    endereco_stream: texto('endereco_stream') || texto('ip'),
    id_setor: numero('id_setor'),
    descricao: texto('descricao'),
    id_status_camera: numero('id_status_camera') || 1,
  };

  if (!payload.nome || !payload.endereco_stream || !payload.id_setor) {
    return NextResponse.json(
      { message: 'Preencha nome, endereço RTSP e setor da câmera.' },
      { status: 400 }
    );
  }

  const authHeader = obterAuthorization(request);
  const headers = { 'Content-Type': 'application/json' };
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  try {
    // Envia para a IA iniciar o stream RTSP e encaminhar o POST para o Node com a URL HTTP
    const resposta = await fetch(`${IA_URL}/registrar_camera`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return NextResponse.json(
        { message: dados?.message || 'Não foi possível registrar a câmera na IA.' },
        { status: resposta.status }
      );
    }

    return NextResponse.json({ ok: true, ...dados }, { status: 201 });
  } catch (err) {
    console.error('Erro ao conectar com o servidor Python da IA:', err);
    return NextResponse.json(
      { message: 'Servidor de IA offline. Verifique se o Python está em execução.' },
      { status: 502 }
    );
  }
}

export async function GET(request) {
  try {
    const authHeader = obterAuthorization(request);
    const headers = { 'Content-Type': 'application/json' };
    if (authHeader) {
      headers['Authorization'] = authHeader;
      headers['token'] = authHeader.replace(/^Bearer\s+/i, '');
    }

    const resposta = await fetch(`${API_URL}${ROTA_CAMERA}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => []);

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