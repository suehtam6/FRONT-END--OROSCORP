 import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
// puxa o .env
const API_URL = process.env.API_URL;
const ROTA_CARGO = '/v1/oroscorp/cargo';


export async function GET(request) {
    try {
        const token = request.cookies.get('token')?.value;
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const resposta =  await fetch(`${API_URL}${ROTA_CARGO}`,{
            //diz qual o metodo do fetch
            method: 'GET',
            // é como se fosse um envelope que trasformamos en json 
            // headers: envelope, body: messagen(dados)
            headers: {'Content-Type': 'application/json'},
            //O no-store diz “não guarde nada, busque os dados 
            // frescos da API toda vez”. Útil para listas que mudam, como funcionários.
            cache: 'no-store'
        });
                
        //agora vamos preparar os dados que vamos receber para formato Json
        const dados = await resposta.json().catch(() => ({}))

        //auto explicativo 
        if (!resposta.ok) {
            return NextResponse.json({ message: 'Erro ao buscar os funcionários do backend.' }, { status: resposta.status });
        }

        return NextResponse.json(dados, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { message: 'Não foi possível conectar ao servidor para buscar os funcionários.' },
            { status: 502 }
          );
    }
}


export async function POST(request) {
  try {
    //variavel reponsavel por validar o token de usuario (ela vai lá e pega do cookies)
    const token = request.cookies.get('token')?.value;
    
    //trasforma os dados em JSON
    const body = await request.json();

    //pega os dados que o usuario escreve e trasforma em JSON
    const payload = {
        cargo: body.cargo
    };

    //trasforma Content-Type do headers em JSON
    const headers = { 'Content-Type': 'application/json' };
    // verifica se o token é true 
    if (token) {
      //e autoriza a transão de dados para api atraves do token 
      headers['Authorization'] = `Bearer ${token}`;
    }

    //agora chama a API pra fazer funcionar tudo 
    const resposta = await fetch(`${API_URL}${ROTA_CARGO}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    //cria uma resposta da api do tipo text
    const text = await resposta.text();
    //e trasforma em JSON
    const dados = text ? JSON.parse(text) : {};

    //se a resposta for diferente de true 
    if (!resposta.ok) {
      //cria tipo uma config mesage 
      const msg = dados.message || dados.response?.message || 'Erro ao cadastrar EPI.';
      return NextResponse.json({ message: msg }, { status: resposta.status });
    }

    return NextResponse.json(dados, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno no servidor Next.js.' }, { status: 500 });
  }
}

export async function PUT(request) {
    try {

      const { id } = await params;

      //variavel reponsavel por validar o token de usuario (ela vai lá e pega do cookies)
      const token = request.cookies.get('token')?.value;
      
      //trasforma os dados em JSON
      const body = await request.json();
  
      //pega os dados que o usuario escreve e trasforma em JSON
      const payload = {
        id: Number(id),
        cargo: body.cargo,
      };
  
      //trasforma Content-Type do headers em JSON
      const headers = { 'Content-Type': 'application/json' };
      // verifica se o token é true 
      if (token) {
        //e autoriza a transão de dados para api atraves do token 
        headers['Authorization'] = `Bearer ${token}`;
      }
  
      //agora chama a API pra fazer funcionar tudo 
      const resposta = await fetch(`${API_URL}${ROTA_CARGO}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        cache: 'no-store',
      });
  
      //cria uma resposta da api do tipo text
      const text = await resposta.text();
      //e trasforma em JSON
      const dados = text ? JSON.parse(text) : {};
  
      //se a resposta for diferente de true 
      if (!resposta.ok) {
        //cria tipo uma config mesage 
        const msg = dados.message || dados.response?.message || 'Erro ao cadastrar EPI.';
        return NextResponse.json({ message: msg }, { status: resposta.status });
      }
  
      return NextResponse.json(dados, { status: 201 });
    } catch (error) {
      return NextResponse.json({ message: 'Erro interno no servidor Next.js.' }, { status: 500 });
    }
  }


  export async function DELETE(request, { params }) {
    try {
      const { id } = await params;
      const token = request.cookies.get('token')?.value;
  
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
  
      const resposta = await fetch(`${API_URL}${ROTA_CARGO}/${id}`, {
        method: 'DELETE',
        headers,
        cache: 'no-store',
      });
  
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        return NextResponse.json(
          { message: dados.message || 'Erro ao deletar o nível de acesso.' },
          { status: resposta.status }
        );
      }
  
      return NextResponse.json({ sucesso: true }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { message: 'Erro interno no servidor ao deletar nível de acesso.' },
        { status: 500 }
      );
    }
  }