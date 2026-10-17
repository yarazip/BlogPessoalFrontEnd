import { authGuard } from './guards/auth.guard';
import { routes } from './app.routes';

describe('rotas: o que é só para quem tem conta e o que é público', () => {
  const rota = (caminho: string) => routes.find(r => r.path === caminho)!;
  const protegida = (caminho: string) => (rota(caminho).canActivate ?? []).includes(authGuard);

  it('o mural completo exige conta (visitante só vê a prévia da home)', () => {
    expect(rota('explorar')).toBeDefined();
    expect(protegida('explorar')).toBeTrue();
  });

  it('as demais áreas de quem escreve também exigem conta', () => {
    for (const caminho of ['dashboard', 'postagens/nova']) {
      expect(protegida(caminho)).withContext(caminho).toBeTrue();
    }
  });

  it('a home, o login, o cadastro, a leitura de uma postagem e o perfil seguem públicos', () => {
    for (const caminho of ['', 'login', 'register', 'esqueci-senha', 'postagens/:id', 'perfil/:id']) {
      expect(rota(caminho)).withContext(caminho).toBeDefined();
      expect(protegida(caminho)).withContext(caminho).toBeFalse();
    }
  });
});
