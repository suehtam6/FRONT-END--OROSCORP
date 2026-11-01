const API_URL = process.env.API_URL || 'http://localhost:8080';
const ROTA_USUARIO = '/v1/oroscorp/usuario';

export async function criarUsuarioBackEnd(dadosUsuario, token) {
  const resposta = await fetch(`${API_URL}${ROTA_USUARIO}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(dadosUsuario),
    cache: 'no-store',
  });
  
  const dados = await resposta.json().catch(() => ({}));
  return { resposta, dados };
}

export async function desfazerUsuarioBackEnd(id, token) {
  try {
    const resposta = await fetch(`${API_URL}${ROTA_USUARIO}/${id}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    const dados = await resposta.json().catch(() => ({}));
    return resposta.ok && dados.status !== false;
  } catch {
    return false;
  }
}