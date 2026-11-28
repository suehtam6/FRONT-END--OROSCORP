import { NextResponse } from "next/server";

// Rotas que podem ser acessadas SEM estar logado
const ROTAS_PUBLICAS = ["/", "/trocar_senha", "/cadastrarAdm"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Ignora arquivos internos do Next, imagens da pasta public e rotas da API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  const usuarioCookie = request.cookies.get("usuario")?.value;

  const ehRotaPublica = ROTAS_PUBLICAS.includes(pathname);

  // 1. Se tentar acessar página interna (/home, /epis, /setores, etc.) SEM token -> manda para o Login (/)
  if (!ehRotaPublica && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. Validação extra: garante que o cookie de usuário pertence a um ADM
  if (!ehRotaPublica && usuarioCookie) {
    try {
      const usuario = JSON.parse(usuarioCookie);
      const nivel = Array.isArray(usuario.nivel_acesso)
        ? usuario.nivel_acesso[0]
        : usuario.nivel_acesso;

      const idNivel =
        nivel?.id ??
        nivel?.id_nivel_acesso ??
        usuario.id_nivel_acesso;
      const nomeNivel = String(nivel?.nivel ?? nivel?.nome ?? nivel ?? "")
        .trim()
        .toUpperCase();

      const ehAdm =
        Number(idNivel) === 1 ||
        nomeNivel === "ADM" ||
        nomeNivel === "ADMINISTRADOR";

      if (!ehAdm) {
        const response = NextResponse.redirect(new URL("/", request.url));
        response.cookies.delete("token");
        response.cookies.delete("usuario");
        return response;
      }
    } catch {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 3. Se já estiver logado e tentar voltar para a tela de login (/), manda direto para /home
  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};