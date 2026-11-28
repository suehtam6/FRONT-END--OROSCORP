import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL;
const ROTA_ADMINISTRADOR = '/v1/oroscorp/administrador';
const ROTA_USUARIO = '/v1/oroscorp/usuario';

const ID_NIVEL_ADM = Number(process.env.ID_NIVEL_ADM || 1);
const ID_STATUS_ATIVO = Number(process.env.ID_STATUS_ATIVO || 1);

const FOTO_PADRAO = 'sem-foto.png';

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

async function callBack(method, route, body, authHeader) {
  const headers = { 'Content-Type': 'application/json' };
  if (authHeader) {
    headers['Authorization'] = authHeader;
    // Envia também no header 'token' caso algum middleware do backend leia por esse nome
    headers['token'] = authHeader.replace(/^Bearer\s+/i, '');
  }

  const resposta = await fetch(`${API_URL}${route}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const dados = await resposta.json().catch(() => ({}));
  return { resposta, dados };
}

const deuCerto = ({ resposta, dados }) =>
  resposta.ok &&
  (dados.status === true || dados.status_code === 200 || dados.status_code === 201);

const mensagemDe = (dados, padrao) =>
  [dados.message || dados.response?.message, dados.field].filter(Boolean).join(' - ') || padrao;

function extrairId(dados) {
  const r = dados.response;
  const candidato = r?.dados ?? r?.usuario ?? r;
  const item = Array.isArray(candidato) ? candidato[0] : candidato;
  return item?.id ?? item?.id_usuario ?? null;
}

export async function PUT(request, context) {
  const params = await context.params;
  const idAdm = Number(params?.id);
  const authHeader = obterAuthorization(request);

  if (!idAdm) {
    return NextResponse.json(
      { message: 'ID do administrador inválido na URL.' },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Requisição inválida.' }, { status: 400 });
  }

  const texto = (campo) => String(body?.[campo] ?? '').trim();
  const idUsuario = Number(body?.id_usuario);

  if (!idUsuario) {
    return NextResponse.json(
      { message: 'ID do usuário não informado para atualização.' },
      { status: 400 }
    );
  }

  const foto = texto('foto') || FOTO_PADRAO;

  // 1. Atualiza primeiro a tabela usuario: PUT /v1/oroscorp/usuario/:id_usuario
  const payloadUsuario = {
    nome: texto('nome'),
    foto,
    email: texto('email'),
    senha: texto('senha'),
    data_nascimento: texto('data_nascimento'),
    id_nivel_acesso: Number(body?.id_nivel_acesso || ID_NIVEL_ADM),
    id_status_conta: Number(body?.id_status_conta || ID_STATUS_ATIVO),
  };

  let atualizacaoUsuario;
  try {
    atualizacaoUsuario = await callBack(
      'PUT',
      `${ROTA_USUARIO}/${idUsuario}`,
      payloadUsuario,
      authHeader
    );
  } catch (err) {
    console.error('Erro de rede no PUT usuario:', err);
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor para atualizar o usuário.' },
      { status: 502 }
    );
  }

  if (!atualizacaoUsuario || !deuCerto(atualizacaoUsuario)) {
    console.error(
      'Falha no PUT usuario:',
      atualizacaoUsuario?.resposta?.status,
      atualizacaoUsuario?.dados
    );
    return NextResponse.json(
      {
        message: mensagemDe(
          atualizacaoUsuario?.dados || {},
          `Erro ${atualizacaoUsuario?.resposta?.status || 500} ao atualizar usuário.`
        ),
      },
      {
        status: atualizacaoUsuario?.resposta?.ok
          ? 400
          : atualizacaoUsuario?.resposta?.status || 502,
      }
    );
  }

  const idUsuarioArrumado = Number(extrairId(atualizacaoUsuario.dados)) || idUsuario;


  let atualizacaoAdm;
  try {
    atualizacaoAdm = await callBack(
      'PUT',
      `${ROTA_ADMINISTRADOR}/${idAdm}`,
      {
        cnpj: texto('cnpj'),
        razao_social: texto('razao_social'),
        id_usuario: idUsuarioArrumado,
      },
      authHeader
    );
  } catch (err) {
    console.error('Erro de rede no PUT administrador:', err);
    return NextResponse.json(
      { message: 'Usuário atualizado, mas falhou ao conectar na tabela administrador.' },
      { status: 502 }
    );
  }

  if (!atualizacaoAdm || !deuCerto(atualizacaoAdm)) {
    console.error(
      'Falha no PUT administrador:',
      atualizacaoAdm?.resposta?.status,
      atualizacaoAdm?.dados
    );
    return NextResponse.json(
      {
        message: mensagemDe(
          atualizacaoAdm?.dados || {},
          `Erro ${atualizacaoAdm?.resposta?.status || 500} ao atualizar dados da empresa.`
        ),
      },
      {
        status: atualizacaoAdm?.resposta?.ok
          ? 400
          : atualizacaoAdm?.resposta?.status || 502,
      }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      id_usuario: idUsuarioArrumado,
      id_adm: idAdm,
    },
    { status: 200 }
  );
}

export async function DELETE(request, context) {
  const params = await context.params;
  const idAdm = Number(params?.id);
  const authHeader = obterAuthorization(request);

  if (!idAdm) {
    return NextResponse.json(
      { message: 'ID do administrador inválido na URL.' },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const idUsuario = Number(body?.id_usuario);

  let exclusaoAdm;
  try {
    exclusaoAdm = await callBack(
      'DELETE',
      `${ROTA_ADMINISTRADOR}/${idAdm}`,
      undefined,
      authHeader
    );
  } catch {
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor para excluir o administrador.' },
      { status: 502 }
    );
  }

  if (!exclusaoAdm || !deuCerto(exclusaoAdm)) {
    return NextResponse.json(
      {
        message: mensagemDe(
          exclusaoAdm?.dados || {},
          'Não foi possível excluir o registro de administrador.'
        ),
      },
      {
        status: exclusaoAdm?.resposta?.ok
          ? 400
          : exclusaoAdm?.resposta?.status || 502,
      }
    );
  }

  if (idUsuario) {
    try {
      await callBack('DELETE', `${ROTA_USUARIO}/${idUsuario}`, undefined, authHeader);
    } catch (err) {
      console.error(
        `Administrador ${idAdm} excluído, mas falhou ao excluir usuário ${idUsuario}:`,
        err
      );
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}