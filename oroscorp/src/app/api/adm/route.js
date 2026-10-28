import { NextResponse } from 'next/server';

// Roda no SERVIDOR do Next: o navegador chama só /api/adm, e aqui são feitas as
// DUAS chamadas ao back, na ordem certa:
//   1) POST /usuario        -> cria o usuário e devolve o id
//   2) POST /administrador  -> cria o ADM usando o id_usuario do passo 1
// A foto já chega pronta: a tela envia a imagem para o Cloudinary e manda só o endereço (URL).
export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL; // ex: http://localhost:8080

const ROTA_USUARIO = '/v1/oroscorp/usuario';
const ROTA_ADMINISTRADOR = '/v1/oroscorp/administrador';


const ID_NIVEL_ADM = Number(process.env.ID_NIVEL_ADM || 1);
const ID_STATUS_ATIVO = Number(process.env.ID_STATUS_ATIVO || 1);


const PREFIXO_FOTO = 'https://res.cloudinary.com/deuflqtkr/';
const FOTO_PADRAO = 'sem-foto.png';

async function callBack(method, route, body) {
  const resposta = await fetch(`${API_URL}${route}`, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const dados = await resposta.json().catch(() => ({}));
  return { resposta, dados };
}

const deuCerto = ({ resposta, dados }) => resposta.ok && dados.status === true;


const mensagemDe = (dados, padrao) =>
  [dados.message || dados.response?.message, dados.field].filter(Boolean).join(' - ') || padrao;


//Extraindo o ID do usuario quando ele for criado
function extrairId(dados) {
  const r = dados.response;
  const candidato = r?.dados ?? r?.usuario ?? r;
  const item = Array.isArray(candidato) ? candidato[0] : candidato;
  return item?.id ?? item?.id_usuario ?? null;
}


async function desfazerUsuario(id) {
  try {
    const { resposta, dados } = await callBack('DELETE', `${ROTA_USUARIO}/${id}`);
    return resposta.ok && dados.status !== false;
  } catch {
    return false;
  }
}

const erroConexao = () =>
  NextResponse.json(
    { message: 'Não foi possível conectar ao servidor. Confira se o back-end está rodando.' },
    { status: 502 }
  );

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Requisição inválida.' }, { status: 400 });
  }

  const texto = (campo) => String(body?.[campo] ?? '');

  
  // Caso nn envie uma foto, o banco vai salvar um png falso, para evitar problemas
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
    cadastroUsuario = await callBack('POST', ROTA_USUARIO, {
      nome: texto('nome'),
      foto,
      email: texto('email'),
      senha: texto('senha'),
      data_nascimento: texto('data_nascimento'),
      id_nivel_acesso: ID_NIVEL_ADM,
      id_status_conta: ID_STATUS_ATIVO,
    });
  } catch {
    return erroConexao();
  }

  if (!deuCerto(cadastroUsuario)) {
    return NextResponse.json(
      { message: mensagemDe(cadastroUsuario.dados, 'Não foi possível cadastrar o usuário.') },
      { status: cadastroUsuario.resposta.ok ? 502 : cadastroUsuario.resposta.status }
    );
  }

  const idUsuario = extrairId(cadastroUsuario.dados);

  if (!idUsuario) {
    // Só para você ver o formato real da resposta e ajustar o extrairId (pode remover depois).
    console.error('Cadastro de usuário sem id na resposta:', JSON.stringify(cadastroUsuario.dados));
    return NextResponse.json(
      {
        message:
          'O usuário foi criado, mas não consegui ler o id na resposta do back. ' +
          'Veja o terminal do Next e remova esse usuário antes de tentar de novo.',
      },
      { status: 502 }
    );
  }


  let cadastroADM = null;
  try {
    cadastroADM = await callBack('POST', ROTA_ADMINISTRADOR, {
      cnpj: texto('cnpj'),
      razao_social: texto('razao_social'),
      id_usuario: idUsuario,
    });
  } catch {
    cadastroADM = null; 
  }

  if (cadastroADM && deuCerto(cadastroADM)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }



  const desfez = await desfazerUsuario(idUsuario);

  const motivo = cadastroADM
    ? mensagemDe(cadastroADM.dados, 'Não foi possível cadastrar o administrador.')
    : 'Não foi possível conectar ao servidor.';

  return NextResponse.json(
    {
      message: desfez
        ? motivo
        : `${motivo} O usuário ${idUsuario} ficou criado sem administrador; remova-o antes de tentar de novo.`,
    },
    { status: cadastroADM && !cadastroADM.resposta.ok ? cadastroADM.resposta.status : 502 }
  );
}