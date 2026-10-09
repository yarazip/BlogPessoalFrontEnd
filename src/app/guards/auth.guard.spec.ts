import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;

  const executar = (url: string) =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot)
    );

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: auth }]
    });
    router = TestBed.inject(Router);
  });

  it('libera com sessão válida', () => {
    auth.isLoggedIn.and.returnValue(true);
    expect(executar('/dashboard')).toBeTrue();
  });

  it('manda para o login guardando a página pedida', () => {
    auth.isLoggedIn.and.returnValue(false);

    const resultado = executar('/postagens/3') as UrlTree;

    expect(router.serializeUrl(resultado)).toBe('/login?returnUrl=%2Fpostagens%2F3');
  });
});
