import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL;
const ROTA_FUNCIONARIO = '/v1/oroscorp/funcionario';

const ID_STATUS_INATIVO = 2;

function obterHeadersAuth(request) {
  const headers = { 'Content-Type': 'application/json' };
  const headerAuth = request.headers.get('authorization');
  const tokenCookie =
    request.cookies.get('token')?.value ||
    request.cookies.get('auth_token')?.value ||
    request.cookies.get('jwt')?.value ||
    request.cookies.get('access_token')?.value ||
    request.cookies.get('oroscorp_token')?.value;

  const bruto = headerAuth || tokenCookie;
  if (bruto) {
    const tokenLimpo = bruto.replace(/^Bearer\s+/i, '').trim();
    headers['Authorization'] = `Bearer ${tokenLimpo}`;
    headers['token'] = tokenLimpo;
  }

  return headers;
}

function extrairRegistroFuncionario(dados) {
  const r = dados?.response;
  const candidato = r?.dados ?? r?.funcionario ?? r?.funcionarios ?? r ?? dados;
  return Array.isArray(candidato) ? candidato[0] : candidato;
}

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = Number(params?.id);

    if (!id) {
      return NextResponse.json(
        { message: 'ID do funcionário inválido.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const headers = obterHeadersAuth(request);

    const payload = {
      nome: String(body?.nome ?? '').trim(),
      cpf: String(body?.cpf ?? '').trim(),
      rg: String(body?.rg ?? '').trim(),
      foto: String(body?.foto ?? '').trim(),
      telefone: String(body?.telefone ?? '').trim(),
      email: String(body?.email ?? '').trim(),
      data_nascimento: String(body?.data_nascimento ?? '').trim(),
      id_setor: Number(body?.id_setor),
      id_status_funcionario: Number(body?.id_status_funcionario || 1),
    };

    const resposta = await fetch(`${API_URL}${ROTA_FUNCIONARIO}/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return NextResponse.json(
        { message: dados.message || dados.response?.message || 'Erro ao atualizar funcionário.' },
        { status: resposta.status }
      );
    }

    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    console.error('Erro no PUT funcionario:', error);
    return NextResponse.json(
      { message: 'Erro interno ao atualizar funcionário.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const id = Number(params?.id);

    if (!id) {
      return NextResponse.json(
        { message: 'ID do funcionário inválido.' },
        { status: 400 }
      );
    }

    const headers = obterHeadersAuth(request);

    // 1. Busca os dados atuais do funcionário para não sobrescrever campos obrigatórios no PUT
    const buscaAtual = await fetch(`${API_URL}${ROTA_FUNCIONARIO}/${id}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const dadosBusca = await buscaAtual.json().catch(() => ({}));
    const funcionarioAtual = extrairRegistroFuncionario(dadosBusca);

    if (!buscaAtual.ok || !funcionarioAtual) {
      return NextResponse.json(
        { message: dadosBusca.message || 'Funcionário não encontrado para inativação.' },
        { status: buscaAtual.status || 404 }
      );
    }

    // Formata data_nascimento caso venha em formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
    const dataNasc = funcionarioAtual.data_nascimento
      ? String(funcionarioAtual.data_nascimento).split('T')[0]
      : '';

    // 2. Dispara o PUT mantendo os dados originais e alterando o status para Inativo (id = 2)
    const payloadInativacao = {
      nome: funcionarioAtual.nome,
      cpf: funcionarioAtual.cpf,
      rg: funcionarioAtual.rg,
      foto: funcionarioAtual.foto || 'sem-foto.png',
      telefone: funcionarioAtual.telefone,
      email: funcionarioAtual.email,
      data_nascimento: dataNasc,
      id_setor: Number(funcionarioAtual.id_setor),
      id_status_funcionario: ID_STATUS_INATIVO,
    };

    const resposta = await fetch(`${API_URL}${ROTA_FUNCIONARIO}/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payloadInativacao),
      cache: 'no-store',
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      return NextResponse.json(
        { message: dados.message || dados.response?.message || 'Erro ao inativar funcionário.' },
        { status: resposta.status }
      );
    }

    return NextResponse.json(
      { ok: true, message: 'Funcionário inativado com sucesso.', dados },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro no DELETE (inativação) funcionario:', error);
    return NextResponse.json(
      { message: 'Erro interno ao inativar funcionário.' },
      { status: 500 }
    );
  }
}