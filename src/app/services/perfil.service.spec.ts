import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { PerfilService } from './perfil.service';

describe('PerfilService', () => {
  let service: PerfilService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/usuarios`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PerfilService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('busca o perfil público pelo id', () => {
    let recebido: unknown;
    service.getPerfil(5).subscribe(p => (recebido = p));

    const req = http.expectOne(`${base}/5`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 5, nome: 'Bia', totalPostagens: 2 });

    expect(recebido).toEqual({ id: 5, nome: 'Bia', totalPostagens: 2 });
  });

  it('atualiza a bio com PUT e o texto no corpo', () => {
    service.atualizarBio(5, 'Nova bio').subscribe();

    const req = http.expectOne(`${base}/5/bio`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ bio: 'Nova bio' });
    req.flush({ id: 5, nome: 'Bia', bio: 'Nova bio', totalPostagens: 0 });
  });

  it('atualiza música e livro do momento com PUT em /destaques', () => {
    const destaques = { musicaAtual: 'Clube da Esquina', livroAtual: '', musicaCapa: '', musicaPrevia: '', livroCapa: '' };
    service.atualizarDestaques(5, destaques).subscribe();

    const req = http.expectOne(`${base}/5/destaques`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(destaques);
    req.flush({ id: 5, nome: 'Bia', musicaAtual: 'Clube da Esquina', totalPostagens: 0 });
  });

  it('atualiza o humor do dia com PUT e o texto no corpo', () => {
    service.atualizarHumor(5, 'animada').subscribe();

    const req = http.expectOne(`${environment.apiUrl}/usuarios/5/humor`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ humor: 'animada' });
    req.flush({});
  });

  it('lê o arquivo por mês da pessoa', () => {
    let recebido: unknown;
    service.getArquivo(5).subscribe(arquivo => (recebido = arquivo));

    http.expectOne(`${environment.apiUrl}/usuarios/5/arquivo`).flush([{ ano: 2026, mes: 10, total: 4 }]);

    expect(recebido).toEqual([{ ano: 2026, mes: 10, total: 4 }]);
  });
});
