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
});
