import { NextResponse } from 'next/server';

// Esta rota roda no SERVIDOR do Next. O navegador só conversa com o Next;
// quem chama o back-end é o servidor. Por isso não há problema de CORS e o
// back pode ficar em localhost, sem precisar ser acessível de fora.
export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL; // ex: http://localhost:8080

const OITO_HORAS = 60 * 60 * 8; // igual à duração do JWT do seu back

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
    // Erros do seu configMessages podem vir em "message" ou, no 400, em "field".
    const mensagem =
      dados.message || dados.response?.message || dados.field || 'Não foi possível entrar.';

    return NextResponse.json(
      { message: mensagem },
      { status: resposta.ok ? 502 : resposta.status }
    );
  }

  const res = NextResponse.json({ usuario });

  const opcoes = {
    httpOnly: true, // o JavaScript do navegador não consegue ler (protege contra XSS)
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: OITO_HORAS,
  };

  // 1) O token: a "chave" de acesso. Fica salvo por 8h, mesmo se fechar e abrir a aba.
  res.cookies.set('token', token, opcoes);

  // 2) Os dados do perfil, só o que a interface precisa (nada de senha, nada sensível).
  //    A rota /api/me lê este cookie para o menu mostrar quem está logado.
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