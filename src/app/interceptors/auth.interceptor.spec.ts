import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['getToken', 'sessaoExpirada']);
    auth.getToken.and.returnValue('meu-token');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth }
      ]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('envia o token nas requisições à API', () => {
    http.get(`${environment.apiUrl}/postagens`).subscribe();

    const req = controller.expectOne(`${environment.apiUrl}/postagens`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer meu-token');
  });

  it('NÃO envia o token para outros domínios', () => {
    http.get('https://cdn.exemplo.com/lib.js').subscribe();

    const req = controller.expectOne('https://cdn.exemplo.com/lib.js');
    expect(req.request.headers.has('Authorization')).toBeFalse();
  });

  it('NÃO envia o token no login nem no cadastro', () => {
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe();
    http.post(`${environment.apiUrl}/auth/register`, {}).subscribe();

    const login = controller.expectOne(`${environment.apiUrl}/auth/login`);
    const cadastro = controller.expectOne(`${environment.apiUrl}/auth/register`);

    expect(login.request.headers.has('Authorization')).toBeFalse();
    expect(cadastro.request.headers.has('Authorization')).toBeFalse();
  });

  it('sem token, a requisição segue sem Authorization', () => {
    auth.getToken.and.returnValue(null);
    http.get(`${environment.apiUrl}/postagens`).subscribe();

    expect(controller.expectOne(`${environment.apiUrl}/postagens`).request.headers.has('Authorization')).toBeFalse();
  });

  it('encerra a sessão quando a API responde 401 a uma requisição autenticada', () => {
    http.get(`${environment.apiUrl}/postagens`).subscribe({ error: () => undefined });

    controller.expectOne(`${environment.apiUrl}/postagens`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.sessaoExpirada).toHaveBeenCalledTimes(1);
  });

  it('um 401 no login (senha errada) NÃO derruba a sessão', () => {
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({ error: () => undefined });

    controller.expectOne(`${environment.apiUrl}/auth/login`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.sessaoExpirada).not.toHaveBeenCalled();
  });

  it('outros erros (403, 500) passam adiante sem encerrar a sessão', () => {
    let status = 0;
    http.get(`${environment.apiUrl}/postagens`).subscribe({ error: e => (status = e.status) });

    controller.expectOne(`${environment.apiUrl}/postagens`).flush({}, { status: 403, statusText: 'Forbidden' });

    expect(status).toBe(403);
    expect(auth.sessaoExpirada).not.toHaveBeenCalled();
  });
});
