/** Gera um JWT sem assinatura válida, suficiente para testar a leitura do "exp". */
export function criarJwt(expiraEmSegundos: number): string {
  const base64url = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

  const exp = Math.floor(Date.now() / 1000) + expiraEmSegundos;
  return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url({ sub: 'ana@teste.com', exp })}.assinatura`;
}
