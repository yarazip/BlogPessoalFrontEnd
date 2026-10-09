import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { criarJwt } from '../../testing/jwt-teste';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: router }]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('faz login em /auth/login', () => {
    service.login({ email: 'a@a.com', senha: 'x' }).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@a.com', senha: 'x' });
  });

  it('cadastra em /auth/register sem enviar id nem foto', () => {
    service.register('Ana', 'a@a.com', 'senha1234').subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.body).toEqual({ nome: 'Ana', email: 'a@a.com', senha: 'senha1234' });
  });

  it('envia a foto por PUT /usuarios/{id}/foto', () => {
    service.atualizarFoto(7, new File(['x'], 'a.png', { type: 'image/png' })).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/usuarios/7/foto`);
    expect(req.request.method).toBe('PUT');
    expect((req.request.body as FormData).get('foto')).toBeTruthy();
  });

  describe('sessão', () => {
    it('salva o token sem o prefixo Bearer e o usuário sem o token', () => {
      service.saveAuthData({ id: 1, nome: 'Ana', email: 'a@a.com', token: 'Bearer abc.def.ghi' });

      expect(service.getToken()).toBe('abc.def.ghi');
      expect(service.getUsuario()).toEqual({ id: 1, nome: 'Ana', email: 'a@a.com', foto: '' });
      expect(localStorage.getItem('usuario')).not.toContain('abc.def.ghi');
    });

    it('está logado com token válido', () => {
      localStorage.setItem('token', criarJwt(3600));
      expect(service.isLoggedIn()).toBeTrue();
    });

    it('não está logado sem token', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('descarta a sessão quando o token expirou', () => {
      localStorage.setItem('token', criarJwt(-60));
      localStorage.setItem('usuario', JSON.stringify({ id: 1 }));

      expect(service.isLoggedIn()).toBeFalse();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('usuario')).toBeNull();
    });

    it('trata token malformado como sessão inválida', () => {
      localStorage.setItem('token', 'isso-nao-e-um-jwt');
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('logout apaga token e usuário e vai para o login', () => {
      service.saveAuthData({ id: 1, nome: 'Ana', email: 'a@a.com', token: criarJwt(3600) });

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('usuario')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('sessaoExpirada limpa tudo e avisa o login', () => {
      service.saveAuthData({ id: 1, nome: 'Ana', email: 'a@a.com', token: criarJwt(3600) });

      service.sessaoExpirada();

      expect(service.getToken()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { expirada: 1 } });
    });

    it('ignora dados de usuário corrompidos', () => {
      localStorage.setItem('usuario', '{quebrado');
      expect(service.getUsuario()).toBeNull();
      expect(localStorage.getItem('usuario')).toBeNull();
    });

    it('updateUsuario altera só os campos informados', () => {
      service.saveAuthData({ id: 1, nome: 'Ana', email: 'a@a.com', token: 't' });

      service.updateUsuario({ foto: 'http://x/foto.png' });

      expect(service.getUsuario()).toEqual({ id: 1, nome: 'Ana', email: 'a@a.com', foto: 'http://x/foto.png' });
    });
  });
});
