import { NextResponse } from 'next/server';
import { criarUsuarioBackEnd, desfazerUsuarioBackEnd } from '../utils/apiBase'; // Importe as funções base

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL || 'http://localhost:8080';
const ROTA_RESPONSAVEL = '/v1/oroscorp/responsavel';

const ID_NIVEL_RESPONSAVEL = Number(process.env.ID_NIVEL_RESPONSAVEL || 2);
const ID_STATUS_ATIVO = Number(process.env.ID_STATUS_ATIVO || 1);

const PREFIXO_FOTO = 'https://res.cloudinary.com/deuflqtkr/';
const FOTO_PADRAO = 'sem-foto.png';

const deuCerto = ({ resposta, dados }) => resposta.ok && dados.status !== false;

const mensagemDe = (dados, padrao) =>
  [dados.message || dados.response?.message, dados.field].filter(Boolean).join(' - ') || padrao;

function extrairId(dados) {
  const r = dados.response;
  const candidato = r?.dados ?? r?.usuario ?? r;
  const item = Array.isArray(candidato) ? candidato[0] : candidato;
  return item?.id ?? item?.id_usuario ?? null;
}

export async function POST(request) {

  const token = request.cookies.get('token')?.value; 

  if (!token) {
    return NextResponse.json({ message: 'Token não informado. Faça login novamente.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Requisição inválida.' }, { status: 400 });
  }

  const texto = (campo) => String(body?.[campo] ?? '');

  let foto = FOTO_PADRAO;
  const fotoRecebida = texto('foto');

  if (fotoRecebida) {
    if (!fotoRecebida.startsWith(PREFIXO_FOTO) || fotoRecebida.length > 256) {
      return NextResponse.json({ message: 'Foto inválida.' }, { status: 400 });
    }
    foto = fotoRecebida;
  }

  
  let cadastroUsuario;
  try {
    cadastroUsuario = await criarUsuarioBackEnd({
      nome: texto('nome'),
      foto,
      email: texto('email'),
      senha: texto('senha'),
      data_nascimento: texto('data_nascimento'),
      id_nivel_acesso: ID_NIVEL_RESPONSAVEL,
      id_status_conta: ID_STATUS_ATIVO,
    }, token);
  } catch {
    return NextResponse.json({ message: 'Não foi possível conectar ao servidor.' }, { status: 502 });
  }

  if (!deuCerto(cadastroUsuario)) {
    return NextResponse.json(
      { message: mensagemDe(cadastroUsuario.dados, 'Não foi possível cadastrar o usuário.') },
      { status: cadastroUsuario.resposta.ok ? 502 : cadastroUsuario.resposta.status }
    );
  }

  const idUsuario = extrairId(cadastroUsuario.dados);

  if (!idUsuario) {
    return NextResponse.json(
      { message: 'Usuário criado, mas não foi possível ler o ID na resposta.' },
      { status: 502 }
    );
  }

 
  let cadastroResponsavel = null;
  try {
    const respostaResp = await fetch(`${API_URL}${ROTA_RESPONSAVEL}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        cpf: texto('cpf'),
        id_usuario: idUsuario,
      }),
      cache: 'no-store',
    });
    const dadosResp = await respostaResp.json().catch(() => ({}));
    cadastroResponsavel = { resposta: respostaResp, dados: dadosResp };
  } catch {
    cadastroResponsavel = null; 
  }

  if (cadastroResponsavel && deuCerto(cadastroResponsavel)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }


  const desfez = await desfazerUsuarioBackEnd(idUsuario, token);

  const motivo = cadastroResponsavel
    ? mensagemDe(cadastroResponsavel.dados, 'Não foi possível cadastrar o responsável.')
    : 'Não foi possível conectar ao servidor.';

  return NextResponse.json(
    {
      message: desfez
        ? motivo
        : `${motivo} O usuário ficou criado sem responsável; remova-o manualmente.`,
    },
    { status: cadastroResponsavel && !cadastroResponsavel.resposta.ok ? cadastroResponsavel.resposta.status : 502 }
  );
}


export async function GET(request) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json(
      { message: 'Token não informado. Faça login novamente.' },
      { status: 401 }
    );
  }

  try {
    const resposta = await fetch(`${API_URL}${ROTA_RESPONSAVEL}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return NextResponse.json(
        { message: mensagemDe(dados, 'Erro ao buscar os responsáveis do backend.') },
        { status: resposta.status }
      );
    }

    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor para buscar os responsáveis.' },
      { status: 502 }
    );
  }
}