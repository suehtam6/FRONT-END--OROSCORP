import { NextResponse } from 'next/server';

// Uma única rota atende as três etapas da recuperação de senha:
//   POST /api/recuperar/solicitar  -> pede o código por e-mail
//   POST /api/recuperar/validar    -> confere o código de 6 dígitos
//   POST /api/recuperar/redefinir  -> grava a nova senha
//
// Roda no SERVIDOR do Next (mesmo esquema do login). O e-mail e o token da recuperação
// ficam em cookies httpOnly: o navegador não consegue ler, só o servidor.
export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL; 


const BASE = '/v1/oroscorp/trocar-senha';

const COOKIE_EMAIL = 'rec_email'; 
const COOKIE_TOKEN = 'rec_token'; 
const QUINZE_MINUTOS = 60 * 15;

const opcoesCookie = (maxAge) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge,
});

async function chamarBack(caminho, body) {
  const resposta = await fetch(`${API_URL}${BASE}${caminho}`, {
    method: 'POST',
    
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const dados = await resposta.json().catch(() => ({}));
  return { resposta, dados };
}

const deuCerto = ({ resposta, dados }) => resposta.ok && dados.status === true;


const mensagemDe = (dados, padrao) =>
  [dados.message || dados.response?.message, dados.field].filter(Boolean).join(' - ') || padrao;

const erro = (message, status) => NextResponse.json({ message }, { status });

const erroDoBack = ({ resposta, dados }, padrao) =>
  erro(mensagemDe(dados, padrao), resposta.ok ? 502 : resposta.status);

const erroConexao = () =>
  erro('Não foi possível conectar ao servidor. Confira se o back-end está rodando.', 502);

async function solicitar(body) {
  const email = String(body?.email || '').trim();
  if (!email) return erro('Informe o e-mail.', 400);

  let passo;
  try {
    passo = await chamarBack('/solicitar', { email });
  } catch {
    return erroConexao();
  }

  if (!deuCerto(passo)) return erroDoBack(passo, 'Não foi possível enviar o código.');


  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_EMAIL, email, opcoesCookie(QUINZE_MINUTOS));
  return res;
}


async function validar(request, body) {
  const email = request.cookies.get(COOKIE_EMAIL)?.value;
  if (!email) return erro('Sessão expirada. Volte e peça um novo código.', 400);

  const codigo = String(body?.codigo || '').trim();
  if (!/^\d{6}$/.test(codigo)) return erro('Digite os 6 dígitos do código.', 400);

  let passo;
  try {
    passo = await chamarBack('/validar', { email, codigo });
  } catch {
    return erroConexao();
  }

  if (!deuCerto(passo)) return erroDoBack(passo, 'Código inválido ou expirado.');

  const token = passo.dados.response?.token_redefinicao;
  if (!token) return erro('Resposta inesperada do servidor.', 502);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_TOKEN, token, opcoesCookie(QUINZE_MINUTOS));
  res.cookies.set(COOKIE_EMAIL, '', opcoesCookie(0)); 
  return res;
}


async function redefinir(request, body) {
  const token = request.cookies.get(COOKIE_TOKEN)?.value;
  if (!token) return erro('Sessão expirada. Volte e peça um novo código.', 401);

  const senha = String(body?.senha || '');
  if (senha.length < 8 || senha.length > 72) {
    return erro('A senha deve ter entre 8 e 72 caracteres.', 400);
  }

  let passo;
  try {
    passo = await chamarBack('/redefinir', { token, senha });
  } catch {
    return erroConexao();
  }

  if (!deuCerto(passo)) return erroDoBack(passo, 'Não foi possível alterar a senha.');

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_TOKEN, '', opcoesCookie(0));
  res.cookies.set(COOKIE_EMAIL, '', opcoesCookie(0));
  return res;
}

export async function POST(request, { params }) {
  const { etapa } = await params; 

  let body;
  try {
    body = await request.json();
  } catch {
    return erro('Requisição inválida.', 400);
  }

  if (etapa === 'solicitar') return solicitar(body);
  if (etapa === 'validar') return validar(request, body);
  if (etapa === 'redefinir') return redefinir(request, body);

  return erro('Rota não encontrada.', 404);
}