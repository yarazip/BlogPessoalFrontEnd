import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { ComentarioPostagemService } from './comentario-postagem.service';

describe('ComentarioPostagemService', () => {
  let servico: ComentarioPostagemService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/postagens/7/comentarios`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servico = TestBed.inject(ComentarioPostagemService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista a página pedida', () => {
    servico.listar(7, 2, 10).subscribe();

    const req = http.expectOne(r => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');
    req.flush({ conteudo: [] });
  });

  it('comenta enviando só o texto', () => {
    servico.comentar(7, 'Oi').subscribe();

    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ texto: 'Oi' });
    req.flush({});
  });

  it('exclui pelo id do comentário', () => {
    servico.excluir(7, 3).subscribe();

    const req = http.expectOne(`${base}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
