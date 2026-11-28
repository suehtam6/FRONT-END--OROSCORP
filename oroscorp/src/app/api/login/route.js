import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL; // ex: http://localhost:8080

const OITO_HORAS = 60 * 60 * 8; // igual à duração do JWT do seu back

function ehAdministrador(usuario) {
  if (!usuario || typeof usuario !== 'object') return false;

  // Caso nivel_acesso venha como array (padrão comum da API Oroscorp)
  if (Array.isArray(usuario.nivel_acesso) && usuario.nivel_acesso.length > 0) {
    const nivel = usuario.nivel_acesso[0];
    const idNivel = nivel?.id ?? nivel?.id_nivel_acesso;
    const nomeNivel = String(nivel?.nivel ?? nivel?.nome ?? '').trim().toUpperCase();

    if (idNivel !== undefined && idNivel !== null) return Number(idNivel) === 1;
    return nomeNivel === 'ADM' || nomeNivel === 'ADMINISTRADOR';
  }

  // Caso nivel_acesso venha como objeto
  if (usuario.nivel_acesso && typeof usuario.nivel_acesso === 'object') {
    const idNivel = usuario.nivel_acesso.id ?? usuario.nivel_acesso.id_nivel_acesso;
    const nomeNivel = String(
      usuario.nivel_acesso.nivel ?? usuario.nivel_acesso.nome ?? ''
    )
      .trim()
      .toUpperCase();

    if (idNivel !== undefined && idNivel !== null) return Number(idNivel) === 1;
    return nomeNivel === 'ADM' || nomeNivel === 'ADMINISTRADOR';
  }

  // Caso venha como ID direto (id_nivel_acesso) ou string
  const idDireto = usuario.id_nivel_acesso ?? usuario.idNivelAcesso;
  if (idDireto !== undefined && idDireto !== null) {
    return Number(idDireto) === 1;
  }

  const textoDireto = String(usuario.nivel_acesso ?? '').trim().toUpperCase();
  return textoDireto === 'ADM' || textoDireto === 'ADMINISTRADOR';
}

export async function POST(request) {
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ message: 'Requisição inválida.' }, { status: 400 });
  }

  const { email, senha } = corpo;
  if (!email || !senha) {
    return NextResponse.json({ message: 'Informe e-mail e senha.' }, { status: 400 });
  }

  let resposta;
  try {
    resposta = await fetch(`${API_URL}/v1/oroscorp/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor. Confira se o back-end está rodando.' },
      { status: 502 }
    );
  }

  const dados = await resposta.json().catch(() => ({}));

  // Formato do seu back:
  // { status, status_code, response: { dados: {...}, token: "..." } }
  const token = dados.response?.token;
  const usuario = dados.response?.dados;

  if (!resposta.ok || dados.status !== true || !token) {
    const mensagem =
      dados.message || dados.response?.message || dados.field || 'Não foi possível entrar.';

    return NextResponse.json(
      { message: mensagem },
      { status: resposta.ok ? 502 : resposta.status }
    );
  }

  // Bloqueio no servidor: só permite acesso para nível ADM
  if (!ehAdministrador(usuario)) {
    return NextResponse.json(
      { message: 'Acesso restrito. Apenas usuários com nível ADM podem acessar o painel.' },
      { status: 403 }
    );
  }

  const res = NextResponse.json({ usuario });

  const opcoes = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: OITO_HORAS,
  };

  // 1) O token: a "chave" de acesso. Fica salvo por 8h, mesmo se fechar e abrir a aba.
  res.cookies.set('token', token, opcoes);

  // 2) Os dados do perfil, só o que a interface precisa.
  if (usuario) {
    res.cookies.set(
      'usuario',
      JSON.stringify({
        id: usuario.id,
        nome: usuario.nome,
        foto: usuario.foto,
        email: usuario.email,
        nivel_acesso: usuario.nivel_acesso,
      }),
      opcoes
    );
  }

  return res;
}