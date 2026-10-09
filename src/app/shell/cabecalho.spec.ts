import { caminhoDaUrl, deveMostrarCabecalhoDoUsuario, ROTAS_DE_VISITANTE } from './cabecalho';

describe('cabeçalho do esqueleto', () => {
  describe('caminhoDaUrl', () => {
    it('remove query string e fragmento', () => {
      expect(caminhoDaUrl('/explorar?pagina=2#topo')).toBe('/explorar');
      expect(caminhoDaUrl('/postagens/3#x')).toBe('/postagens/3');
    });

    it('trata URL vazia como a raiz', () => {
      expect(caminhoDaUrl('')).toBe('/');
      expect(caminhoDaUrl('?a=1')).toBe('/');
    });
  });

  describe('deveMostrarCabecalhoDoUsuario', () => {
    it('logado, mostra o cabeçalho do usuário nas áreas internas', () => {
      for (const url of ['/dashboard', '/postagens', '/postagens/nova', '/postagens/3/editar', '/perfil']) {
        expect(deveMostrarCabecalhoDoUsuario(url, true)).withContext(url).toBeTrue();
      }
    });

    it('REGRESSÃO: logado, /explorar (o "Feed" do menu) mantém o cabeçalho do usuário', () => {
      expect(deveMostrarCabecalhoDoUsuario('/explorar', true)).toBeTrue();
      expect(deveMostrarCabecalhoDoUsuario('/explorar?x=1#topo', true)).toBeTrue();
    });

    it('logado, nas páginas de visitante mostra o cabeçalho público', () => {
      for (const url of ROTAS_DE_VISITANTE) {
        expect(deveMostrarCabecalhoDoUsuario(url, true)).withContext(url).toBeFalse();
      }
    });

    it('sem sessão, nunca mostra o cabeçalho do usuário', () => {
      for (const url of ['/', '/login', '/explorar', '/dashboard', '/postagens']) {
        expect(deveMostrarCabecalhoDoUsuario(url, false)).withContext(url).toBeFalse();
      }
    });
  });
});
