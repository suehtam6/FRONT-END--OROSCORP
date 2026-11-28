/*
  Autor: Matheus Lucas
  Objetivo: Rota que busca uma ocorrência específica pelo ID na API
  Data: 10/11/2026
*/
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL;
const ROTA_OCORRENCIA = '/v1/oroscorp/ocorrencia';

function obterToken(request) {
  const headerAuth = request.headers.get('authorization') || request.headers.get('token');
  if (headerAuth) {
    return headerAuth.replace(/^Bearer\s+/i, '').trim();
  }

  const nomesComuns = ['token', 'auth_token', 'jwt', 'access_token', 'oroscorp_token'];
  for (const nome of nomesComuns) {
    const val = request.cookies.get(nome)?.value;
    if (val) return val;
  }

  for (const c of request.cookies.getAll()) {
    if (c.value && c.value.split('.').length === 3) {
      return c.value;
    }
  }

  return '';
}

function extrairDadosDoToken(token) {
  if (!token) return null;
  try {
    const partes = token.split('.');
    if (partes.length < 2) return null;

    const payloadBase64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  const { id } = await params;
  const token = obterToken(request);
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['token'] = token;
  }

  try {
    const resposta = await fetch(`${API_URL}${ROTA_OCORRENCIA}/dados/${id}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      return NextResponse.json(
        { message: dados?.message || dados?.response?.message || 'Erro ao buscar detalhes da ocorrência.' },
        { status: resposta.status }
      );
    }

    return NextResponse.json(dados, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor.' },
      { status: 502 }
    );
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Requisição inválida.' }, { status: 400 });
  }

  const token = obterToken(request);
  const dadosToken = extrairDadosDoToken(token);

  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['token'] = token;
  }

  const idUsuarioToken = Number(
    dadosToken?.id ||
      dadosToken?.id_usuario ||
      dadosToken?.idUsuario ||
      dadosToken?.userId ||
      dadosToken?.sub ||
      0
  );

  const { vincular_usuario_token, ...restoBody } = body;
  const idRespAtual = Number(restoBody.id_usuario_registro || 0);

  const payloadFinal = {
    ...restoBody,
    id_usuario_registro:
      (vincular_usuario_token || !idRespAtual) && idUsuarioToken
        ? idUsuarioToken
        : idRespAtual || 1,
  };

  try {
    const resposta = await fetch(`${API_URL}${ROTA_OCORRENCIA}/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payloadFinal),
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return NextResponse.json(
        { message: dados?.message || dados?.response?.message || 'Erro ao atualizar ocorrência.' },
        { status: resposta.status }
      );
    }

    return NextResponse.json(dados, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor.' },
      { status: 502 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const token = obterToken(request);
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['token'] = token;
    }

    const resposta = await fetch(`${API_URL}${ROTA_OCORRENCIA}/${id}`, {
      method: 'DELETE',
      headers,
      cache: 'no-store',
    });

    const text = await resposta.text();
    const dados = text ? JSON.parse(text) : {};

    if (!resposta.ok) {
      return NextResponse.json(
        { message: dados.message || 'Erro ao deletar ocorrência.' },
        { status: resposta.status }
      );
    }

    return NextResponse.json({ sucesso: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno no servidor Next.js.' }, { status: 500 });
  }
}