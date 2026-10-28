import path from 'path';
import { promises as fs } from 'fs';


/*
Data : 26 de Outubro de 2026
Objetivo : Arquivo responsavel para salvar a foto e escolher qual o tipo de foto aceito
Autor : Matheus Lucas
*/

export const dynamic = 'force-dynamic';


const PASTA_FOTOS = process.env.FOTOS_DIR || path.join(process.cwd(), 'uploads', 'fotos');

const TIPOS = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export async function GET(request, { params }) {
  const { nome } = await params; 

  const arquivo = path.basename(nome);
  const extensao = arquivo.split('.').pop()?.toLowerCase();
  const tipo = TIPOS[extensao];

  if (!tipo) {
    return new Response('Formato não suportado', { status: 400 });
  }

  try {
    const conteudo = await fs.readFile(path.join(PASTA_FOTOS, arquivo));
    return new Response(conteudo, {
      headers: {
        'Content-Type': tipo,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new Response('Foto não encontrada', { status: 404 });
  }
}