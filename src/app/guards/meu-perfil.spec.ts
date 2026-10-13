import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { paraMeuPerfil } from './meu-perfil';

describe('paraMeuPerfil', () => {
  let auth: jasmine.SpyObj<AuthService>;

  const executar = (destino: string) => TestBed.runInInjectionContext(() => paraMeuPerfil(destino)());

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getUsuario']);
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: auth }] });
  });

  it('com sessão, leva ao perfil da própria pessoa', () => {
    auth.isLoggedIn.and.returnValue(true);
    auth.getUsuario.and.returnValue({ id: 24 });

    expect(executar('/perfil')).toBe('/perfil/24');
  });

  it('sem sessão, leva ao login e volta para o endereço pedido depois de entrar', () => {
    auth.isLoggedIn.and.returnValue(false);
    auth.getUsuario.and.returnValue(null);

    const destino = executar('/postagens') as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(destino)).toBe('/login?returnUrl=%2Fpostagens');
  });

  it('sessão vencida (token expirado) também vai ao login, mesmo que o usuário ainda esteja salvo', () => {
    auth.isLoggedIn.and.returnValue(false);
    auth.getUsuario.and.returnValue({ id: 24 });

    expect(executar('/perfil')).toEqual(jasmine.any(UrlTree));
  });
});
