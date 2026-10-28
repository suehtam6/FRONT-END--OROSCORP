import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Devolve o perfil de quem fez login. Os cookies são httpOnly, então o navegador
// não consegue lê-los direto; esta rota (no servidor) lê e entrega só o perfil.
// O token em si NUNCA é devolvido.
export async function GET() {
  const cookieStore = await cookies(); // o await funciona no Next 14 e no 15+

  if (!cookieStore.get('token')) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  let usuario = null;
  try {
    usuario = JSON.parse(cookieStore.get('usuario')?.value || 'null');
  } catch {
    usuario = null;
  }

  if (!usuario) {
    return NextResponse.json(
      { message: 'Perfil não encontrado. Faça login novamente.' },
      { status: 401 }
    );
  }

  return NextResponse.json({ usuario });
}