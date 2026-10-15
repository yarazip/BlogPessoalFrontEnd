/**
 * Páginas só para visitantes: mesmo logado, quem abre uma delas vê o cabeçalho público.
 * Todas as demais (inclusive /explorar, que o menu do usuário chama de "Mural") mostram o cabeçalho
 * do usuário quando há sessão.
 */
export const ROTAS_DE_VISITANTE = ['/', '/login', '/register', '/esqueci-senha'];

/** Remove query string e fragmento: "/explorar?x=1#topo" -> "/explorar". */
export function caminhoDaUrl(url: string): string {
  return url.split(/[?#]/)[0] || '/';
}

export function deveMostrarCabecalhoDoUsuario(url: string, logado: boolean): boolean {
  return logado && !ROTAS_DE_VISITANTE.includes(caminhoDaUrl(url));
}
