import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { NotificacaoService } from './notificacao.service';

describe('NotificacaoService', () => {
  let servico: NotificacaoService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/notificacoes`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servico = TestBed.inject(NotificacaoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lê o número de não lidas', () => {
    let total = -1;
    servico.contarNaoLidas().subscribe(n => (total = n));

    http.expectOne(`${base}/nao-lidas`).flush({ total: 4 });

    expect(total).toBe(4);
  });

  it('lista a página pedida', () => {
    servico.listar(1, 5).subscribe();

    const req = http.expectOne(r => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('5');
    req.flush({ conteudo: [] });
  });

  it('marca todas como lidas', () => {
    servico.marcarTodasComoLidas().subscribe();

    const req = http.expectOne(`${base}/lidas`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });
});
